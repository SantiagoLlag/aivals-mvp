import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";

// Tipografía del design language: Plex Sans (UI/datos), Plex Mono (datos de instrumento),
// Newsreader italic (solo la cita-resumen humana). Pesos contenidos: 400 y 500/600.
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500"], style: ["italic"], variable: "--font-newsreader", display: "swap", adjustFontFallback: false });

export const metadata: Metadata = {
  title: "Aivals — Evaluación de talento",
  description: "Evaluación de talento asistida por IA. La IA amplifica al psicólogo, no lo reemplaza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
