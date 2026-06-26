import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import { voiceEnabled } from "@/lib/voice/elevenlabs";
import { getServerT } from "@/lib/i18n-server";
import BackLink from "@/components/BackLink";
import VozRunner from "./VozRunner";

export const dynamic = "force-dynamic";

export default async function VozPage({ params }: { params: { token: string } }) {
  const { t } = getServerT();
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { process: proc, candidate } = found;
  const bp = proc.voiceBlueprint;

  let content;
  if (!bp?.approved || !voiceEnabled()) {
    content = (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">🕒</div>
        <h2 className="text-lg font-bold">{t("Aún no disponible", "Not available yet")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("Este ejercicio todavía no está activo. Vuelve más tarde.", "This exercise is not active yet. Please come back later.")}</p>
      </div>
    );
  } else if (candidate.voiceResult) {
    content = (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-lg font-bold">{t("Ya completaste esta conversación", "You have already completed this conversation")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("Gracias. Puedes cerrar esta ventana.", "Thank you. You can close this window.")}</p>
      </div>
    );
  } else {
    content = (
      <VozRunner
        token={params.token}
        candidateName={candidate.name}
        contexto={bp.contexto}
        instrucciones={bp.instrucciones}
        colaborador={`${bp.scenario.nombre_colaborador} · ${bp.scenario.puesto_colaborador}`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-2xl mx-auto"><BackLink href={`/test/${params.token}`} label={t("Volver a las actividades", "Back to activities")} /></div>
      {content}
    </div>
  );
}
