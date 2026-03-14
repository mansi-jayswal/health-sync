import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { sendError, sendSuccess } from "@/lib/utils/api";
import { ROLES } from "@/constants/roles";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id: studyId, imageId } = await context.params;
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("scan_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("study_id", studyId)
    .single();

  if (fetchError || !existing) {
    return sendError("Scan not found", 404);
  }

  const serviceClient = createServiceClient();
  const { error: storageError } = await serviceClient.storage
    .from("scan-images")
    .remove([existing.storage_path]);

  if (storageError) {
    return sendError(storageError.message, 500);
  }

  const { error: deleteError } = await supabase
    .from("scan_images")
    .delete()
    .eq("id", imageId);

  if (deleteError) {
    return sendError(deleteError.message, 500);
  }

  return sendSuccess<null>(null, 200, { message: "Deleted." });
}
