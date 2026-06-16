import { NextResponse } from "next/server";
import { getCandidate, saveCv } from "@/lib/store";
import { evaluateCvWithHuman } from "@/lib/cv/ai";

export const maxDuration = 60;

// Integra el CV con los resultados HUMAN (triangulación / Evaluador Central).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const found = await getCandidate(params.id);
  if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { process: proc, candidate } = found;
  if (!candidate.cv?.isolated) return NextResponse.json({ error: "Falta evaluación de CV" }, { status: 400 });
  if (!candidate.result) return NextResponse.json({ error: "Falta resultado HUMAN" }, { status: 400 });

  const integrated = await evaluateCvWithHuman(candidate.cv.isolated, candidate.result, proc.reference?.raw);
  await saveCv(candidate.id, { ...candidate.cv, integrated });
  return NextResponse.json(integrated);
}
