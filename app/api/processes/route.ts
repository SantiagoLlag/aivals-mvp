import { NextRequest, NextResponse } from "next/server";
import { createProcess } from "@/lib/store";
import { evaluadorUno } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { name, puestoText, empresaText } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }
  // Evaluador UNO: genera el perfil de referencia (si la IA está activa).
  const reference = await evaluadorUno(puestoText ?? "", empresaText ?? "");
  const proc = await createProcess({
    name,
    puestoText: puestoText ?? "",
    empresaText: empresaText ?? "",
    reference,
  });
  return NextResponse.json({ id: proc.id });
}
