import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { listCalendarEvents, createCalendarEvent } from "@backend/services/calendar.service";
import { ok, badRequest, unauthorized } from "@/lib/http";
import { z } from "zod";

const createSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category:    z.enum(["academic","exams","sports","pta","staff","holidays"]),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:        z.string().optional(),
  endTime:     z.string().optional(),
  location:    z.string().max(200).optional(),
  audience:    z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const sp    = request.nextUrl.searchParams;
  const year  = parseInt(sp.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(sp.get("month") ?? String(new Date().getMonth()));
  const events = await listCalendarEvents(year, month);
  return ok(events);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body   = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

  // Block past dates — compare in UTC (Accra is UTC+0, so UTC date == Ghana date)
  const eventDate = new Date(parsed.data.date + "T00:00:00Z");
  const todayUTC  = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  if (eventDate < todayUTC) {
    return badRequest({ date: ["Cannot create events on past dates."] });
  }

  const event = await createCalendarEvent(user, parsed.data);
  return ok(event);
}
