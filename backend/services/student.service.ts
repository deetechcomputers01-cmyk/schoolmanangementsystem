import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "../auth/rbac";
import * as repo from "../repositories/student.repository";
import { audit } from "./audit.service";
import { prisma } from "../prisma";

type StudentInput = {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  photoUrl?: string;
  classId: string;
  guardian?: { name: string; phone: string; email?: string; relation: string };
};

export function listStudents(classIds?: string[]) { return repo.listStudents(classIds); }
export const getStudent = repo.getStudent;

async function nextAdmissionNo() {
  const year = new Date().getFullYear();
  const count = await prisma.student.count({ where: { admissionNo: { startsWith: `ADM-${year}-` } } });
  return `ADM-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function createStudent(user: SessionUser | null, input: StudentInput) {
  assertCan(user, "students:write");
  const data: Prisma.StudentCreateInput = {
    admissionNo: await nextAdmissionNo(),
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    dateOfBirth: new Date(input.dateOfBirth),
    address: input.address,
    photoUrl: input.photoUrl,
    class: { connect: { id: input.classId } },
    guardians: input.guardian
      ? { create: [{ ...input.guardian, email: input.guardian.email || undefined }] }
      : undefined
  };
  const student = await repo.createStudent(data);
  await audit(user, "create", "Student", student.id, { admissionNo: student.admissionNo });
  return student;
}

export async function updateStudent(user: SessionUser | null, id: string, input: Partial<StudentInput>) {
  assertCan(user, "students:write");
  const data: Prisma.StudentUpdateInput = {
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
    address: input.address,
    photoUrl: input.photoUrl,
    class: input.classId ? { connect: { id: input.classId } } : undefined
  };
  const student = await repo.updateStudent(id, data);
  await audit(user, "update", "Student", id, input);
  return student;
}

export async function removeStudent(user: SessionUser | null, id: string) {
  assertCan(user, "students:write");
  const student = await repo.deleteStudent(id);
  await audit(user, "delete", "Student", id);
  return student;
}
