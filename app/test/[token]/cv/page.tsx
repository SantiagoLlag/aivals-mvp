import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import { getServerT } from "@/lib/i18n-server";
import BackLink from "@/components/BackLink";
import CvUpload from "./CvUpload";

export const dynamic = "force-dynamic";

export default async function CvPage({ params }: { params: { token: string } }) {
  const { t } = getServerT();
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { candidate } = found;

  const content = candidate.cv ? (
    <div className="card text-center py-12 max-w-lg mx-auto">
      <div className="text-3xl mb-2">✓</div>
      <h2 className="text-lg font-bold">{t("CV recibido", "CV received")}</h2>
      <p className="text-sm text-neutral-600 mt-1">
        {t("Gracias, ya registramos tu CV", "Thank you, we have received your CV")}{candidate.cv.fileName ? ` (${candidate.cv.fileName})` : ""}.
      </p>
    </div>
  ) : (
    <CvUpload token={params.token} candidateName={candidate.name} />
  );

  return (
    <div className="space-y-4">
      <div className="max-w-lg mx-auto"><BackLink href={`/test/${params.token}`} label={t("Volver a las actividades", "Back to activities")} /></div>
      {content}
    </div>
  );
}
