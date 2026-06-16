"use client";
import { useRef, useState } from "react";

export default function CvUpload({ token, candidateName }: { token: string; candidateName: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(f: File | null) {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf") { setError("El CV debe ser un archivo PDF."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("El archivo es muy grande (máx. 10 MB)."); return; }
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("cv", file);
      const res = await fetch(`/api/test/${token}/cv`, { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo subir el CV. Intenta de nuevo.");
      }
      setDone(true);
    } catch (e: any) { setError(e.message); setBusy(false); }
  }

  if (done) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto anim-pop">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-xl font-bold">¡Gracias, {candidateName}!</h2>
        <p className="text-sm text-neutral-600 mt-2">Tu CV se registró correctamente. Puedes cerrar esta ventana o continuar con las demás actividades.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold">📄 Sube tu CV</h2>
        <p className="text-sm text-neutral-600 mt-1">
          Adjunta tu currículum en <b>PDF</b>. Lo analizaremos junto con el resto de tu evaluación. Confidencial.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files?.[0] ?? null); }}
        onClick={() => inputRef.current?.click()}
        className={`card cursor-pointer text-center py-10 border-2 border-dashed transition ${drag ? "border-accent bg-accentSoft" : "border-line hover:border-accent"}`}>
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => choose(e.target.files?.[0] ?? null)} />
        {file ? (
          <div>
            <div className="text-3xl mb-2">📄</div>
            <div className="font-medium text-sm">{file.name}</div>
            <div className="text-xs text-neutral-500">{(file.size / 1024).toFixed(0)} KB · clic para cambiar</div>
          </div>
        ) : (
          <div>
            <div className="text-3xl mb-2">⬆️</div>
            <div className="text-sm font-medium">Arrastra tu PDF aquí o haz clic para elegirlo</div>
            <div className="text-xs text-neutral-500 mt-1">Solo PDF · máx. 10 MB</div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button className="btn-primary w-full" disabled={!file || busy} onClick={upload}>
        {busy ? "Subiendo y analizando…" : "Enviar CV"}
      </button>
      {busy && <p className="text-xs text-neutral-500 text-center">Esto puede tardar unos segundos mientras se procesa.</p>}
    </div>
  );
}
