import { z } from "zod";

export const PATIENT_GENDERS = ["male", "female", "other"] as const;

export const createPatientSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  age: z.number().int().min(0, "Age must be 0 or greater."),
  gender: z.enum(PATIENT_GENDERS, {
    message: "Please select a gender.",
  }),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
