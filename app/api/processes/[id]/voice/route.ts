import { NextResponse } from "next/server";
import { getProcess, saveVoiceBlueprint } from "@/lib/store";
import { generateVoiceBlueprint } from "@/lib/voice/ai";
import { agentId } from "@/lib/voice/elevenlabs";

// Genera el caso del role-play por voz, calibrado al puesto.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc) return NextResponse.json({ error: "Proceso no encontrado" }, { status: 404 });
  const blueprint = await generateVoiceBlueprint(proc.puestoText, proc.empresaText, proc.reference?.raw, agentId());
  await saveVoiceBlueprint(proc.id, blueprint);
  return NextResponse.json(blueprint);
}

// Aprueba (activa) el ejercicio para los candidatos.
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc?.voiceBlueprint) return NextResponse.json({ error: "Sin ejercicio generado" }, { status: 404 });
  await saveVoiceBlueprint(proc.id, { ...proc.voiceBlueprint, approved: true });
  return NextResponse.json({ ok: true });
}
