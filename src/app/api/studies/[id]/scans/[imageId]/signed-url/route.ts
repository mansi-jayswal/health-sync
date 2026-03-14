import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { sendError, sendSuccess } from "@/lib/utils/api";
import type { ScanSignedUrl } from "@/types/api";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const { id: studyId, imageId } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("study_id", studyId)
    .single();

  if (error || !data) {
    return sendError("Scan not found", 404);
  }

  const serviceClient = createServiceClient();
  const { data: signed, error: signedError } = await serviceClient.storage
    .from("scan-images")
    .createSignedUrl(data.storage_path, SIGNED_URL_TTL_SECONDS);

  if (signedError || !signed?.signedUrl) {
    return sendError(signedError?.message ?? "Failed to create signed URL.", 500);
  }

  const expiresAt = new Date(
    Date.now() + SIGNED_URL_TTL_SECONDS * 1000
  ).toISOString();

  return sendSuccess<ScanSignedUrl>({
    url: signed.signedUrl,
    expiresAt,
  });
}
