import { NextRequest, NextResponse } from "next/server";
import { getCandidateByToken, saveCv } from "@/lib/store";
import { extractCvText } from "@/lib/cv/extract";
import { evaluateCvIsolated } from "@/lib/cv/ai";

export const maxDuration = 60;

// El candidato sube su CV (PDF). Se extrae el texto y se evalúa AISLADO contra el puesto.
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  const { process: proc, candidate } = found;

  const form = await req.formData();
  const file = form.get("cv");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "El CV debe ser un PDF" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "El archivo es muy grande (máx. 10 MB)" }, { status: 400 });

  let text = "";
  try {
    text = await extractCvText(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "No se pudo leer el PDF" }, { status: 400 });
  }
  if (text.length < 50) {
    return NextResponse.json({ error: "El PDF no contiene texto legible (¿es una imagen escaneada?)" }, { status: 400 });
  }

  const isolated = await evaluateCvIsolated(text, proc.puestoText, proc.empresaText, proc.reference?.raw);
  await saveCv(candidate.id, {
    fileName: file.name, uploadedAt: new Date().toISOString(), text, chars: text.length, isolated,
  });
  return NextResponse.json({ ok: true });
}
