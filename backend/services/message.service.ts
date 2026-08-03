import { prisma } from "../prisma";

export async function getConversations(userId: string) {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: {
      sender:   { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
      student:  { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group into conversation threads keyed by (other party id + student id)
  const convMap = new Map<string, {
    otherId: string;
    otherName: string;
    otherRole: string;
    studentId: string | null;
    studentName: string | null;
    lastMessage: string;
    lastAt: Date;
    unread: number;
  }>();

  for (const msg of messages) {
    const isMe  = msg.senderId === userId;
    const other = isMe ? msg.receiver : msg.sender;
    const key   = `${other.id}::${msg.studentId ?? ""}`;

    if (!convMap.has(key)) {
      convMap.set(key, {
        otherId:     other.id,
        otherName:   other.name,
        otherRole:   other.role,
        studentId:   msg.studentId ?? null,
        studentName: msg.student ? `${msg.student.firstName} ${msg.student.lastName}` : null,
        lastMessage: msg.content,
        lastAt:      msg.createdAt,
        unread:      0,
      });
    }

    if (!isMe && !msg.isRead) {
      const conv = convMap.get(key)!;
      conv.unread++;
    }
  }

  return Array.from(convMap.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export async function getThread(userId: string, otherId: string, studentId?: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
      ...(studentId ? { studentId } : {}),
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: userId, isRead: false },
    data:  { isRead: true },
  });

  return messages;
}

export async function sendMessage(senderId: string, receiverId: string, content: string, studentId?: string) {
  return prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
      studentId: studentId ?? null,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });
}

// Returns the list of teachers a guardian can message (based on each linked child's class subjects)
export async function getMessagableTeachersForGuardian(userId: string) {
  const guardians = await prisma.guardian.findMany({
    where: { userId },
    include: {
      student: {
        include: {
          class: {
            include: {
              subjects: {
                include: {
                  staff: {
                    include: { user: { select: { id: true, name: true } } }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return guardians.map(g => ({
    studentId:   g.student.id,
    studentName: `${g.student.firstName} ${g.student.lastName}`,
    className:   g.student.class.name,
    teachers:    g.student.class.subjects
      .filter(s => s.staff?.user)
      .map(s => ({
        userId:      s.staff!.user!.id,
        name:        s.staff!.user!.name,
        subjectName: s.name,
        staffId:     s.staff!.id,
      })),
  }));
}
