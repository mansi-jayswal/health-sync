import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { sendError, sendSuccess } from "@/lib/utils/api";
import { ROLES } from "@/constants/roles";
import type { ScanImage } from "@/types/schemas";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

  const { id: studyId } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_images")
    .select("id, study_id, file_name, file_size, mime_type, uploaded_by, created_at")
    .eq("study_id", studyId)
    .order("created_at", { ascending: true });

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<ScanImage[]>((data ?? []) as ScanImage[]);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const { id: studyId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return sendError("File is required.", 400);
  }

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return sendError("Only JPG and PNG files are allowed.", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return sendError("File exceeds 10 MB limit.", 400);
  }

  const supabase = await createClient();
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id")
    .eq("id", studyId)
    .single();

  if (studyError || !study) {
    if (studyError?.code === "PGRST116") {
      return sendError("Study not found", 404);
    }
    return sendError(studyError?.message ?? "Study not found", 404);
  }

  const imageId = crypto.randomUUID();
  const extension = file.type === "image/png" ? "png" : "jpg";
  const storagePath = `${studyId}/${imageId}.${extension}`;

  const serviceClient = createServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from("scan-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return sendError(uploadError.message, 500);
  }

  const { data, error } = await supabase
    .from("scan_images")
    .insert({
      id: imageId,
      study_id: studyId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: auth.user.id,
    })
    .select("id, study_id, file_name, file_size, mime_type, uploaded_by, created_at")
    .single();

  if (error) {
    await serviceClient.storage.from("scan-images").remove([storagePath]);
    return sendError(error.message, 500);
  }

  return sendSuccess<ScanImage>(data as ScanImage, 201, {
    message: "Scan uploaded.",
  });
}
