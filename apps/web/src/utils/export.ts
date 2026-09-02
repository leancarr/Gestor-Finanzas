import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExpenseItem } from './api/expenses';

function formatCurrency(amount: number | string, currency: string = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(Number(amount));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR');
}

export function exportToCSV(data: ExpenseItem[]) {
  if (!data || data.length === 0) return;

  const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Tipo'];
  
  const rows = data.map((item) => [
    formatDate(item.date),
    `"${item.description.replace(/"/g, '""')}"`, // escape quotes
    `"${item.category?.name || 'Sin Categoría'}"`,
    item.amount,
    item.type === 'INCOME' ? 'Ingreso' : 'Gasto',
  ]);

  const csvContent =
    headers.join(',') +
    '\n' +
    rows.map((e) => e.join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `Gestor_Guita_Export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: ExpenseItem[], includeSummary: boolean = true) {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text('Reporte Financiero', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')}`, 14, 30);
  doc.text('Gestor Guita App', 14, 35);

  const tableData = data.map((item) => [
    formatDate(item.date),
    item.description,
    item.category?.name || '-',
    item.type === 'INCOME' ? 'Ingreso' : 'Gasto',
    formatCurrency(item.amount, item.currency)
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      4: { halign: 'right' },
    },
  });

  if (includeSummary) {
    const totalIncomes = data.filter(d => d.type === 'INCOME').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalExpenses = data.filter(d => d.type === 'EXPENSE').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const balance = totalIncomes - totalExpenses;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen Total', 14, finalY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`Total Ingresos: ${formatCurrency(totalIncomes)}`, 14, finalY + 23);
    
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`Total Gastos: ${formatCurrency(totalExpenses)}`, 14, finalY + 30);
    
    doc.setFontSize(12);
    doc.setTextColor(balance >= 0 ? 16 : 239, balance >= 0 ? 185 : 68, balance >= 0 ? 129 : 68);
    doc.text(`Balance Neto: ${formatCurrency(balance)}`, 14, finalY + 40);
  }

  doc.save(`Gestor_Guita_Reporte_${new Date().toISOString().split('T')[0]}.pdf`);
}
