import type { Candidate } from "@/lib/types";
import type { ValueCode } from "@/lib/human/types";
import { FLAGS } from "@/lib/flags";
import { getServerT } from "@/lib/i18n-server";
import { BIGFIVE_FACTOR_LABELS } from "@/lib/bigfive/types";
import {
  triangular,
  preguntasExploracion,
  metodoNombre,
  competencyNombre,
  type ResumenFila,
} from "@/lib/insights/triangulation";

// Síntesis de triangulación multi-método (determinista, sin IA). Server component.
// Devuelve null con datos en MENOS de 2 métodos: triangular con un solo método no es triangular.
export default function Triangulacion({ candidate }: { candidate: Candidate }) {
  const { t, lang } = getServerT();

  // Respeta el gate del Big Five: con FF_BIG_FIVE apagado, ese método no existe en el reporte.
  const cand: Candidate = FLAGS.bigFive ? candidate : { ...candidate, bigFive: undefined };
  const tri = triangular(cand);
  if (tri.presentes.length < 2) return null;

  const preguntas = preguntasExploracion(tri, t);
  const cvIA = cand.cv?.integrated?.explorarEnEntrevista ?? [];

  const VAL: Record<ValueCode, string> = {
    T: t("Teórico", "Theoretical"),
    E: t("Económico", "Economic"),
    A: t("Estético", "Aesthetic"),
    S: t("Social", "Social"),
    P: t("Político", "Political"),
    R: t("Regulatorio", "Regulatory"),
  };
  const PERFIL: Record<"bajoPresion" | "proyectado", string> = {
    bajoPresion: t("Bajo Presión", "Under Pressure"),
    proyectado: t("Motivado", "Motivated"),
  };
  const bfLabel = (f: keyof typeof BIGFIVE_FACTOR_LABELS) =>
    lang === "en" ? BIGFIVE_FACTOR_LABELS[f].en : BIGFIVE_FACTOR_LABELS[f].es;
  const fmt15 = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

  const rotulo = (fila: ResumenFila): string => {
    if (fila.metodo === "ac" || fila.metodo === "voz") return t("media de competencias", "competency mean");
    if (fila.metodo === "cv") return t("ajuste documental · 0–100", "document fit · 0–100");
    return t("descriptivo", "descriptive");
  };

  const hayChips =
    !!tri.convergenciaGlobal ||
    tri.divergenciasGlobales.length > 0 ||
    tri.convergenciasCompetencia.length > 0 ||
    tri.divergenciasCompetencia.length > 0;

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-semibold">
          {t("Triangulación multi-método", "Multi-method triangulation")}{" "}
          <span className="text-xs font-normal text-neutral-400">· {t("síntesis determinista", "deterministic synthesis")}</span>
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-text3">
          {t("computado sin IA", "computed without AI")}
        </span>
      </div>

      {/* Resumen: una fila por método presente */}
      <div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
        {tri.resumen.map((fila) => (
          <div key={fila.metodo} className="px-3 py-2.5 grid gap-x-3 gap-y-1 sm:grid-cols-[11.5rem_1fr] sm:items-center bg-white">
            <div>
              <div className="text-sm font-medium">{metodoNombre(fila.metodo, t)}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.04em] text-text3">{rotulo(fila)}</div>
            </div>

            {(fila.metodo === "ac" || fila.metodo === "voz") && (
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 progress"><span style={{ width: `${fila.score}%` }} /></div>
                  <span className="w-10 text-right font-mono text-xs tabular-nums">{fila.score}</span>
                </div>
                <p className="font-mono text-[10px] text-text3 mt-1 tabular-nums">
                  {t("media", "mean")} {fmt15(fila.media)}/5 · n={fila.n}
                </p>
              </div>
            )}

            {fila.metodo === "cv" && (
              <div className="flex items-center gap-3">
                <div className="flex-1 progress"><span style={{ width: `${fila.score}%` }} /></div>
                <span className="w-10 text-right font-mono text-xs tabular-nums">{fila.score}</span>
              </div>
            )}

            {fila.metodo === "human" && (
              <p className="text-xs text-neutral-700">
                {t("Perfil interpretado:", "Interpreted profile:")} <b>{PERFIL[fila.perfil]}</b>
                {fila.notInterpretable && (
                  <span className="text-warning"> · {t("patrón no interpretable", "pattern not interpretable")}</span>
                )}
                <span className="text-neutral-500"> · {t("valores predominantes:", "predominant values:")}</span>{" "}
                <b>{fila.predominantes.map((v) => VAL[v]).join(", ") || t("ninguno ALTO", "none HIGH")}</b>
              </p>
            )}

            {fila.metodo === "bigfive" && (
              <p className="text-xs text-neutral-700">
                {t("Rasgo más alto:", "Highest trait:")} <b>{bfLabel(fila.alto.factor)} {fila.alto.score}</b>
                <span className="text-neutral-500"> · </span>
                {t("más bajo:", "lowest:")} <b>{bfLabel(fila.bajo.factor)} {fila.bajo.score}</b>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Convergencias / divergencias (solo entre escalas comparables) */}
      <div>
        <div className="label mb-2">{t("Convergencias y divergencias", "Convergences and divergences")}</div>
        {hayChips ? (
          <div className="flex flex-wrap gap-1.5">
            {tri.convergenciaGlobal && (
              <span className="inline-flex items-center gap-1.5 text-[11px] rounded-md bg-success/10 text-success px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {t("Convergencia global", "Global convergence")} ·{" "}
                {tri.convergenciaGlobal.metodos.map((m) => `${metodoNombre(m.metodo, t)} ${m.score}`).join(" · ")}{" "}
                ({t("rango", "range")} {tri.convergenciaGlobal.rango})
              </span>
            )}
            {tri.divergenciasGlobales.map((d) => (
              <span key={`${d.a}-${d.b}`} className="inline-flex items-center gap-1.5 text-[11px] rounded-md bg-warning/10 text-warning px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {t("Divergencia", "Divergence")} · {metodoNombre(d.a, t)} {d.scoreA} vs {metodoNombre(d.b, t)} {d.scoreB} (Δ{d.diff})
              </span>
            ))}
            {tri.convergenciasCompetencia.map((c) => (
              <span key={`conv-${c.competency}`} className="inline-flex items-center gap-1.5 text-[11px] rounded-md bg-success/10 text-success px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {t("Convergencia", "Convergence")} · {competencyNombre(c.competency)}: AC {fmt15(c.ac)}/5 · {t("Voz", "Voice")} {fmt15(c.voz)}/5
              </span>
            ))}
            {tri.divergenciasCompetencia.map((c) => (
              <span key={`div-${c.competency}`} className="inline-flex items-center gap-1.5 text-[11px] rounded-md bg-warning/10 text-warning px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {t("Divergencia", "Divergence")} · {competencyNombre(c.competency)}: AC {fmt15(c.ac)}/5 vs {t("Voz", "Voice")} {fmt15(c.voz)}/5
              </span>
            ))}
          </div>
        ) : tri.escalables.length < 2 ? (
          <p className="text-xs text-text3">
            {t(
              "Los métodos presentes no comparten una escala comparable (el agregado 0–100 solo es legítimo en AC, CV y Voz): lee cada fila en sus propios términos.",
              "The methods present do not share a comparable scale (the 0–100 aggregate is only legitimate for AC, CV and Voice): read each row on its own terms.",
            )}
          </p>
        ) : (
          <p className="text-xs text-text3">
            {t(
              "Sin convergencia ni divergencias fuertes entre los agregados (diferencias intermedias): contrasta las filas con tu criterio.",
              "No strong convergence or divergences between the aggregates (intermediate differences): contrast the rows with your judgment.",
            )}
          </p>
        )}
      </div>

      {/* Preguntas plantilla deterministas, derivadas de las divergencias */}
      {preguntas.length > 0 && (
        <div>
          <div className="label mb-2">{t("Explorar en entrevista", "Explore in interview")}</div>
          <ul className="space-y-1.5">
            {preguntas.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700">
                <span className="font-mono text-[10px] text-text3 pt-0.5 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bloque APARTE: preguntas de la IA de integración del CV (Evaluador Central). No se mezclan. */}
      {cvIA.length > 0 && (
        <div className="ai-surface">
          <div className="ai-surface__head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4M12 17v4M5 12H1M23 12h-4" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
            {t("Explorar en entrevista · IA de integración del CV", "Explore in interview · CV integration AI")}
          </div>
          <div className="ai-surface__body space-y-1.5">
            {cvIA.map((q, i) => (
              <p key={i} className="text-sm text-neutral-700">• {q}</p>
            ))}
            <p className="text-[11px] text-text3 pt-1">
              {t(
                "Estas preguntas provienen de la integración CV + HUMAN hecha por IA; valida antes de usarlas. No forman parte de la síntesis determinista de arriba.",
                "These questions come from the AI-made CV + HUMAN integration; validate before using them. They are not part of the deterministic synthesis above.",
              )}
            </p>
          </div>
        </div>
      )}

      <p className="font-mono text-[11px] text-text3 border-t border-line pt-3">
        {t("Dónde mirar, no un veredicto: la lectura integrada la haces tú.", "Where to look, not a verdict: you make the integrated reading.")}
      </p>
    </section>
  );
}
