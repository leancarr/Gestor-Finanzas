import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  parseCsvString,
  cleanAmount,
  normalizeDate,
  guessColumnMapping,
  guessInitialTypeMode,
  normalizeRows,
} from './csvParser';

describe('csvParser - SEI-70 Fail-Fast & Validation', () => {
  it('detecta delimitadores correctamente', () => {
    expect(detectDelimiter('Fecha,Monto,Desc\n2026-09-01,100,Test')).toBe(',');
    expect(detectDelimiter('Fecha;Monto;Desc\n2026-09-01;100;Test')).toBe(';');
    expect(detectDelimiter('Fecha\tMonto\tDesc\n2026-09-01\t100\tTest')).toBe('\t');
  });

  it('arroja error de sintaxis si hay comillas sin cerrar (Fail-Fast RFC 4180)', () => {
    const brokenCsv = `Fecha,Descripcion,Monto\n01/09/2026,"Coto con comilla rota,-45000,Supermercado`;
    expect(() => parseCsvString(brokenCsv)).toThrow(/comilla abierta sin cerrar/);
  });

  it('parsea correctamente campos entrecomillados válidos y comillas escapadas', () => {
    const validQuotedCsv = `Fecha,Descripcion,Monto\n2026-09-01,"Coto, Sucursal ""Palermo""",-1500`;
    const result = parseCsvString(validQuotedCsv);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0][1]).toBe('Coto, Sucursal "Palermo"');
  });

  it('normaliza montos en formato rioplatense y us', () => {
    expect(cleanAmount('$ 1.234,56').value).toBe(1234.56);
    expect(cleanAmount('-1.234,56').isNegative).toBe(true);
    expect(cleanAmount('(1.234,56)').isNegative).toBe(true);
    expect(cleanAmount('1234.56').value).toBe(1234.56);
    expect(cleanAmount('NO_ES_UN_NUMERO').value).toBe(0);
  });

  it('normaliza fechas DD/MM/YYYY y ISO', () => {
    expect(normalizeDate('01/09/2026')).toBe('2026-09-01');
    expect(normalizeDate('2026-09-01')).toBe('2026-09-01');
  });

  it('adivina columnas bancarias habituales', () => {
    const headers = ['Fecha Operación', 'Detalle del Movimiento', 'Importe Neto', 'Rubro'];
    const mapping = guessColumnMapping(headers);
    expect(mapping.dateColumn).toBe('Fecha Operación');
    expect(mapping.descriptionColumn).toBe('Detalle del Movimiento');
    expect(mapping.amountColumn).toBe('Importe Neto');
    expect(mapping.categoryColumn).toBe('Rubro');
  });

  it('determina modo auto cuando hay ingresos o tipos mixtos', () => {
    const headers = ['Fecha', 'Descripción', 'Monto'];
    const rows = [
      ['01/09/2026', 'Coto', '-50000'],
      ['02/09/2026', 'Acreditación Haberes Sueldo', '1500000'],
    ];
    const mapping = guessColumnMapping(headers);
    const mode = guessInitialTypeMode(rows, headers, mapping);
    expect(mode).toBe('auto');

    const normalized = normalizeRows(rows, headers, mapping, mode);
    expect(normalized[0].type).toBe('EXPENSE');
    expect(normalized[1].type).toBe('INCOME');
  });

  it('marca filas inválidas cuando el monto es 0 o la descripción está vacía', () => {
    const headers = ['Fecha', 'Descripción', 'Monto'];
    const rows = [
      ['01/09/2026', '', '500'],
      ['02/09/2026', 'Gasto Cero', '0.00'],
      ['03/09/2026', 'Gasto Válido', '1500'],
    ];
    const mapping = guessColumnMapping(headers);
    const normalized = normalizeRows(rows, headers, mapping, 'auto');

    expect(normalized[0].isValid).toBe(false);
    expect(normalized[0].validationError).toBe('La descripción es obligatoria.');
    expect(normalized[1].isValid).toBe(false);
    expect(normalized[1].validationError).toBe('El monto debe ser mayor a 0.');
    expect(normalized[2].isValid).toBe(true);
  });
});
