import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendError, sendSuccess } from "@/lib/utils/api";
import { reportUpdateSchema } from "@/types/schemas";
import type { Report } from "@/types/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.RADIOLOGIST]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id } = await context.params;
  const parsed = reportUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const update = parsed.data;
  if (Object.keys(update).length === 0) {
    return sendError("No fields to update.", 400);
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("id, author_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return sendError("Report not found", 404);
  }

  if ((existing as { author_id: string }).author_id !== auth.user.id) {
    return sendError("Forbidden", 403);
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, study_id, author_id, findings, impression, created_at, updated_at")
    .single();

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<Report>(data as Report, 200, { message: "Report updated." });
}
