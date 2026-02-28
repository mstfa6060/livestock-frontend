import { hasRole, hasAnyRole } from "@/lib/jwt";
import { Roles, AdminRoles, StaffRoles } from "@/constants/roles";

// Fallback admin emails (used when JWT doesn't contain role claims yet)
const ADMIN_EMAILS = [
  "nagehanyazici13@gmail.com",
  "m.mustafaocak@gmail.com",
];

/**
 * Check if the current user is an admin.
 * First checks JWT role claim, falls back to email-based check.
 */
export function isAdmin(email?: string): boolean {
  // Primary: check JWT role
  if (hasRole(Roles.Admin)) return true;

  // Fallback: email-based check (until backend fully assigns Admin role)
  if (email) return ADMIN_EMAILS.includes(email.toLowerCase());

  return false;
}

/**
 * Check if the current user is staff (Admin, Moderator, or Support).
 */
export function isStaff(email?: string): boolean {
  if (hasAnyRole(StaffRoles)) return true;
  // Fallback: admin emails are treated as staff
  if (email) return ADMIN_EMAILS.includes(email.toLowerCase());
  return false;
}

/**
 * @deprecated Use isAdmin() instead. Kept for backward compatibility.
 */
export function isAdminEmail(email: string | undefined): boolean {
  return isAdmin(email);
}

export { hasRole, hasAnyRole, Roles, AdminRoles, StaffRoles };
