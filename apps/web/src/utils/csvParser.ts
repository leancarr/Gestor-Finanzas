/**
 * csvParser.ts - SEI-57: Motor de Importación Masiva de CSV y Mapeo de Columnas Bancarias
 * Parser robusto en el cliente con detección de delimitadores (, ; \t), manejo de comillas RFC-4180,
 * normalización de fechas (ISO / Argentina DD/MM/YYYY) y saneamiento de montos bancarios ($1.234,56 o 1234.56).
 */

export interface RawCsvParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
  totalLines: number;
}

export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  categoryColumn?: string;
  typeColumn?: string;
}

export type ImportTypeMode = 'auto' | 'all_expenses' | 'all_income';

export interface NormalizedExpenseRow {
  index: number;
  date: string; // Formato ISO YYYY-MM-DD
  description: string;
  amount: number; // Monto positivo numérico
  type: 'EXPENSE' | 'INCOME';
  category?: string;
  rawDate: string;
  rawAmount: string;
  rawDescription: string;
  isValid: boolean;
  validationError?: string;
}

export interface ParsedAmount {
  value: number;
  isNegative: boolean;
  raw: string;
}

/**
 * Detecta inteligentemente el delimitador analizando las primeras líneas del archivo.
 * Soporta coma (,), punto y coma (;) y tabulación (\t).
 */
export function detectDelimiter(text: string): string {
  const lines = text
    .split(/\r\n|\n|\r/)
    .filter((l) => l.trim().length > 0)
    .slice(0, 10);

  if (lines.length === 0) return ',';

  let commaCount = 0;
  let semicolonCount = 0;
  let tabCount = 0;

  for (const line of lines) {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char === ',') commaCount++;
        else if (char === ';') semicolonCount++;
        else if (char === '\t') tabCount++;
      }
    }
  }

  if (semicolonCount > commaCount && semicolonCount >= tabCount) return ';';
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  return ',';
}

/**
 * Parsea el contenido CSV crudo respetando el estándar RFC 4180
 * (escapes de comillas dobles, saltos de línea dentro de campos entrecomillados y delimitadores).
 */
export function parseCsvString(
  csvContent: string,
  customDelimiter?: string,
): RawCsvParseResult {
  // Limpiar Byte Order Mark (BOM UTF-8)
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  const delimiter = customDelimiter || detectDelimiter(cleanContent);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let quoteOpenedLine = 1;
  let currentLine = 1;

  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];

    if (char === '\n') {
      currentLine++;
    }

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Saltar comilla de escape
      } else {
        if (!inQuotes) {
          quoteOpenedLine = currentLine;
        }
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Manejar salto \r\n
        currentLine++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Validación estructural: si hay una comilla sin cerrar, el archivo está corrupto
  if (inQuotes) {
    throw new Error(
      `Error de formato en el archivo CSV: Se detectó una comilla abierta sin cerrar (alrededor de la línea ${quoteOpenedLine}). Verifique la integridad del archivo antes de importar.`,
    );
  }

  // Último campo / fila remanente
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], delimiter, totalLines: 0 };
  }

  // Primera fila como encabezados
  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h, i) => {
    const cleaned = h.replace(/^["']|["']$/g, '').trim();
    return cleaned.length > 0 ? cleaned : `Columna ${i + 1}`;
  });

  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim().length > 0));

  return {
    headers,
    rows: dataRows,
    delimiter,
    totalLines: dataRows.length,
  };
}

/**
 * Limpia y normaliza montos monetarios en formatos bancarios habituales:
 * - Formato rioplatense/europeo: "$ 1.234,56", "-1.234,56", "(1.234,56)", "1234,56"
 * - Formato internacional: "$ 1,234.56", "-1,234.56", "1234.56"
 * - Identificación de egresos / débitos por signo negativo o sufijos (DB, D, Egreso).
 */
export function cleanAmount(rawInput: string | number): ParsedAmount {
  if (typeof rawInput === 'number') {
    const isNeg = rawInput < 0;
    return {
      value: Math.round(Math.abs(rawInput) * 100) / 100,
      isNegative: isNeg,
      raw: String(rawInput),
    };
  }

  if (!rawInput || typeof rawInput !== 'string') {
    return { value: 0, isNegative: false, raw: '' };
  }

  const trimmed = rawInput.trim();
  let str = trimmed;

  // Detección de número negativo (paréntesis contables o signo menos)
  const isParenNegative = /^\(.*\)$/.test(str);
  const isMinusNegative = str.includes('-');
  const isDebitIndicator = /\b(db|deb|debito|débito|egreso|d)\b/i.test(str);
  const isCreditIndicator = /\b(cr|cred|credito|crédito|ingreso|c)\b/i.test(str);

  const isNegative =
    isParenNegative || isMinusNegative || (isDebitIndicator && !isCreditIndicator);

  // Conservar solo dígitos, comas y puntos
  str = str.replace(/[^0-9.,]/g, '');

  if (!str) {
    return { value: 0, isNegative, raw: trimmed };
  }

  // Resolución de separador de miles vs decimales
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Formato argentino/español: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato US: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2) {
      // 1234,56 -> coma decimal
      str = parts[0] + '.' + parts[1];
    } else {
      // Múltiples comas (separadores de miles sin decimales)
      str = parts.join('');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2) {
      // 1.234.567 -> múltiples puntos como miles
      str = parts.join('');
    }
    // Si tiene un solo punto (ej: 1234.56), el parseFloat nativo lo interpreta correctamente
  }

  const num = parseFloat(str);
  return {
    value: isNaN(num) ? 0 : Math.round(Math.abs(num) * 100) / 100,
    isNegative,
    raw: trimmed,
  };
}

/**
 * Normaliza fechas variadas a formato estándar ISO YYYY-MM-DD.
 * Admite:
 * - DD/MM/YYYY, DD/MM/YY, DD-MM-YYYY, DD.MM.YYYY (típicas en bancos argentinos)
 * - YYYY-MM-DD, YYYY/MM/DD (ISO standard)
 */
export function normalizeDate(rawDate: string): string {
  if (!rawDate || typeof rawDate !== 'string') {
    return new Date().toISOString().split('T')[0];
  }

  const trimmed = rawDate.trim();

  // 1. ISO YYYY-MM-DD o YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. Latino / Argentino DD/MM/YYYY o DD-MM-YYYY
  const latinMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (latinMatch) {
    const day = latinMatch[1].padStart(2, '0');
    const month = latinMatch[2].padStart(2, '0');
    let year = latinMatch[3];
    if (year.length === 2) {
      const yNum = parseInt(year, 10);
      year = yNum < 50 ? `20${year}` : `19${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // 3. Fallback con Date.parse
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Infiere automáticamente el mapeo más probable de columnas analizando los nombres de encabezado.
 */
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  let dateColumn = '';
  let descriptionColumn = '';
  let amountColumn = '';
  let categoryColumn = '';
  let typeColumn = '';

  for (const h of headers) {
    const clean = normalize(h);

    if (
      !dateColumn &&
      (clean.includes('fecha') ||
        clean.includes('date') ||
        clean.includes('dia') ||
        clean.includes('foperacion') ||
        clean.includes('fvalor'))
    ) {
      dateColumn = h;
    } else if (
      !amountColumn &&
      (clean.includes('monto') ||
        clean.includes('importe') ||
        clean.includes('amount') ||
        clean.includes('total') ||
        clean.includes('valor') ||
        clean.includes('saldo') ||
        clean.includes('debito') ||
        clean.includes('credito'))
    ) {
      amountColumn = h;
    } else if (
      !descriptionColumn &&
      (clean.includes('descrip') ||
        clean.includes('detalle') ||
        clean.includes('concepto') ||
        clean.includes('comercio') ||
        clean.includes('movimiento') ||
        clean.includes('motivo') ||
        clean.includes('glosa') ||
        clean.includes('referencia') ||
        clean.includes('nota') ||
        clean.includes('texto'))
    ) {
      descriptionColumn = h;
    } else if (
      !categoryColumn &&
      (clean.includes('categoria') ||
        clean.includes('category') ||
        clean.includes('rubro'))
    ) {
      categoryColumn = h;
    } else if (
      !typeColumn &&
      (clean.includes('tipo') ||
        clean.includes('type') ||
        clean.includes('operacion'))
    ) {
      typeColumn = h;
    }
  }

  // Fallbacks si no se pudieron adivinar
  if (!dateColumn && headers.length > 0) dateColumn = headers[0];
  if (!descriptionColumn && headers.length > 1) {
    descriptionColumn =
      headers.find((h) => h !== dateColumn && h !== amountColumn) || headers[1];
  }
  if (!amountColumn && headers.length > 2) {
    amountColumn =
      headers.find((h) => h !== dateColumn && h !== descriptionColumn) || headers[2];
  }

  return {
    dateColumn: dateColumn || (headers[0] ?? ''),
    descriptionColumn: descriptionColumn || (headers[1] ?? ''),
    amountColumn: amountColumn || (headers[2] ?? ''),
    categoryColumn: categoryColumn || undefined,
    typeColumn: typeColumn || undefined,
  };
}

/**
 * Determina inteligentemente el modo inicial de tipo (auto vs all_expenses).
 * Si hay columna de Tipo o si los datos contienen signos mixtos (+/-) o palabras clave de ingreso/débito,
 * prioriza 'auto' para respetar las transacciones reales.
 */
export function guessInitialTypeMode(
  rows: string[][],
  headers: string[],
  mapping: ColumnMapping,
): ImportTypeMode {
  if (mapping.typeColumn) {
    return 'auto';
  }

  const amountIdx = headers.indexOf(mapping.amountColumn);
  const descIdx = headers.indexOf(mapping.descriptionColumn);

  for (const r of rows.slice(0, 30)) {
    const rawAmt = amountIdx >= 0 ? (r[amountIdx] ?? '') : '';
    const desc = descIdx >= 0 ? (r[descIdx] ?? '') : '';

    const parsed = cleanAmount(rawAmt);
    if (parsed.value > 0) {
      if (
        parsed.isNegative ||
        rawAmt.includes('+') ||
        /sueldo|haberes|transferencia recibida|acreditaci|deposito|depósito|cobro/i.test(desc)
      ) {
        return 'auto';
      }
    }
  }

  return 'auto';
}

/**
 * Normaliza y valida una lista de filas tabulares a objetos `NormalizedExpenseRow`.
 */
export function normalizeRows(
  rows: string[][],
  headers: string[],
  mapping: ColumnMapping,
  typeMode: ImportTypeMode = 'auto',
): NormalizedExpenseRow[] {
  const dateIdx = headers.indexOf(mapping.dateColumn);
  const descIdx = headers.indexOf(mapping.descriptionColumn);
  const amountIdx = headers.indexOf(mapping.amountColumn);
  const catIdx = mapping.categoryColumn ? headers.indexOf(mapping.categoryColumn) : -1;
  const typeIdx = mapping.typeColumn ? headers.indexOf(mapping.typeColumn) : -1;

  return rows.map((row, idx) => {
    const rawDate = dateIdx >= 0 ? (row[dateIdx] ?? '') : '';
    const rawDesc = descIdx >= 0 ? (row[descIdx] ?? '') : '';
    const rawAmt = amountIdx >= 0 ? (row[amountIdx] ?? '') : '';
    const rawCat = catIdx >= 0 ? (row[catIdx] ?? '') : '';
    const rawType = typeIdx >= 0 ? (row[typeIdx] ?? '') : '';

    const parsedAmt = cleanAmount(rawAmt);
    const normalizedDate = normalizeDate(rawDate);
    const rawTrimmedDesc = rawDesc.trim();

    // Determinar tipo de transacción
    let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
    if (typeMode === 'all_expenses') {
      type = 'EXPENSE';
    } else if (typeMode === 'all_income') {
      type = 'INCOME';
    } else {
      // Modo 'auto'
      if (rawType) {
        const lowerType = rawType.toLowerCase();
        if (
          lowerType.includes('ingreso') ||
          lowerType.includes('cred') ||
          lowerType.includes('c')
        ) {
          type = 'INCOME';
        } else if (
          lowerType.includes('gasto') ||
          lowerType.includes('deb') ||
          lowerType.includes('egreso') ||
          lowerType.includes('d')
        ) {
          type = 'EXPENSE';
        } else {
          // Si el texto del tipo no es explícito, usar signo del monto
          type = parsedAmt.isNegative ? 'EXPENSE' : 'INCOME';
        }
      } else {
        // En bancos: montos negativos son egresos/débitos, montos positivos son créditos/ingresos.
        if (parsedAmt.isNegative) {
          type = 'EXPENSE';
        } else if (
          rawAmt.includes('+') ||
          /sueldo|haberes|transferencia recibida|acreditaci|deposito|depósito|cobro/i.test(
            rawTrimmedDesc,
          )
        ) {
          type = 'INCOME';
        } else {
          type = 'EXPENSE';
        }
      }
    }

    // Validación
    let isValid = true;
    let validationError: string | undefined = undefined;

    if (parsedAmt.value <= 0) {
      isValid = false;
      validationError = 'El monto debe ser mayor a 0.';
    } else if (!rawTrimmedDesc) {
      isValid = false;
      validationError = 'La descripción es obligatoria.';
    }

    const description = rawTrimmedDesc || 'Sin descripción';

    return {
      index: idx + 1,
      date: normalizedDate,
      description,
      amount: parsedAmt.value,
      type,
      category: rawCat.trim() || undefined,
      rawDate,
      rawAmount: rawAmt,
      rawDescription: rawDesc,
      isValid,
      validationError,
    };
  });
}
