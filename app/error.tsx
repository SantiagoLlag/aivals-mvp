"use client";
// Red de seguridad para fallos de runtime (p. ej. el store/Supabase caído): muestra algo
// recuperable en español en vez de la pantalla cruda de Next.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center py-12">
        <div className="text-4xl mb-3">⚠️</div>
        <h1 className="text-xl font-bold">Algo salió mal</h1>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          No pudimos cargar esta página. Suele ser temporal: vuelve a intentarlo en un momento.
        </p>
        <button onClick={() => reset()} className="btn-primary mt-5">Reintentar</button>
      </div>
    </div>
  );
}
