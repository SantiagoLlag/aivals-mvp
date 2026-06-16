import { NextRequest, NextResponse } from "next/server";
import { getCandidateByToken, saveAcResult } from "@/lib/store";
import { scoreAc } from "@/lib/ac/ai";
import type { AcCapture } from "@/lib/ac/types";

// El candidato envía sus respuestas del AC. Se guarda la CAPTURA (verbatim) y luego se
// corre la CALIFICACIÓN (ORCSE) — separadas por diseño.
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  const { process: proc, candidate } = found;
  if (!proc.acBlueprint?.approved) return NextResponse.json({ error: "Ejercicio no disponible" }, { status: 400 });
  if (candidate.acResult) return NextResponse.json({ error: "Ya completado" }, { status: 409 });

  const body = await req.json();
  const captura: AcCapture = {
    charola: Array.isArray(body?.charola) ? body.charola : [],
    sjt: Array.isArray(body?.sjt) ? body.sjt : [],
    submittedAt: new Date().toISOString(),
  };
  // 1) Captura primero (suspender el juicio)
  await saveAcResult(candidate.id, { captura });
  // 2) Calificación (insumo para el psicólogo)
  const calificacion = await scoreAc(proc.acBlueprint, captura);
  await saveAcResult(candidate.id, { captura, calificacion });
  return NextResponse.json({ ok: true });
}
