# Banderas de funcionalidad (reversibilidad)

Aivals usa **feature flags** para que toda implementación nueva sea **100% reversible sin tocar código**.

## Cómo apagar/encender una feature
1. Vercel → proyecto `aivals-mvp` → **Settings → Environment Variables**.
2. Crea/edita la variable de la feature (ver tabla) con valor `0` (apagar) o `1` (encender).
3. **Redeploy** (los cambios de env var solo aplican en un nuevo deploy): Deployments → ⋯ → Redeploy, o un push.

Sin la variable, la feature usa su **default**. En local, agrégala a `.env.local`.

## Convención para cada feature nueva
1. Agregar su flag en `lib/flags.ts`.
2. **Preservar la ruta anterior** cuando el flag está apagado (con el flag en `0`, el comportamiento debe ser idéntico al de antes de la feature).
3. Documentarla aquí.

Respaldo a nivel código: cada feature se entrega en su propio commit → `git revert <commit>` la deshace por completo.

## Flags activas
| Variable (Vercel) | Default | Qué controla | Apagado (`0`) = |
|---|---|---|---|
| `FF_EVIDENCE_BAND` | `1` (on) | En el reporte, separa cada vertical en **Evidencia (sin IA, determinista)** arriba e **Interpretación (IA)** debajo. | El reporte vuelve **exacto** al layout anterior (IA y dato mezclados como hoy). |
| `FF_REABRIR_TEST` | `1` (on) | Botón **"Reabrir test"** por candidato en el panel del proceso: limpia la captura de la vertical elegida (HUMAN/CV/AC/Voz) para que el candidato la rehaga. | El botón desaparece; nadie puede reabrir un test desde la UI. |
