export interface IconOption {
  name: string;
  label: string;
  category: string;
}

export const AVAILABLE_ICONS: IconOption[] = [
  // Alimentación y Bebidas
  { name: 'ShoppingCart', label: 'Supermercado', category: 'Alimentos' },
  { name: 'Utensils', label: 'Restaurante / Comida', category: 'Alimentos' },
  { name: 'Coffee', label: 'Cafetería / Desayuno', category: 'Alimentos' },
  { name: 'Pizza', label: 'Comida Rápida', category: 'Alimentos' },
  { name: 'Beer', label: 'Bebidas / Bar', category: 'Alimentos' },

  // Movilidad y Transporte
  { name: 'Car', label: 'Auto / Combustible', category: 'Transporte' },
  { name: 'Fuel', label: 'Nafta / Estación', category: 'Transporte' },
  { name: 'Bus', label: 'Colectivo / Micro', category: 'Transporte' },
  { name: 'Train', label: 'Tren / Subte', category: 'Transporte' },
  { name: 'Plane', label: 'Vuelos / Viajes', category: 'Transporte' },

  // Hogar y Servicios
  { name: 'Home', label: 'Hogar / Alquiler', category: 'Hogar' },
  { name: 'Zap', label: 'Luz / Electricidad', category: 'Hogar' },
  { name: 'Flame', label: 'Gas / Calefacción', category: 'Hogar' },
  { name: 'Droplets', label: 'Agua / Red', category: 'Hogar' },
  { name: 'Wifi', label: 'Internet / WiFi', category: 'Hogar' },
  { name: 'Wrench', label: 'Mantenimiento / Arreglos', category: 'Hogar' },

  // Salud y Bienestar
  { name: 'HeartPulse', label: 'Salud / Farmacia', category: 'Salud' },
  { name: 'Stethoscope', label: 'Médico / Consulta', category: 'Salud' },
  { name: 'Pill', label: 'Medicamentos', category: 'Salud' },
  { name: 'Dumbbell', label: 'Gimnasio / Deporte', category: 'Salud' },

  // Ocio y Entretenimiento
  { name: 'Gamepad2', label: 'Videojuegos / Gaming', category: 'Ocio' },
  { name: 'Film', label: 'Cine / Películas', category: 'Ocio' },
  { name: 'Music', label: 'Música / Recitales', category: 'Ocio' },
  { name: 'Tv', label: 'Streaming / TV', category: 'Ocio' },
  { name: 'Sparkles', label: 'Salidas / Fiestas', category: 'Ocio' },

  // Educación y Trabajo
  { name: 'GraduationCap', label: 'Universidad / Cursos', category: 'Educación' },
  { name: 'BookOpen', label: 'Libros / Material', category: 'Educación' },
  { name: 'Briefcase', label: 'Trabajo / Oficina', category: 'Trabajo' },
  { name: 'Laptop', label: 'Tecnología / Hardware', category: 'Trabajo' },
  { name: 'Smartphone', label: 'Telefonía / Celular', category: 'Trabajo' },

  // Finanzas e Inversiones
  { name: 'CreditCard', label: 'Tarjetas / Facturas', category: 'Finanzas' },
  { name: 'Wallet', label: 'Billetera / Efectivo', category: 'Finanzas' },
  { name: 'TrendingUp', label: 'Inversiones / Acciones', category: 'Finanzas' },
  { name: 'PiggyBank', label: 'Ahorro / Fondos', category: 'Finanzas' },
  { name: 'Landmark', label: 'Impuestos / Bancos', category: 'Finanzas' },

  // Compras y Varios
  { name: 'ShoppingBag', label: 'Ropa / Indumentaria', category: 'Compras' },
  { name: 'Gift', label: 'Regalos / Festejos', category: 'Compras' },
  { name: 'Package', label: 'Envíos / Paquetes', category: 'Compras' },
  { name: 'Tag', label: 'Etiqueta / Descuentos', category: 'Compras' },
  { name: 'Shield', label: 'Seguros / Protección', category: 'Varios' },
  { name: 'MoreHorizontal', label: 'Otros / Varios', category: 'Varios' },
];

export const PRESET_COLORS = [
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Verde', hex: '#22C55E' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Cian', hex: '#06B6D4' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Índigo', hex: '#6366F1' },
  { name: 'Violeta', hex: '#8B5CF6' },
  { name: 'Púrpura', hex: '#A855F7' },
  { name: 'Fucsia', hex: '#D946EF' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Amarillo', hex: '#EAB308' },
  { name: 'Pizarra', hex: '#64748B' },
];
