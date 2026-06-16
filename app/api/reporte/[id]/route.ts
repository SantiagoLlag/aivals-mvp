import { NextRequest, NextResponse } from "next/server";
import { getCandidate, saveDosReport } from "@/lib/store";
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
