"use client";

// Exporta el reporte a PDF vía el diálogo de impresión. Antes de imprimir abre todos los
// <details> (la transcripción) para que no salgan colapsados, y las reglas @media print
// ocultan el header, los botones y la barra del tour.
export default function PrintButton() {
  function doPrint() {
    document.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
    window.print();
  }
  return (
    <button onClick={doPrint} className="btn-ghost text-xs no-print" title="Genera un PDF o imprime este reporte">
      🖨️ Exportar / Imprimir
    </button>
  );
}
