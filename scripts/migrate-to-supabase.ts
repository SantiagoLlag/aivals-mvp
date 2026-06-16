// Copia los datos del store de archivo (.data/db.json) a Supabase. Idempotente (upsert por id).
// Úsalo una vez tras configurar SUPABASE_SERVICE_ROLE_KEY:  pnpm migrate:supabase
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Carga simple de .env.local (tsx no lo hace solo)
async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith("#")) process.env[m[1]] ??= m[2].trim();
    }
  } catch {}
}

async function main() {
  await loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let db: any;
  try {
    db = JSON.parse(await fs.readFile(path.join(process.cwd(), ".data", "db.json"), "utf-8"));
  } catch {
    console.log("No hay .data/db.json; nada que migrar.");
    return;
  }

  let nP = 0, nC = 0;
  for (const p of db.processes ?? []) {
    const { error: ep } = await sb.from("processes").upsert({
      id: p.id, name: p.name, puesto_text: p.puestoText ?? "", empresa_text: p.empresaText ?? "",
      reference: p.reference ?? null, created_at: p.createdAt,
    });
    if (ep) { console.error("proceso", p.id, ep.message); continue; }
    nP++;
    for (const c of p.candidates ?? []) {
      const { error: ec } = await sb.from("candidates").upsert({
        id: c.id, process_id: p.id, name: c.name, token: c.token, status: c.status,
        input: c.input ?? null, result: c.result ?? null, dos_report: c.dosReport ?? null,
        created_at: c.createdAt, completed_at: c.completedAt ?? null,
      });
      if (ec) { console.error("candidato", c.id, ec.message); continue; }
      nC++;
    }
  }
  console.log(`✅ Migrado a Supabase: ${nP} proceso(s), ${nC} candidato(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
