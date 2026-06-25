// Evidencia determinista del Assessment Center (sin IA). Conteos sobre la captura cruda.
import type { AcCapture } from "@/lib/ac/types";
import { wordCount } from "./text";

// Catálogo de acciones (string EXACTO como lo guarda el runner del candidato + su icono).
export const AC_ACCIONES = [
  { v: "Responder yo", icon: "✍️" },
  { v: "Delegar", icon: "👥" },
  { v: "Escalar a mi jefe", icon: "⬆️" },
  { v: "Convocar reunión", icon: "📅" },
  { v: "Pedir más información", icon: "❓" },
  { v: "Posponer", icon: "⏳" },
] as const;

export function accionIcon(v: string): string {
  return AC_ACCIONES.find((a) => a.v === v)?.icon ?? "•";
}

export type AccionDist = {
  counts: { accion: string; icon: string; n: number }[];
  sinResponder: number;
  total: number;
  contestados: number;
};

// Distribución de las 6 acciones sobre la charola, incluyendo los ítems sin responder
// (accion === "") como 7º estado explícito. Cuenta crudo; el % es secundario.
export function accionDistribution(captura: AcCapture): AccionDist {
  const map: Record<string, number> = {};
  for (const a of AC_ACCIONES) map[a.v] = 0;
  let sinResponder = 0;
  for (const r of captura.charola) {
    if (!r.accion) sinResponder++;
    else map[r.accion] = (map[r.accion] ?? 0) + 1;
  }
  const total = captura.charola.length;
  return {
    counts: AC_ACCIONES.map((a) => ({ accion: a.v, icon: a.icon, n: map[a.v] ?? 0 })),
    sinResponder,
    total,
    contestados: total - sinResponder,
  };
}

export function rationaleWords(rationale: string): number {
  return wordCount(rationale);
}
