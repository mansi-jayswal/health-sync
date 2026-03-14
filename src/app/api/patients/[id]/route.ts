import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendSuccess, sendError } from "@/lib/utils/api";
import { updatePatientSchema } from "@/types/schemas";
import type { Patient } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, age, gender, created_by, created_at")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return sendError("Patient not found", 404);
    }
    return sendError(error.message, 500);
  }

  return sendSuccess<Patient>(data as Patient);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id } = await context.params;
  const parsed = updatePatientSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const update = parsed.data;
  if (Object.keys(update).length === 0) {
    return sendError("No fields to update.", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .update(update)
    .eq("id", id)
    .select("id, name, age, gender, created_by, created_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return sendError("Patient not found", 404);
    }
    return sendError(error.message, 500);
  }

  return sendSuccess<Patient>(data as Patient, 200, {
    message: "Patient updated.",
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
    .from("patients")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return sendError("Patient not found", 404);
  }

  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<null>(null, 200, { message: "Patient deleted." });
}
