'use client';

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/utils/export';
import type { ExpenseItem } from '@/utils/api/expenses';

interface ExportMenuProps {
  data: ExpenseItem[];
}

export default function ExportMenu({ data }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportCSV = () => {
    exportToCSV(data);
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    // Para simplificar, siempre incluimos el resumen como el usuario pidió que sea una opción o venga incluido
    exportToPDF(data, true);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl hover:bg-emerald-400/20 transition-all duration-300"
      >
        <Download size={16} />
        <span>Exportar</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <FileText size={16} className="text-emerald-400" />
              <span>Exportar PDF</span>
            </button>
            <div className="h-[1px] bg-white/10 w-full" />
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <span>Exportar CSV / Excel</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
