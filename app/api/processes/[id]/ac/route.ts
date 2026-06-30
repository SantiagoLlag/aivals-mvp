import { NextResponse } from "next/server";
import { getProcess, saveAcBlueprint } from "@/lib/store";
import { generateAcBlueprint } from "@/lib/ac/ai";
import { sanitizeCustomization, hasCustomization } from "@/lib/ac/customize";

// Genera (o regenera) el ejercicio de Assessment Center calibrado al puesto/empresa.
// Body opcional: { customization: {...} } cuando el psicólogo eligió "Personalizar".
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc) return NextResponse.json({ error: "Proceso no encontrado" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { customization?: unknown };
  const customization = sanitizeCustomization(body?.customization);
  const blueprint = await generateAcBlueprint(
    proc.puestoText, proc.empresaText, proc.reference?.raw,
    hasCustomization(customization) ? customization : undefined
  );
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
