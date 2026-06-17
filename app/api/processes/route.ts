import { NextRequest, NextResponse } from "next/server";
import { createProcess, saveVoiceBlueprint } from "@/lib/store";
import { evaluadorUno, aiEnabled } from "@/lib/ai";
import { generateVoiceBlueprint } from "@/lib/voice/ai";
import { agentId, voiceEnabled } from "@/lib/voice/elevenlabs";

// Dos llamadas de IA secuenciales (perfil + escenario de voz); deja margen en Vercel.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { name, puestoText, empresaText } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }
  // Evaluador UNO: genera el perfil de referencia (si la IA está activa).
  const reference = await evaluadorUno(puestoText ?? "", empresaText ?? "");
  const proc = await createProcess({
    name,
    puestoText: puestoText ?? "",
    empresaText: empresaText ?? "",
    reference,
  });

  // Role-play por voz: se activa por defecto en TODO proceso nuevo, calibrado al puesto
  // (requiere IA + ElevenLabs configurados). Falla suave: si algo sale mal, el proceso ya
  // existe y el psicólogo puede generarlo a mano en el panel.
  if (aiEnabled() && voiceEnabled()) {
    try {
      const vb = await generateVoiceBlueprint(proc.puestoText, proc.empresaText, reference.raw, agentId());
      await saveVoiceBlueprint(proc.id, { ...vb, approved: true });
    } catch (e) {
      console.error("[processes] auto voice blueprint:", e);
    }
  }

  return NextResponse.json({ id: proc.id });
}
