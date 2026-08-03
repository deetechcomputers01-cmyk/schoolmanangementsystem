import type { SessionUser } from "@/types/auth";
import { prisma } from "../prisma";
import { audit } from "./audit.service";

function assertCanManage(actor: SessionUser | null) {
  if (!actor || !["super_admin", "principal", "staff"].includes(actor.role)) throw new Error("Forbidden");
}

export async function upsertMenu(
  actor: SessionUser,
  input: { weekOf: string; day: string; mealType: string; items: string[] }
) {
  assertCanManage(actor);
  const menu = await prisma.mealMenu.upsert({
    where: { weekOf_day_mealType: { weekOf: input.weekOf, day: input.day, mealType: input.mealType } },
    update: { items: input.items },
    create: input,
  });
  await audit(actor, "upsert", "MealMenu", menu.id, input);
  return menu;
}

export function listServings(menuId: string) {
  return prisma.mealServing.findMany({ where: { menuId }, select: { studentId: true, servedAt: true } });
}

export async function markServed(actor: SessionUser, input: { menuId: string; studentIds: string[] }) {
  assertCanManage(actor);
  if (!input.studentIds.length) throw new Error("At least one student must be selected");

  const menu = await prisma.mealMenu.findUnique({ where: { id: input.menuId } });
  if (!menu) throw new Error("Meal menu not found");

  const results = await Promise.all(
    input.studentIds.map((studentId) =>
      prisma.mealServing.upsert({
        where: { menuId_studentId: { menuId: input.menuId, studentId } },
        update: {},
        create: { menuId: input.menuId, studentId, servedById: actor.id },
      })
    )
  );

  await audit(actor, "mark_served", "MealMenu", input.menuId, { count: results.length });
  return results;
}
