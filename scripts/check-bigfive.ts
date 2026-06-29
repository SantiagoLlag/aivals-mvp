// Verificación rápida del motor Big Five (no es un test formal, es un sanity check).
import { scoreBigFive } from "../lib/bigfive/motor";
import itemsData from "../lib/bigfive/data/items.json";
import type { BigFiveItem } from "../lib/bigfive/types";

const ITEMS = itemsData.items as unknown as BigFiveItem[];
let ok = true;
const assert = (label: string, got: unknown, exp: unknown) => {
  const pass = JSON.stringify(got) === JSON.stringify(exp);
  if (!pass) ok = false;
  console.log(`  ${pass ? "✓" : "✗"} ${label}  got=${JSON.stringify(got)} exp=${JSON.stringify(exp)}`);
};

// 1) 50 ítems, 10 por factor.
assert("total ítems", ITEMS.length, 50);
const counts: Record<string, number> = {};
for (const it of ITEMS) counts[it.factor] = (counts[it.factor] ?? 0) + 1;
assert("10 por factor", counts, { E: 10, A: 10, C: 10, ES: 10, O: 10 });

// 2) Todo neutral (3) -> media 3 -> 50 en cada factor (reverse-key no cambia el 3).
const allNeutral = Object.fromEntries(ITEMS.map((i) => [i.id, 3]));
assert("neutral -> 50", scoreBigFive(allNeutral).scores, { E: 50, A: 50, C: 50, ES: 50, O: 50 });

// 3) Responder "consistente alto": 5 a los +keyed, 1 a los -keyed -> media 5 -> 100 en todos.
const consistentHigh = Object.fromEntries(ITEMS.map((i) => [i.id, i.key === -1 ? 1 : 5]));
assert("consistente alto -> 100", scoreBigFive(consistentHigh).scores, { E: 100, A: 100, C: 100, ES: 100, O: 100 });

// 4) Consistente bajo -> 0 en todos.
const consistentLow = Object.fromEntries(ITEMS.map((i) => [i.id, i.key === -1 ? 5 : 1]));
assert("consistente bajo -> 0", scoreBigFive(consistentLow).scores, { E: 0, A: 0, C: 0, ES: 0, O: 0 });

// 5) answered cuenta bien (protocolo completo).
assert("answered=50", scoreBigFive(allNeutral).answered, 50);

// 6) Determinista: misma entrada, misma salida.
assert("determinista", scoreBigFive(consistentHigh).scores, scoreBigFive(consistentHigh).scores);

console.log(ok ? "\n✅ MOTOR BIG FIVE OK" : "\n❌ FALLÓ");
process.exit(ok ? 0 : 1);
