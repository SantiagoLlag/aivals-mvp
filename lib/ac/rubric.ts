// Rúbrica de competencias del Assessment Center, en el FORMATO REAL de GENTZA:
// cada competencia = definición + indicadores conductuales, cada uno anclado en 5 niveles.
// "Comunicación escrita" se recuperó 100% fiel del taller (image7.emf). El resto usa el
// formato GENTZA con anclas redactadas por nosotros (source: 'aivals') hasta confirmar contra
// el catálogo oficial de GENTZA (pendiente). Ver docs/gentza-recuperado.md.

export type Source = "gentza" | "aivals";
export type Exercise = "charola" | "sjt";

export interface Indicator {
  name: string;
  anchors: { 5: string; 4: string; 3: string; 2: string; 1: string };
}
export interface Competency {
  key: string;
  name: string;
  definition: string;
  exercises: Exercise[]; // en qué ejercicio(s) se mide
  source: Source;
  indicators: Indicator[];
}

// Escala GENTZA (slide 19)
export const SCALE: Record<number, string> = {
  5: "Desempeño Superior",
  4: "Desempeño Eficiente",
  3: "Desempeño Promedio",
  2: "Desempeño Abajo del promedio",
  1: "Desempeño Limitado",
};

export const COMPETENCIES: Competency[] = [
  // -------- CHAROLA (in-basket) --------
  {
    key: "priorizacion",
    name: "Priorización",
    definition: "Capacidad para jerarquizar los asuntos según urgencia e impacto, atendiendo primero lo crítico y justificando los criterios.",
    exercises: ["charola"],
    source: "aivals",
    indicators: [{
      name: "Jerarquización por urgencia/impacto",
      anchors: {
        5: "Prioriza correctamente, justifica con criterios de impacto/urgencia y reconoce dependencias entre asuntos.",
        4: "Prioriza correctamente y justifica con un criterio explícito.",
        3: "Establece un orden razonable pero sin justificar los trade-offs ni considerar el impacto.",
        2: "Prioriza con errores de juicio (p. ej. ignora un asunto crítico o atiende lo trivial primero).",
        1: "Trata todos los asuntos como urgentes o atiende sin criterio alguno.",
      },
    }],
  },
  {
    key: "delegacion",
    name: "Delegación",
    definition: "Capacidad para asignar asuntos a la persona adecuada con instrucciones, plazo y seguimiento.",
    exercises: ["charola"],
    source: "aivals",
    indicators: [{
      name: "Asignación efectiva",
      anchors: {
        5: "Delega lo delegable a la persona correcta con instrucciones claras, plazo y mecanismo de seguimiento.",
        4: "Delega adecuadamente con instrucciones, aunque sin plazo o seguimiento explícito.",
        3: "Delega algunos asuntos pero con instrucciones vagas.",
        2: "Delega sin contexto suficiente o a la persona equivocada.",
        1: "No delega (intenta resolver todo) o delega sin instrucciones.",
      },
    }],
  },
  {
    key: "toma_decisiones",
    name: "Toma de decisiones y juicio",
    definition: "Capacidad para decidir de forma fundamentada ante información incompleta o en conflicto, asumiendo las consecuencias.",
    exercises: ["charola", "sjt"],
    source: "aivals",
    indicators: [{
      name: "Decisión fundamentada",
      anchors: {
        5: "Decide con criterio claro, sopesa alternativas y consecuencias, y actúa pese a la incertidumbre.",
        4: "Decide de forma razonable y justifica la decisión.",
        3: "Decide pero con justificación superficial.",
        2: "Evita decidir o decide sin considerar consecuencias.",
        1: "No decide, o sus decisiones son erráticas o contradictorias.",
      },
    }],
  },
  {
    key: "planeacion_organizacion",
    name: "Planeación y organización",
    definition: "Capacidad para estructurar el trabajo, anticipar y relacionar asuntos, y planear acciones de seguimiento.",
    exercises: ["charola"],
    source: "aivals",
    indicators: [{
      name: "Estructura y anticipación",
      anchors: {
        5: "Organiza el trabajo, relaciona asuntos entre sí y planea seguimiento (juntas, fechas) con antelación.",
        4: "Organiza el trabajo y planea algunas acciones de seguimiento.",
        3: "Aborda los asuntos de forma ordenada pero sin planear seguimiento.",
        2: "Trabajo poco estructurado; no relaciona asuntos.",
        1: "Aborda los asuntos sin orden ni planeación.",
      },
    }],
  },
  // -------- COMUNICACIÓN ESCRITA (recuperada de GENTZA, aplica a ambos) --------
  {
    key: "comunicacion_escrita",
    name: "Comunicación (escrita)",
    definition: "Capacidad para redactar con claridad, estructura y lógica ideas y opiniones, mediante la utilización efectiva de las reglas gramaticales y ortográficas, utilizando un vocabulario y estilo de redacción apropiados a la situación y a quién dirige sus mensajes.",
    exercises: ["charola", "sjt"],
    source: "gentza",
    indicators: [
      {
        name: "Claridad y lógica del mensaje",
        anchors: {
          5: "Transmite sus ideas y opiniones de forma clara y lógica siendo convincente en su mensaje.",
          4: "Transmite sus ideas y opiniones de forma ordenada, clara y lógica, logrando que se entienda su mensaje.",
          3: "Transmite ideas centrales con moderado orden, claridad y lógica.",
          2: "Muestra dificultades para transmitir ideas; se expresa con poco orden, ambigüedad o demasiado extenso (mensaje confuso).",
          1: "No logra transmitir sus ideas; su comunicación es confusa y desordenada.",
        },
      },
      {
        name: "Estructura del contenido",
        anchors: {
          5: "Estructura el contenido del mensaje que permite a los lectores una fácil y efectiva comprensión.",
          4: "Estructura el contenido que permite captar la idea central.",
          3: "Estructura de manera general el contenido para transmitir ideas.",
          2: "Es poco claro al estructurar sus ideas; comete errores o imprecisiones en la información.",
          1: "Es confuso o extremadamente breve; muestra falta de estructura.",
        },
      },
      {
        name: "Gramática y ortografía",
        anchors: {
          5: "Domina las reglas gramaticales y ortográficas.",
          4: "Muestra conocimiento de las reglas; en ocasiones errores sencillos.",
          3: "Muestra algunas faltas gramaticales y ortográficas.",
          2: "Bajo manejo de reglas básicas; errores que afectan el mensaje.",
          1: "Desconoce reglas básicas; errores que afectan la comprensión.",
        },
      },
      {
        name: "Vocabulario y estilo según situación/destinatario",
        anchors: {
          5: "Utiliza vocabulario y estilo apropiados según la situación y a quién se dirige.",
          4: "Utiliza vocabulario y estilo apropiados según la situación.",
          3: "Usa vocabulario básico y el mismo estilo sin importar situación ni destinatario.",
          2: "Dificultad en vocabulario y estilo; no considera situación ni destinatario.",
          1: "Vocabulario limitado; sin estilo de redacción; no considera situación ni destinatario.",
        },
      },
    ],
  },
  // -------- SJT (interpersonal / criterio) --------
  {
    key: "manejo_conflicto",
    name: "Manejo de conflicto",
    definition: "Capacidad para abordar desacuerdos integrando perspectivas y proponiendo soluciones accionables sin escalar la tensión.",
    exercises: ["sjt"],
    source: "aivals",
    indicators: [{
      name: "Resolución integradora",
      anchors: {
        5: "Integra perspectivas, propone una solución accionable, anticipa consecuencias y mantiene la relación.",
        4: "Considera múltiples perspectivas y propone una solución concreta con tono adecuado.",
        3: "Reconoce el problema y propone una solución genérica.",
        2: "Responde sin reconocer al interlocutor ni proponer una salida.",
        1: "Escala el conflicto o ignora la perspectiva del otro.",
      },
    }],
  },
  {
    key: "orientacion_servicio",
    name: "Orientación al servicio / a las personas",
    definition: "Capacidad para atender las necesidades del interlocutor con empatía y foco en una solución útil.",
    exercises: ["sjt"],
    source: "aivals",
    indicators: [{
      name: "Empatía y solución",
      anchors: {
        5: "Comprende la necesidad de fondo, responde con empatía y entrega una solución útil y proactiva.",
        4: "Atiende la necesidad con una solución adecuada y trato respetuoso.",
        3: "Responde a la necesidad explícita pero de forma reactiva o estándar.",
        2: "Atiende parcialmente o con trato impersonal.",
        1: "Ignora la necesidad del interlocutor o responde de forma inadecuada.",
      },
    }],
  },
  {
    key: "integridad_juicio_etico",
    name: "Integridad y juicio ético",
    definition: "Capacidad para actuar conforme a principios éticos y normas ante dilemas, sin sacrificar lo correcto por conveniencia.",
    exercises: ["sjt"],
    source: "aivals",
    indicators: [{
      name: "Decisión ética",
      anchors: {
        5: "Identifica el dilema ético, decide conforme a principios y explica el porqué considerando a los afectados.",
        4: "Decide de forma ética y razonable.",
        3: "Decide correctamente pero sin reconocer el componente ético.",
        2: "Decisión éticamente ambigua o que prioriza la conveniencia.",
        1: "Decisión que vulnera principios éticos o normas.",
      },
    }],
  },
];

export const charolaCompetencies = () => COMPETENCIES.filter((c) => c.exercises.includes("charola"));
export const sjtCompetencies = () => COMPETENCIES.filter((c) => c.exercises.includes("sjt"));
export const competencyByKey = (k: string) => COMPETENCIES.find((c) => c.key === k);
