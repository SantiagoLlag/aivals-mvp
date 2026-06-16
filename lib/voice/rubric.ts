// Rúbrica del role-play por voz "Conversación de desempeño con subordinado defensivo".
// Formato GENTZA (competencia + indicador anclado 1-5). Reusa la estructura de la AC.
import type { Competency } from "@/lib/ac/rubric";
export { SCALE } from "@/lib/ac/rubric";

export const VOICE_COMPETENCIES: Competency[] = [
  {
    key: "coaching",
    name: "Coaching / desarrollo de personas",
    definition: "Capacidad para guiar al colaborador hacia la mejora explorando causas y co-construyendo un plan, en vez de solo señalar fallas.",
    exercises: [] as any,
    source: "aivals",
    indicators: [{
      name: "Exploración de causa y desarrollo",
      anchors: {
        5: "Explora la causa raíz con preguntas abiertas, hace que el colaborador llegue a sus propias conclusiones y acuerda un plan con apoyo y seguimiento.",
        4: "Indaga la causa y propone un plan de mejora concreto y realista.",
        3: "Señala el problema y sugiere qué mejorar, pero sin explorar la causa.",
        2: "Se enfoca en el reproche; apenas orienta hacia la mejora.",
        1: "Solo regaña o amenaza; no desarrolla ni acuerda un plan.",
      },
    }],
  },
  {
    key: "feedback_asertivo",
    name: "Comunicación asertiva y feedback",
    definition: "Capacidad para confrontar el bajo desempeño con hechos concretos, de forma clara y respetuosa, sin agredir ni evadir.",
    exercises: [] as any,
    source: "aivals",
    indicators: [{
      name: "Feedback basado en hechos",
      anchors: {
        5: "Confronta con hechos específicos (datos, ejemplos), separa la conducta de la persona y mantiene un tono firme y respetuoso.",
        4: "Da feedback con hechos concretos y de forma respetuosa.",
        3: "Comunica el problema pero con generalidades o juicios ('siempre', 'mal actitud').",
        2: "Es ambiguo o blando: no deja claro el problema, o lo suaviza tanto que se pierde.",
        1: "Ataca/etiqueta a la persona, o evita el tema por completo.",
      },
    }],
  },
  {
    key: "manejo_conflicto_ie",
    name: "Manejo de conflicto / inteligencia emocional",
    definition: "Capacidad para mantener la compostura y desactivar la defensividad del colaborador, preservando la relación.",
    exercises: [] as any,
    source: "aivals",
    indicators: [{
      name: "Desactivación y compostura",
      anchors: {
        5: "Reconoce y valida la emoción del colaborador, no se engancha con la defensividad y reencuadra hacia la solución manteniendo la relación.",
        4: "Mantiene la calma y baja la tensión con escucha y tono adecuado.",
        3: "No escala pero tampoco logra desactivar del todo la defensividad.",
        2: "Se tensa o se pone a la defensiva ante las excusas del colaborador.",
        1: "Escala el conflicto, se irrita o rompe la relación.",
      },
    }],
  },
  {
    key: "manejo_desempeno",
    name: "Manejo del desempeño / orientación a resultados",
    definition: "Capacidad para sostener el estándar esperado y cerrar con compromisos verificables, sin ceder el resultado por evitar el conflicto.",
    exercises: [] as any,
    source: "aivals",
    indicators: [{
      name: "Estándar y cierre con compromisos",
      anchors: {
        5: "Sostiene el estándar con claridad, acuerda compromisos concretos, medibles y con fecha, y define seguimiento.",
        4: "Deja claro el estándar y cierra con un compromiso concreto.",
        3: "Menciona la expectativa pero el cierre queda vago o sin seguimiento.",
        2: "Cede el estándar para evitar la incomodidad, o no cierra nada.",
        1: "No fija expectativa ni compromiso; la conversación termina sin rumbo.",
      },
    }],
  },
  {
    key: "escucha_activa",
    name: "Escucha activa",
    definition: "Capacidad para escuchar genuinamente al colaborador, reflejar lo que dice y dejar espacio antes de responder.",
    exercises: [] as any,
    source: "aivals",
    indicators: [{
      name: "Escucha y reflejo",
      anchors: {
        5: "Hace preguntas abiertas, parafrasea/refleja lo que el colaborador dice y ajusta su mensaje a lo que escucha.",
        4: "Escucha y da espacio; recoge lo que dice el colaborador.",
        3: "Escucha de forma básica pero domina la conversación con su propio discurso.",
        2: "Interrumpe o no recoge lo que el colaborador expresa.",
        1: "Monologa; ignora por completo lo que dice el colaborador.",
      },
    }],
  },
];

export const voiceCompetencyByKey = (k: string) => VOICE_COMPETENCIES.find((c) => c.key === k);
