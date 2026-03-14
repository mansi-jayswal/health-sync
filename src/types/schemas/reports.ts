import { z } from "zod";

export const reportCreateSchema = z.object({
  study_id: z.string().uuid(),
  findings: z.string().max(5000).default(""),
  impression: z.string().max(2000).default(""),
});

export const reportUpdateSchema = z.object({
  findings: z.string().max(5000).optional(),
  impression: z.string().max(2000).optional(),
});

export const reportSchema = z.object({
  id: z.string().uuid(),
  study_id: z.string().uuid(),
  author_id: z.string().uuid(),
  findings: z.string(),
  impression: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Report = z.infer<typeof reportSchema>;
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;
