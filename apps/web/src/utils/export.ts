import jsPDF, { GState } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExpenseItem } from './api/expenses';

function formatCurrency(amount: number | string, currency: string = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(Number(amount) || 0);
}

function formatDate(dateStr: string | Date | unknown) {
  if (!dateStr) return '-';
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? '-' : dateStr.toLocaleDateString('es-AR');
  }
  const str = String(dateStr);
  const d = new Date(str.includes('T') ? str : str + 'T00:00:00');
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('es-AR');
}

export interface ExportCSVOptions {
  vaultName?: string | null;
  organizationName?: string | null;
}

export function exportToCSV(
  data: ExpenseItem[],
  filenamePrefix: string = 'Gestor_Guita_Reporte',
  options?: ExportCSVOptions,
) {
  if (!data || data.length === 0) return;

  const orgName = options?.vaultName || options?.organizationName;
  const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Moneda'];
  if (orgName) {
    headers.push('Organización / Bóveda');
  }
  
  const rows = data.map((item) => {
    const row = [
      formatDate(item.date),
      `"${(item.description || '').replace(/"/g, '""')}"`, // escape quotes
      `"${(item.category?.name || 'Sin Categoría').replace(/"/g, '""')}"`,
      item.type === 'INCOME' ? 'Ingreso' : 'Gasto',
      typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 0,
      item.currency || 'ARS',
    ];
    if (orgName) {
      row.push(`"${orgName.replace(/"/g, '""')}"`);
    }
    return row;
  });

  try {
    const csvContent =
      headers.join(',') +
      '\n' +
      rows.map((e) => e.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const orgSuffix = orgName ? `_${orgName.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}${orgSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {}
    }, 250);
  } catch (err) {
    console.error('[Export CSV] Falló la exportación a CSV:', err);
    throw err;
  }
}

export interface ExportPDFOptions {
  includeSummary?: boolean;
  periodLabel?: string;
  currency?: string;
  customTitle?: string;
  vaultName?: string | null;
  organizationName?: string | null;
}

export function exportToPDF(
  data: ExpenseItem[],
  optionsOrSummary: boolean | ExportPDFOptions = true
) {
  if (!data || data.length === 0) return;

  const options: ExportPDFOptions =
    typeof optionsOrSummary === 'boolean'
      ? { includeSummary: optionsOrSummary }
      : optionsOrSummary || { includeSummary: true };

  const {
    includeSummary = true,
    periodLabel,
    currency = 'ARS',
    customTitle = 'REPORTE FINANCIERO EJECUTIVO',
    vaultName,
    organizationName,
  } = options;

  const orgName = vaultName || organizationName;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Franja decorativa institucional superior (Esmeralda)
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Badge Corporativo Sobrio (Slate / Esmeralda)
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.roundedRect(14, 10, 48, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('GESTOR GUITA', 18, 14.8);
  doc.setFillColor(16, 185, 129);
  doc.circle(56, 13.5, 1.2, 'F');

  // Badge contextual de Bóveda / Organización si aplica
  if (orgName) {
    const orgBadgeText = `ESPACIO: ${orgName.toUpperCase()}`;
    const badgeWidth = Math.min(doc.getTextWidth(orgBadgeText) + 8, 70);
    doc.setFillColor(6, 78, 59); // Emerald 900
    doc.roundedRect(66, 10, badgeWidth, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(167, 243, 208); // Emerald 200
    doc.text(orgBadgeText, 70, 14.8);
  }

  // 3. Título Principal Formal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(customTitle, 14, 24);

  // 4. Metadatos de Encabezado Formal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  const periodText = orgName
    ? `Período: ${periodLabel || 'Consolidado'}  |  Organización: ${orgName}`
    : `Período auditado: ${periodLabel || 'Consolidado histórico'}`;
  doc.text(periodText, 14, 30);
  doc.text(
    `Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`,
    pageWidth - 14,
    24,
    { align: 'right' }
  );
  doc.text(
    `Total de registros: ${data.length} movimientos`,
    pageWidth - 14,
    30,
    { align: 'right' }
  );

  // 5. Línea divisoria formal
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(14, 34, pageWidth - 14, 34);

  let startTableY = 40;

  // 6. Tarjetas de Balance Ejecutivo (si includeSummary es true)
  if (includeSummary) {
    const totalIncomes = data
      .filter((d) => d.type === 'INCOME')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const totalExpenses = data
      .filter((d) => (d.type || 'EXPENSE') === 'EXPENSE')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const netBalance = totalIncomes - totalExpenses;
    const savingRate =
      totalIncomes > 0
        ? Math.max(0, Math.round(((totalIncomes - totalExpenses) / totalIncomes) * 1000) / 10)
        : 0;

    const cardY = 37;
    const cardHeight = 16;
    const cardGap = 3.5;
    const cardWidth = (pageWidth - 28 - cardGap * 3) / 4;

    const summaryCards = [
      {
        label: 'TOTAL INGRESOS',
        value: formatCurrency(totalIncomes, currency),
        color: [5, 150, 105], // Emerald 600
      },
      {
        label: 'TOTAL GASTOS',
        value: formatCurrency(totalExpenses, currency),
        color: [225, 29, 72], // Rose 600
      },
      {
        label: 'BALANCE NETO',
        value: `${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, currency)}`,
        color: netBalance >= 0 ? [5, 150, 105] : [225, 29, 72],
      },
      {
        label: 'TASA DE AHORRO',
        value: `${savingRate}%`,
        color: [15, 23, 42], // Slate 900
      },
    ];

    summaryCards.forEach((card, idx) => {
      const cardX = 14 + idx * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.8, 1.8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text(card.label, cardX + 3.2, cardY + 5.2);

      doc.setFontSize(9.5);
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(card.value, cardX + 3.2, cardY + 12.2);
    });

    startTableY = cardY + cardHeight + 6;
  }

  // 7. Tabla estructurada con jspdf-autotable (Soporte ESM/CJS interop seguro)
  const tableData = data.map((item) => [
    formatDate(item.date),
    item.description || '-',
    item.category?.name || 'Sin Categoría',
    item.type === 'INCOME' ? 'Ingreso' : 'Gasto',
    formatCurrency(item.amount, item.currency || currency),
  ]);

  const applyAutoTable =
    typeof autoTable === 'function'
      ? autoTable
      : (autoTable as any)?.default || (autoTable as any)?.autoTable || (doc as any)?.autoTable;

  if (typeof applyAutoTable === 'function') {
    applyAutoTable(doc, {
      startY: startTableY,
      margin: { top: 25, bottom: 20, left: 14, right: 14 },
      head: [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // Slate 900
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.8,
        lineColor: [226, 232, 240], // Slate 200
        lineWidth: 0.2,
        textColor: [30, 41, 59], // Slate 800
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate 50
      },
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 32 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          if (hookData.cell.raw === 'Ingreso') {
            hookData.cell.styles.textColor = [5, 150, 105]; // Emerald
            hookData.cell.styles.fontStyle = 'bold';
          } else {
            hookData.cell.styles.textColor = [225, 29, 72]; // Rose
          }
        }
      },
    });
  } else {
    console.error('[Export PDF] autoTable plugin no está disponible como función invocable');
    throw new Error('El plugin autoTable para jsPDF no se pudo inicializar.');
  }

  // 8. Marca de agua diagonal y numeración de página formal en todas las páginas
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Marca de agua institucional sutil en diagonal ('GESTOR GUITA')
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.05 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('GESTOR GUITA', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    doc.restoreGraphicsState();

    // Encabezado compacto en páginas subsiguientes
    if (i > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`GESTOR GUITA — REPORTE FINANCIERO EJECUTIVO${orgName ? ` [${orgName}]` : ''}`, 14, 12);
      doc.setFont('helvetica', 'normal');
      if (periodLabel) {
        doc.text(`Período: ${periodLabel}`, pageWidth - 14, 12, { align: 'right' });
      }
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, 15, pageWidth - 14, 15);
    }

    // Pie de página formal con paginación
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    const footerText = `Página ${i} de ${totalPages} - Documento confidencial generado por Gestor Guita${orgName ? ` (${orgName})` : ''}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 9, { align: 'center' });
  }

  const safeFilename = (customTitle || 'Reporte_Financiero')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const orgSuffix = orgName ? `_${orgName.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
  doc.save(`Gestor_Guita_${safeFilename}${orgSuffix}_${new Date().toISOString().split('T')[0]}.pdf`);
}

