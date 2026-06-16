// Definición del test SIN las claves de scoring (lo que ve el candidato).
import disc from "./data/disc.json";
import valores from "./data/valores.json";
import pensante from "./data/pensante.json";

export const publicTest = {
  disc: {
    series: disc.series.map((s) => ({
      n: s.n,
      words: s.words.map((w) => ({ pos: w.pos, text: w.text })),
    })),
  },
  valores: {
    series: valores.series.map((s) => ({
      n: s.n,
      concepts: s.concepts.map((c) => ({ id: c.id as string, text: c.text })),
    })),
  },
  pensante: {
    groupI: {
      title: pensante.groupI.title,
      scale: pensante.groupI.scale,
      questions: pensante.groupI.questions.map((q) => ({
        title: q.title,
        options: q.options.map((o) => ({ id: o.id as string, text: o.text })),
      })),
    },
    groupII: {
      title: pensante.groupII.title,
      scale: pensante.groupII.scale,
      items: pensante.groupII.questions.map((o) => ({ id: o.id as string, text: o.text })),
    },
    groupIII: {
      title: pensante.groupIII.title,
      scale: pensante.groupIII.scale,
      items: pensante.groupIII.questions.map((o) => ({ id: o.id as string, text: o.text })),
    },
  },
};

export type PublicTest = typeof publicTest;
