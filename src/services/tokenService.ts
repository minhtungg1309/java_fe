import {jwtDecode} from "jwt-decode";

interface JwtPayload {
  scope: string;
}

export function getRoleFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.scope) return null;
    const roles = decoded.scope.split(" ").filter(s => s.startsWith("ROLE_"));
    return roles.length > 0 ? roles[0] : null;
  } catch {
    return null;
  }
}

export function getPermissionsFromToken(token: string): string[] {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.scope) return [];
    return decoded.scope.split(" ");
  } catch {
    return [];
  }
}