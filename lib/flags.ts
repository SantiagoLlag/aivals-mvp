// Banderas de funcionalidad — el MÉTODO DE REVERSIBILIDAD de Aivals.
//
// Cada feature nueva se gatea con una bandera aquí. Para APAGAR una feature sin revertir
// código: define su variable de entorno = "0" en Vercel (Settings → Environment Variables)
// y redeploya. El código vuelve a la ruta anterior al instante. Para reactivarla, pon "1"
// (o borra la variable, que cae al default). Respaldo a nivel código: git revert.
//
// Convención: TODA implementación nueva debe (1) agregar su flag aquí, (2) preservar la ruta
// anterior cuando el flag está apagado, y (3) documentarse en docs/FLAGS.md.
function read(name: string, def: boolean): boolean {
  const v = process.env[name];
  if (v == null || v === "") return def;
  return ["1", "true", "on", "yes", "si", "sí"].includes(v.trim().toLowerCase());
}

export const FLAGS = {
  // Reporte: separa cada vertical en "Evidencia (sin IA)" e "Interpretación (IA)".
  // Apagar con FF_EVIDENCE_BAND=0 → el reporte vuelve EXACTO a como estaba antes.
  evidenceBand: read("FF_EVIDENCE_BAND", true),
};

export type FlagName = keyof typeof FLAGS;
