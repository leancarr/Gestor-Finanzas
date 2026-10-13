export type Currency = "ARS" | "USD" | "USDT";

export type AccountKind = "efectivo" | "banco" | "cripto";

export interface Account {
  id: string;
  nombre: string;
  tipo: AccountKind;
  moneda: Currency;
  saldo: number;
}

export interface Transaction {
  id: string;
  fecha: string; // yyyy-mm-dd
  descripcion: string;
  monto: number; // negativo = gasto
  categoria: string;
  etiquetas: string[];
  cuentaId: string;
  moneda: Currency;
}

export interface Budget {
  categoria: string;
  limite: number;
}

export interface Goal {
  id: string;
  nombre: string;
  objetivo: number;
  ahorrado: number;
  emoji: string;
}

export interface Recurring {
  id: string;
  nombre: string;
  monto: number;
  frecuencia: string;
  proximo: string;
  categoria: string;
  detectado: boolean;
}

export interface Rule {
  id: string;
  siContiene: string;
  entoncesCategoria: string;
  activa: boolean;
}

export const CATEGORIAS = [
  "Comida",
  "Transporte",
  "Servicios",
  "Salidas",
  "Salud",
  "Hogar",
  "Suscripciones",
  "Ingresos",
  "Otros",
] as const;

export const CATEGORIA_EMOJI: Record<string, string> = {
  Comida: "🍽️",
  Transporte: "🚕",
  Servicios: "💡",
  Salidas: "🍻",
  Salud: "🩺",
  Hogar: "🏠",
  Suscripciones: "📺",
  Ingresos: "💼",
  Otros: "✨",
};

export function formatARS(n: number, opts: { signo?: boolean } = {}) {
  const s = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
  if (opts.signo) return `${n < 0 ? "−" : "+"} ${s}`;
  return `${n < 0 ? "−" : ""}${s}`;
}

export function formatMoneda(n: number, moneda: Currency) {
  if (moneda === "ARS") return formatARS(n);
  const s = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Math.abs(n));
  return `${n < 0 ? "−" : ""}${moneda === "USD" ? "US$" : "USDT "}${s}`;
}

export function fechaCorta(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

/** Parser de lenguaje natural: "Me gasté 15 lucas en nafta ayer" */
export interface ParsedInput {
  monto: number;
  categoria: string;
  fecha: string;
  descripcion: string;
  etiquetas: string[];
}

const PALABRAS_CATEGORIA: Record<string, string[]> = {
  Transporte: ["nafta", "combustible", "uber", "cabify", "taxi", "sube", "colectivo", "peaje"],
  Comida: ["super", "supermercado", "verdu", "carniceria", "almuerzo", "cena", "comida", "delivery", "pedidos"],
  Salidas: ["bar", "birra", "cerveza", "cine", "boliche", "salida", "restaurante", "café", "cafe"],
  Servicios: ["luz", "gas", "agua", "internet", "celular", "expensas", "alquiler"],
  Suscripciones: ["netflix", "spotify", "disney", "hbo", "youtube", "suscripcion", "suscripción"],
  Salud: ["farmacia", "medico", "médico", "obra social", "dentista", "remedios"],
  Hogar: ["ferreteria", "ferretería", "muebles", "limpieza", "hogar"],
  Ingresos: ["cobré", "cobre", "sueldo", "factura", "freelance", "ingreso", "me pagaron"],
};

function hoyISO(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

export function parseMagicInput(texto: string): ParsedInput | null {
  const t = texto.toLowerCase();

  // monto: soporta "15 lucas", "15k", "1.500", "1500,50"
  const lucas = t.match(/(\d+(?:[.,]\d+)?)\s*(lucas|luca|k|mil)\b/);
  const plano = t.match(/(\d{1,3}(?:\.\d{3})+|\d+(?:,\d{1,2})?)/);
  let monto = 0;
  if (lucas?.[1]) monto = parseFloat(lucas[1].replace(",", ".")) * 1000;
  else if (plano?.[1]) monto = parseFloat(plano[1].replace(/\./g, "").replace(",", "."));
  if (!monto) return null;

  let categoria = "Otros";
  for (const [cat, palabras] of Object.entries(PALABRAS_CATEGORIA)) {
    if (palabras.some((p) => t.includes(p))) {
      categoria = cat;
      break;
    }
  }

  let fecha = hoyISO();
  if (t.includes("ayer")) fecha = hoyISO(-1);
  if (t.includes("anteayer")) fecha = hoyISO(-2);
  const diaMes = t.match(/\bel (\d{1,2})\b/);
  if (diaMes?.[1]) {
    const d = new Date();
    d.setDate(Number(diaMes[1]));
    fecha = d.toISOString().slice(0, 10);
  }

  const esIngreso = categoria === "Ingresos" || /cobr|me pagaron|ingres/.test(t);

  const etiquetas = Array.from(t.matchAll(/#(\w+)/g))
    .map((m) => m[1])
    .filter((x): x is string => Boolean(x));

  const descripcion = texto
    .replace(/#\w+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^me gast[ée]\s*/i, "")
    .replace(/^gast[ée]\s*/i, "");

  return {
    monto: esIngreso ? monto : -monto,
    categoria,
    fecha,
    descripcion: descripcion.charAt(0).toUpperCase() + descripcion.slice(1),
    etiquetas,
  };
}
