"use client";
// Toggle ES / EN. Escribe la cookie "lang" y refresca para que el servidor re-renderice
// en el nuevo idioma (los server components leen la cookie en getLang()).
import { useRouter } from "next/navigation";
import { useT } from "./LangProvider";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

export default function LanguageToggle() {
  const router = useRouter();
  const { lang } = useT();

  function setLang(next: Lang) {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className="inline-flex items-center rounded-md border border-line overflow-hidden font-mono text-[11px] leading-none"
      role="group"
      aria-label="Idioma / Language"
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2 py-1 uppercase tracking-[0.04em] transition-colors ${
            lang === l ? "bg-accent text-white" : "text-text3 hover:bg-neutral-100"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
