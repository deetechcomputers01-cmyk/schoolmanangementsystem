import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  rememberDevice?: boolean;
};

export type JwtPayload = SessionUser & {
  tokenType: "access" | "refresh";
};
