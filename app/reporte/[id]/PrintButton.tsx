"use client";
import { useT } from "@/components/LangProvider";

// Exporta el reporte a PDF vía el diálogo de impresión. Antes de imprimir abre todos los
// <details> (la transcripción) para que no salgan colapsados, y las reglas @media print
// ocultan el header, los botones y la barra del tour.
export default function PrintButton() {
  const { t } = useT();
  function doPrint() {
    document.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
    window.print();
  }
  return (
    <button onClick={doPrint} className="btn-ghost text-xs no-print" title={t("Genera un PDF o imprime este reporte", "Generate a PDF or print this report")}>
      🖨️ {t("Exportar / Imprimir", "Export / Print")}
    </button>
  );
}
