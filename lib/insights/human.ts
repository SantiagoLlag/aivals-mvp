// Evidencia determinista de HUMAN (sin IA). Solo conteos sobre la entrada cruda.
import type { HumanInput } from "@/lib/human/types";

export type Completitud = {
  disc: [number, number];
  valores: [number, number];
  pensante: [number, number];
  full: boolean;
};

// Cuántas respuestas registró el candidato vs el total esperado (24 series DISC, 60 conceptos
// de Valores, 60 ítems de Pensante). El motor salta en silencio los ítems sin responder, así
// que este conteo es lo único que delata un protocolo incompleto.
export function completitud(input?: HumanInput): Completitud {
  const d = input?.disc ? Object.keys(input.disc).length : 0;
  const v = input?.valores ? Object.keys(input.valores).length : 0;
  const p = input?.pensante ? Object.keys(input.pensante).length : 0;
  return {
    disc: [d, 24],
    valores: [v, 60],
    pensante: [p, 60],
    full: d === 24 && v === 60 && p === 60,
  };
}
