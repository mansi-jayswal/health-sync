import { z } from "zod";
import { ROLES } from "@/constants/roles";

export const updateUserRoleSchema = z.object({
  role: z.enum([ROLES.CLINIC_ADMIN, ROLES.RADIOLOGIST]),
});

export type UpdateUserRoleValues = z.infer<typeof updateUserRoleSchema>;

export const userInviteSchema = z.object({
  email: z.string().email("Valid email required"),
  full_name: z.string().min(1, "Name is required").max(100),
  role: z.enum([ROLES.CLINIC_ADMIN, ROLES.RADIOLOGIST]),
});

export type UserInviteInput = z.infer<typeof userInviteSchema>;
