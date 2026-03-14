import { z } from "zod";

export const scanImageSchema = z.object({
  id: z.string().uuid(),
  study_id: z.string().uuid(),
  file_name: z.string(),
  file_size: z.number().nullable(),
  mime_type: z.enum(["image/jpeg", "image/png"]),
  uploaded_by: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type ScanImage = z.infer<typeof scanImageSchema>;
