import { NextResponse } from "next/server";
import { getProcess, saveAcBlueprint } from "@/lib/store";
import { generateAcBlueprint } from "@/lib/ac/ai";

// Genera (o regenera) el ejercicio de Assessment Center calibrado al puesto/empresa.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc) return NextResponse.json({ error: "Proceso no encontrado" }, { status: 404 });
  const blueprint = await generateAcBlueprint(proc.puestoText, proc.empresaText, proc.reference?.raw);
  await saveAcBlueprint(proc.id, blueprint);
  return NextResponse.json(blueprint);
}

// Aprueba el blueprint (lo activa para los candidatos).
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc?.acBlueprint) return NextResponse.json({ error: "Sin ejercicio generado" }, { status: 404 });
  await saveAcBlueprint(proc.id, { ...proc.acBlueprint, approved: true });
  return NextResponse.json({ ok: true });
}
