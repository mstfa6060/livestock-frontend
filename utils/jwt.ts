export interface JwtPayload {
  nameid: string;
  given_name: string;
  unique_name: string;
  email: string;
  role: string | string[];
  platform: string;
  exp: number;
}

export const decodeJwt = (): JwtPayload | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("jwt");
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const getUserRoles = (): string[] => {
  const payload = decodeJwt();
  if (!payload) return [];

  if (Array.isArray(payload.role)) {
    return payload.role;
  }
  return payload.role ? [payload.role] : [];
};

export const hasRole = (role: string): boolean => {
  const roles = getUserRoles();
  return roles.includes(role);
};

export const hasAnyRole = (requiredRoles: string[]): boolean => {
  const roles = getUserRoles();
  return requiredRoles.some((r) => roles.includes(r));
};
