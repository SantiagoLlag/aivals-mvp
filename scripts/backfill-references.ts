// Genera el PERFIL DE REFERENCIA (Evaluador UNO) para los puestos que no lo tengan,
// para que el encaje HUMAN del comparador se pueda medir. Idempotente: salta los que ya
// tienen un perfil de IA con discIdeal.  Uso:  pnpm backfill:refs   (o  --force  para rehacer)
import { promises as fs } from "fs";
import path from "path";

// tsx no carga .env.local solo; hazlo ANTES de importar el store (index.ts elige
// archivo vs Supabase según el env al momento de importarse).
async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      if (line.trim().startsWith("#")) continue;
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] ??= m[2].trim();
    }
  } catch {}
}

async function main() {
  await loadEnv();
  const force = process.argv.includes("--force");

  // Import dinámico: el store ya ve el env cargado y selecciona la implementación correcta.
  const { listProcesses, saveReference, backend } = await import("../lib/store");
  const { evaluadorUno, aiEnabled } = await import("../lib/ai");

  if (!aiEnabled()) {
    console.error("❌ Falta ANTHROPIC_API_KEY en .env.local — el Evaluador UNO necesita IA.");
    process.exit(1);
  }
  console.log(`Store: ${backend} · modelo: ${process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"}`);

  const processes = await listProcesses();
  const hasIdeal = (r: any) => r && r.source === "ai" && r.discIdeal && typeof r.discIdeal.D === "number";
  const pending = processes.filter((p) => force || !hasIdeal(p.reference));

  console.log(`${processes.length} puesto(s); ${pending.length} a generar${force ? " (--force)" : ""}.`);
  if (!pending.length) { console.log("Nada que hacer."); return; }

  let ok = 0;
  for (const p of pending) {
    process.stdout.write(`• ${p.name} … `);
    try {
      const ref = await evaluadorUno(p.puestoText || p.name, p.empresaText || "");
      if (ref.source !== "ai" || !ref.discIdeal) {
        console.log("⚠️  la IA no devolvió un perfil utilizable, se omite.");
        continue;
      }
      await saveReference(p.id, ref);
      const d = ref.discIdeal;
      console.log(`✅ DISC D${d.D} I${d.I} S${d.S} C${d.C} · valores: ${(ref.valoresDeseados ?? []).join(", ") || "—"}`);
      ok++;
    } catch (e: any) {
      console.log(`❌ ${e?.message ?? e}`);
    }
  }
  console.log(`\nListo: ${ok}/${pending.length} perfiles generados y guardados.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
