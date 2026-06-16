import { NextResponse } from "next/server";
import { getCandidateByToken } from "@/lib/store";
import { getSignedUrl, voiceEnabled } from "@/lib/voice/elevenlabs";

// Devuelve la URL firmada + las variables dinámicas para que el candidato hable con el agente.
export async function POST(_req: Request, { params }: { params: { token: string } }) {
  if (!voiceEnabled()) return NextResponse.json({ error: "Voz no configurada" }, { status: 503 });
  const found = await getCandidateByToken(params.token);
  if (!found) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  const { process: proc, candidate } = found;
  const bp = proc.voiceBlueprint;
  if (!bp?.approved) return NextResponse.json({ error: "Ejercicio no disponible" }, { status: 400 });
  if (candidate.voiceResult) return NextResponse.json({ error: "Ya completado" }, { status: 409 });

  try {
    const signedUrl = await getSignedUrl();
    // Variables dinámicas autoritativas desde el server (el caso curado + el nombre del candidato como "jefe").
    const dynamicVariables = {
      nombre_jefe: candidate.name,
      nombre_colaborador: bp.scenario.nombre_colaborador,
      puesto_colaborador: bp.scenario.puesto_colaborador,
      empresa: proc.empresaText?.slice(0, 200) || "la empresa",
      historial_desempeno: bp.scenario.historial_desempeno,
      causa_legitima: bp.scenario.causa_legitima,
    };
    return NextResponse.json({ signedUrl, dynamicVariables });
  } catch (e: any) {
    return NextResponse.json({ error: "No se pudo iniciar la llamada", detail: String(e?.message ?? e) }, { status: 502 });
  }
}
