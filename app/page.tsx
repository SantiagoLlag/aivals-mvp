import Link from "next/link";
import { listProcesses, backend } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";
import { candidateProgress } from "@/lib/progress";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const processes = await listProcesses();
  const ai = aiEnabled();
  const { t } = getServerT();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-accent900">{t("Procesos de evaluación", "Evaluation processes")}</h1>
          <p className="text-sm text-neutral-600 mt-1.5 max-w-[62ch]">
            {t("Crea un proceso, envía el test HUMAN a cada candidato y recibe el reporte interpretado. Tú decides.", "Create a process, send the HUMAN test to each candidate and receive the interpreted report. You decide.")}
          </p>
        </div>
        <div className="flex gap-2 flex-none">
          <Link href="/tour" className="btn-ghost"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="m7 4 13 8-13 8V4z" /></svg>{t("Tour", "Tour")}</Link>
          <Link href="/comparar" className="btn-ghost"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.2a3.2 3.2 0 0 1 0 5.6M18 20a6.5 6.5 0 0 0-3-5.5" /></svg>{t("Comparar", "Compare")}</Link>
          <Link href="/proceso/new" className="btn-primary"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>{t("Nuevo proceso", "New process")}</Link>
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="card anim-fadeup">
          <h2 className="font-semibold">{t("Empieza aquí", "Start here")}</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {t("Un ", "A ")}<b>{t("proceso", "process")}</b>{t(" reúne a los candidatos de un mismo puesto. El flujo es:", " gathers the candidates for the same position. The flow is:")}
          </p>
          <ol className="mt-3 grid sm:grid-cols-3 gap-2 text-sm">
            <li className="rounded-lg bg-paper border border-line px-3 py-2"><b>1.</b> {t("Creas el proceso (puesto + empresa).", "You create the process (position + company).")}</li>
            <li className="rounded-lg bg-paper border border-line px-3 py-2"><b>2.</b> {t("Compartes el link único a cada candidato.", "You share the unique link with each candidate.")}</li>
            <li className="rounded-lg bg-paper border border-line px-3 py-2"><b>3.</b> {t("Lees el reporte interpretado y comparas.", "You read the interpreted report and compare.")}</li>
          </ol>
          <p className="text-sm text-neutral-600 mt-3">
            {t("Cada candidato completa hasta 4 actividades: ", "Each candidate completes up to 4 activities: ")}<b>HUMAN</b>{t(" (psicométrico), ", " (psychometric), ")}<b>Assessment Center</b>,{" "}
            <b>CV</b>{t(" y ", " and ")}<b>{t("role-play por voz", "voice role-play")}</b>{t(". La IA las interpreta; tú decides.", ". The AI interprets them; you decide.")}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/tour" className="btn-ghost">{t("🎬 Ver el tour (2 min)", "🎬 Watch the tour (2 min)")}</Link>
            <Link href="/proceso/new" className="btn-primary">{t("+ Crear mi primer proceso", "+ Create my first process")}</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-line overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[1fr_90px_190px_130px] items-center gap-4 px-4 py-2.5 border-b border-line bg-paper font-mono text-[11px] font-medium uppercase tracking-[0.05em] text-text3">
                <span>{t("Proceso", "Process")}</span>
                <span className="text-right">{t("Candidatos", "Candidates")}</span>
                <span>{t("Avance", "Progress")}</span>
                <span>{t("Estado", "Status")}</span>
              </div>
              {processes.map((p, i) => {
                const total = p.candidates.length;
                const completos = p.candidates.filter((c) => candidateProgress(p, c).complete).length;
                const enCurso = p.candidates.filter((c) => { const pr = candidateProgress(p, c); return pr.started && !pr.complete; }).length;
                const pct = total ? Math.round((completos / total) * 100) : 0;
                const state = total === 0 ? t("Sin candidatos", "No candidates") : completos === total ? t("Completo", "Complete") : (completos > 0 || enCurso > 0) ? t("En curso", "In progress") : t("Sin iniciar", "Not started");
                const dot = total > 0 && completos === total ? "bg-success" : "bg-neutral-400";
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
                            {t("perfil de referencia", "reference profile")}
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
        <span className="inline-flex items-center gap-1.5" title={ai ? t("Las interpretaciones de los reportes las redacta la IA.", "The report interpretations are written by the AI.") : t("Sin IA, los reportes usan el texto determinista del manual.", "Without AI, the reports use the deterministic text from the manual.")}>
          <span className={`h-1.5 w-1.5 rounded-full ${ai ? "bg-success" : "bg-warning"}`} />
          {ai ? t("Interpretaciones con IA activadas", "AI interpretations enabled") : t("Interpretaciones con IA no disponibles", "AI interpretations not available")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${backend === "supabase" ? "bg-success" : "bg-neutral-400"}`} />
          {backend === "supabase" ? t("Datos guardados en la nube", "Data stored in the cloud") : t("Datos guardados en este equipo", "Data stored on this device")}
        </span>
      </div>
    </div>
  );
}
