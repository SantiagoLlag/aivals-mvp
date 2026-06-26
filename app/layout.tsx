import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { LangProvider } from "@/components/LangProvider";
import { getLang, getServerT } from "@/lib/i18n-server";
import { FLAGS } from "@/lib/flags";

// Tipografía del design language: Plex Sans (UI/datos), Plex Mono (datos de instrumento),
// Newsreader italic (solo la cita-resumen humana). Pesos contenidos: 400 y 500/600.
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500"], style: ["italic"], variable: "--font-newsreader", display: "swap", adjustFontFallback: false });

export function generateMetadata(): Metadata {
  const { t } = getServerT();
  return {
    title: t("Aivals — Evaluación de talento", "Aivals — Talent assessment"),
    description: t(
      "Evaluación de talento asistida por IA. La IA amplifica al psicólogo, no lo reemplaza.",
      "AI-assisted talent assessment. AI amplifies the psychologist, it doesn't replace them."
    ),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang} className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <LangProvider lang={lang}>
          <SiteHeader i18nOn={FLAGS.i18n} />
          <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
        </LangProvider>
      </body>
    </html>
  );
}
