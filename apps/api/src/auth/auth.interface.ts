export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  appMetadata?: Record<string, any>;
  userMetadata?: Record<string, any>;
}
