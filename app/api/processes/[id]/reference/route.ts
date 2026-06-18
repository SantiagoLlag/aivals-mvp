import { NextResponse } from "next/server";
import { getProcess, saveReference } from "@/lib/store";
import { evaluadorUno } from "@/lib/ai";
import type { ReferenceProfile } from "@/lib/types";

export const maxDuration = 60;

const VALORES_VALIDOS = ["Teórico", "Económico", "Estético", "Social", "Político", "Regulatorio"];
const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n)) || 0));

// Regenerar: vuelve a correr el Evaluador UNO desde el puesto/empresa.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc) return NextResponse.json({ error: "Proceso no encontrado" }, { status: 404 });
  const reference = await evaluadorUno(proc.puestoText, proc.empresaText);
  await saveReference(proc.id, reference);
  return NextResponse.json(reference);
}

// Editar a mano: se hace merge sobre el perfil actual; source se mantiene "ai" (sigue siendo el
// ancla activa del encaje) y solo se marca edited:true para mostrar la procedencia.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc?.reference) return NextResponse.json({ error: "Sin perfil de referencia" }, { status: 404 });
  const body = await req.json().catch(() => ({} as any));
  const cur = proc.reference;
  const next: ReferenceProfile = {
    ...cur,
    source: "ai",
    resumen: typeof body.resumen === "string" ? body.resumen : cur.resumen,
    estiloPensamiento: typeof body.estiloPensamiento === "string" ? body.estiloPensamiento : cur.estiloPensamiento,
    discIdeal: body.discIdeal
      ? { D: clamp(body.discIdeal.D), I: clamp(body.discIdeal.I), S: clamp(body.discIdeal.S), C: clamp(body.discIdeal.C) }
      : cur.discIdeal,
    valoresDeseados: Array.isArray(body.valoresDeseados)
      ? body.valoresDeseados.filter((v: unknown) => typeof v === "string" && VALORES_VALIDOS.includes(v))
      : cur.valoresDeseados,
    edited: true,
  };
  await saveReference(proc.id, next);
  return NextResponse.json(next);
}
