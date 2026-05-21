export type UserRole = "staff" | "admin" | "superuser";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  sessionId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  roles: UserRole[];
  permissions: string[];
  tenantId: string;
  tenantSlug: string;
  isPlatformOwner?: boolean;
  isSuperUser?: boolean;
  phone?: string;
}

export interface AuthResponse {
  session: SessionTokens;
  user: UserProfile;
}
