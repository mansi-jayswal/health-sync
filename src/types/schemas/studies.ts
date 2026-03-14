import { z } from "zod";

export const createStudySchema = z.object({
  patient_id: z.string().uuid("Patient is required."),
  study_type_id: z.string().uuid("Study type is required."),
  description: z.string().trim().optional(),
});

export type CreateStudyInput = z.infer<typeof createStudySchema>;

export const studyUpdateSchema = z.object({
  assigned_to: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "in_review", "completed"]).optional(),
  description: z.string().trim().max(500).optional(),
  patient_id: z.string().uuid().optional(),
  study_type_id: z.string().uuid().optional(),
});

export type StudyUpdateInput = z.infer<typeof studyUpdateSchema>;
