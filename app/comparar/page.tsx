import Link from "next/link";
import { listProcesses } from "@/lib/store";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aivals — Comparar candidatos" };

export default async function CompararPicker() {
  const { t } = getServerT();
  const processes = await listProcesses();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-accent">{t("← Panel", "← Dashboard")}</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("Comparar candidatos", "Compare candidates")}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {t("Elige un puesto para ver a sus candidatos lado a lado: ranking de encaje, mapa de calor por vertical y radar.", "Pick a role to see its candidates side by side: fit ranking, heatmap by vertical, and radar.")}
        </p>
      </div>

      {processes.length === 0 ? (
        <div className="card text-center py-12 text-neutral-500">
          {t("Aún no hay procesos. Crea uno y evalúa candidatos para poder compararlos.", "No processes yet. Create one and evaluate candidates to compare them.")}
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
                    {p.candidates.length} {t(`candidato${p.candidates.length === 1 ? "" : "s"}`, `candidate${p.candidates.length === 1 ? "" : "s"}`)} · {done} {t(`completado${done === 1 ? "" : "s"}`, `completed`)}
                    {p.reference?.source === "ai" && t(" · perfil de referencia ✓", " · reference profile ✓")}
                  </div>
                </div>
                <span className="text-sm text-accent whitespace-nowrap">
                  {comparable >= 2 ? t("Comparar →", "Compare →") : comparable === 1 ? t("Ver 1 candidato →", "View 1 candidate →") : t("Sin datos aún", "No data yet")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
