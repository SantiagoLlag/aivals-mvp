// ============================================================================
// MOTOR BIG FIVE (IPIP-50) — scoring determinista, sin IA, sin estado.
// Clave pública de ipip.ori.org: invertir ítems "-" (6 - valor) y promediar por
// factor. La normalización por media tolera protocolos incompletos.
// ============================================================================
import itemsData from "./data/items.json";
import { BIGFIVE_FACTORS, type BigFiveFactor, type BigFiveItem, type BigFiveInput, type BigFiveResult } from "./types";

const ITEMS = itemsData.items as unknown as BigFiveItem[];

const zero = (): Record<BigFiveFactor, number> => ({ E: 0, A: 0, C: 0, ES: 0, O: 0 });

export function scoreBigFive(input: BigFiveInput): BigFiveResult {
  const sum = zero();
  const perFactorCount = zero();
  let answered = 0;

  for (const it of ITEMS) {
    const v = input[it.id];
    if (typeof v !== "number" || v < 1 || v > 5) continue;
    answered++;
    sum[it.factor] += it.key === -1 ? 6 - v : v; // reverse-key
    perFactorCount[it.factor] += 1;
  }

  const raw = zero();
  const scores = zero();
  for (const f of BIGFIVE_FACTORS) {
    raw[f] = sum[f];
    // media (1..5) -> 0..100, con 1 decimal. 0 si no hay respuestas en ese factor.
    scores[f] = perFactorCount[f] ? Math.round(((sum[f] / perFactorCount[f] - 1) / 4) * 1000) / 10 : 0;
  }

  return { raw, scores, answered, perFactorCount };
}

export const BIGFIVE_TOTAL_ITEMS = ITEMS.length; // 50
