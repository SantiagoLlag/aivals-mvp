"use client";
import { useMemo, useState } from "react";
import type { AcBlueprint } from "@/lib/ac/types";

const ACCIONES = [
  { v: "Responder yo", icon: "✍️" },
  { v: "Delegar", icon: "👥" },
  { v: "Escalar a mi jefe", icon: "⬆️" },
  { v: "Convocar reunión", icon: "📅" },
  { v: "Pedir más información", icon: "❓" },
  { v: "Posponer", icon: "⏳" },
];

export default function AcRunner({
  token, candidateName, blueprint,
}: { token: string; candidateName: string; blueprint: AcBlueprint }) {
  const steps = ["intro", "charola", "sjt"] as const;
  const [step, setStep] = useState(0);
  const [charola, setCharola] = useState<Record<string, { accion?: string; rationale: string }>>({});
  const [sjt, setSjt] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) throw new Error("No se pudo guardar. Intenta de nuevo.");
      setDone(true);
    } catch (e: any) { setError(e.message); setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto anim-pop">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-bold">¡Listo, {candidateName}!</h2>
        <p className="text-sm text-neutral-600 mt-2">
          Completaste el ejercicio de simulación. Tus respuestas se registraron y serán revisadas por un
          evaluador profesional. Ya puedes cerrar esta ventana.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* progreso */}
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
          <span>{["Cómo funciona", "Tu bandeja de entrada", "Situaciones"][step]}</span>
          <span>Paso {step + 1} de {steps.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
        </div>
      </div>

      {step === 0 && <Tutorial blueprint={blueprint} name={candidateName} nItems={items.length} nScen={escenarios.length} />}

      {step === 1 && (
        <div className="space-y-4">
          <StepHeader emoji="📥" title="Tu bandeja de entrada"
            sub={`Estos son ${items.length} mensajes que llegaron a tu bandeja. Para cada uno, elige qué harías y explica brevemente por qué.`} />
          <div className="rounded-xl bg-accentSoft border border-accent/20 px-4 py-3 text-sm text-ink anim-fadeup">
            <b>Tu rol:</b> {blueprint.contextoPuesto}
          </div>
          {items.map((it, i) => (
            <div key={it.id} className="card space-y-3 anim-fadeup" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="border-b border-line pb-2">
                <div className="text-[11px] text-neutral-400">Mensaje {i + 1} de {items.length} · de {it.de}</div>
                <div className="font-semibold text-sm">{it.asunto}</div>
              </div>
              <p className="text-sm text-neutral-700 whitespace-pre-line">{it.cuerpo}</p>
              <div>
                <div className="label">¿Qué haces?</div>
                <div className="flex flex-wrap gap-1.5">
                  {ACCIONES.map((a) => {
                    const sel = charola[it.id]?.accion === a.v;
                    return (
                      <button key={a.v} type="button"
                        onClick={() => setCharola((c) => ({ ...c, [it.id]: { ...(c[it.id] ?? { rationale: "" }), accion: a.v } }))}
                        className={`text-xs rounded-lg border px-2.5 py-1.5 transition ${sel ? "bg-accent text-white border-accent" : "border-line hover:border-accent"}`}>
                        {a.icon} {a.v}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="label">¿Por qué? (2-3 líneas)</div>
                <textarea className="textarea" placeholder="Explica tu decisión: prioridad, a quién delegas, qué instrucción das…"
                  value={charola[it.id]?.rationale ?? ""}
                  onChange={(e) => setCharola((c) => ({ ...c, [it.id]: { ...(c[it.id] ?? {}), rationale: e.target.value } }))} />
              </div>
            </div>
          ))}
          <p className="text-xs text-neutral-500 text-right">{charolaCount} de {items.length} respondidos</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <StepHeader emoji="🎯" title="Situaciones"
            sub={`${escenarios.length} situaciones breves del día a día. Responde con naturalidad, como lo harías en el trabajo.`} />
          {escenarios.map((es, i) => (
            <div key={es.id} className="card space-y-3 anim-fadeup" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="text-[11px] text-neutral-400">Situación {i + 1} de {escenarios.length}</div>
              <p className="text-sm text-neutral-700">{es.situacion}</p>
              <p className="text-sm font-medium">{es.pregunta}</p>
              <textarea className="textarea" placeholder="Tu respuesta…"
                value={sjt[es.id] ?? ""}
                onChange={(e) => setSjt((s) => ({ ...s, [es.id]: e.target.value }))} />
            </div>
          ))}
          <p className="text-xs text-neutral-500 text-right">{sjtCount} de {escenarios.length} respondidos</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button className="btn-ghost" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>← Atrás</button>
        {step === 0 && <button className="btn-primary anim-pulse" onClick={() => setStep(1)}>Comenzar el ejercicio →</button>}
        {step === 1 && <button className="btn-primary" disabled={!charolaDone} onClick={() => setStep(2)}>Continuar →</button>}
        {step === 2 && <button className="btn-primary" disabled={!sjtDone || submitting} onClick={submit}>{submitting ? "Enviando…" : "Finalizar y enviar"}</button>}
      </div>
      {((step === 1 && !charolaDone) || (step === 2 && !sjtDone)) && (
        <p className="text-xs text-amber-600 text-right">Elige una acción y escribe tu motivo en cada tarjeta para continuar.</p>
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
  return (
    <div className="space-y-5">
      {/* hero animado */}
      <div className="card text-center overflow-hidden relative">
        <InboxArt />
        <h2 className="text-2xl font-bold mt-2 anim-fadeup">Hola, {name} 👋</h2>
        <p className="text-sm text-neutral-600 mt-1 anim-fadeup max-w-md mx-auto" style={{ animationDelay: "80ms" }}>
          Vas a hacer un <b>ejercicio de simulación</b>: por un rato te pones en los zapatos de un puesto real
          y resuelves su día a día. No es un examen — queremos ver <b>cómo piensas y actúas</b>.
        </p>
      </div>

      {/* tu rol */}
      <div className="rounded-xl bg-accentSoft border border-accent/20 px-4 py-3 anim-fadeup" style={{ animationDelay: "160ms" }}>
        <div className="label text-accent">Tu rol en esta simulación</div>
        <p className="text-sm text-ink">{blueprint.contextoPuesto}</p>
      </div>

      {/* cómo funciona */}
      <div className="grid sm:grid-cols-3 gap-3">
        <HowCard delay={220} emoji="📥" title="1 · Tu bandeja"
          text={`Revisarás ${nItems} mensajes (correos, quejas, decisiones). Para cada uno eliges una acción y explicas en pocas líneas por qué.`} />
        <HowCard delay={300} emoji="🎯" title="2 · Situaciones"
          text={`Después resolverás ${nScen} situaciones cortas del puesto, con una respuesta breve cada una.`} />
        <HowCard delay={380} emoji="💡" title="3 · Sé tú"
          text="No hay una respuesta perfecta. Mostramos cómo priorizas, decides y te comunicas. Responde con naturalidad." />
      </div>

      <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-neutral-600 anim-fadeup flex gap-2" style={{ animationDelay: "460ms" }}>
        <span>⏱️</span>
        <span>Tómate tu tiempo (unos 20–30 min). Tus respuestas son confidenciales y serán interpretadas por un evaluador profesional; al comenzar otorgas tu consentimiento para este tratamiento de datos.</span>
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

function InboxArt() {
  return (
    <svg viewBox="0 0 220 120" className="mx-auto w-44 h-24" role="img" aria-label="Bandeja de entrada">
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
