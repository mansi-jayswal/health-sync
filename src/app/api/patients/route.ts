import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendSuccess, sendError } from "@/lib/utils/api";
import { createPatientSchema } from "@/types/schemas";
import type { Patient } from "@/types/database";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, age, gender, created_by, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<Patient[]>((data ?? []) as Patient[]);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const parsed = createPatientSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      name: parsed.data.name.trim(),
      age: parsed.data.age,
      gender: parsed.data.gender,
      created_by: auth.user.id,
    })
    .select("id, name, age, gender, created_by, created_at")
    .single();

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<Patient>(data as Patient, 201, {
    message: "Patient created.",
  });
}
