import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import { publicBigFive } from "@/lib/bigfive/publicTest";
import { FLAGS } from "@/lib/flags";
import { testActive } from "@/lib/tests/catalog";
import BackLink from "@/components/BackLink";
import BigFiveRunner from "./BigFiveRunner";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function BigFivePage({ params }: { params: { token: string } }) {
  const { t } = getServerT();
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { process: proc, candidate } = found;

  // Si la feature está apagada o el proceso no aplica Big Five, no existe esta actividad.
  if (!FLAGS.bigFive || !testActive(proc, "bigfive")) notFound();

  const content = candidate.bigFive?.result ? (
    <div className="card text-center py-12 max-w-lg mx-auto">
      <div className="text-3xl mb-2">✓</div>
      <h2 className="text-lg font-bold">{t("Ya completaste el cuestionario Big Five", "You already completed the Big Five questionnaire")}</h2>
      <p className="text-sm text-neutral-600 mt-1">{t("Gracias. Puedes cerrar esta ventana.", "Thank you. You can close this window.")}</p>
    </div>
  ) : (
    <BigFiveRunner token={params.token} candidateName={candidate.name} test={publicBigFive} />
  );

  return (
    <div className="space-y-4">
      <div className="max-w-2xl mx-auto"><BackLink href={`/test/${params.token}`} label={t("Volver a las actividades", "Back to activities")} /></div>
      {content}
    </div>
  );
}
