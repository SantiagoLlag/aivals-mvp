import { NextRequest, NextResponse } from "next/server";
import { getCandidateByToken, saveVoiceResult } from "@/lib/store";
import { getTranscript } from "@/lib/voice/elevenlabs";
import { scoreVoice } from "@/lib/voice/ai";

export const maxDuration = 120;

// El candidato terminó la llamada: jala el transcript, guarda captura y corre la calificación ORCSE.
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  const { process: proc, candidate } = found;
  if (!proc.voiceBlueprint?.approved) return NextResponse.json({ error: "No disponible" }, { status: 400 });
  if (candidate.voiceResult) return NextResponse.json({ error: "Ya completado" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const conversationId = body?.conversationId as string | undefined;
  if (!conversationId) return NextResponse.json({ error: "Falta conversationId" }, { status: 400 });

  const { transcript, durationSecs, analysis } = await getTranscript(conversationId);
  const captura = { conversationId, transcript, durationSecs, analysis, submittedAt: new Date().toISOString() };
  // 1) Captura primero (suspender el juicio)
  await saveVoiceResult(candidate.id, { captura });
  // 2) Calificación ORCSE (insumo para el psicólogo)
  const calificacion = await scoreVoice(proc.voiceBlueprint, captura);
  await saveVoiceResult(candidate.id, { captura, calificacion });
  return NextResponse.json({ ok: true, turns: transcript.length });
}
