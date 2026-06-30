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
| `FF_REABRIR_TEST` | `1` (on) | Botón **"Reabrir test"** por candidato en el panel del proceso: reabre la vertical elegida (HUMAN/CV/AC/Voz) para que el candidato la rehaga. Al reabrir HUMAN se guarda un snapshot de las respuestas previas; al reenviar se **comparan** nuevas vs previas y solo se recalcula lo que cambió (si nada cambió, se **conserva** la interpretación IA previa; si cambió, queda lista para regenerarse). | El botón desaparece; nadie reabre tests, no hay snapshot ni comparación. |
| `FF_AC_CUSTOMIZE` | `1` (on) | En el panel del AC, opción **"Personalizar"** la generación: 5 preguntas de opción múltiple (nivel, enfoque, sector, dificultad, tono) + nota libre (máx 300) que se inyectan al prompt del ejercicio. Se guarda en `acBlueprint.customization`. | Desaparece el botón "Personalizar"; solo queda **"Generar con IA"** (comportamiento original; el endpoint ignora cualquier `customization` que no se envíe desde la UI). |
| `FF_BIG_FIVE` | `1` (on) | Nuevo test **Big Five (IPIP-50)** — motor determinista (suma con reverse-key, 0–100 por rasgo) + runner del candidato + sección en el reporte. Y la sección **"Batería de tests"** en el panel del proceso, donde el aplicador elige qué pruebas aplicar (cada candidato ve solo las activas). Datos en `processes.tests` (jsonb) y `candidates.bigfive` (jsonb). | Desaparece el Big Five y el panel de batería; el hub del candidato vuelve a su **lógica original** (HUMAN/CV siempre, AC/Voz por blueprint). Idéntico a antes de la feature. |
| `FF_I18N` | `1` (on) | Toggle **ES/EN** en el header (todo el proyecto): traduce la **interfaz** (navegación, botones, encabezados, paneles, reporte, comparador, errores + el texto que enmarca los tests). Idioma vía cookie `lang` (default `es`). Los **ítems psicométricos** (DISC/Valores/Pensante) y el **contenido generado por IA** se mantienen en español. | El toggle desaparece y `getLang()` siempre devuelve `es` → la app queda **idéntica** a antes (el primer argumento de `t("es","en")` es el español literal). |
