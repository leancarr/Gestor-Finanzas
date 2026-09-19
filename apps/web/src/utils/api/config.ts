/**
 * Retorna la URL base de la API del backend.
 * En el navegador, usa automáticamente `${window.location.origin}/api` para aprovechar
 * el rewrite de Next.js hacia NestJS (puerto 4001). Esto garantiza compatibilidad universal
 * con túneles Cloudflare, acceso móvil en LAN o localhost sin problemas de CORS ni URLs rotas.
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    if (
      process.env.NEXT_PUBLIC_API_URL &&
      !process.env.NEXT_PUBLIC_API_URL.includes('localhost') &&
      !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
    ) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return `${window.location.origin}/api`;
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
}

export const DYNAMIC_API_URL = {
  toString: () => getApiUrl(),
  valueOf: () => getApiUrl(),
  [Symbol.toPrimitive]: () => getApiUrl(),
} as unknown as string;
