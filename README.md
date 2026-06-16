# Aivals — MVP

Sistema de evaluación de talento para psicología organizacional. La IA **amplifica** al psicólogo
(human-in-the-loop): la IA es insumo, nunca veredicto. Stack: **Next.js (App Router) + Supabase + Claude + ElevenLabs**.

## Verticales de evaluación
- **HUMAN** — test psicométrico propietario (DISC + Valores de Spranger + Proceso Pensante). Motor de scoring **determinista** validado (`pnpm test:motor`).
- **Assessment Center** — Charola/in-basket + SJT (escritos, asíncronos). Calificación ORCSE 1–5 (formato GENTZA).
- **CV / Evidencias** — el candidato sube su CV (PDF); evaluación aislada (rúbrica 6 dimensiones) + integrada con HUMAN (triangulación).
- **Role-play por voz** — conversación en vivo con un agente de ElevenLabs (subordinado defensivo); el transcript se califica con ORCSE.

Evaluadores IA: **UNO** (perfil de referencia del puesto), **DOS** (interpreta HUMAN), **Central** (triangulación CV+HUMAN). El agente de voz **solo actúa**; la calificación corre en este pipeline (actor ≠ juez).

## Variables de entorno (configurar en Vercel → Settings → Environment Variables)
| Variable | Uso | Secreta |
|---|---|---|
| `ANTHROPIC_API_KEY` | Evaluadores IA (Claude) | sí |
| `ANTHROPIC_MODEL` | Modelo (def. `claude-sonnet-4-6`) | — |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso server-side (omite RLS) | sí |
| `ELEVENLABS_API_KEY` | Signed URL + pull del transcript | sí |
| `ELEVENLABS_AGENT_ID` | Agente del role-play por voz | — |

> En producción **Supabase es obligatorio** (el filesystem de Vercel es de solo lectura; el store de archivo solo aplica en local). Si `SUPABASE_SERVICE_ROLE_KEY` está definida, la app usa Supabase automáticamente.

## Notas de despliegue en Vercel
- Varias rutas de IA tardan 30–70 s (calificación AC/CV/voz, generación de casos). Llevan `maxDuration` 60–120 s → requieren **Vercel Pro** (o Fluid Compute). En **Hobby** (límite ~10 s) esas rutas harían timeout.
- El esquema de Supabase ya está migrado (tablas `processes`, `candidates` con columnas JSONB). RLS encendido sin políticas públicas; el acceso es solo server-side con `service_role`.

## Desarrollo local
```bash
pnpm install
cp .env.example .env.local   # y rellena las llaves
pnpm dev                     # http://localhost:3000
pnpm test:motor              # valida el motor HUMAN contra el caso gold-standard
```

El motor HUMAN es el IP: `pnpm test:motor` alimenta el caso gold-standard (cacheado en el `.xlsm` original) y exige reproducir **exacto** los 22 puntajes. DISC usa **dos claves distintas** (Más/Menos, estilo Cleaver) y baremos no-lineales.

## Estructura
```
lib/human/   # MOTOR (el IP): claves + baremos + scoreHuman determinista (validado)
lib/ac/      # Assessment Center (charola + SJT): rúbrica GENTZA + scoreAc (ORCSE)
lib/cv/      # Evaluador de Evidencias: extracción PDF + evaluación aislada/integrada
lib/voice/   # Role-play por voz: ElevenLabs + scoreVoice (ORCSE sobre transcript)
lib/ai.ts    # Evaluador UNO/DOS (Claude), degradación elegante sin clave
lib/store/   # persistencia: selector archivo <-> Supabase por env
app/         # Next.js App Router (dashboard, proceso, test del candidato, reporte)
```
