import { NextRequest, NextResponse } from "next/server";
import { getCandidateByToken, saveResult } from "@/lib/store";
import { scoreHuman } from "@/lib/human/motor";
import type { HumanInput } from "@/lib/human/types";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  if (found.candidate.status === "completado") {
    return NextResponse.json({ error: "Ya completado" }, { status: 409 });
  }

  const body = (await req.json()) as HumanInput;
  if (!body?.disc || !body?.valores || !body?.pensante) {
    return NextResponse.json({ error: "Respuestas incompletas" }, { status: 400 });
  }

  const result = scoreHuman(body);
  await saveResult(found.candidate.id, body, result);
  return NextResponse.json({ ok: true });
}
