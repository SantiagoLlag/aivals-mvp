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
  // Panel: botón "Reabrir test" por candidato (limpia la captura de una vertical para rehacerla).
  // Apagar con FF_REABRIR_TEST=0 → desaparece el botón.
  reabrirTest: read("FF_REABRIR_TEST", true),
  // i18n: toggle ES/EN en toda la app (interfaz). Apagar con FF_I18N=0 → siempre español,
  // sin toggle (idéntico a antes de la feature).
  i18n: read("FF_I18N", true),
  // Big Five (IPIP-50) + sección "Batería de tests" (el aplicador elige qué aplicar).
  // Apagar con FF_BIG_FIVE=0 → desaparece el Big Five y el panel de batería; el hub
  // del candidato vuelve a su lógica original.
  bigFive: read("FF_BIG_FIVE", true),
};

export type FlagName = keyof typeof FLAGS;
