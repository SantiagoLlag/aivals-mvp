import Link from "next/link";
import { listProcesses, backend } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";
import { candidateProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const processes = await listProcesses();
  const ai = aiEnabled();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procesos de evaluación</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Crea un proceso, envía el test HUMAN a cada candidato y recibe el reporte interpretado.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tour" className="btn-ghost">🎬 Tour</Link>
          <Link href="/comparar" className="btn-ghost">📊 Comparar candidatos</Link>
          <Link href="/proceso/new" className="btn-primary">+ Nuevo proceso</Link>
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="card anim-fadeup">
          <h2 className="font-semibold">Empieza aquí</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Un <b>proceso</b> reúne a los candidatos de un mismo puesto. El flujo es:
          </p>
          <ol className="mt-3 grid sm:grid-cols-3 gap-2 text-sm">
            <li className="rounded-lg bg-paper border border-line px-3 py-2"><b>1.</b> Creas el proceso (puesto + empresa).</li>
            <li className="rounded-lg bg-paper border border-line px-3 py-2"><b>2.</b> Compartes el link único a cada candidato.</li>
            <li className="rounded-lg bg-paper border border-line px-3 py-2"><b>3.</b> Lees el reporte interpretado y comparas.</li>
          </ol>
          <p className="text-sm text-neutral-600 mt-3">
            Cada candidato completa hasta 4 actividades: <b>HUMAN</b> (psicométrico), <b>Assessment Center</b>,{" "}
            <b>CV</b> y <b>role-play por voz</b>. La IA las interpreta; tú decides.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/tour" className="btn-ghost">🎬 Ver el tour (2 min)</Link>
            <Link href="/proceso/new" className="btn-primary">+ Crear mi primer proceso</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {processes.map((p) => {
            const completos = p.candidates.filter((c) => candidateProgress(p, c).complete).length;
            const enCurso = p.candidates.filter((c) => {
              const pr = candidateProgress(p, c);
              return pr.started && !pr.complete;
            }).length;
            return (
              <Link key={p.id} href={`/proceso/${p.id}`} className="card hover:border-accent transition flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    {p.reference?.source === "ai" && " · perfil de referencia ✓"}
                  </div>
                </div>
                <div className="text-sm text-neutral-600 text-right">
                  {p.candidates.length} candidato{p.candidates.length === 1 ? "" : "s"}
                  <div className="text-xs text-neutral-400">
                    {completos} complet{completos === 1 ? "o" : "os"}{enCurso > 0 ? ` · ${enCurso} en curso` : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Estado del sistema: discreto, al pie, en lenguaje del psicólogo (sin jerga de despliegue). */}
      <div className="pt-4 mt-2 border-t border-line flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        <span className="inline-flex items-center gap-1.5" title={ai ? "Las interpretaciones de los reportes las redacta la IA." : "Sin IA, los reportes usan el texto determinista del manual."}>
          <span className={`h-1.5 w-1.5 rounded-full ${ai ? "bg-emerald-500" : "bg-amber-500"}`} />
          {ai ? "Interpretaciones con IA activadas" : "Interpretaciones con IA no disponibles"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${backend === "supabase" ? "bg-emerald-500" : "bg-neutral-400"}`} />
          {backend === "supabase" ? "Datos guardados en la nube" : "Datos guardados en este equipo"}
        </span>
      </div>
    </div>
  );
}
