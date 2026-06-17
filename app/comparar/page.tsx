import Link from "next/link";
import { listProcesses } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aivals — Comparar candidatos" };

export default async function CompararPicker() {
  const processes = await listProcesses();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-accent">← Panel</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comparar candidatos</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Elige un puesto para ver a sus candidatos lado a lado: ranking de encaje, mapa de calor por vertical y radar.
        </p>
      </div>

      {processes.length === 0 ? (
        <div className="card text-center py-12 text-neutral-500">
          Aún no hay procesos. Crea uno y evalúa candidatos para poder compararlos.
        </div>
      ) : (
        <div className="grid gap-3">
          {processes.map((p) => {
            const done = p.candidates.filter((c) => c.status === "completado").length;
            const comparable = p.candidates.filter(
              (c) => c.result || c.acResult || c.cv || c.voiceResult,
            ).length;
            return (
              <Link
                key={p.id}
                href={`/comparar/${p.id}`}
                className="card hover:border-accent transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {p.candidates.length} candidato{p.candidates.length === 1 ? "" : "s"} · {done} completado
                    {done === 1 ? "" : "s"}
                    {p.reference?.source === "ai" && " · perfil de referencia ✓"}
                  </div>
                </div>
                <span className="text-sm text-accent whitespace-nowrap">
                  {comparable >= 2 ? "Comparar →" : comparable === 1 ? "Ver 1 candidato →" : "Sin datos aún"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
