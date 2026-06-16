import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import AcRunner from "./AcRunner";

export const dynamic = "force-dynamic";

export default async function AcPage({ params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { process: proc, candidate } = found;
  const bp = proc.acBlueprint;

  if (!bp?.approved || bp.charola.items.length === 0) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">🕒</div>
        <h2 className="text-lg font-bold">Aún no disponible</h2>
        <p className="text-sm text-neutral-600 mt-1">Este ejercicio todavía no está activo. Vuelve más tarde.</p>
      </div>
    );
  }
  if (candidate.acResult) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-lg font-bold">Ya completaste este ejercicio</h2>
        <p className="text-sm text-neutral-600 mt-1">Gracias. Puedes cerrar esta ventana.</p>
      </div>
    );
  }
  return <AcRunner token={params.token} candidateName={candidate.name} blueprint={bp} />;
}
