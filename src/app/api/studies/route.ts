import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendSuccess, sendError } from "@/lib/utils/api";
import { createStudySchema } from "@/types/schemas";
import type { Study } from "@/types/database";
import type { StudyWithPatient } from "@/hooks/use-studies";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId");
  const status = url.searchParams.get("status");
  const modality = url.searchParams.get("modality");

  const supabase = await createClient();
  let query = supabase
    .from("studies")
    .select(
      "id, patient_id, study_type_id, description, created_by, created_at, assigned_to, status, patients(name), study_types(name), reports(count), profiles:profiles!studies_assigned_to_fkey(full_name,email)"
    )
    .order("created_at", { ascending: false });

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (modality) {
    const modalityFilter = modality.toUpperCase();
    const studyTypeName =
      modalityFilter === "XRAY" || modalityFilter === "X-RAY"
        ? "X-Ray"
        : modalityFilter === "US" || modalityFilter === "ULTRASOUND"
          ? "Ultrasound"
          : modalityFilter;
    query = query.ilike("study_types.name", `%${studyTypeName}%`);
  }

  const { data, error } = await query;
  if (error) {
    return sendError(error.message, 500);
  }

  const shaped = (data ?? []).map((row) => ({
    ...row,
    patient_name:
      "patients" in row && row.patients && typeof row.patients === "object"
        ? (row.patients as { name?: string | null }).name ?? null
        : null,
    study_type_name:
      "study_types" in row && row.study_types && typeof row.study_types === "object"
        ? (row.study_types as { name?: string | null }).name ?? null
        : null,
    report_count:
      "reports" in row && Array.isArray(row.reports)
        ? (row.reports[0] as { count?: number | null }).count ?? 0
        : 0,
    assigned_to_name:
      "profiles" in row && row.profiles && typeof row.profiles === "object"
        ? (row.profiles as { full_name?: string | null; email?: string | null })
            .full_name ??
          (row.profiles as { full_name?: string | null; email?: string | null }).email ??
          null
        : null,
  }));

  return sendSuccess<StudyWithPatient[]>((shaped ?? []) as StudyWithPatient[]);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const parsed = createStudySchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studies")
    .insert({
      patient_id: parsed.data.patient_id,
      study_type_id: parsed.data.study_type_id,
      description: parsed.data.description?.trim() || null,
      created_by: auth.user.id,
    })
    .select("id, patient_id, study_type_id, description, created_by, created_at, assigned_to, status")
    .single();

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<Study>(data as Study, 201, { message: "Study created." });
}
