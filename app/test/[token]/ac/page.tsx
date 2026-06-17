import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import BackLink from "@/components/BackLink";
import AcRunner from "./AcRunner";

export const dynamic = "force-dynamic";

export default async function AcPage({ params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { process: proc, candidate } = found;
  const bp = proc.acBlueprint;

  let content;
  if (!bp?.approved || bp.charola.items.length === 0) {
    content = (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">🕒</div>
        <h2 className="text-lg font-bold">Aún no disponible</h2>
        <p className="text-sm text-neutral-600 mt-1">Este ejercicio todavía no está activo. Vuelve más tarde.</p>
      </div>
    );
  } else if (candidate.acResult) {
    content = (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-lg font-bold">Ya completaste este ejercicio</h2>
        <p className="text-sm text-neutral-600 mt-1">Gracias. Puedes cerrar esta ventana.</p>
      </div>
    );
  } else {
    content = <AcRunner token={params.token} candidateName={candidate.name} blueprint={bp} />;
  }

  return (
    <div className="space-y-4">
      <div className="max-w-2xl mx-auto"><BackLink href={`/test/${params.token}`} label="Volver a las actividades" /></div>
      {content}
    </div>
  );
}
