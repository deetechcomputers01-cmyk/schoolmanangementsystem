import type { SessionUser } from "@/types/auth";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

function assertCanManage(actor: SessionUser | null) {
  if (!actor || !["super_admin", "principal", "staff"].includes(actor.role)) throw new Error("Forbidden");
}

export function listAssets() {
  return prisma.asset.findMany({
    include: {
      custodian: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { movements: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function listMovements(take = 30) {
  return prisma.assetMovement.findMany({
    include: { asset: { select: { name: true, tag: true } }, actedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function createAsset(
  actor: SessionUser,
  input: { name: string; category: string; location?: string; custodianId?: string | null; quantity: number; value?: number; imageUrl?: string }
) {
  assertCanManage(actor);
  const year = new Date().getFullYear();
  const count = await prisma.asset.count({ where: { tag: { startsWith: `AST-${year}-` } } });
  const tag = `AST-${year}-${String(count + 1).padStart(4, "0")}`;

  const asset = await prisma.asset.create({ data: { ...input, tag } });
  await audit(actor, "create", "Asset", asset.id, { name: input.name, tag });
  return asset;
}

export async function updateAsset(
  actor: SessionUser,
  id: string,
  input: Partial<{ name: string; category: string; status: string; location: string; custodianId: string | null; value: number; imageUrl: string }>
) {
  assertCanManage(actor);
  const asset = await prisma.asset.update({ where: { id }, data: input as any });
  await audit(actor, "update", "Asset", id, input);
  return asset;
}

export async function recordMovement(
  actor: SessionUser,
  input: { assetId: string; type: "issue" | "receive" | "transfer" | "adjustment"; quantity: number; note?: string }
) {
  assertCanManage(actor);
  const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
  if (!asset) throw new Error("Asset not found");

  const delta = input.type === "issue" ? -Math.abs(input.quantity) : Math.abs(input.quantity);
  const newQuantity = Math.max(0, asset.quantity + delta);

  const [movement] = await prisma.$transaction([
    prisma.assetMovement.create({
      data: { assetId: input.assetId, type: input.type, quantity: input.quantity, note: input.note, actedById: actor.id },
    }),
    prisma.asset.update({
      where: { id: input.assetId },
      data: { quantity: newQuantity, status: newQuantity === 0 ? "low_stock" : asset.status === "low_stock" ? "active" : asset.status },
    }),
  ]);

  await audit(actor, "record_movement", "Asset", input.assetId, input);
  return movement;
}
