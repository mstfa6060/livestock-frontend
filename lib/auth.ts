/**
 * JWT decode utilities
 * For client-side JWT token parsing (not verification)
 */

interface JwtPayload {
  sub: string; // user id
  email?: string;
  name?: string;
  roles?: string[];
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  [key: string]: unknown;
}

/**
 * Decode a JWT token without verification
 * Only use for reading claims, not for security decisions
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Get time until token expires (in milliseconds)
 * Returns 0 if already expired or invalid
 */
export function getTokenExpiresIn(token: string): number {
  const payload = decodeJwt(token);
  if (!payload) return 0;

  const expirationTime = payload.exp * 1000;
  const remaining = expirationTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Get user roles from JWT token
 */
export function getUserRoles(token: string): string[] {
  const payload = decodeJwt(token);
  if (!payload) return [];

  // Roles might be in different claim names depending on backend
  const roles = payload.roles || payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  if (!roles) return [];
  if (Array.isArray(roles)) return roles;
  if (typeof roles === "string") return [roles];

  return [];
}

/**
 * Check if user has a specific role
 */
export function hasRole(token: string, role: string): boolean {
  const roles = getUserRoles(token);
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(token: string, requiredRoles: string[]): boolean {
  const roles = getUserRoles(token);
  return requiredRoles.some((role) => roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(token: string, requiredRoles: string[]): boolean {
  const roles = getUserRoles(token);
  return requiredRoles.every((role) => roles.includes(role));
}

/**
 * Get user ID from JWT token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJwt(token);
  return payload?.sub || null;
}
