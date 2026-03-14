import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendSuccess, sendError } from "@/lib/utils/api";
import { createStudyTypeSchema } from "@/types/schemas";
import type { StudyType } from "@/types/database";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_types")
    .select("id, name, created_by, created_at")
    .order("name", { ascending: true });

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<StudyType[]>((data ?? []) as StudyType[]);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const parsed = createStudyTypeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_types")
    .insert({
      name: parsed.data.name.trim(),
      created_by: auth.user.id,
    })
    .select("id, name, created_by, created_at")
    .single();

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<StudyType>(data as StudyType, 201, {
    message: "Study type created.",
  });
}
