"use client";
import { useEffect, useState } from "react";

type Step = { title: string; body: string; headings: string[] };

// Cada paso explica el PROCESO (cómo el candidato genera el dato y cómo la IA lo analiza)
// y se ancla a la(s) sección(es) del reporte por el texto de su <h2>.
const STEPS: Step[] = [
  {
    title: "🧠 Prueba HUMAN",
    headings: ["Comportamiento (DISC)", "Motivadores", "Estilo de pensamiento"],
    body: "El candidato responde el test HUMAN directamente en la plataforma (comportamiento DISC, valores y estilo de pensamiento). El motor calcula los puntajes de forma 100% exacta y determinista — esto retrata cómo es la persona.",
  },
  {
    title: "🧩 Interpretación profesional (IA)",
    headings: ["Interpretación profesional"],
    body: "La IA (Evaluador DOS) integra los tres instrumentos de HUMAN en una lectura profesional anclada en el manual: fortalezas, riesgos, áreas de desarrollo y compatibilidad con el puesto.",
  },
  {
    title: "📥 Assessment Center",
    headings: ["Assessment Center"],
    body: "El candidato resolvió una bandeja de entrada y situaciones calibradas a este puesto. La IA observa la conducta y la califica con el método GENTZA (ORCSE, escala 1–5), citando evidencia textual de lo que hizo.",
  },
  {
    title: "📄 CV / Evidencias",
    headings: ["Evidencias (CV)"],
    body: "El candidato sube su CV en PDF a la plataforma. La IA lo analiza contra el puesto (6 dimensiones) y luego lo CRUZA con los resultados de HUMAN — triangula lo que el CV dice con lo que la persona realmente es.",
  },
  {
    title: "📞 Role-play por voz",
    headings: ["Role-play por voz"],
    body: "El candidato tuvo una llamada en vivo con un colaborador interpretado por IA. El psicólogo puede revisar la transcripción, escuchar el audio o ver directamente el análisis 1–5 de la conducta conversacional (coaching, manejo de conflicto, escucha…).",
  },
];

function findSections(headings: string[]): HTMLElement[] {
  const out: HTMLElement[] = [];
  document.querySelectorAll("section").forEach((sec) => {
    const h = sec.querySelector("h2")?.textContent ?? "";
    if (headings.some((t) => h.includes(t))) out.push(sec as HTMLElement);
  });
  return out;
}

function clearHighlights() {
  document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
}

export default function ReportTour({ autoStart }: { autoStart?: boolean }) {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    const present = STEPS.filter((s) => findSections(s.headings).length > 0);
    setSteps(present);
    if (autoStart && present.length) setActive(true);
  }, [autoStart]);

  useEffect(() => {
    if (!active || !steps[i]) return;
    clearHighlights();
    const secs = findSections(steps[i].headings);
    secs.forEach((el) => el.classList.add("tour-highlight"));
    secs[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [active, i, steps]);

  useEffect(() => () => clearHighlights(), []);

  function close() {
    setActive(false);
    clearHighlights();
  }

  if (!active) {
    if (!steps.length) return null;
    return (
      <button onClick={() => { setI(0); setActive(true); }} className="btn-primary text-sm">
        🎬 Tour guiado de este reporte
      </button>
    );
  }

  const s = steps[i];
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-xl card shadow-xl border-accent/30 anim-fadeup">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Paso {i + 1} de {steps.length}</span>
          <button onClick={close} className="hover:text-ink">✕ Cerrar</button>
        </div>
        <h3 className="font-bold mt-1">{s.title}</h3>
        <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{s.body}</p>
        <div className="mt-3 h-1 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <button className="btn-ghost text-sm" disabled={i === 0} onClick={() => setI(i - 1)}>← Anterior</button>
          {i < steps.length - 1
            ? <button className="btn-primary text-sm" onClick={() => setI(i + 1)}>Siguiente →</button>
            : <button className="btn-primary text-sm" onClick={close}>Terminar ✓</button>}
        </div>
      </div>
    </div>
  );
}
