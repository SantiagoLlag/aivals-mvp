// Progreso real de un candidato a través de las verticales ACTIVAS del proceso.
// Antes "completado" se fijaba solo al terminar HUMAN, así que quien hizo AC+CV+Voz pero no
// HUMAN contaba como 0. Esto unifica el cálculo para el hub del candidato, el panel y el detalle.
import type { Process, Candidate } from "./types";

export type VerticalProgress = { key: "human" | "cv" | "ac" | "voz"; label: string; done: boolean };

export function candidateProgress(p: Process, c: Candidate): {
  items: VerticalProgress[]; done: number; total: number; complete: boolean; started: boolean;
} {
  const acActive = !!p.acBlueprint?.approved;
  const voiceActive = !!p.voiceBlueprint?.approved;
  const items: VerticalProgress[] = [
    { key: "human", label: "HUMAN", done: !!c.result },
    { key: "cv", label: "CV", done: !!c.cv },
    ...(acActive ? [{ key: "ac" as const, label: "AC", done: !!c.acResult }] : []),
    ...(voiceActive ? [{ key: "voz" as const, label: "Voz", done: !!c.voiceResult }] : []),
  ];
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  return { items, done, total, complete: total > 0 && done === total, started: done > 0 };
}
