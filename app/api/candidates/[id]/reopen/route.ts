import { NextResponse } from "next/server";
import { getCandidate, reopenCandidate } from "@/lib/store";
import { FLAGS } from "@/lib/flags";
import type { ReopenVertical } from "@/lib/store/types";

// "bigfive" solo es reabrible con su flag prendido; apagado → conjunto idéntico al anterior.
const VALID: ReopenVertical[] = ["human", "cv", "ac", "voz", ...(FLAGS.bigFive ? (["bigfive"] as ReopenVertical[]) : [])];

// Reabre (limpia) la captura de las verticales elegidas de un candidato, para que las rehaga.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!FLAGS.reabrirTest) return NextResponse.json({ error: "Función desactivada" }, { status: 403 });
  const found = await getCandidate(params.id);
  if (!found) return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({} as any));
  const verticals: ReopenVertical[] = Array.isArray(body.verticals)
    ? body.verticals.filter((v: unknown) => VALID.includes(v as ReopenVertical))
    : [];
  if (!verticals.length) return NextResponse.json({ error: "Sin verticales válidas" }, { status: 400 });

  await reopenCandidate(params.id, verticals);
  return NextResponse.json({ ok: true });
}
