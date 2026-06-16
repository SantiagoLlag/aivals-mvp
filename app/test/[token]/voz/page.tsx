import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import { voiceEnabled } from "@/lib/voice/elevenlabs";
import VozRunner from "./VozRunner";

export const dynamic = "force-dynamic";

export default async function VozPage({ params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { process: proc, candidate } = found;
  const bp = proc.voiceBlueprint;

  if (!bp?.approved || !voiceEnabled()) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">🕒</div>
        <h2 className="text-lg font-bold">Aún no disponible</h2>
        <p className="text-sm text-neutral-600 mt-1">Este ejercicio todavía no está activo. Vuelve más tarde.</p>
      </div>
    );
  }
  if (candidate.voiceResult) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-lg font-bold">Ya completaste esta conversación</h2>
        <p className="text-sm text-neutral-600 mt-1">Gracias. Puedes cerrar esta ventana.</p>
      </div>
    );
  }
  return (
    <VozRunner
      token={params.token}
      candidateName={candidate.name}
      contexto={bp.contexto}
      instrucciones={bp.instrucciones}
      colaborador={`${bp.scenario.nombre_colaborador} · ${bp.scenario.puesto_colaborador}`}
    />
  );
}
