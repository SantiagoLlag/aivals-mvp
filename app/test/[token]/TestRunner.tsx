"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicTest } from "@/lib/human/publicTest";
import { useT } from "@/components/LangProvider";

type DiscAns = Record<number, { mas?: number; menos?: number }>;

export default function TestRunner({
  token, candidateName, test,
}: { token: string; candidateName: string; test: PublicTest }) {
  const { t } = useT();
  const steps = ["consent", "disc", "valores", "penI", "penII", "penIII"] as const;
  const [step, setStep] = useState(0);
  const [discAns, setDiscAns] = useState<DiscAns>({});
  const [valOrder, setValOrder] = useState<Record<number, string[]>>({});
  // Grupo I del Pensante = CALIFICACIÓN LIBRE (id de opción → valor; se puede repetir), no ranking.
  const [penI, setPenI] = useState<Record<string, number>>({});
  const [penII, setPenII] = useState<Record<string, number>>({});
  const [penIII, setPenIII] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- persistencia local: una recarga o cierre accidental no debe borrar 15-25 min ----
  // Se rehidrata en el montaje (no en el initializer: rompería el SSR) y se limpia al enviar.
  const STORAGE_KEY = `aivals:human:${token}`;
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.discAns) setDiscAns(s.discAns);
        if (s.valOrder) setValOrder(s.valOrder);
        if (s.penI) setPenI(s.penI);
        if (s.penII) setPenII(s.penII);
        if (s.penIII) setPenIII(s.penIII);
        if (typeof s.step === "number" && s.step >= 0 && s.step < steps.length) setStep(s.step);
      }
    } catch { /* sin persistencia disponible */ }
    hydrated.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, discAns, valOrder, penI, penII, penIII }));
    } catch { /* almacenamiento lleno/bloqueado: seguimos en memoria */ }
  }, [step, discAns, valOrder, penI, penII, penIII]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- completeness per step ----
  const discComplete = test.disc.series.every((s) => {
    const a = discAns[s.n];
    return a && a.mas && a.menos && a.mas !== a.menos;
  });
  const valComplete = test.valores.series.every((s) => (valOrder[s.n]?.length ?? 0) === s.concepts.length);
  const penIComplete = test.pensante.groupI.questions.every((q) => q.options.every((o) => penI[o.id] != null));
  const penIIComplete = test.pensante.groupII.items.every((it) => penII[it.id] != null);
  const penIIIComplete = test.pensante.groupIII.items.every((it) => penIII[it.id] != null);

  const canContinue = [true, discComplete, valComplete, penIComplete, penIIComplete, penIIIComplete][step];

  async function submit() {
    setSubmitting(true);
    setError(null);
    // construir payload con el shape que espera el motor
    const valores: Record<string, number> = {};
    for (const s of test.valores.series) {
      (valOrder[s.n] ?? []).forEach((id, k) => { valores[id] = 6 - k; });
    }
    // Grupo I = calificación libre (cada opción ya tiene su valor en penI, se puede repetir),
    // igual que II/III. El motor suma el valor de cada ítem.
    const pensante: Record<string, number> = { ...penI, ...penII, ...penIII };
    try {
      const res = await fetch(`/api/test/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disc: discAns, valores, pensante }),
      });
      if (!res.ok) {
        if (res.status === 409) throw new Error(t("Esta evaluación ya se había enviado. Puedes cerrar la ventana.", "This assessment had already been submitted. You can close this window."));
        throw new Error(t("No se pudo guardar. Revisa tu conexión — tus respuestas siguen aquí. Intenta de nuevo.", "Could not save. Check your connection — your answers are still here. Try again."));
      }
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setDone(true);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-xl font-bold">{t(`¡Gracias, ${candidateName}!`, `Thank you, ${candidateName}!`)}</h2>
        <p className="text-sm text-neutral-600 mt-2">
          {t("Tus respuestas se registraron correctamente. Ya puedes cerrar esta ventana.", "Your answers were recorded successfully. You can now close this window.")}
        </p>
      </div>
    );
  }

  const labels = [t("Consentimiento", "Consent"), t("Comportamiento", "Behavior"), t("Motivadores", "Motivators"), t("Pensamiento I", "Thinking I"), t("Pensamiento II", "Thinking II"), t("Pensamiento III", "Thinking III")];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
          <span>{t(`Paso ${step + 1} de ${steps.length}`, `Step ${step + 1} of ${steps.length}`)} · {labels[step]}</span>
          <span>{Math.round(((step + 1) / (steps.length + 1)) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          {/* El 100% se reserva para el envío (pantalla "done"): durante el formulario nunca llega a 100. */}
          <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / (steps.length + 1)) * 100}%` }} />
        </div>
      </div>

      {step === 0 && <Consent name={candidateName} />}
      {step === 1 && <DiscStep test={test} ans={discAns} setAns={setDiscAns} />}
      {step === 2 && <ValoresStep test={test} order={valOrder} setOrder={setValOrder} />}
      {step === 3 && <RatePensanteI test={test} ans={penI} setAns={setPenI} />}
      {step === 4 && <RatePensante items={test.pensante.groupII.items} title={test.pensante.groupII.title} ans={penII} setAns={setPenII} />}
      {step === 5 && <RatePensante items={test.pensante.groupIII.items} title={test.pensante.groupIII.title} ans={penIII} setAns={setPenIII} />}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button className="btn-ghost" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>← {t("Atrás", "Back")}</button>
        {step < steps.length - 1 ? (
          <button className="btn-primary" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
            {t("Continuar", "Continue")} →
          </button>
        ) : (
          <button className="btn-primary" disabled={!canContinue || submitting} onClick={submit}>
            {submitting ? t("Enviando…", "Submitting…") : t("Finalizar y enviar", "Finish and submit")}
          </button>
        )}
      </div>
      {!canContinue && step > 0 && (
        <p className="text-xs text-amber-600 text-right">{t("Completa todas las respuestas de este paso para continuar.", "Complete all the answers in this step to continue.")}</p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- subcomponentes
function Consent({ name }: { name: string }) {
  const { t } = useT();
  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-bold">{t(`Hola, ${name}`, `Hello, ${name}`)}</h2>
      <p className="text-sm text-neutral-700">
        {t("Estás por completar la prueba", "You are about to complete the")} <b>HUMAN</b> {t("que explora tu estilo de comportamiento, tus motivadores y tu estilo de pensamiento. No es una prueba de inteligencia y no hay respuestas buenas o malas. Toma entre 15 y 25 minutos.", "test, which explores your behavioral style, your motivators and your thinking style. It is not an intelligence test and there are no right or wrong answers. It takes between 15 and 25 minutes.")}
      </p>
      <p className="text-sm text-neutral-700">
        {t("Tus respuestas se usarán únicamente para tu evaluación profesional y serán interpretadas por un psicólogo. Al continuar, otorgas tu consentimiento informado para este tratamiento de datos.", "Your answers will be used solely for your professional assessment and will be interpreted by a psychologist. By continuing, you give your informed consent for this processing of data.")}
      </p>
      <p className="text-xs text-neutral-500">{t("Responde con honestidad y de forma espontánea.", "Answer honestly and spontaneously.")}</p>
    </div>
  );
}

function DiscStep({ test, ans, setAns }: { test: PublicTest; ans: DiscAns; setAns: (f: (a: DiscAns) => DiscAns) => void }) {
  const { t } = useT();
  function pick(n: number, kind: "mas" | "menos", pos: number) {
    setAns((a) => {
      const cur = { ...(a[n] ?? {}) };
      cur[kind] = pos;
      // evitar que más y menos sean la misma palabra
      const other = kind === "mas" ? "menos" : "mas";
      if (cur[other] === pos) cur[other] = undefined;
      return { ...a, [n]: cur };
    });
  }
  return (
    <div className="space-y-4">
      <Intro title={t("Comportamiento (DISC)", "Behavior (DISC)")}
        text={t("En cada grupo de 4 palabras, elige la que MÁS te describe y la que MENOS te describe.", "In each group of 4 words, choose the one that describes you the MOST and the one that describes you the LEAST.")} />
      {test.disc.series.map((s) => {
        const a = ans[s.n] ?? {};
        return (
          <div key={s.n} className="card py-4">
            <div className="text-xs text-neutral-400 mb-2">{t(`Grupo ${s.n} de 24`, `Group ${s.n} of 24`)}</div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <div className="text-xs font-semibold text-neutral-400" />
              <div className="text-[10px] font-semibold uppercase text-S text-center w-16">{t("Más", "Most")}</div>
              <div className="text-[10px] font-semibold uppercase text-D text-center w-16">{t("Menos", "Least")}</div>
              {s.words.map((w) => (
                <Row key={w.pos}
                  text={w.text}
                  mas={a.mas === w.pos}
                  menos={a.menos === w.pos}
                  onMas={() => pick(s.n, "mas", w.pos)}
                  onMenos={() => pick(s.n, "menos", w.pos)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function Row({ text, mas, menos, onMas, onMenos }: any) {
  return (
    <>
      <div className="text-sm">{text}</div>
      <button onClick={onMas} className={`h-7 w-16 rounded-md border text-xs ${mas ? "bg-S text-white border-S" : "border-line hover:border-S"}`}>{mas ? "✓" : ""}</button>
      <button onClick={onMenos} className={`h-7 w-16 rounded-md border text-xs ${menos ? "bg-D text-white border-D" : "border-line hover:border-D"}`}>{menos ? "✓" : ""}</button>
    </>
  );
}

function ValoresStep({ test, order, setOrder }: { test: PublicTest; order: Record<number, string[]>; setOrder: (f: (o: Record<number, string[]>) => Record<number, string[]>) => void }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <Intro title={t("Motivadores (Valores)", "Motivators (Values)")}
        text={t("En cada grupo, haz clic en los conceptos en orden de importancia para ti: el primer clic es el MÁS importante (6) y el último el menos (1).", "In each group, click the concepts in order of importance to you: the first click is the MOST important (6) and the last the least (1).")} />
      {test.valores.series.map((s) => (
        <RankGroup key={s.n}
          label={t(`Grupo ${s.n} de 10`, `Group ${s.n} of 10`)}
          items={s.concepts}
          sequence={[6, 5, 4, 3, 2, 1]}
          value={order[s.n] ?? []}
          onChange={(v) => setOrder((o) => ({ ...o, [s.n]: v }))} />
      ))}
    </div>
  );
}

// Grupo I: CALIFICACIÓN LIBRE (no ranking). Cada opción recibe un valor de la escala del
// instrumento {5,4,2,1} y se puede repetir entre opciones (así es el HUMAN original).
function RatePensanteI({ test, ans, setAns }: {
  test: PublicTest;
  ans: Record<string, number>;
  setAns: (f: (a: Record<string, number>) => Record<string, number>) => void;
}) {
  const { t } = useT();
  const scale = test.pensante.groupI.scale; // [5, 4, 2, 1]
  return (
    <div className="space-y-4">
      <Intro title={t(`Pensamiento — ${test.pensante.groupI.title}`, `Thinking — ${test.pensante.groupI.title}`)}
        text={t("En cada pregunta, califica cada opción según cuánto te gusta o te describe: 5 = la que más, 1 = la que menos. Puedes repetir calificaciones.", "For each question, rate every option according to how much you like it or it describes you: 5 = the most, 1 = the least. You can repeat ratings.")} />
      {test.pensante.groupI.questions.map((q, i) => (
        <div key={i} className="card py-4">
          <div className="text-xs text-neutral-400 mb-2">{q.title || t(`Pregunta ${i + 1}`, `Question ${i + 1}`)}</div>
          <div className="grid gap-1.5">
            {q.options.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                <span className="text-sm">{o.text}</span>
                <div className="flex gap-1">
                  {scale.map((v) => (
                    <button key={v} type="button" onClick={() => setAns((a) => ({ ...a, [o.id]: v }))}
                      className={`h-8 w-8 rounded-md border text-xs ${ans[o.id] === v ? "bg-accent text-white border-accent" : "border-line hover:border-accent"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankGroup({ label, items, sequence, value, onChange }: {
  label: string; items: { id: string; text: string }[]; sequence: number[]; value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else if (value.length < items.length) onChange([...value, id]);
  }
  return (
    <div className="card py-4">
      <div className="text-xs text-neutral-400 mb-2">{label}</div>
      <div className="grid gap-1.5">
        {items.map((it) => {
          const idx = value.indexOf(it.id);
          const rank = idx === -1 ? null : sequence[idx];
          return (
            <button key={it.id} onClick={() => toggle(it.id)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${rank != null ? "border-accent bg-accentSoft" : "border-line hover:border-accent"}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${rank != null ? "bg-accent text-white" : "bg-paper text-neutral-400 border border-line"}`}>
                {rank ?? ""}
              </span>
              {it.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RatePensante({ items, title, ans, setAns }: {
  items: { id: string; text: string }[]; title: string; ans: Record<string, number>;
  setAns: (f: (a: Record<string, number>) => Record<string, number>) => void;
}) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <Intro title={t(`Pensamiento — ${title}`, `Thinking — ${title}`)}
        text={t("Califica cada elemento del 1 (no me describe / me disgusta) al 5 (me describe muy bien / me gusta mucho). Puedes repetir calificaciones.", "Rate each item from 1 (does not describe me / I dislike it) to 5 (describes me very well / I like it a lot). You can repeat ratings.")} />
      {items.map((it) => (
        <div key={it.id} className="card py-3 flex items-center justify-between gap-3">
          <span className="text-sm">{it.text}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => setAns((a) => ({ ...a, [it.id]: v }))}
                className={`h-8 w-8 rounded-md border text-xs ${ans[it.id] === v ? "bg-accent text-white border-accent" : "border-line hover:border-accent"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Intro({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-neutral-600 mt-1">{text}</p>
    </div>
  );
}
