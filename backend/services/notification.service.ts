import { prisma } from "../prisma";
import type { SessionUser } from "@/types/auth";

export type NotificationType =
  | "fee_reminder"
  | "attendance_alert"
  | "exam_result"
  | "staff_announcement"
  | "system";

export async function notifyUser(userId: string, input: { type: NotificationType; title: string; body: string; link?: string }) {
  return prisma.notification.create({
    data: { userId, type: input.type, title: input.title, body: input.body, link: input.link },
  });
}

export async function notifyUsers(userIds: string[], input: { type: NotificationType; title: string; body: string; link?: string }) {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, type: input.type, title: input.title, body: input.body, link: input.link })),
  });
}

export function listNotifications(userId: string, take = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markNotificationRead(user: SessionUser, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== user.id) throw new Error("Forbidden");
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}
