"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/LangProvider";
import type { AcBlueprint } from "@/lib/ac/types";

const ACCIONES = [
  { v: "Responder yo", en: "Reply myself", icon: "✍️" },
  { v: "Delegar", en: "Delegate", icon: "👥" },
  { v: "Escalar a mi jefe", en: "Escalate to my manager", icon: "⬆️" },
  { v: "Convocar reunión", en: "Call a meeting", icon: "📅" },
  { v: "Pedir más información", en: "Request more information", icon: "❓" },
  { v: "Posponer", en: "Postpone", icon: "⏳" },
];

export default function AcRunner({
  token, candidateName, blueprint,
}: { token: string; candidateName: string; blueprint: AcBlueprint }) {
  const { t } = useT();
  const steps = ["intro", "charola", "sjt"] as const;
  const [step, setStep] = useState(0);
  const [charola, setCharola] = useState<Record<string, { accion?: string; rationale: string }>>({});
  const [sjt, setSjt] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistencia local: una recarga no debe borrar el avance. Rehidrata al montar, limpia al enviar.
  const STORAGE_KEY = `aivals:ac:${token}`;
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.charola) setCharola(s.charola);
        if (s.sjt) setSjt(s.sjt);
        if (typeof s.step === "number" && s.step >= 0 && s.step < steps.length) setStep(s.step);
      }
    } catch { /* sin persistencia disponible */ }
    hydrated.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, charola, sjt })); } catch { /* noop */ }
  }, [step, charola, sjt]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = blueprint.charola.items;
  const escenarios = blueprint.sjt.escenarios;

  const charolaDone = items.length > 0 && items.every((it) => {
    const a = charola[it.id];
    return a?.accion && (a.rationale?.trim().length ?? 0) >= 3;
  });
  const sjtDone = escenarios.length > 0 && escenarios.every((es) => (sjt[es.id]?.trim().length ?? 0) >= 3);
  const charolaCount = items.filter((it) => charola[it.id]?.accion && (charola[it.id]?.rationale?.trim().length ?? 0) >= 3).length;
  const sjtCount = escenarios.filter((es) => (sjt[es.id]?.trim().length ?? 0) >= 3).length;

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/test/${token}/ac`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charola: items.map((it) => ({ itemId: it.id, accion: charola[it.id]?.accion ?? "", rationale: charola[it.id]?.rationale ?? "" })),
          sjt: escenarios.map((es) => ({ scenarioId: es.id, respuesta: sjt[es.id] ?? "" })),
        }),
      });
      if (!res.ok) {
        if (res.status === 409) throw new Error(t("Este ejercicio ya se había enviado. Puedes cerrar la ventana.", "This exercise had already been submitted. You can close the window."));
        throw new Error(t("No se pudo guardar. Revisa tu conexión — tus respuestas siguen aquí. Intenta de nuevo.", "Couldn't save. Check your connection — your answers are still here. Please try again."));
      }
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setDone(true);
    } catch (e: any) { setError(e.message); setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto anim-pop">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-bold">{t(`¡Listo, ${candidateName}!`, `All set, ${candidateName}!`)}</h2>
        <p className="text-sm text-neutral-600 mt-2">
          {t("Completaste el ejercicio de simulación. Tus respuestas se registraron y serán revisadas por un evaluador profesional. Ya puedes cerrar esta ventana.", "You completed the simulation exercise. Your answers were recorded and will be reviewed by a professional evaluator. You can now close this window.")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* progreso */}
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
          <span>{[t("Cómo funciona", "How it works"), t("Tu bandeja de entrada", "Your inbox"), t("Situaciones", "Situations")][step]}</span>
          <span>{t(`Paso ${step + 1} de ${steps.length}`, `Step ${step + 1} of ${steps.length}`)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / (steps.length + 1)) * 100}%` }} />
        </div>
      </div>

      {step === 0 && <Tutorial blueprint={blueprint} name={candidateName} nItems={items.length} nScen={escenarios.length} />}

      {step === 1 && (
        <div className="space-y-4">
          <StepHeader emoji="📥" title={t("Tu bandeja de entrada", "Your inbox")}
            sub={t(`Estos son ${items.length} mensajes que llegaron a tu bandeja. Para cada uno, elige qué harías y explica brevemente por qué.`, `These are ${items.length} messages that arrived in your inbox. For each one, choose what you would do and briefly explain why.`)} />
          <div className="rounded-xl bg-accentSoft border border-accent/20 px-4 py-3 text-sm text-ink anim-fadeup">
            <b>{t("Tu rol:", "Your role:")}</b> {blueprint.contextoPuesto}
          </div>
          {items.map((it, i) => (
            <div key={it.id} className="card space-y-3 anim-fadeup" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="border-b border-line pb-2">
                <div className="text-[11px] text-neutral-400">{t(`Mensaje ${i + 1} de ${items.length}`, `Message ${i + 1} of ${items.length}`)} · {t("de", "from")} {it.de}</div>
                <div className="font-semibold text-sm">{it.asunto}</div>
              </div>
              <p className="text-sm text-neutral-700 whitespace-pre-line">{it.cuerpo}</p>
              <div>
                <div className="label">{t("¿Qué haces?", "What do you do?")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {ACCIONES.map((a) => {
                    const sel = charola[it.id]?.accion === a.v;
                    return (
                      <button key={a.v} type="button"
                        onClick={() => setCharola((c) => ({ ...c, [it.id]: { ...(c[it.id] ?? { rationale: "" }), accion: a.v } }))}
                        className={`text-xs rounded-lg border px-2.5 py-1.5 transition ${sel ? "bg-accent text-white border-accent" : "border-line hover:border-accent"}`}>
                        {a.icon} {t(a.v, a.en)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="label">{t("¿Por qué? (2-3 líneas)", "Why? (2-3 lines)")}</div>
                <textarea className="textarea" placeholder={t("Explica tu decisión: prioridad, a quién delegas, qué instrucción das…", "Explain your decision: priority, who you delegate to, what instructions you give…")}
                  value={charola[it.id]?.rationale ?? ""}
                  onChange={(e) => setCharola((c) => ({ ...c, [it.id]: { ...(c[it.id] ?? {}), rationale: e.target.value } }))} />
              </div>
            </div>
          ))}
          <p className="text-xs text-neutral-500 text-right">{t(`${charolaCount} de ${items.length} respondidos`, `${charolaCount} of ${items.length} answered`)}</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <StepHeader emoji="🎯" title={t("Situaciones", "Situations")}
            sub={t(`${escenarios.length} situaciones breves del día a día. Responde con naturalidad, como lo harías en el trabajo.`, `${escenarios.length} brief day-to-day situations. Answer naturally, as you would at work.`)} />
          {escenarios.map((es, i) => (
            <div key={es.id} className="card space-y-3 anim-fadeup" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="text-[11px] text-neutral-400">{t(`Situación ${i + 1} de ${escenarios.length}`, `Situation ${i + 1} of ${escenarios.length}`)}</div>
              <p className="text-sm text-neutral-700">{es.situacion}</p>
              <p className="text-sm font-medium">{es.pregunta}</p>
              <textarea className="textarea" placeholder={t("Tu respuesta…", "Your answer…")}
                value={sjt[es.id] ?? ""}
                onChange={(e) => setSjt((s) => ({ ...s, [es.id]: e.target.value }))} />
            </div>
          ))}
          <p className="text-xs text-neutral-500 text-right">{t(`${sjtCount} de ${escenarios.length} respondidos`, `${sjtCount} of ${escenarios.length} answered`)}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button className="btn-ghost" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>{t("← Atrás", "← Back")}</button>
        {step === 0 && <button className="btn-primary anim-pulse" onClick={() => setStep(1)}>{t("Comenzar el ejercicio →", "Start the exercise →")}</button>}
        {step === 1 && <button className="btn-primary" disabled={!charolaDone} onClick={() => setStep(2)}>{t("Continuar →", "Continue →")}</button>}
        {step === 2 && <button className="btn-primary" disabled={!sjtDone || submitting} onClick={submit}>{submitting ? t("Enviando…", "Submitting…") : t("Finalizar y enviar", "Finish and submit")}</button>}
      </div>
      {((step === 1 && !charolaDone) || (step === 2 && !sjtDone)) && (
        <p className="text-xs text-amber-600 text-right">{t("Elige una acción y escribe tu motivo en cada tarjeta para continuar.", "Choose an action and write your reason on each card to continue.")}</p>
      )}
    </div>
  );
}

function StepHeader({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="anim-fadeup">
      <h2 className="text-lg font-bold">{emoji} {title}</h2>
      <p className="text-sm text-neutral-600 mt-1">{sub}</p>
    </div>
  );
}

function Tutorial({ blueprint, name, nItems, nScen }: { blueprint: AcBlueprint; name: string; nItems: number; nScen: number }) {
  const { t } = useT();
  return (
    <div className="space-y-5">
      {/* hero animado */}
      <div className="card text-center overflow-hidden relative">
        <InboxArt aria={t("Bandeja de entrada", "Inbox")} />
        <h2 className="text-2xl font-bold mt-2 anim-fadeup">{t(`Hola, ${name} 👋`, `Hi, ${name} 👋`)}</h2>
        <p className="text-sm text-neutral-600 mt-1 anim-fadeup max-w-md mx-auto" style={{ animationDelay: "80ms" }}>
          {t("Vas a hacer un", "You're going to do a")} <b>{t("ejercicio de simulación", "simulation exercise")}</b>{t(": por un rato te pones en los zapatos de un puesto real y resuelves su día a día. No es un examen — queremos ver", ": for a while you step into the shoes of a real role and handle its day-to-day. It's not an exam — we want to see")} <b>{t("cómo piensas y actúas", "how you think and act")}</b>.
        </p>
      </div>

      {/* tu rol */}
      <div className="rounded-xl bg-accentSoft border border-accent/20 px-4 py-3 anim-fadeup" style={{ animationDelay: "160ms" }}>
        <div className="label text-accent">{t("Tu rol en esta simulación", "Your role in this simulation")}</div>
        <p className="text-sm text-ink">{blueprint.contextoPuesto}</p>
      </div>

      {/* cómo funciona */}
      <div className="grid sm:grid-cols-3 gap-3">
        <HowCard delay={220} emoji="📥" title={t("1 · Tu bandeja", "1 · Your inbox")}
          text={t(`Revisarás ${nItems} mensajes (correos, quejas, decisiones). Para cada uno eliges una acción y explicas en pocas líneas por qué.`, `You'll review ${nItems} messages (emails, complaints, decisions). For each one you choose an action and explain in a few lines why.`)} />
        <HowCard delay={300} emoji="🎯" title={t("2 · Situaciones", "2 · Situations")}
          text={t(`Después resolverás ${nScen} situaciones cortas del puesto, con una respuesta breve cada una.`, `Then you'll resolve ${nScen} short situations from the role, with a brief answer for each.`)} />
        <HowCard delay={380} emoji="💡" title={t("3 · Sé tú", "3 · Be yourself")}
          text={t("No hay una respuesta perfecta. Mostramos cómo priorizas, decides y te comunicas. Responde con naturalidad.", "There's no perfect answer. We show how you prioritize, decide, and communicate. Answer naturally.")} />
      </div>

      <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-neutral-600 anim-fadeup flex gap-2" style={{ animationDelay: "460ms" }}>
        <span>⏱️</span>
        <span>{t("Tómate tu tiempo (unos 20–30 min). Tus respuestas son confidenciales y serán interpretadas por un evaluador profesional; al comenzar otorgas tu consentimiento para este tratamiento de datos.", "Take your time (about 20–30 min). Your answers are confidential and will be interpreted by a professional evaluator; by starting, you give your consent for this data processing.")}</span>
      </div>
    </div>
  );
}

function HowCard({ emoji, title, text, delay }: { emoji: string; title: string; text: string; delay: number }) {
  return (
    <div className="card anim-pop" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-2xl">{emoji}</div>
      <div className="font-semibold text-sm mt-1">{title}</div>
      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function InboxArt({ aria }: { aria: string }) {
  return (
    <svg viewBox="0 0 220 120" className="mx-auto w-44 h-24" role="img" aria-label={aria}>
      {/* sobres flotando */}
      <g className="anim-float" style={{ transformOrigin: "center" }}>
        <g transform="translate(70 18)">
          <rect width="80" height="52" rx="6" fill="#fff" stroke="#1f6f78" strokeWidth="2" />
          <path d="M2 8 L40 34 L78 8" fill="none" stroke="#1f6f78" strokeWidth="2"
            strokeDasharray="320" style={{ animation: "drawLine 1.4s ease forwards" }} />
        </g>
      </g>
      <g transform="translate(40 60)" opacity="0.9">
        <rect width="60" height="38" rx="5" fill="#e7f1f1" stroke="#1f6f78" strokeWidth="1.5" />
        <path d="M2 6 L30 24 L58 6" fill="none" stroke="#1f6f78" strokeWidth="1.5" />
      </g>
      <g transform="translate(124 64)" opacity="0.8">
        <rect width="56" height="34" rx="5" fill="#fbf7ea" stroke="#9a7b1f" strokeWidth="1.5" />
        <path d="M2 5 L28 22 L54 5" fill="none" stroke="#9a7b1f" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
