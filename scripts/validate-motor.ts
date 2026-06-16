// Test gold-standard del motor HUMAN.
// Alimenta el caso cacheado del .xlsm y exige reproducir EXACTO los puntajes.
// Ejecuta: pnpm test:motor
import golden from "../lib/human/data/goldenCase.json";
import { scoreHuman } from "../lib/human/motor";
import type { HumanInput } from "../lib/human/types";

const EPS = 1e-9;
let failures = 0;

function check(label: string, got: number, exp: number) {
  const ok = Math.abs(got - exp) < EPS;
  if (!ok) failures++;
  const mark = ok ? "✓" : "✗ FALLA";
  console.log(`  ${mark}  ${label.padEnd(22)} got=${round(got)}  exp=${round(exp)}`);
}
const round = (n: number) => Math.round(n * 1e6) / 1e6;

const res = scoreHuman(golden.input as unknown as HumanInput);
const exp = golden.expected as any;

console.log("\nDISC — Observado");
for (const f of ["D", "I", "S", "C"]) check(f, (res.disc.profiles.observado as any)[f], exp.disc.observado[f]);
console.log("DISC — Proyectado");
for (const f of ["D", "I", "S", "C"]) check(f, (res.disc.profiles.proyectado as any)[f], exp.disc.proyectado[f]);
console.log("DISC — Bajo Presión");
for (const f of ["D", "I", "S", "C"]) check(f, (res.disc.profiles.bajoPresion as any)[f], exp.disc.bajoPresion[f]);

console.log("VALORES (0-100)");
for (const v of ["T", "E", "A", "S", "P", "R"]) check(v, (res.valores.scores as any)[v], exp.valores[v]);

console.log("PROCESO PENSANTE (0-100)");
for (const s of ["A", "L", "I", "V"]) check(s, (res.pensante.scores as any)[s], exp.pensante[s]);

console.log("\n— Derivados —");
console.log("  Valores predominantes:", res.valores.predominant.join(", "));
console.log("  Pensante ejes:", res.pensante.axes.conceptualVsEspecifico, "/", res.pensante.axes.izquierdoVsDerecho);
console.log("  DISC perfil interpretado:", res.disc.interpretedProfile);
console.log("  DISC combinaciones interpretables:", res.disc.combinations.map((c) => `${c.pair}:${c.nivel}`).join(", "));

if (failures === 0) {
  console.log("\n✅ MOTOR VALIDADO — todos los puntajes reproducen el caso gold-standard.\n");
  process.exit(0);
} else {
  console.error(`\n❌ ${failures} discrepancia(s). El motor NO reproduce el caso.\n`);
  process.exit(1);
}
