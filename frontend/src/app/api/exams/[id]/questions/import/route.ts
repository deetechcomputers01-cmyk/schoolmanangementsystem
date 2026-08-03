import { type NextRequest } from "next/server";
import { getCurrentUser } from "@backend/auth/cookies";
import { prisma } from "@backend/prisma";
import { ok, unauthorized, forbidden, fail, handleApiError } from "@/lib/http";
import { audit } from "@backend/services/audit.service";

export const runtime = "nodejs";

// CSV format: text,optionA,optionB,optionC,optionD,correctAnswer,marks
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["super_admin", "principal", "teacher"].includes(user.role)) return forbidden();

  try {
    const body = await req.json();
    const { csv } = body as { csv: string };
    if (!csv) return fail("csv field required", 400);

    const lines = csv.trim().split("\n").filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().startsWith("text") ? lines.slice(1) : lines;

    const last = await prisma.examQuestion.findFirst({
      where: { examId: params.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let nextOrder = (last?.order ?? 0) + 1;

    const rows = dataLines.map((line) => {
      const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((c) =>
        c.replace(/^"|"$/g, "").trim()
      ) ?? line.split(",").map((c) => c.trim());

      const [text, a, b, c, d, correctAnswer, marksStr] = cols;
      if (!text) return null;

      const hasOptions = a || b || c || d;
      const options = hasOptions ? [a, b, c, d].filter(Boolean) : null;

      return {
        id: crypto.randomUUID(),
        examId: params.id,
        order: nextOrder++,
        text,
        type: hasOptions ? "mcq" : "short_answer",
        options,
        correctAnswer: correctAnswer || null,
        marks: parseFloat(marksStr ?? "1") || 1,
      };
    }).filter(Boolean) as Array<{ id: string; examId: string; order: number; text: string; type: string; options: string[] | null; correctAnswer: string | null; marks: number }>;

    if (rows.length === 0) return fail("No valid questions found in CSV", 400);

    await prisma.examQuestion.createMany({
      data: rows.map((r) => ({
        id: r.id,
        examId: r.examId,
        order: r.order,
        text: r.text,
        type: r.type,
        options: r.options ?? undefined,
        correctAnswer: r.correctAnswer,
        marks: r.marks,
      })),
    });

    await audit(user, "import_questions", "Exam", params.id, { count: rows.length });
    return ok({ imported: rows.length }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
