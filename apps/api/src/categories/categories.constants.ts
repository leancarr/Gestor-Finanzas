export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Categorías de Ingresos
  { name: 'Salario & Sueldo', icon: 'Banknote', color: '#10B981' }, // Emerald
  { name: 'Freelance & Ventas', icon: 'Briefcase', color: '#06B6D4' }, // Cyan
  // Categorías de Gastos
  { name: 'Supermercado & Alimentos', icon: 'ShoppingCart', color: '#10B981' }, // Emerald
  { name: 'Comida & Salidas', icon: 'Utensils', color: '#F59E0B' }, // Amber
  { name: 'Transporte & Combustible', icon: 'Car', color: '#3B82F6' }, // Blue
  { name: 'Vivienda & Servicios', icon: 'Home', color: '#6366F1' }, // Indigo
  { name: 'Servicios & Facturas', icon: 'CreditCard', color: '#EC4899' }, // Pink
  { name: 'Salud & Farmacia', icon: 'HeartPulse', color: '#EF4444' }, // Red
  { name: 'Entretenimiento & Ocio', icon: 'Gamepad2', color: '#8B5CF6' }, // Purple
  { name: 'Educación & Cursos', icon: 'GraduationCap', color: '#06B6D4' }, // Cyan
  { name: 'Compras & Ropa', icon: 'ShoppingBag', color: '#14B8A6' }, // Teal
  { name: 'Inversiones & Ahorro', icon: 'TrendingUp', color: '#22C55E' }, // Green
  { name: 'Viajes & Vacaciones', icon: 'Plane', color: '#0EA5E9' }, // Sky
  { name: 'Otros Gastos', icon: 'MoreHorizontal', color: '#64748B' }, // Slate
];
