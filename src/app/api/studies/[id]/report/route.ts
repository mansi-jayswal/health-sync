import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { sendError, sendSuccess } from "@/lib/utils/api";
import type { ReportDetail } from "@/types/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const { id: studyId } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, study_id, author_id, findings, impression, created_at, updated_at, profiles(full_name,email)"
    )
    .eq("study_id", studyId)
    .maybeSingle();

  if (error) {
    return sendError(error.message, 500);
  }

  if (!data) {
    return sendSuccess<ReportDetail | null>(null);
  }

  const shaped: ReportDetail = {
    id: data.id,
    study_id: data.study_id,
    author_id: data.author_id,
    findings: data.findings,
    impression: data.impression,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author_name:
      data.profiles && typeof data.profiles === "object"
        ? (data.profiles as { full_name?: string | null }).full_name ?? null
        : null,
    author_email:
      data.profiles && typeof data.profiles === "object"
        ? (data.profiles as { email?: string | null }).email ?? null
        : null,
  };

  return sendSuccess<ReportDetail>(shaped);
}
