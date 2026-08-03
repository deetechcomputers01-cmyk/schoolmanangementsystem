import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";
import { audit } from "./audit.service";

const stepInclude = {
  steps: { orderBy: { order: "asc" as const } },
  requester: { select: { id: true, name: true, email: true, role: true } },
};

export async function createApprovalRequest(
  requester: SessionUser,
  data: {
    type: string;
    title: string;
    payload: unknown;
    steps: Array<{ approverRole?: string; approverId?: string }>;
  }
) {
  if (!data.steps.length) throw new Error("At least one approval step is required");

  const request = await prisma.approvalRequest.create({
    data: {
      type: data.type,
      title: data.title,
      requesterId: requester.id,
      payload: data.payload as object,
      steps: {
        create: data.steps.map((s, i) => ({
          order: i,
          approverRole: s.approverRole ?? null,
          approverId: s.approverId ?? null,
        })),
      },
    },
    include: stepInclude,
  });

  await audit(requester, "create", "ApprovalRequest", request.id, { type: data.type, title: data.title });
  return request;
}

export async function listApprovalRequests(user: SessionUser, scope: "queue" | "mine" | "all") {
  if (scope === "mine") {
    return prisma.approvalRequest.findMany({
      where: { requesterId: user.id },
      include: stepInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  if (scope === "all") {
    if (user.role !== "super_admin" && user.role !== "principal") throw new Error("Forbidden");
    return prisma.approvalRequest.findMany({ include: stepInclude, orderBy: { createdAt: "desc" } });
  }

  // scope === "queue": requests currently awaiting THIS user's decision
  const all = await prisma.approvalRequest.findMany({
    where: { status: "pending" },
    include: stepInclude,
    orderBy: { createdAt: "desc" },
  });
  return all.filter((r) => {
    const step = r.steps.find((s) => s.order === r.currentStepIndex);
    if (!step) return false;
    return step.approverId === user.id || step.approverRole === user.role || user.role === "super_admin";
  });
}

export async function getApprovalRequest(id: string) {
  return prisma.approvalRequest.findUnique({ where: { id }, include: stepInclude });
}

export async function decideApprovalStep(
  user: SessionUser,
  requestId: string,
  decision: "approved" | "rejected",
  reason?: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: requestId }, include: stepInclude });
  if (!request) throw new Error("Approval request not found");
  if (request.status !== "pending") throw new Error("This request has already been decided");

  const step = request.steps.find((s) => s.order === request.currentStepIndex);
  if (!step) throw new Error("No pending step found");

  const authorized = user.role === "super_admin" || step.approverId === user.id || step.approverRole === user.role;
  if (!authorized) throw new Error("Forbidden");

  await prisma.approvalStep.update({
    where: { id: step.id },
    data: { decision, reason: reason ?? null, decidedAt: new Date() },
  });

  const isLastStep = request.currentStepIndex >= request.steps.length - 1;
  const updated = await prisma.approvalRequest.update({
    where: { id: requestId },
    data:
      decision === "rejected"
        ? { status: "rejected" }
        : isLastStep
          ? { status: "approved" }
          : { currentStepIndex: request.currentStepIndex + 1 },
    include: stepInclude,
  });

  // Producer-specific side effects once a final decision is reached
  if (updated.status === "approved" || updated.status === "rejected") {
    if (updated.type === "expense") {
      await prisma.expense.updateMany({
        where: { approvalRequestId: updated.id },
        data: { status: updated.status },
      });
    }
  }

  await audit(user, decision === "approved" ? "approve" : "reject", "ApprovalRequest", requestId, { reason });
  return updated;
}
