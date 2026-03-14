import { z } from "zod";

export const createStudyTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
});

export type CreateStudyTypeInput = z.infer<typeof createStudyTypeSchema>;

export const updateStudyTypeSchema = createStudyTypeSchema.partial();

export type UpdateStudyTypeInput = z.infer<typeof updateStudyTypeSchema>;
