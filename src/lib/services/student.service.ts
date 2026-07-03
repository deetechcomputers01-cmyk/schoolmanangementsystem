import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/types/auth";
import { assertCan } from "@/lib/auth/rbac";
import * as repo from "@/lib/repositories/student.repository";
import { audit } from "./audit.service";

type StudentInput = {
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  photoUrl?: string;
  classId: string;
  guardian?: { name: string; phone: string; email?: string; relation: string };
};

export const listStudents = repo.listStudents;
export const getStudent = repo.getStudent;

export async function createStudent(user: SessionUser | null, input: StudentInput) {
  assertCan(user, "students:write");
  const data: Prisma.StudentCreateInput = {
    admissionNo: input.admissionNo,
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
    admissionNo: input.admissionNo,
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
