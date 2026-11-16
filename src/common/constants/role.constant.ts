
export const PRIMARY_ROLE = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  PATIENT: 'PATIENT',
} as const;

export const SECONDARY_ROLE = {
  MANAGER: 'MANAGER',
  BILLING: 'BILLING',
  PRACTICE_MANAGER: 'PRACTICE_MANAGER',
  SCHEDULER: 'SCHEDULER',
  STAFF_READ_ONLY: 'STAFF_READ_ONLY',
} as const;

export type PrimaryRole =
  (typeof PRIMARY_ROLE)[keyof typeof PRIMARY_ROLE];

export type SecondaryRole =
  (typeof SECONDARY_ROLE)[keyof typeof SECONDARY_ROLE];

export type AppRole = PrimaryRole | SecondaryRole;

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  STAFF: 'Staff',
  PATIENT: 'Patient',
  MANAGER: 'Manager',
  BILLING: 'Billing',
  PRACTICE_MANAGER: 'Practice Manager',
  SCHEDULER: 'Scheduler',
  STAFF_READ_ONLY: 'Staff Read-only',
};

export const getRoleLabel = (role: string): string =>
  ROLE_LABELS[role as AppRole] ?? role;
