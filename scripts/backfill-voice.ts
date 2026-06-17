// Activa el ROLE-PLAY POR VOZ en los procesos que no lo tengan aprobado: genera el escenario
// (Evaluador UNO calibrado al puesto) y lo guarda con approved:true, para que el candidato vea
// la tarjeta al abrir su link. Idempotente: salta los que ya están aprobados.
// Uso:  pnpm backfill:voice   (o  --force  para regenerar todos)
import { promises as fs } from "fs";
import path from "path";

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

  const { listProcesses, saveVoiceBlueprint, backend } = await import("../lib/store");
  const { generateVoiceBlueprint } = await import("../lib/voice/ai");
  const { agentId, voiceEnabled } = await import("../lib/voice/elevenlabs");
  const { aiEnabled } = await import("../lib/ai");

  if (!aiEnabled()) {
    console.error("❌ Falta ANTHROPIC_API_KEY en .env.local — el escenario lo genera el Evaluador UNO.");
    process.exit(1);
  }
  if (!voiceEnabled()) {
    console.warn("⚠️  ElevenLabs no está configurado (ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID). Se aprobará el");
    console.warn("    ejercicio igual (la tarjeta aparecerá), pero la llamada fallará hasta configurarlo.");
  }
  console.log(`Store: ${backend} · agente: ${agentId() || "(no configurado)"}`);

  const processes = await listProcesses();
  const pending = processes.filter((p) => force || !p.voiceBlueprint?.approved);
  console.log(`${processes.length} puesto(s); ${pending.length} a activar${force ? " (--force)" : ""}.`);
  if (!pending.length) { console.log("Todos ya tienen el role-play activo. Nada que hacer."); return; }

  let ok = 0;
  for (const p of pending) {
    process.stdout.write(`• ${p.name} … `);
    try {
      const vb = await generateVoiceBlueprint(p.puestoText || p.name, p.empresaText || "", p.reference?.raw, agentId());
      await saveVoiceBlueprint(p.id, { ...vb, approved: true });
      console.log(
        vb.generatedBy === "ai"
          ? `✅ escenario: ${vb.scenario.nombre_colaborador} (${vb.scenario.puesto_colaborador})`
          : "✅ (plantilla genérica — IA no devolvió escenario)"
      );
      ok++;
    } catch (e: any) {
      console.log(`❌ ${e?.message ?? e}`);
    }
  }
  console.log(`\nListo: ${ok}/${pending.length} role-plays activados.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
