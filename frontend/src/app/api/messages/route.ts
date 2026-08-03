import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getThread, sendMessage } from "@backend/services/message.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const otherId   = searchParams.get("with");
  const studentId = searchParams.get("student") ?? undefined;

  if (!otherId) return NextResponse.json({ error: "Missing 'with' param" }, { status: 400 });

  const messages = await getThread(user.id, otherId, studentId);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.to || !body?.content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const msg = await sendMessage(user.id, body.to, body.content, body.studentId ?? undefined);
  return NextResponse.json(msg, { status: 201 });
}
