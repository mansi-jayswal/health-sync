export const ROLES = {
  CLINIC_ADMIN: "clinic_admin",
  RADIOLOGIST: "radiologist",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
