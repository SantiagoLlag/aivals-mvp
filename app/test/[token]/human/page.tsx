import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import { publicTest } from "@/lib/human/publicTest";
import TestRunner from "../TestRunner";

export const dynamic = "force-dynamic";

export default async function HumanTestPage({ params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { candidate } = found;

  if (candidate.result) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-lg font-bold">Ya completaste la prueba HUMAN</h2>
        <p className="text-sm text-neutral-600 mt-1">Gracias. Puedes cerrar esta ventana.</p>
      </div>
    );
  }
  return <TestRunner token={params.token} candidateName={candidate.name} test={publicTest} />;
}
