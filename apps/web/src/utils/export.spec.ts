import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToPDF } from './export';
import type { ExpenseItem } from './api/expenses';

describe('export.ts - CSV & PDF Export Suite', () => {
  const mockExpenses: ExpenseItem[] = [
    {
      id: 'exp-1',
      description: 'Supermercado Coto',
      amount: 45000,
      currency: 'ARS',
      type: 'EXPENSE',
      date: '2026-10-16T12:00:00.000Z',
      categoryId: 'cat-1',
      userId: 'usr-1',
      createdAt: '2026-10-16T12:00:00.000Z',
      updatedAt: '2026-10-16T12:00:00.000Z',
      category: {
        id: 'cat-1',
        name: 'Alimentación',
        icon: 'utensils',
        color: '#10B981',
      },
    },
    {
      id: 'exp-2',
      description: 'Honorarios Desarrollo Software',
      amount: 250000,
      currency: 'ARS',
      type: 'INCOME',
      date: '2026-10-15T15:30:00.000Z',
      categoryId: null,
      userId: 'usr-1',
      createdAt: '2026-10-15T15:30:00.000Z',
      updatedAt: '2026-10-15T15:30:00.000Z',
      category: null,
    },
  ];

  it('exportToCSV no lanza excepciones cuando los datos están vacíos', () => {
    expect(() => exportToCSV([])).not.toThrow();
  });

  describe('con entorno DOM simulado', () => {
    let originalDocument: any;
    let originalURL: any;

    beforeEach(() => {
      originalDocument = globalThis.document;
      originalURL = globalThis.URL;

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      globalThis.document = {
        body: mockBody,
        createElement: vi.fn().mockReturnValue({
          setAttribute: vi.fn(),
          style: {},
          click: vi.fn(),
          parentNode: mockBody,
        }),
      } as any;

      globalThis.URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
        revokeObjectURL: vi.fn(),
      } as any;
    });

    afterEach(() => {
      globalThis.document = originalDocument;
      globalThis.URL = originalURL;
    });

    it('exportToCSV genera el archivo y simula el click en el DOM', () => {
      expect(() => exportToCSV(mockExpenses, 'Reporte_Test')).not.toThrow();
      expect(globalThis.document.createElement).toHaveBeenCalledWith('a');
      expect(globalThis.document.body.appendChild).toHaveBeenCalled();
    });
  });

  it('exportToPDF no lanza excepciones cuando los datos están vacíos', () => {
    expect(() => exportToPDF([])).not.toThrow();
  });

  it('exportToPDF inicializa jsPDF y autoTable correctamente sin lanzar TypeError', () => {
    expect(() => {
      exportToPDF(mockExpenses, {
        includeSummary: true,
        periodLabel: 'Octubre 2026',
        currency: 'ARS',
        customTitle: 'REPORTE FINANCIERO EJECUTIVO',
      });
    }).not.toThrow();
  });
});
