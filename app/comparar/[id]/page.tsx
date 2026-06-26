import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcess } from "@/lib/store";
import { compareCandidates, referenceMini } from "@/lib/compare/score";
import CompareBoard from "./CompareBoard";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function CompararProceso({ params }: { params: { id: string } }) {
  const { t } = getServerT();
  const proc = await getProcess(params.id);
  if (!proc) notFound();

  const rows = compareCandidates(proc);
  const ref = referenceMini(proc);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/comparar" className="text-sm text-accent">{t("← Elegir otro puesto", "← Choose another role")}</Link>
        <Link href={`/proceso/${proc.id}`} className="text-sm text-neutral-500 hover:text-accent">
          {t("Ir al proceso →", "Go to process →")}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("Comparar · ", "Compare · ")}{proc.name}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {t("Ranking por encaje con el puesto, mapa de calor por vertical y radar. Ajusta los pesos para reordenar según lo que más importa en esta posición.", "Fit ranking against the role, heatmap by vertical, and radar. Adjust the weights to reorder by what matters most in this position.")}
        </p>
      </div>

      <CompareBoard processId={proc.id} processName={proc.name} rows={rows} reference={ref} />
    </div>
  );
}
