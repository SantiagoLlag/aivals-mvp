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
import ReportTour from "./ReportTour";
import CompetencyScores from "./CompetencyScores";
import PrintButton from "./PrintButton";
import { FLAGS } from "@/lib/flags";
import EvidenciaHuman from "./EvidenciaHuman";
import EvidenciaAc from "./EvidenciaAc";
import EvidenciaCv from "./EvidenciaCv";
import EvidenciaVoz from "./EvidenciaVoz";
import { EvidenceDivider } from "./EvidenceBand";
import { getServerT } from "@/lib/i18n-server";

// Semáforo disciplinado: colores semánticos desaturados, idénticos a los del comparador.
const SEM: Record<string, string> = { verde: "bg-success", amarillo: "bg-warning", rojo: "bg-danger" };

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

export default async function ReportPage({ params, searchParams }: { params: { id: string }; searchParams: { tour?: string } }) {
  const { t } = getServerT();
  const found = await getCandidate(params.id);
  if (!found) notFound();
  const { process: proc, candidate } = found;
  const r = candidate.result;
  const hasAny = !!(r || candidate.cv || candidate.acResult || candidate.voiceResult);

  // Navegación entre candidatos del mismo proceso (C16).
  const sibs = proc.candidates;
  const idx = sibs.findIndex((c) => c.id === candidate.id);
  const prev = idx > 0 ? sibs[idx - 1] : null;
  const next = idx >= 0 && idx < sibs.length - 1 ? sibs[idx + 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap no-print">
        <Link href={`/proceso/${proc.id}`} className="text-sm text-accent">← {proc.name}</Link>
        <div className="flex items-center gap-2">
          {sibs.length > 1 && (
            <>
              {prev
                ? <Link href={`/reporte/${prev.id}`} className="text-xs text-accent hover:underline" title={t(`Candidato anterior: ${prev.name}`, `Previous candidate: ${prev.name}`)}>← {t("anterior", "previous")}</Link>
                : <span className="text-xs text-neutral-300">← {t("anterior", "previous")}</span>}
              <span className="text-neutral-300">·</span>
              {next
                ? <Link href={`/reporte/${next.id}`} className="text-xs text-accent hover:underline" title={t(`Siguiente candidato: ${next.name}`, `Next candidate: ${next.name}`)}>{t("siguiente", "next")} →</Link>
                : <span className="text-xs text-neutral-300">{t("siguiente", "next")} →</span>}
              <span className="text-neutral-300">·</span>
            </>
          )}
          <Link href={`/comparar/${proc.id}`} className="text-xs text-accent hover:underline">📊 {t("Comparar", "Compare")}</Link>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{candidate.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("Reporte de evaluación", "Evaluation report")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip on={!!r} label="HUMAN" />
          <Chip on={!!candidate.cv} label="CV" />
          <Chip on={!!candidate.acResult} label="AC" />
          <Chip on={!!candidate.voiceResult} label={t("Voz", "Voice")} />
          {hasAny && <PrintButton />}
        </div>
      </div>

      {hasAny && <ReportTour autoStart={searchParams?.tour === "1"} />}

      {!hasAny && (
        <div className="card text-center py-10 text-sm text-neutral-500">
          {t("Aún no hay resultados para este candidato. Comparte su link para que complete las actividades.", "There are no results for this candidate yet. Share their link so they can complete the activities.")}
        </div>
      )}

      {r && (
      <>
      {FLAGS.evidenceBand && <EvidenciaHuman candidate={candidate} />}
      {/* DISC */}
      <section className="card space-y-3">
        <h2 className="font-semibold">{t("Comportamiento (DISC)", "Behavior (DISC)")}</h2>
        {!FLAGS.evidenceBand && r.disc.notInterpretable && (
          <div className="text-xs rounded-lg bg-amber-50 text-amber-700 px-3 py-2">⚠️ {r.disc.notInterpretableReason}</div>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <DiscProfile title={t("Observado", "Observed")} scores={r.disc.profiles.observado} highlight={r.disc.interpretedProfile === "observado" as any} />
          <DiscProfile title={t("Motivado", "Motivated")} scores={r.disc.profiles.proyectado} highlight={r.disc.interpretedProfile === "proyectado"} />
          <DiscProfile title={t("Bajo Presión", "Under Pressure")} scores={r.disc.profiles.bajoPresion} highlight={r.disc.interpretedProfile === "bajoPresion"} />
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
        <h2 className="font-semibold">{t("Motivadores (Valores de Spranger)", "Motivators (Spranger Values)")}</h2>
        <ValoresChart scores={r.valores.scores} />
        <p className="text-sm text-neutral-600">
          {t("Predominantes:", "Predominant:")} <b>{r.valores.predominant.map((v) => VAL_NAME[v]).join(", ") || t("ninguno ALTO", "none HIGH")}</b>
        </p>
      </section>

      {/* Proceso Pensante */}
      <section className="card space-y-3">
        <h2 className="font-semibold">{t("Estilo de pensamiento (Proceso Pensante)", "Thinking style (Thinking Process)")}</h2>
        <PensanteChart scores={r.pensante.scores} />
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] rounded-md bg-accentSoft text-accent px-2 py-0.5">{r.pensante.axes.conceptualVsEspecifico}</span>
          <span className="text-[11px] rounded-md bg-accentSoft text-accent px-2 py-0.5">{r.pensante.axes.izquierdoVsDerecho}</span>
          {r.pensante.cerebroTotal && <span className="text-[11px] rounded-md bg-accent text-white px-2 py-0.5">{t("Cerebro Total", "Whole Brain")}</span>}
        </div>
      </section>

      {/* Interpretación (Evaluador DOS) — vive en el contenedor-IA, subordinada al juicio humano */}
      <section className="card space-y-3">
        <h2 className="font-semibold">{t("Interpretación profesional", "Professional interpretation")} <span className="text-xs font-normal text-neutral-400">· {t("Evaluador DOS — integra HUMAN", "DOS Evaluator — integrates HUMAN")}</span></h2>
        {candidate.dosReport?.source === "ai" ? (
          <div className="ai-surface">
            <div className="ai-surface__head">
              {candidate.dosReport.edited ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{t("Interpretación · ajustada por ti", "Interpretation · adjusted by you")}</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M5 12H1M23 12h-4" /><circle cx="12" cy="12" r="3.5" /></svg>{t("IA · valida antes de decidir", "AI · validate before deciding")}</>
              )}
            </div>
            <div className="ai-surface__body">
              <ReportNarrative candidateId={candidate.id} initialMarkdown={candidate.dosReport.markdown} aiEnabled={aiEnabled()} />
            </div>
          </div>
        ) : (
          <ReportNarrative candidateId={candidate.id} initialMarkdown={candidate.dosReport?.markdown ?? null} aiEnabled={aiEnabled()} />
        )}
      </section>
      </>
      )}

      {/* Assessment Center */}
      {candidate.acResult?.calificacion && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Assessment Center <span className="text-xs font-normal text-neutral-400">· {t("conducta situacional", "situational behavior")}</span></h2>
            <span className="text-[11px] text-neutral-400">
              {candidate.acResult.calificacion.source === "ai" ? t("propuesta de IA — insumo", "AI proposal — input") : t("pendiente de IA", "pending AI")}
            </span>
          </div>

          {FLAGS.evidenceBand && (
            <>
              <EvidenciaAc candidate={candidate} proc={proc} />
              <EvidenceDivider />
            </>
          )}

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

          <CompetencyScores
            candidateId={candidate.id}
            target="ac"
            rows={candidate.acResult.calificacion.porCompetencia.map((p) => ({
              competency: p.competency,
              name: competencyByKey(p.competency)?.name ?? p.competency,
              score: p.score, edited: p.edited, rationale: p.rationale, evidence: p.evidence, exercise: p.exercise,
            }))}
          />

          {candidate.acResult.calificacion.resumen && (
            <p className="text-sm text-neutral-700 border-t border-line pt-3">{candidate.acResult.calificacion.resumen}</p>
          )}
          <p className="text-[11px] text-amber-600">
            ⚠️ {t("Calificación propuesta por IA con rúbrica en formato", "Score proposed by AI with a rubric in")} <span title={t("GENTZA: método de evaluación por competencias con conductas ancla 1–5 (ORCSE: observar, clasificar y evaluar la conducta).", "GENTZA: competency-based evaluation method with anchor behaviors 1–5 (ORCSE: observe, classify and evaluate behavior).")} className="underline decoration-dotted cursor-help">GENTZA</span> {t("(anclas provisionales). Es un insumo: revisa el verbatim y haz clic en el 1–5 para ajustarlo con tu criterio.", "format (provisional anchors). It is an input: review the verbatim and click the 1–5 to adjust it with your judgment.")}
          </p>
        </section>
      )}

      {/* Evidencias (CV) */}
      {candidate.cv?.isolated && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("Evidencias (CV)", "Evidence (Résumé)")} <span className="text-xs font-normal text-neutral-400">· {candidate.cv.fileName}</span></h2>
            <div className="text-right">
              <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-text3 mb-0.5">{t("Ajuste documental", "Document fit")}</div>
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-[34px] leading-none font-medium tabular-nums text-ink">{candidate.cv.isolated.overall}</span>
                <span className="text-xs text-text3">{t("de 100", "of 100")}</span>
              </div>
            </div>
          </div>

          {FLAGS.evidenceBand && (
            <>
              <EvidenciaCv candidate={candidate} />
              <EvidenceDivider />
            </>
          )}

          <div className="space-y-2">
            {candidate.cv.isolated.dimensions.map((d, i) => {
              const dim = cvDimensionByKey(d.key);
              return (
                <div key={i} className="border border-line rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dim?.name ?? d.key} <span className="text-[10px] text-neutral-400">{t("peso", "weight")} {dim?.weight ?? 0}%</span></span>
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
            <CvList title={t("Fortalezas", "Strengths")} color="text-S" items={candidate.cv.isolated.strengths} />
            <CvList title={t("Brechas", "Gaps")} color="text-amber-600" items={candidate.cv.isolated.gaps} />
            <CvList title={t("Banderas", "Flags")} color="text-red-600" items={candidate.cv.isolated.flags} />
          </div>
          {candidate.cv.isolated.summary && <p className="text-sm text-neutral-700 border-t border-line pt-3">{candidate.cv.isolated.summary}</p>}

          {/* Integración con HUMAN (triangulación) */}
          <div className="border-t border-line pt-3">
            <h3 className="text-sm font-semibold mb-2">{t("Integración con HUMAN", "Integration with HUMAN")} <span className="text-xs font-normal text-neutral-400">· {t("triangulación", "triangulation")}</span></h3>
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
            <h2 className="font-semibold">{t("Role-play por voz", "Voice role-play")} <span className="text-xs font-normal text-neutral-400">· {t("conversación de desempeño", "performance conversation")}</span></h2>
            <span className="text-[11px] text-neutral-400">
              {candidate.voiceResult.calificacion.source === "ai" ? t("propuesta de IA — insumo", "AI proposal — input") : t("pendiente", "pending")}
            </span>
          </div>

          {FLAGS.evidenceBand && (
            <>
              <EvidenciaVoz candidate={candidate} />
              <EvidenceDivider />
            </>
          )}

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

          <CompetencyScores
            candidateId={candidate.id}
            target="voz"
            rows={candidate.voiceResult.calificacion.porCompetencia.map((p) => ({
              competency: p.competency,
              name: voiceCompetencyByKey(p.competency)?.name ?? p.competency,
              score: p.score, edited: p.edited, rationale: p.rationale, evidence: p.evidence,
            }))}
          />

          {candidate.voiceResult.calificacion.resumen && (
            <p className="text-sm text-neutral-700 border-t border-line pt-3">{candidate.voiceResult.calificacion.resumen}</p>
          )}

          {candidate.voiceResult.captura.analysis && (
            <div className="border-t border-line pt-3">
              <div className="text-xs font-semibold text-neutral-500 mb-2">{t("Señales automáticas de la llamada", "Automatic call signals")} <span className="font-normal text-neutral-400">· ElevenLabs (GENTZA)</span></div>
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

          {!FLAGS.evidenceBand && candidate.voiceResult.captura.transcript.length > 0 && (
            <details className="border-t border-line pt-2">
              <summary className="text-xs text-accent cursor-pointer">▸ {t("Ver transcripción", "View transcript")}</summary>
              <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                {candidate.voiceResult.captura.transcript.map((tt, i) => (
                  <p key={i} className={`text-xs ${tt.role === "user" ? "text-ink" : "text-neutral-500"}`}>
                    <b>{tt.role === "user" ? candidate.name : t("Colaborador", "Team member")}:</b> {tt.text}
                  </p>
                ))}
              </div>
            </details>
          )}
          <p className="text-[11px] text-amber-600">
            ⚠️ {t("Calificación propuesta por IA sobre el transcript (formato", "Score proposed by AI over the transcript (")}<span title={t("GENTZA: método de evaluación por competencias con conductas ancla 1–5.", "GENTZA: competency-based evaluation method with anchor behaviors 1–5.")} className="underline decoration-dotted cursor-help">GENTZA</span>{t(", anclas provisionales). Es un insumo: revisa la transcripción y haz clic en el 1–5 para ajustarlo.", " format, provisional anchors). It is an input: review the transcript and click the 1–5 to adjust it.")}
          </p>
        </section>
      )}

      {hasAny && (
        <p className="text-[11px] text-neutral-400 border-t border-line pt-3">
          {t("Documento generado con Aivals. La IA es un", "Document generated with Aivals. AI is an")} <b>{t("insumo", "input")}</b> {t("para el psicólogo, no un veredicto: la interpretación y la decisión finales son profesionales y humanas.", "for the psychologist, not a verdict: the final interpretation and decision are professional and human.")}
        </p>
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
