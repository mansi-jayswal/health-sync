import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendSuccess, sendError } from "@/lib/utils/api";
import { studyUpdateSchema } from "@/types/schemas";
import type { Study } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studies")
    .select(
      "id, patient_id, study_type_id, description, created_by, created_at, assigned_to, status, study_types(name), profiles:profiles!studies_assigned_to_fkey(full_name,email)"
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return sendError("Study not found", 404);
    }
    return sendError(error.message, 500);
  }

  const shaped = {
    ...(data as Study),
    study_type_name:
      data && "study_types" in data && data.study_types && typeof data.study_types === "object"
        ? (data.study_types as { name?: string | null }).name ?? null
        : null,
    assigned_to_name:
      data && "profiles" in data && data.profiles && typeof data.profiles === "object"
        ? (data.profiles as { full_name?: string | null; email?: string | null }).full_name ??
          (data.profiles as { full_name?: string | null; email?: string | null }).email ??
          null
        : null,
  };

  return sendSuccess<Study>(shaped as Study);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id } = await context.params;
  const parsed = studyUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const update = parsed.data;
  if (Object.keys(update).length === 0) {
    return sendError("No fields to update.", 400);
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("studies")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return sendError("Study not found", 404);
  }

  if (update.status) {
    const currentStatus = (existing as { status: Study["status"] }).status;
    const nextStatus = update.status;
    const isValidTransition =
      (currentStatus === "pending" && nextStatus === "in_review") ||
      (currentStatus === "in_review" && nextStatus === "completed") ||
      (currentStatus === "completed" && nextStatus === "in_review") ||
      currentStatus === nextStatus;

    if (!isValidTransition) {
      return sendError("Invalid status transition", 400);
    }
  }

  const updateData = {
    ...update,
    ...(update.description !== undefined
      ? { description: update.description.trim() || null }
      : {}),
  };

  const { data, error } = await supabase
    .from("studies")
    .update(updateData)
    .eq("id", id)
    .select("id, patient_id, study_type_id, description, created_by, created_at, assigned_to, status")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return sendError("Study not found", 404);
    }
    return sendError(error.message, 500);
  }

  return sendSuccess<Study>(data as Study, 200, { message: "Study updated." });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("studies")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return sendError("Study not found", 404);
  }

  const { error } = await supabase.from("studies").delete().eq("id", id);
  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<null>(null, 200, { message: "Study deleted." });
}
