import {jwtDecode} from "jwt-decode";

interface JwtPayload {
  scope: string;
  sub: string;
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

export function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.sub || null;
  } catch (error) {
    console.error('Error decoding token for userId:', error);
    return null;
  }
}