import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";
import { DiscProfile, ValoresChart, PensanteChart } from "@/components/charts";
import { competencyByKey } from "@/lib/ac/rubric";
import { cvDimensionByKey } from "@/lib/cv/rubric";
import { voiceCompetencyByKey } from "@/lib/voice/rubric";
import ReportNarrative from "./ReportNarrative";
import CvIntegration from "./CvIntegration";

const SEM: Record<string, string> = { verde: "bg-green-500", amarillo: "bg-amber-400", rojo: "bg-red-500" };

function Chip({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`text-[11px] rounded-full px-2.5 py-1 font-medium ${on ? "bg-accentSoft text-accent" : "bg-neutral-100 text-neutral-400"}`}>
      {on ? "✓ " : ""}{label}
    </span>
  );
}

const VOICE_LABELS: Record<string, string> = {
  confronto_con_hechos: "Confrontó con hechos", exploro_causa: "Exploró la causa",
  mantuvo_compostura: "Mantuvo compostura", cerro_con_plan: "Cerró con plan", escucha_activa: "Escucha activa",
  valido_la_emocion: "Validó la emoción", hechos_citados: "Hechos citados", exploro_causa_raiz: "Exploró causa raíz",
  tono_respetuoso: "Tono respetuoso", uso_etiquetas_o_ataques: "Usó etiquetas/ataques", plan_acordado: "Plan acordado",
  compromiso_concreto: "Compromiso concreto", colaborador_se_abrio: "Colaborador se abrió",
};
function prettify(k: string): string {
  return VOICE_LABELS[k] ?? k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
function fmtVal(v: unknown): string {
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export const dynamic = "force-dynamic";

const VAL_NAME: Record<string, string> = { T: "Teórico", E: "Económico", A: "Estético", S: "Social", P: "Político", R: "Regulatorio" };

export default async function ReportPage({ params }: { params: { id: string } }) {
  const found = await getCandidate(params.id);
  if (!found) notFound();
  const { process: proc, candidate } = found;
  const r = candidate.result;
  const hasAny = !!(r || candidate.cv || candidate.acResult || candidate.voiceResult);

  return (
    <div className="space-y-6">
      <Link href={`/proceso/${proc.id}`} className="text-sm text-accent">← {proc.name}</Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{candidate.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">Reporte de evaluación</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip on={!!r} label="HUMAN" />
          <Chip on={!!candidate.cv} label="CV" />
          <Chip on={!!candidate.acResult} label="AC" />
          <Chip on={!!candidate.voiceResult} label="Voz" />
        </div>
      </div>

      {!hasAny && (
        <div className="card text-center py-10 text-sm text-neutral-500">
          Aún no hay resultados para este candidato. Comparte su link para que complete las actividades.
        </div>
      )}

      {r && (
      <>
      {/* DISC */}
      <section className="card space-y-3">
        <h2 className="font-semibold">Comportamiento (DISC)</h2>
        {r.disc.notInterpretable && (
          <div className="text-xs rounded-lg bg-amber-50 text-amber-700 px-3 py-2">⚠️ {r.disc.notInterpretableReason}</div>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <DiscProfile title="Observado" scores={r.disc.profiles.observado} highlight={r.disc.interpretedProfile === "observado" as any} />
          <DiscProfile title="Motivado" scores={r.disc.profiles.proyectado} highlight={r.disc.interpretedProfile === "proyectado"} />
          <DiscProfile title="Bajo Presión" scores={r.disc.profiles.bajoPresion} highlight={r.disc.interpretedProfile === "bajoPresion"} />
        </div>
        {r.disc.combinations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {r.disc.combinations.map((c) => (
              <span key={c.pair} className="text-[11px] rounded-md bg-paper border border-line px-2 py-0.5">{c.pair} · {c.nivel}</span>
            ))}
          </div>
        )}
      </section>

      {/* Valores */}
      <section className="card space-y-3">
        <h2 className="font-semibold">Motivadores (Valores de Spranger)</h2>
        <ValoresChart scores={r.valores.scores} />
        <p className="text-sm text-neutral-600">
          Predominantes: <b>{r.valores.predominant.map((v) => VAL_NAME[v]).join(", ") || "ninguno ALTO"}</b>
        </p>
      </section>

      {/* Proceso Pensante */}
      <section className="card space-y-3">
        <h2 className="font-semibold">Estilo de pensamiento (Proceso Pensante)</h2>
        <PensanteChart scores={r.pensante.scores} />
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] rounded-md bg-accentSoft text-accent px-2 py-0.5">{r.pensante.axes.conceptualVsEspecifico}</span>
          <span className="text-[11px] rounded-md bg-accentSoft text-accent px-2 py-0.5">{r.pensante.axes.izquierdoVsDerecho}</span>
          {r.pensante.cerebroTotal && <span className="text-[11px] rounded-md bg-accent text-white px-2 py-0.5">Cerebro Total</span>}
        </div>
      </section>

      {/* Interpretación (Evaluador DOS) */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Interpretación profesional</h2>
          {candidate.dosReport && (
            <span className="text-[11px] text-neutral-400">
              {candidate.dosReport.source === "ai" ? "generado con IA" : "interpretación del manual"}
            </span>
          )}
        </div>
        <ReportNarrative
          candidateId={candidate.id}
          initialMarkdown={candidate.dosReport?.markdown ?? null}
          aiEnabled={aiEnabled()}
        />
      </section>
      </>
      )}

      {/* Assessment Center */}
      {candidate.acResult?.calificacion && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Assessment Center <span className="text-xs font-normal text-neutral-400">· conducta situacional</span></h2>
            <span className="text-[11px] text-neutral-400">
              {candidate.acResult.calificacion.source === "ai" ? "propuesta de IA — insumo" : "pendiente de IA"}
            </span>
          </div>

          {candidate.acResult.calificacion.semaforo.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {candidate.acResult.calificacion.semaforo.map((s) => (
                <span key={s.competency} className="inline-flex items-center gap-1.5 text-xs rounded-md bg-paper border border-line px-2 py-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${SEM[s.color] ?? "bg-neutral-400"}`} />
                  {competencyByKey(s.competency)?.name ?? s.competency}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {candidate.acResult.calificacion.porCompetencia.map((p, i) => (
              <div key={i} className="border border-line rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{competencyByKey(p.competency)?.name ?? p.competency}
                    <span className="text-[10px] text-neutral-400 ml-1.5 uppercase">{p.exercise}</span>
                  </span>
                  <span className="inline-flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`h-4 w-4 rounded-sm text-[9px] grid place-items-center ${n <= p.score ? "bg-accent text-white" : "bg-paper border border-line text-neutral-300"}`}>{n}</span>
                    ))}
                  </span>
                </div>
                {p.rationale && <p className="text-xs text-neutral-600 mt-1">{p.rationale}</p>}
                {p.evidence?.length > 0 && (
                  <p className="text-[11px] text-neutral-400 mt-1 italic">“{p.evidence.join("” · “")}”</p>
                )}
              </div>
            ))}
          </div>

          {candidate.acResult.calificacion.resumen && (
            <p className="text-sm text-neutral-700 border-t border-line pt-3">{candidate.acResult.calificacion.resumen}</p>
          )}
          <p className="text-[11px] text-amber-600">
            ⚠️ Calificación propuesta por IA con rúbrica en formato GENTZA (anclas provisionales). Es un insumo: revisa el verbatim y ajusta el 1–5 con tu criterio profesional.
          </p>
        </section>
      )}

      {/* Evidencias (CV) */}
      {candidate.cv?.isolated && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Evidencias (CV) <span className="text-xs font-normal text-neutral-400">· {candidate.cv.fileName}</span></h2>
            <span className="text-2xl font-bold tabular-nums" style={{ color: candidate.cv.isolated.overall >= 70 ? "#2f7d52" : candidate.cv.isolated.overall >= 45 ? "#9a7b1f" : "#b4533a" }}>
              {candidate.cv.isolated.overall}<span className="text-xs text-neutral-400 font-normal">/100</span>
            </span>
          </div>

          <div className="space-y-2">
            {candidate.cv.isolated.dimensions.map((d, i) => {
              const dim = cvDimensionByKey(d.key);
              return (
                <div key={i} className="border border-line rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dim?.name ?? d.key} <span className="text-[10px] text-neutral-400">peso {dim?.weight ?? 0}%</span></span>
                    <span className="inline-flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={`h-4 w-4 rounded-sm text-[9px] grid place-items-center ${n <= d.score ? "bg-accent text-white" : "bg-paper border border-line text-neutral-300"}`}>{n}</span>
                      ))}
                    </span>
                  </div>
                  {d.note && <p className="text-xs text-neutral-600 mt-1">{d.note}</p>}
                  {d.evidence?.length > 0 && <p className="text-[11px] text-neutral-400 mt-1 italic">“{d.evidence.join("” · “")}”</p>}
                </div>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <CvList title="Fortalezas" color="text-S" items={candidate.cv.isolated.strengths} />
            <CvList title="Brechas" color="text-amber-600" items={candidate.cv.isolated.gaps} />
            <CvList title="Banderas" color="text-red-600" items={candidate.cv.isolated.flags} />
          </div>
          {candidate.cv.isolated.summary && <p className="text-sm text-neutral-700 border-t border-line pt-3">{candidate.cv.isolated.summary}</p>}

          {/* Integración con HUMAN (triangulación) */}
          <div className="border-t border-line pt-3">
            <h3 className="text-sm font-semibold mb-2">Integración con HUMAN <span className="text-xs font-normal text-neutral-400">· triangulación</span></h3>
            <CvIntegration
              candidateId={candidate.id}
              initial={candidate.cv.integrated ?? null}
              canIntegrate={!!candidate.result}
              aiEnabled={aiEnabled()}
            />
          </div>
        </section>
      )}

      {/* Role-play por voz */}
      {candidate.voiceResult?.calificacion && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Role-play por voz <span className="text-xs font-normal text-neutral-400">· conversación de desempeño</span></h2>
            <span className="text-[11px] text-neutral-400">
              {candidate.voiceResult.calificacion.source === "ai" ? "propuesta de IA — insumo" : "pendiente"}
            </span>
          </div>

          {candidate.voiceResult.calificacion.semaforo.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {candidate.voiceResult.calificacion.semaforo.map((s) => (
                <span key={s.competency} className="inline-flex items-center gap-1.5 text-xs rounded-md bg-paper border border-line px-2 py-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${SEM[s.color] ?? "bg-neutral-400"}`} />
                  {voiceCompetencyByKey(s.competency)?.name ?? s.competency}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {candidate.voiceResult.calificacion.porCompetencia.map((p, i) => (
              <div key={i} className="border border-line rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{voiceCompetencyByKey(p.competency)?.name ?? p.competency}</span>
                  <span className="inline-flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`h-4 w-4 rounded-sm text-[9px] grid place-items-center ${n <= p.score ? "bg-accent text-white" : "bg-paper border border-line text-neutral-300"}`}>{n}</span>
                    ))}
                  </span>
                </div>
                {p.rationale && <p className="text-xs text-neutral-600 mt-1">{p.rationale}</p>}
                {p.evidence?.length > 0 && <p className="text-[11px] text-neutral-400 mt-1 italic">“{p.evidence.join("” · “")}”</p>}
              </div>
            ))}
          </div>

          {candidate.voiceResult.calificacion.resumen && (
            <p className="text-sm text-neutral-700 border-t border-line pt-3">{candidate.voiceResult.calificacion.resumen}</p>
          )}

          {candidate.voiceResult.captura.analysis && (
            <div className="border-t border-line pt-3">
              <div className="text-xs font-semibold text-neutral-500 mb-2">Señales automáticas de la llamada <span className="font-normal text-neutral-400">· ElevenLabs (GENTZA)</span></div>
              {candidate.voiceResult.captura.analysis.criteria.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {candidate.voiceResult.captura.analysis.criteria.map((c) => {
                    const ok = c.result === "success"; const bad = c.result === "failure";
                    return (
                      <span key={c.id} title={c.rationale} className={`text-[11px] rounded-md px-2 py-1 ${ok ? "bg-green-50 text-green-700" : bad ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-500"}`}>
                        {ok ? "✓" : bad ? "✗" : "?"} {prettify(c.id)}
                      </span>
                    );
                  })}
                </div>
              )}
              {candidate.voiceResult.captura.analysis.dataCollection.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {candidate.voiceResult.captura.analysis.dataCollection.map((d) => (
                    <div key={d.key} className="flex gap-1.5">
                      <span className="text-neutral-500">{prettify(d.key)}:</span>
                      <span className="font-medium">{fmtVal(d.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {candidate.voiceResult.captura.transcript.length > 0 && (
            <details className="border-t border-line pt-2">
              <summary className="text-xs text-accent cursor-pointer">▸ Ver transcripción</summary>
              <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                {candidate.voiceResult.captura.transcript.map((tt, i) => (
                  <p key={i} className={`text-xs ${tt.role === "user" ? "text-ink" : "text-neutral-500"}`}>
                    <b>{tt.role === "user" ? candidate.name : "Colaborador"}:</b> {tt.text}
                  </p>
                ))}
              </div>
            </details>
          )}
          <p className="text-[11px] text-amber-600">
            ⚠️ Calificación propuesta por IA sobre el transcript (formato GENTZA, anclas provisionales). Es un insumo: revisa la transcripción y ajusta el 1–5 con tu criterio.
          </p>
        </section>
      )}
    </div>
  );
}

function CvList({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line p-2.5">
      <div className={`text-[11px] font-semibold uppercase tracking-wide ${color} mb-1`}>{title}</div>
      {items.length ? (
        <ul className="space-y-1 text-xs text-neutral-700">{items.map((x, i) => <li key={i}>• {x}</li>)}</ul>
      ) : <p className="text-xs text-neutral-400">—</p>}
    </div>
  );
}
