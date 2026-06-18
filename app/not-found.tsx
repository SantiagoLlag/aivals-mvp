// Pantalla 404 con marca y en español. Cubre tanto un link de candidato inválido/expirado
// como un proceso/reporte borrado del lado del psicólogo. No enlaza a "/" para no exponer el
// dashboard a un candidato que llegó con un enlace roto (el header ya da la navegación correcta).
export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center py-12">
        <div className="text-4xl mb-3">🔍</div>
        <h1 className="text-xl font-bold">Esta página no existe o el enlace ya no es válido</h1>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Si recibiste un <b>enlace de evaluación</b>, confírmalo con quien te lo compartió: puede haber
          expirado o haberse copiado incompleto.
        </p>
      </div>
    </div>
  );
}
