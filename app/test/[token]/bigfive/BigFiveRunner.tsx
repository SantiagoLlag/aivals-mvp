"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/LangProvider";
import type { PublicBigFive } from "@/lib/bigfive/publicTest";

const PER_PAGE = 10;

export default function BigFiveRunner({
  token, candidateName, test,
}: { token: string; candidateName: string; test: PublicBigFive }) {
  const { t, lang } = useT();
  const pages = Math.ceil(test.items.length / PER_PAGE);
  const steps = 1 + pages; // consentimiento + páginas
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- persistencia local (una recarga no debe borrar el avance) ----
  const STORAGE_KEY = `aivals:bigfive:${token}`;
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.ans) setAns(s.ans);
        if (typeof s.step === "number" && s.step >= 0 && s.step < steps) setStep(s.step);
      }
    } catch { /* sin persistencia */ }
    hydrated.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, ans })); } catch {}
  }, [step, ans]); // eslint-disable-line react-hooks/exhaustive-deps

  const anchors = lang === "en" ? test.scaleAnchorsEn : test.scaleAnchorsEs;
  const pageItems = (p: number) => test.items.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);
  const pageComplete = step === 0 || pageItems(step - 1).every((it) => ans[it.id] != null);
  const allComplete = test.items.every((it) => ans[it.id] != null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/test/${token}/bigfive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans }),
      });
      if (!res.ok) {
        if (res.status === 409) throw new Error(t("Esta prueba ya se había enviado. Puedes cerrar la ventana.", "This test had already been submitted. You can close this window."));
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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
          <span>{t(`Paso ${step + 1} de ${steps}`, `Step ${step + 1} of ${steps}`)}</span>
          <span>{Math.round(((step + 1) / (steps + 1)) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / (steps + 1)) * 100}%` }} />
        </div>
      </div>

      {step === 0 ? (
        <div className="card space-y-3">
          <h2 className="text-lg font-bold">{t(`Hola, ${candidateName}`, `Hello, ${candidateName}`)}</h2>
          <p className="text-sm text-neutral-700">
            {t("Vas a contestar un cuestionario de personalidad de 50 frases. Para cada una, indica qué tan de acuerdo estás contigo mismo. No hay respuestas buenas ni malas; toma unos 7 minutos.", "You'll answer a 50-statement personality questionnaire. For each one, indicate how much you agree it describes you. There are no right or wrong answers; it takes about 7 minutes.")}
          </p>
          <p className="text-sm text-neutral-700">
            {t("Tus respuestas se usarán únicamente para tu evaluación profesional y serán interpretadas por un psicólogo. Al continuar, otorgas tu consentimiento informado.", "Your answers will be used solely for your professional assessment and interpreted by a psychologist. By continuing, you give your informed consent.")}
          </p>
          <p className="text-xs text-neutral-500">{t("Responde con honestidad y de forma espontánea.", "Answer honestly and spontaneously.")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{t("¿Qué tan de acuerdo estás?", "How much do you agree?")}</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {t("Para cada frase, elige del 1 (muy en desacuerdo) al 5 (muy de acuerdo).", "For each statement, choose from 1 (strongly disagree) to 5 (strongly agree).")}
            </p>
            <div className="mt-2 flex justify-between text-[10px] text-text3 font-mono">
              <span>1 · {anchors[0]}</span>
              <span>5 · {anchors[4]}</span>
            </div>
          </div>
          {pageItems(step - 1).map((it) => (
            <div key={it.id} className="card py-3 flex items-center justify-between gap-3">
              <span className="text-sm">{lang === "en" ? it.en : it.es}</span>
              <div className="flex gap-1 flex-none">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" onClick={() => setAns((a) => ({ ...a, [it.id]: v }))}
                    title={anchors[v - 1]}
                    className={`h-8 w-8 rounded-md border text-xs ${ans[it.id] === v ? "bg-accent text-white border-accent" : "border-line hover:border-accent"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button className="btn-ghost" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>← {t("Atrás", "Back")}</button>
        {step < steps - 1 ? (
          <button className="btn-primary" disabled={!pageComplete} onClick={() => setStep((s) => s + 1)}>{t("Continuar", "Continue")} →</button>
        ) : (
          <button className="btn-primary" disabled={!allComplete || submitting} onClick={submit}>
            {submitting ? t("Enviando…", "Submitting…") : t("Finalizar y enviar", "Finish and submit")}
          </button>
        )}
      </div>
      {!pageComplete && step > 0 && (
        <p className="text-xs text-amber-600 text-right">{t("Responde todas las frases de este paso para continuar.", "Answer every statement on this step to continue.")}</p>
      )}
    </div>
  );
}
