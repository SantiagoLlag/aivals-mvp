import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import CvUpload from "./CvUpload";

export const dynamic = "force-dynamic";

export default async function CvPage({ params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { candidate } = found;

  if (candidate.cv) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-lg font-bold">CV recibido</h2>
        <p className="text-sm text-neutral-600 mt-1">
          Gracias, ya registramos tu CV{candidate.cv.fileName ? ` (${candidate.cv.fileName})` : ""}.
        </p>
      </div>
    );
  }
  return <CvUpload token={params.token} candidateName={candidate.name} />;
}
