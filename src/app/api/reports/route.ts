import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendError, sendSuccess } from "@/lib/utils/api";
import { reportCreateSchema } from "@/types/schemas";
import type { Report } from "@/types/schemas";
import type { ReportListItem } from "@/types/api";

function normalizeModality(input: string) {
  const normalized = input.toUpperCase();
  if (normalized === "XRAY" || normalized === "X-RAY") return "X-Ray";
  if (normalized === "CT") return "CT";
  if (normalized === "MRI") return "MRI";
  if (normalized === "US" || normalized === "ULTRASOUND") return "Ultrasound";
  return input;
}

function mapModality(name?: string | null): ReportListItem["study"]["modality"] {
  const value = (name ?? "").toUpperCase().replace("-", "");
  if (value.includes("XRAY") || value.includes("X RAY")) return "XRAY";
  if (value.includes("MRI")) return "MRI";
  if (value.includes("CT")) return "CT";
  return "US";
}

export async function GET(request: NextRequest) {
  const auth = await requireRole([ROLES.RADIOLOGIST]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const url = new URL(request.url);
  const modalityParam = url.searchParams.get("modality");
  const modalityFilter = modalityParam ? normalizeModality(modalityParam) : null;

  const supabase = await createClient();
  const query = supabase
    .from("reports")
    .select(
      "id, findings, impression, created_at, updated_at, studies(id, created_at, status, study_types(name), patients(id, name))"
    )
    .eq("author_id", auth.user.id)
    .order("updated_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    return sendError(error.message, 500);
  }

  const shaped: ReportListItem[] = (data ?? []).map((row) => {
    const rawStudy = (row as { studies?: unknown }).studies;
    const study =
      Array.isArray(rawStudy) && rawStudy.length > 0
        ? (rawStudy[0] as {
            id: string;
            created_at: string;
            status: "pending" | "in_review" | "completed";
            study_types?: { name?: string | null } | null;
            patients?: { id: string; name: string } | null;
          })
        : (rawStudy as {
            id: string;
            created_at: string;
            status: "pending" | "in_review" | "completed";
            study_types?: { name?: string | null } | null;
            patients?: { id: string; name: string } | null;
          } | null);

    return {
      id: row.id,
      findings: row.findings,
      impression: row.impression,
      created_at: row.created_at,
      updated_at: row.updated_at,
      study: {
        id: study?.id ?? "",
        modality: mapModality(study?.study_types?.name),
        study_date: study?.created_at ?? row.created_at,
        status: study?.status ?? "pending",
        patient: {
          id: study?.patients?.id ?? "",
          full_name: study?.patients?.name ?? "Unknown",
        },
      },
    };
  });

  const filtered = modalityFilter
    ? shaped.filter((item) => item.study.modality === mapModality(modalityFilter))
    : shaped;

  return sendSuccess<ReportListItem[]>(filtered);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole([ROLES.RADIOLOGIST]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const parsed = reportCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const { study_id, findings, impression } = parsed.data;

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("reports")
    .select("id")
    .eq("study_id", study_id)
    .maybeSingle();

  if (existingError) {
    return sendError(existingError.message, 500);
  }

  if (existing) {
    return sendError("Report already exists for this study.", 409);
  }

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id, assigned_to")
    .eq("id", study_id)
    .single();

  if (studyError || !study) {
    return sendError("Study not found.", 404);
  }

  if ((study as { assigned_to: string | null }).assigned_to !== auth.user.id) {
    return sendError("Forbidden", 403);
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      study_id,
      author_id: auth.user.id,
      findings,
      impression,
    })
    .select("id, study_id, author_id, findings, impression, created_at, updated_at")
    .single();

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<Report>(data as Report, 201, { message: "Report created." });
}
