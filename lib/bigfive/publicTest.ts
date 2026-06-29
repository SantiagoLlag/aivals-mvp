// Versión CANDIDATO-SAFE del Big Five: solo id + texto del ítem (sin factor ni keying),
// con los factores INTERCALADOS (round-robin E,A,C,ES,O) para reducir sesgo de respuesta.
import itemsData from "./data/items.json";
import { BIGFIVE_FACTORS, type BigFiveItem } from "./types";

const ITEMS = itemsData.items as unknown as BigFiveItem[];

function interleave(items: BigFiveItem[]): BigFiveItem[] {
  const byFactor: Record<string, BigFiveItem[]> = {};
  for (const it of items) (byFactor[it.factor] ??= []).push(it);
  const out: BigFiveItem[] = [];
  const max = Math.max(...BIGFIVE_FACTORS.map((f) => byFactor[f]?.length ?? 0));
  for (let i = 0; i < max; i++) for (const f of BIGFIVE_FACTORS) {
    const arr = byFactor[f];
    if (arr && arr[i]) out.push(arr[i]);
  }
  return out;
}

export interface PublicBigFiveItem { id: string; es: string; en: string; }
export interface PublicBigFive {
  scaleAnchorsEs: string[];
  scaleAnchorsEn: string[];
  items: PublicBigFiveItem[];
}

export const publicBigFive: PublicBigFive = {
  scaleAnchorsEs: itemsData.scale.anchors_es,
  scaleAnchorsEn: itemsData.scale.anchors_en,
  items: interleave(ITEMS).map((i) => ({ id: i.id, es: i.es, en: i.en })),
};
