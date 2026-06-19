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
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-accent900">Procesos de evaluación</h1>
          <p className="text-sm text-neutral-600 mt-1.5 max-w-[62ch]">
            Crea un proceso, envía el test HUMAN a cada candidato y recibe el reporte interpretado. Tú decides.
          </p>
        </div>
        <div className="flex gap-2 flex-none">
          <Link href="/tour" className="btn-ghost"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="m7 4 13 8-13 8V4z" /></svg>Tour</Link>
          <Link href="/comparar" className="btn-ghost"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.2a3.2 3.2 0 0 1 0 5.6M18 20a6.5 6.5 0 0 0-3-5.5" /></svg>Comparar</Link>
          <Link href="/proceso/new" className="btn-primary"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>Nuevo proceso</Link>
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
        <div className="rounded-xl border border-line overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[1fr_90px_190px_130px] items-center gap-4 px-4 py-2.5 border-b border-line bg-paper font-mono text-[11px] font-medium uppercase tracking-[0.05em] text-text3">
                <span>Proceso</span>
                <span className="text-right">Candidatos</span>
                <span>Avance</span>
                <span>Estado</span>
              </div>
              {processes.map((p, i) => {
                const total = p.candidates.length;
                const completos = p.candidates.filter((c) => candidateProgress(p, c).complete).length;
                const enCurso = p.candidates.filter((c) => { const pr = candidateProgress(p, c); return pr.started && !pr.complete; }).length;
                const pct = total ? Math.round((completos / total) * 100) : 0;
                const state = total === 0 ? "Sin candidatos" : completos === total ? "Completo" : (completos > 0 || enCurso > 0) ? "En curso" : "Sin iniciar";
                const dot = state === "Completo" ? "bg-success" : "bg-neutral-400";
                return (
                  <Link key={p.id} href={`/proceso/${p.id}`}
                    className={`grid grid-cols-[1fr_90px_190px_130px] items-center gap-4 px-4 py-3 hover:bg-paper transition ${i < processes.length - 1 ? "border-b border-line" : ""}`}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-text3">
                        <span className="tabular-nums">{new Date(p.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {p.reference?.source === "ai" && (
                          <span className="inline-flex items-center gap-1 text-accent">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            perfil de referencia
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right tabular-nums text-sm">{total}</div>
                    <div className="flex items-center gap-2">
                      <div className="progress flex-1"><span style={{ width: `${pct}%` }} /></div>
                      <span className="w-10 text-right font-mono text-[11px] tabular-nums text-text2">{completos}/{total}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[13px] font-medium">
                      <span className={`h-2 w-2 rounded-full flex-none ${dot}`} />
                      {state}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Estado del sistema: discreto, al pie, en lenguaje del psicólogo (sin jerga de despliegue). */}
      <div className="pt-4 mt-2 border-t border-line flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        <span className="inline-flex items-center gap-1.5" title={ai ? "Las interpretaciones de los reportes las redacta la IA." : "Sin IA, los reportes usan el texto determinista del manual."}>
          <span className={`h-1.5 w-1.5 rounded-full ${ai ? "bg-success" : "bg-warning"}`} />
          {ai ? "Interpretaciones con IA activadas" : "Interpretaciones con IA no disponibles"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${backend === "supabase" ? "bg-success" : "bg-neutral-400"}`} />
          {backend === "supabase" ? "Datos guardados en la nube" : "Datos guardados en este equipo"}
        </span>
      </div>
    </div>
  );
}
