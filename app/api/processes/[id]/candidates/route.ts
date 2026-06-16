import { NextRequest, NextResponse } from "next/server";
import { addCandidate } from "@/lib/store";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }
  const cand = await addCandidate(params.id, name);
  return NextResponse.json({ id: cand.id, token: cand.token });
}
