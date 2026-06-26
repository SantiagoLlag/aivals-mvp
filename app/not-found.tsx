// Pantalla 404 con marca y en español. Cubre tanto un link de candidato inválido/expirado
// como un proceso/reporte borrado del lado del psicólogo. No enlaza a "/" para no exponer el
// dashboard a un candidato que llegó con un enlace roto (el header ya da la navegación correcta).
import { getServerT } from "@/lib/i18n-server";
export default function NotFound() {
  const { t } = getServerT();
  return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center py-12">
        <div className="text-4xl mb-3">🔍</div>
        <h1 className="text-xl font-bold">{t("Esta página no existe o el enlace ya no es válido", "This page doesn't exist or the link is no longer valid")}</h1>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          {t("Si recibiste un ", "If you received an ")}<b>{t("enlace de evaluación", "assessment link")}</b>{t(", confírmalo con quien te lo compartió: puede haber expirado o haberse copiado incompleto.", ", confirm it with whoever shared it with you: it may have expired or been copied incompletely.")}
        </p>
      </div>
    </div>
  );
}
