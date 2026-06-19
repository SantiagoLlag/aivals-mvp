import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutros cálidos (design language v0.1)
        ink: "#1a1d21",       // tinta / texto principal
        paper: "#f7f7f4",     // lienzo / fondo de app
        line: "#e6e4dd",      // borde hairline
        line2: "#d8d6cf",     // borde hover / énfasis
        text2: "#5d6066",     // texto secundario
        text3: "#8a8d92",     // texto terciario (mono)
        // Marca (teal-pizarra). `accent` = accent-700, color de acción principal.
        accent: "#1d4e57",
        accent900: "#11303a", // tinta de marca / títulos
        accent700: "#1d4e57",
        accent500: "#2b7a83", // focus ring
        accentSoft: "#eef3f3",
        // Semánticos (semáforo disciplinado, desaturados)
        success: "#2f7d5b",
        warning: "#b8862f",
        danger: "#a8443a",
        // DISC (identifican factor, no son semáforo)
        D: "#9c4a39",
        I: "#b08a32",
        S: "#3a7d5e",
        C: "#3f6390",
        // Escala de grises re-templada a cálido (afecta a todos los text-neutral-* existentes)
        neutral: {
          50: "#f7f7f4",
          100: "#f1f0ec",
          200: "#e6e4dd",
          300: "#d8d6cf",
          400: "#8a8d92",
          500: "#71747a",
          600: "#5d6066",
          700: "#4a4d52",
          800: "#2c2e33",
          900: "#1a1d21",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      boxShadow: {
        // Elevación casi nula: solo un realce sutil para superficies.
        card: "0 1px 2px rgba(20,24,31,0.04)",
        sm: "0 1px 2px rgba(20,24,31,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
