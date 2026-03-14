import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendSuccess, sendError } from "@/lib/utils/api";
import { updateStudyTypeSchema } from "@/types/schemas";
import type { StudyType } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id } = await context.params;
  const parsed = updateStudyTypeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const update = parsed.data;
  if (Object.keys(update).length === 0) {
    return sendError("No fields to update.", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_types")
    .update({ name: update.name?.trim() })
    .eq("id", id)
    .select("id, name, created_by, created_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return sendError("Study type not found", 404);
    }
    return sendError(error.message, 500);
  }

  return sendSuccess<StudyType>(data as StudyType, 200, {
    message: "Study type updated.",
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("study_types")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return sendError("Study type not found", 404);
  }

  const { count: usageCount, error: usageError } = await supabase
    .from("studies")
    .select("id", { count: "exact", head: true })
    .eq("study_type_id", id);

  if (usageError) {
    return sendError(usageError.message, 500);
  }

  if ((usageCount ?? 0) > 0) {
    return sendError("Cannot delete a study type that is in use.", 409);
  }

  const { error } = await supabase.from("study_types").delete().eq("id", id);
  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<null>(null, 200, { message: "Study type deleted." });
}
