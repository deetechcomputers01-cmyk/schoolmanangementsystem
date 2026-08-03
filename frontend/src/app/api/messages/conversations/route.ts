import { NextResponse } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { getConversations } from "@backend/services/message.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convs = await getConversations(user.id);
  return NextResponse.json(convs);
}
