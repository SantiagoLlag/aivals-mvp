# Aivals — Backlog de producto (roadmap de evaluación)

> Generado de un análisis multi-lente (psicometría I-O · reclutador/TA · validez predictiva · cumplimiento México · diferenciación competitiva), con crítica adversarial por opción. 18 jun 2026.
> Restricción dura en TODAS las opciones: **"la IA amplifica al psicólogo, nunca lo reemplaza" — IA insumo, nunca veredicto**, human-in-the-loop.

## Tesis estratégica
Aivals es fuerte donde está su IP: la interpretación propietaria (HUMAN, triangulación CV↔HUMAN, ORCSE en AC/voz, comparador editable, honestidad "con/sin norma"). Su **debilidad estructural** es que los scores 1–5 / 0–100 viajan al comparador y a los reportes con **falsa precisión** —como si fueran dato normado— sin evidencia de fiabilidad ni baremos.

El mayor retorno **no está en más tests**, sino en dos frentes baratos y bloqueantes: (1) **cumplimiento y defensa** (LFPDPPP, supervisión humana real, audit trail) que desbloquean venta a empresa y blindan contra la "decisión automatizada de facto"; (2) sumar los **ejercicios de más validez que faltan** (work-sample, entrevista estructurada) rotulando con honestidad su estado de validación. El hilo: **convertir "honestidad del dato" de eslogan a arquitectura** — cada número entra al comparador con su estado psicométrico explícito, con un humano que firma, y con plan de validación local. Ese es el foso frente a Hogan/Korn Ferry y a la psicometría fotocopiada (Cleaver/Terman sin baremos vigentes).

## Tabla resumen
| id | Opción | Grupo | Prioridad | Esfuerzo |
|---|---|---|---|---|
| O8  | Aviso de privacidad LFPDPPP + consentimiento auditable | Cumplimiento | Alta | M |
| O18 | Comparador NO determinante + supervisión humana + transparencia/ARCO | Cumplimiento | Alta | S |
| O5  | Work-sample por puesto (BARS) + defensa por voz | Nuevo ejercicio | Alta | M |
| O2  | Entrevista estructurada por competencias (BEI/STAR) | Nuevo ejercicio | Alta | M |
| O14 | Audit trail inmutable + validez de criterio post-contratación | Plataforma | Alta | L |
| O9  | Embudo/Kanban de vacante con SLA y disposición auditable | Plataforma | Alta | M |
| O3  | Índices de atención/consistencia y control de simulación del HUMAN | Núcleo | Media | M |
| O12 | Calibración del LLM-juez + banco de anclas BARS versionado | Núcleo | Media | M |
| O11 | Reponderar el comparador por validez (presets por familia) | Plataforma | Media | S |
| O10 | Resumen ejecutivo de shortlist (1 pág) + Evaluador TRES | Plataforma | Media | M |
| O15 | Realistic Job Preview + encaje de expectativas | Plataforma | Media | S |
| O16 | Plan de desarrollo + onboarding 30-60-90 | Plataforma | Baja | S |
| O4  | Módulo NOM-035 (riesgo psicosocial) | Nuevo mercado | Baja | L |
| O17 | Verificación de referencias estructurada | Plataforma | Baja | M |
| O1  | Batería GMA (aptitud cognitiva) | Nuevo ejercicio | Baja | L |
| O7  | Tablero de equidad / impacto adverso (4/5) | Cumplimiento | Baja | L |

**Secuencia recomendada:** O8 → O18 → O14 (capa audit) → O5 / O2.

---

## 🔴 Prioridad ALTA

### O8 · Aviso de privacidad LFPDPPP + consentimiento auditable · M
- **Qué:** pantalla de consentimiento versionada + registro JSONB (`consentRecord`) + política de retención. No mide constructo.
- **Por qué:** bloqueante de venta a empresa mediana/grande; la pantalla inline actual (`TestRunner.tsx`) no alcanza para datos psicométricos a escala. Bajo esfuerzo, altísimo desbloqueo comercial.
- **Evidencia:** LFPDPPP exige aviso con finalidades/transferencias/ARCO y consentimiento **expreso** para datos sensibles, conservación solo el tiempo necesario y luego bloqueo/supresión.
- **Candado:** modela bien el ROL (despacho = **encargado**, cliente = responsable; contrato de encargo). Plantilla que un abogado/DPO mexicano firma antes de producción. El cron de retención **marca**, no borra (no destruir el dataset para baremos futuros). Mini-flujo ARCO real.

### O18 · Comparador NO determinante + supervisión humana real + transparencia/ARCO · S
- **Qué:** gate que obliga al psicólogo a marcar apto/condicionado/no-recomendado como **acto humano** (nombre, fecha, frase de job-relatedness por criterio) en log inmutable; transparencia al candidato.
- **Por qué:** un score global con semáforo se lee de facto como veredicto automatizado; el gate materializa "IA insumo, nunca veredicto" como evidencia, y es lo que revisa un comité de compras de RH.
- **Evidencia:** LFPDPPP (ARCO, derecho a ser informado). EU AI Act (empleo = alto riesgo) y NYC LL144 exigen transparencia/supervisión humana solo si el cliente opera ahí. Defensa central vs. impacto adverso = job-relatedness por criterio.
- **Candado:** evitar teatro: el gate NO es texto-no-vacío. Degradar verde/amarillo/rojo a indicador secundario; no ordenar por `globalEncaje` sin advertencia/apertura. No sobre-vender LL144 ("preparado para"). ARCO se ejerce ante el responsable (cliente). → **Plan detallado abajo.**

### O5 · Work-sample por puesto (muestra de trabajo real) + defensa por voz · M
- **Qué mide:** desempeño en una muestra representativa de la tarea real del rol (máxima fidelidad de contenido, no competencias genéricas del AC).
- **Formato:** entregable que el candidato produce por su link, calificación 1–5 con BARS + breve **defensa por voz** (ElevenLabs).
- **Por qué:** el AC actual (charola+SJT) es genérico; falta la muestra del rol real. Alta validez aparente, alta aceptación, **menor impacto adverso** que la cognitiva. Reusa captura≠calificación, rúbrica tipada, blueprint UNO y comparador.
- **Evidencia:** work-samples en el top de validez de criterio (Schmidt & Hunter ~.54; Sackett et al. 2022 los mantiene arriba, por delante de personalidad). Con GMA → validez compuesta ~.63.
- **Candado:** (1) **congelar** entregable+rúbrica una vez por puesto (mismo estímulo para todos; reusar el freeze de `ac_blueprint`) o el 0–100 deja de ser comparable. (2) **autenticidad:** un entregable asíncrono es producible con la IA del candidato → ventana cronometrada + defensa por voz ORCSE. El psicólogo ancla a mano los niveles 1/3/5 de las BARS antes de publicar.

### O2 · Entrevista estructurada por competencias (BEI/STAR) — asistida en vivo + voz asíncrona · M
- **Qué mide:** competencias del puesto vía conducta pasada (incidentes críticos, STAR), guion idéntico para todos. Historial conductual real, no simulación.
- **Formato:** modo asistido EN VIVO (primario, "con norma") + voz asíncrona (screening, "sin norma/con bandera"); calificación ORCSE post-transcript.
- **Por qué:** Aivals tiene role-play de DESEMPEÑO, no entrevista estructurada de SELECCIÓN. La estandarización es la principal defensa vs. sesgo. Reusa blueprint UNO, infraestructura de voz, scoring ORCSE. El modo en vivo materializa "la IA amplifica al psicólogo".
- **Evidencia:** en la jerarquía revisada de **Sackett et al. (2022) la entrevista estructurada es el predictor de MAYOR validez (~.42 operacional)**, por encima del GMA corregido; casi duplica a la no estructurada (McDaniel 1994).
- **Candado:** el .42 vive en la **estandarización + evaluación independiente**, no en "tener guion". Sondeos: en vivo los conduce el psicólogo (la app sugiere el siguiente); en voz, sondeo adaptativo acotado de biblioteca pre-aprobada. La voz asíncrona es falseable → degradar a screening + detector de validez de respuesta (especificidad, "yo" vs "nosotros", resultado cuantificado) que levante BANDERA, no que puntúe. No heredar el .42 como propio (rotular "exploratorio"). Entra como vertical **confirmatoria** con peso bajo (no doble-contar competencias que ya puntúan AC/voz/CV).

### O14 · Audit trail inmutable (capa 2) + seguimiento de validez de criterio (capa 1, diferida) · L
- **Qué mide:** la pregunta psicométrica final — ¿los puntajes de Aivals **predicen** el desempeño real? + materializa la trazabilidad de cada decisión.
- **Formato:** expediente/audit log exportable (versión de motor/baremos, inputs, score IA vs editado, pesos) + panel de seguimiento 3/6/12 meses.
- **Por qué:** el audit trail es el "tooling de validez" y oro defensivo que ningún competidor da; convierte "IA insumo, nunca veredicto" en evidencia. Cumple el logging que esperan EU AI Act y LFPDPPP/ARCO.
- **Evidencia:** la validez de criterio (correlación predictor–desempeño) es el patrón oro; sin estudio local, los coeficientes meta-analíticos son solo expectativas.
- **Candado:** separar madurez. Capa audit-trail (2): construir YA. Capa de criterio (1): **nunca** re-pesar el comparador automáticamente (n=8/15/30 = ruido; restricción de rango sesga la r). Reportar N, IC y "muestra insuficiente" bajo umbral (~n<60/vertical); priors bayesianos (Schmidt & Hunter) que solo se muevan con evidencia local; criterio con anclas conductuales (la calificación 1–5 del jefe es halo). → **Plan detallado abajo.**

### O9 · Embudo/Kanban de vacante con etapas, SLA y disposición auditable · M
- **Qué:** tablero por requisición + `stage/stageHistory` en Candidate y `targetDate/SLA` en Process. No mide constructo.
- **Por qué:** lo que el cliente paga es velocidad y un shortlist defendible; convierte Aivals de "herramienta de evaluación" a "sistema de colocación". Sin registro de disposición no hay defensa ni insumo para el 4/5 (O7).
- **Evidencia:** gestión por etapas con SLA (time-to-fill/in-stage) y disposición tipificada = práctica estándar de ATS; la razón estructurada de descarte es el insumo de la auditoría de impacto adverso.
- **Candado:** la "razón tipificada" no sanea el dato (categorías porosas esconden sesgo). Separar motivo operativo (declinó/salario/timing) de motivo evaluativo; **todo descarte evaluativo ligado a evidencia existente** (ORCSE, compat. con el ideal de UNO, triangulación). Marcar si decidió cliente o psicólogo. SLA informativo, nunca acción automática. Es commodity de ATS: el foso es tener los scores que el ATS no tiene.

---

## 🟡 Prioridad MEDIA

### O3 · Índices de atención/consistencia y control de simulación del HUMAN · M
- **Qué mide:** faking / imagen exageradamente favorable, consistencia/atención, manipulación ipsativa.
- **Por qué:** HUMAN solo calcula "validez del protocolo"; no detecta faking pese a que Cleaver y Spranger son ipsativos y manipulables. Diferenciador vs. Cleaver/Zavic que no reportan validez de respuesta.
- **Evidencia:** el faking atenúa fiabilidad/validez; forced-choice **reduce pero no elimina** la distorsión; corregir por una escala de deseabilidad no mejora la validez → índice multi-señal como **bandera de confianza**, no corrección automática.
- **Candado:** un índice mal hecho penaliza perfiles REALES (un Dominante genuino elige adjetivos-D deseables). Quedarse SOLO con índices defendibles (inconsistencias imposibles, discrepancia Proyectado vs Bajo Presión anormal, tiempos por bloque); degradar deseabilidad/aquiescencia a "exploratorio"; calibración fake-good vs honest (15–30 personas) antes de fijar cortes. Salida: **linterna ("dónde mirar"), no semáforo que degrade el dato**.

### O12 · Calibración del LLM-juez (estabilidad + override) + banco de anclas BARS versionado · M
- **Qué mide:** consistencia de la calificación 1–5 de AC/Voz/Entrevista; la confiabilidad es el techo de la validez.
- **Por qué:** AC y Voz califican 1–5 con LLM pero las anclas son provisionales y no hay evidencia de fiabilidad. Prerrequisito del estudio de validez (O14).
- **Candado bloqueante:** hoy la edición SOBRESCRIBE el score (`{...p, score, edited:true}` en `route.ts`/`types.ts`); el original de la IA se PIERDE. **Primero migrar esquema (`aiScore` inmutable).** No llamarlo "fiabilidad inter-juez" (el psicólogo edita el score de la IA, no hay independencia; N diminuto). Métrica estrella defendible = **estabilidad** (misma transcripción N veces a baja temp, % coincidencia ±1) + **tasa/magnitud de override** por competencia/ancla. Inter-juez real solo con doble calificación ciega.

### O11 · Reponderar el comparador por validez (presets por familia de puesto) · S
- **Qué:** cambiar `DEFAULT_WEIGHTS` (hoy 25/25/25/25 en `lib/compare/score.ts`) + catálogo de presets por familia, persistido en Process.
- **Por qué:** tratar HUMAN (ipsativo, validez baja-moderada) igual que un work-sample contradice la evidencia. El andamiaje de pesos ajustables ya existe.
- **Evidencia:** Sackett et al. (2022) reordena la jerarquía: entrevista estructurada, work samples y conocimiento del puesto arriba; DISC/valores ipsativos abajo.
- **Candado:** el comparador solo tiene human|ac|cv|voz (GMA y entrevista no existen aún). No portar el .42 tal cual: el Voz es simulación, el AC es genérico. Ponderar solo las 4 verticales reales con su matiz (AC ~.37, SJT ~.26, DISC ipsativo bajo, CV/biodata bajo-moderado; Voz "tipo-entrevista/simulación"); familia con catálogo cerrado; gate de que el puesto tenga Evaluador UNO; disclaimer "default sugerido, ajustable"; registrar pesos en el reporte. Activar entrevista solo tras O2.

### O10 · Resumen ejecutivo de shortlist (1 pág) para el cliente + Evaluador TRES · M
- **Qué:** PDF de 1 página por vacante, editable, con firma del psicólogo (reusa `PrintButton`/`@media print`).
- **Por qué:** el cliente no quiere 4 reportes técnicos; quiere una hoja comparativa que cierre la colocación. Distingue de Hogan/Korn Ferry (PDF cerrado).
- **Candado:** el formato de 1 página presiona al over-claiming; el cliente verá "87% / 3 fortalezas / 3 riesgos" como veredicto. Convertirlo en "dossier defendible": encaje como perfil multidimensional con etiqueta "con/sin norma" POR dimensión; cada fortaleza/riesgo con trazabilidad; firma humana (cédula) en el pie; bloque "limitaciones y alcance" no editable a la baja; PROHIBIR al prompt emitir "recomendado/no recomendado" final.

### O15 · Realistic Job Preview + encaje de expectativas (salario/ubicación/modalidad) · S
- **Qué mide:** encaje práctico que hace o rompe la colocación (compensación, ubicación, modalidad, disponibilidad) + realismo/motivación tras una vista previa honesta.
- **Por qué:** se pierden colocaciones por desencaje de expectativas, no por personalidad. Filtra temprano, baja time-to-fill; el RJP reduce rotación temprana.
- **Candado:** commodity (cualquier ATS lo hace), no apalanca el IP. La "expectativa salarial" es dato declarado, no revelado. Salario como rango con flexibilidad; registrar consistencia con lo que surja en voz/entrevista. Ningún campo produce rechazo automático (evita impacto adverso vía proxies socioeconómicos/geográficos); consentimiento LFPDPPP específico.

---

## 🟢 Prioridad BAJA (oportunidades con prerrequisitos)

### O16 · Plan de desarrollo individual + onboarding 30-60-90 · S
- **Qué:** PDF editable post-decisión (reusa molde UNO/DOS + reporte editable + export PDF).
- **Por qué:** extiende el valor a retención/ingreso recurrente y lock-in (lo que Korn Ferry monetiza caro). Al dispararse DESPUÉS de la decisión, no contamina el veredicto.
- **Evidencia:** el onboarding estructurado de 90 días se asocia a mayor retención temprana y productividad.
- **Candado:** DISC-Cleaver/Spranger/Herrmann son **estilo/preferencia, no déficit**: convertir un cuadrante "bajo" en "brecha a remediar" es ilegítimo. Brechas SOLO de evidencia conductual (AC, voz, CV, entrevista) y de competencia-vs-ideal; los rasgos entran como "estilo de aprendizaje / cómo dar feedback". Encabezado "Borrador asistido por IA, requiere firma; insumo, no diagnóstico clínico"; consentimiento del colaborador.

### O4 · NOM-035-STPS — Factores de riesgo psicosocial y entorno organizacional · L
- **Qué mide:** factores de riesgo psicosocial (cargas, control, jornadas, interferencia trabajo-familia, liderazgo/violencia) y entorno favorable. **No es selección**: vigilancia/diagnóstico sobre población ya contratada.
- **Formato:** cuestionario cerrado oficial (Guía II ≤50 / III >50) por link, anónimo/confidencial, reportería agregada + scorer determinista con cortes oficiales.
- **Por qué:** **única norma OBLIGATORIA** para todo centro de trabajo en México, fiscalizada por STPS. Ingreso **recurrente anual** con el mismo cliente, fuera del ciclo de vacantes. Ningún competidor global la cubre.
- **Evidencia:** NOM-035-STPS-2018 (vigente en su totalidad desde 23/10/2020): obliga a identificar/analizar/prevenir con Guías I/II/III, con registros exigibles en inspección.
- **Candado:** anonimato por diseño **choca** con el flujo nominal (el link único ES la identidad) → tabla separada, n mínimo por celda (no reportar áreas con <5), muralla dura vs. selección. La Guía III incluye tamizaje de Acontecimientos Traumáticos Severos con ruteo clínico individual. NO sugerir que "certifica" ante STPS (la obligación es del patrón). Sello "Insumo para el cumplimiento, no certificación".

### O17 · Verificación de referencias laborales estructurada · M
- **Qué mide:** confirmación de experiencia, motivo de salida, recontratación y banderas conductuales desde terceros.
- **Por qué:** paso estándar de cierre; cierra la triangulación CV (declarado) ↔ HUMAN (profundo) ↔ referencias (terceros). Reusa el patrón ask()+triangulación.
- **Evidencia:** validez incremental modesta (r≈.26 sin corregir, menor en práctica por leniency/restriction-of-range) pero es debida diligencia esperada.
- **Candado:** insumo contaminado. En México, por riesgo de daño moral (art. 1916 CCF), muchas empresas solo dan "fechas y puesto". Partir en **verificación dura** (fechas, puesto, ¿recontratable?) vs **opinión blanda** (etiquetada "percepción no verificada"); la IA NO emite "discrepancias rasgo↔referencia", solo genera **preguntas para entrevista** (reusar `explorarEnEntrevista`); entra como bandera cualitativa, no como score promediado. Consentimiento del candidato + LFPDPPP del referente.

### O1 · Batería GMA (aptitud cognitiva general) · L
- **Qué mide:** capacidad mental general (factor g) y facetas (numérico, verbal, abstracto-inductivo).
- **Formato:** cronometrado, auto-administrado; banco fijo y cerrado en MVP; calificación 100% determinista por clave (0–100).
- **Por qué:** el hueco psicométrico más grave (nada mide capacidad). Encaja en el patrón scorer-determinista, respeta "IA insumo" (hay clave objetiva), sustituye el uso informal de Terman/Raven sin baremos vigentes.
- **Evidencia:** GMA encabeza la jerarquía por un siglo (Schmidt & Hunter 1998 r≈.51; Sackett 2022 ~.31 operacional). Pero esos coeficientes son de baterías CALIBRADAS, no de un banco artesanal.
- **Candado (por eso es BAJA):** un GMA mal construido puede tener validez **cero/negativa** mientras aparenta rigor. El .51 viene con la **mayor brecha de subgrupo** de todos los predictores → impugnable en México. Separar el MOTOR (constrúyelo) de la pretensión psicométrica (gánatela por etapas): banco fijo cerrado, doble revisión humana, gating por N (mientras N<200 = "puntaje crudo experimental, sin baremo", no percentil ni ponderable), **O7 (impacto adverso) como prerrequisito de salida al comparador**, consentimiento LFPDPPP específico.

### O7 · Tablero de equidad / impacto adverso (regla 4/5, DIF básico) + captura demográfica separada · L
- **Qué mide:** si los instrumentos producen diferencias sistemáticas entre subgrupos (impacto adverso/sesgo de medición). Mide al **instrumento**, no al candidato.
- **Por qué:** en cuanto entra GMA (O1) el impacto adverso deja de ser teórico. Defensa proactiva (lo que golpeó a HireVue/Pymetrics).
- **Evidencia:** regla 4/5 (selection ratio <80% del de referencia) = estándar (NYC LL144, Standards AERA/APA/NCME). EU AI Act = empleo alto riesgo. Los predictores más válidos (GMA) muestran las mayores diferencias.
- **Candado:** el talón es el **n** (un despacho chico no genera volumen; 4/5 cruza 0.80 por 1–2 personas; DIF requiere cientos/subgrupo). El marco real es LFPDPPP (sexo/edad/origen = sensibles, consentimiento reforzado), no LL144. Gating por potencia; acumulación cross-cliente anonimizada (k-anonimato) para que la unidad sea el INSTRUMENTO. **Entregable inmediato y barato: solo la captura demográfica separada + consentimiento**; el tablero se activa con volumen.

---

## ❌ No hacer (ingenuamente)

- **O6 · Integridad/honestidad laboral (overt+covert):** la validez citada (~.41) es del CONSTRUCTO en pruebas comerciales validadas, no de un banco in-house (hereda cero hasta tener estudio propio); evidencia cuestionada por sesgo de publicación (van Iddekinge 2012 → ~.15–.25); reactivos "actitud hacia el robo" = mayor riesgo legal en México y muy fakeables. → Solo como indicador cualitativo dentro de O3, no módulo propio.
- **O13 · Confiabilidad clásica (alfa/SEM) + baremos sobre HUMAN:** error psicométrico fatal — los 3 instrumentos son **ipsativos/ranking forzado**, donde el alfa de Cronbach está sesgado y NO es interpretable, el SEM es decorativo, y una norma de conveniencia no es representativa. Cambiar un "corte mágico" por un "IC de adorno" es PEOR (blinda con apariencia de ciencia). → La necesidad real la sirven O14 (validez de criterio con priors bayesianos) + O3 (autobaremo interno exploratorio).

---

## 📋 Plan detallado — Primera tanda: O18 + O14

Van juntos: comparten **un registro de decisión inmutable**. O18 lo escribe (el acto humano), O14 lo lee/exporta y le suma el seguimiento de validez.

**Prerrequisito chico (de O12):** hoy editar un score 1–5 sobrescribe el de la IA. Preservar `aiScore` inmutable (migración pequeña, va en Fase 1) para que el rastro muestre "IA propuso X, humano ajustó a Y".

### Modelo de datos (tablas nuevas, append-only, RLS server-only)
- **`decisions`** (O18 + O14 capa 2): `id, candidate_id, process_id, decision (apto|condicionado|no_recomendado|en_pausa), rationale, criteria_justifications jsonb (ligadas a evidencia real), snapshot jsonb (verticales/score IA vs editado/encaje/pesos/versión de motor, capturado server-side), decided_by (nombre+cédula), decided_at, supersedes (re-decidir = fila nueva), engine_version`.
- **`outcomes`** (O14 capa 1): `id, candidate_id, hired, hired_at, checkpoint (3m|6m|12m), performance_rating (1–5 anclado), performance_source, retained, notes, captured_by, captured_at`.
- **`audit_events`** (capa 2): `{candidate_id, kind (score_edit|narrative_edit), vertical, competencia, from_ai, to_value, by, at}`.
- Inmutabilidad real: revocar UPDATE/DELETE a service_role (o trigger que lance excepción).

### O18 — la recomendación deja de ser determinante
1. **Degradar semáforo/orden** (resolver la contradicción con `semFromPct`/corte 70): número de encaje en tinta + semáforo como punto secundario; banner "El encaje es un insumo; la recomendación la firma el psicólogo"; **bloquear export del shortlist hasta haber decisiones registradas**.
2. **`DecisionGate`** (anti-teatro): formulario que OBLIGA decisión (radio) + rationale de job-relatedness + por cada criterio decisivo elegir de la **evidencia real del candidato** + cédula. `POST /api/decisions` escribe fila inmutable con snapshot server-side. Re-decidir = `supersedes`.
3. **Transparencia/ARCO** al candidato: aviso "tu evaluación se apoya en IA como insumo; un psicólogo decide" + derechos ARCO enrutados al **responsable (cliente)**. Reporte de transparencia exportable.

### O14 — rastro auditable + validez de criterio
- **Capa 2 (YA):** `decisions` + `audit_events` + `aiScore` preservado = el rastro. **Export "Expediente de evaluación"** por candidato (versión de motor, inputs, score IA vs editado, pesos, decisión + quién/cuándo/por qué) — reusa `PrintButton`/`@media print`.
- **Capa 1 (diferida):** captura `outcomes` 3/6/12m (barata, ya); panel de validez que reporta N/IC, "muestra insuficiente" bajo umbral, priors bayesianos, criterio con anclas conductuales, disclaimer de restricción de rango. **Nunca re-pondera el comparador automáticamente.**

### Fases
1. (1–2 sem) Migración (3 tablas + `aiScore` inmutable) · `DecisionGate` + `/api/decisions` · degradar semáforo + bloquear export · Expediente auditable. **Esfuerzo M.**
2. Transparencia/ARCO al candidato (apoyada en la config de responsable de O8). **S.**
3. (diferida) `outcomes` + panel de criterio (se enciende con volumen). **L.**

### Archivos que se tocan
Migración Supabase (`apply_migration`) · `lib/types.ts` + `lib/store/*` (tipos + `saveDecision/listDecisions/saveOutcome/appendAuditEvent`) · `app/api/decisions/route.ts` · `app/api/reporte/[id]/route.ts` (preservar `aiScore` + `appendAuditEvent`) · `app/comparar/[id]/CompareBoard.tsx` (degradar + banner + "Registrar decisión" + gate de export) · nuevos `DecisionGate.tsx` y `Expediente.tsx` · `app/reporte/[id]/page.tsx` · `app/test/[token]` (aviso de transparencia/ARCO).
