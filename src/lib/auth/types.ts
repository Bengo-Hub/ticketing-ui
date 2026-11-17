import type { EmailVerificationState } from "@bengo-hub/shared-ui-lib/auth";

export type UserRole = "staff" | "admin" | "superuser";

/** The tokens auth-api issued, kept in the persisted auth store. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

/** The SSO profile from auth-api `GET /api/v1/auth/me` (identity and global roles only). */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  permissions: string[];
  tenantId: string;
  tenantSlug: string;
  isPlatformOwner: boolean;
  isSuperUser: boolean;
  email_verification?: EmailVerificationState;
}
