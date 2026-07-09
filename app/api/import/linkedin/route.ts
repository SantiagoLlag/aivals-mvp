import { NextResponse } from "next/server";
import { importLinkedInJob } from "@/lib/import/linkedin";
import { FLAGS } from "@/lib/flags";

export const maxDuration = 20; // hasta 2 fetches con timeout

// Importa una vacante de LinkedIn desde su URL y devuelve { title, company, location, description }
// para prellenar el formulario de nuevo proceso. No crea nada: el psicólogo revisa y crea.
export async function POST(req: Request) {
  if (!FLAGS.linkedinImport) return NextResponse.json({ error: "Función desactivada" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body?.url === "string" ? body.url : "";
  if (!url.trim()) return NextResponse.json({ reason: "invalid_url", error: "Falta el link" }, { status: 400 });

  const result = await importLinkedInJob(url);
  if (!result.ok) return NextResponse.json({ reason: result.reason, error: result.error }, { status: 422 });
  return NextResponse.json(result.job);
}
