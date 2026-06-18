import { NextRequest, NextResponse } from "next/server";
import { getCandidate, saveDosReport, saveAcResult, saveVoiceResult } from "@/lib/store";
import { evaluadorDos } from "@/lib/ai";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const found = await getCandidate(params.id);
  if (!found || !found.candidate.result) {
    return NextResponse.json({ error: "Resultado no disponible" }, { status: 404 });
  }
  const report = await evaluadorDos(
    found.candidate.name,
    found.candidate.result,
    found.process.reference
  );
  await saveDosReport(found.candidate.id, report);
  return NextResponse.json({ markdown: report.markdown, source: report.source });
}

// Edición del psicólogo (human-in-the-loop): ajustar la interpretación o un puntaje 1-5.
// El override del score se guarda EN porCompetencia[].score para que el reporte y /comparar
// queden sincronizados (el ranking lee ese mismo campo), marcando edited:true.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const found = await getCandidate(params.id);
  if (!found) return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
  const c = found.candidate;
  const body = await req.json().catch(() => ({} as any));

  if (body.target === "narrative" && typeof body.markdown === "string") {
    if (!c.dosReport) return NextResponse.json({ error: "Sin interpretación" }, { status: 404 });
    await saveDosReport(c.id, { ...c.dosReport, markdown: body.markdown, edited: true });
    return NextResponse.json({ ok: true });
  }

  if ((body.target === "ac" || body.target === "voz") && typeof body.competency === "string") {
    const score = Math.max(1, Math.min(5, Math.round(Number(body.score)) || 3));
    if (body.target === "ac" && c.acResult?.calificacion) {
      const cal = c.acResult.calificacion;
      const porCompetencia = cal.porCompetencia.map((p) =>
        p.competency === body.competency ? { ...p, score, edited: true } : p);
      await saveAcResult(c.id, { ...c.acResult, calificacion: { ...cal, porCompetencia } });
      return NextResponse.json({ ok: true });
    }
    if (body.target === "voz" && c.voiceResult?.calificacion) {
      const cal = c.voiceResult.calificacion;
      const porCompetencia = cal.porCompetencia.map((p) =>
        p.competency === body.competency ? { ...p, score, edited: true } : p);
      await saveVoiceResult(c.id, { ...c.voiceResult, calificacion: { ...cal, porCompetencia } });
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
}
