import { NextRequest, NextResponse } from "next/server";
import { getCandidateByToken, saveBigFive } from "@/lib/store";
import { scoreBigFive, BIGFIVE_TOTAL_ITEMS } from "@/lib/bigfive/motor";
import type { BigFiveInput } from "@/lib/bigfive/types";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  if (found.candidate.bigFive?.result) {
    return NextResponse.json({ error: "Ya completado" }, { status: 409 });
  }

  const body = (await req.json().catch(() => ({}))) as { answers?: BigFiveInput };
  const answers = body?.answers;
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Respuestas incompletas" }, { status: 400 });
  }

  const result = scoreBigFive(answers);
  if (result.answered < BIGFIVE_TOTAL_ITEMS) {
    return NextResponse.json({ error: "Faltan respuestas" }, { status: 400 });
  }

  await saveBigFive(found.candidate.id, answers, result);
  return NextResponse.json({ ok: true });
}
