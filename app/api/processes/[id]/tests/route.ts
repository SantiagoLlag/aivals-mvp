import { NextResponse } from "next/server";
import { getProcess, saveProcessTests } from "@/lib/store";
import { FLAGS } from "@/lib/flags";
import { TEST_CATALOG, type TestKey } from "@/lib/tests/catalog";

const VALID = new Set<string>(TEST_CATALOG.map((t) => t.key));

// Guarda qué tests aplica un proceso (la "batería" elegida por el aplicador).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!FLAGS.bigFive) return NextResponse.json({ error: "Función desactivada" }, { status: 403 });
  const proc = await getProcess(params.id);
  if (!proc) return NextResponse.json({ error: "Proceso no encontrado" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { tests?: Record<string, unknown> };
  if (!body?.tests || typeof body.tests !== "object") {
    return NextResponse.json({ error: "Configuración inválida" }, { status: 400 });
  }

  const clean: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(body.tests)) {
    if (VALID.has(k)) clean[k as TestKey] = !!v;
  }

  await saveProcessTests(params.id, clean);
  return NextResponse.json({ ok: true });
}
