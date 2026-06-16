import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aivals — Evaluación de talento",
  description: "Evaluación de talento asistida por IA. La IA amplifica al psicólogo, no lo reemplaza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <header className="border-b border-line bg-white/70 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-white text-xs">A</span>
              Aivals
            </Link>
            <span className="text-xs text-neutral-500">Panel del psicólogo</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
