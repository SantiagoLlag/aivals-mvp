"use client";
// Red de seguridad para fallos de runtime (p. ej. el store/Supabase caído): muestra algo
// recuperable en español en vez de la pantalla cruda de Next.
import { useT } from "@/components/LangProvider";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center py-12">
        <div className="text-4xl mb-3">⚠️</div>
        <h1 className="text-xl font-bold">{t("Algo salió mal", "Something went wrong")}</h1>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          {t("No pudimos cargar esta página. Suele ser temporal: vuelve a intentarlo en un momento.", "We couldn't load this page. This is usually temporary: please try again in a moment.")}
        </p>
        <button onClick={() => reset()} className="btn-primary mt-5">{t("Reintentar", "Retry")}</button>
      </div>
    </div>
  );
}
