import { NextRequest, NextResponse } from "next/server";
import { getCandidateByToken, saveResult, saveDosReport, clearReopened } from "@/lib/store";
import { scoreHuman } from "@/lib/human/motor";
import { humanInputChanges } from "@/lib/insights/human";
import type { HumanInput } from "@/lib/human/types";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  const c = found.candidate;
  // El snapshot de reapertura permite reenviar aunque la captura previa exista.
  const snapshot = c.reopened?.human;
  if (c.status === "completado" && !snapshot) {
    return NextResponse.json({ error: "Ya completado" }, { status: 409 });
  }

  const body = (await req.json()) as HumanInput;
  if (!body?.disc || !body?.valores || !body?.pensante) {
    return NextResponse.json({ error: "Respuestas incompletas" }, { status: 400 });
  }

  // El motor recalcula siempre (determinista, sin costo). Tras reabrir HUMAN, dos_report quedó
  // nulo, así que por defecto la interpretación (IA) se regenera on-demand.
  const result = scoreHuman(body);
  await saveResult(c.id, body, result);

  // Test reabierto: comparamos respuestas nuevas vs previas y solo recalculamos lo que cambió.
  if (snapshot) {
    const changes = humanInputChanges(snapshot.input, body);
    // Si NADA cambió, restauramos la interpretación previa: no se regenera la IA sin necesidad.
    if (!changes.any && snapshot.dosReport) {
      await saveDosReport(c.id, snapshot.dosReport);
    }
    // Si algo cambió, dos_report queda nulo → el psicólogo regenera la interpretación.
    await clearReopened(c.id, "human");
    return NextResponse.json({ ok: true, recompare: changes });
  }

  return NextResponse.json({ ok: true });
}
