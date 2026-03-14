import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendError, sendSuccess } from "@/lib/utils/api";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return sendError("Unauthorized", 401);

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return sendError("File is required.", 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return sendError("Only PNG or JPEG images are allowed.", 400);
  }

  if (file.size > MAX_SIZE_BYTES) {
    return sendError("File too large (max 5MB).", 400);
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? (file.type === "image/png" ? "png" : "jpg");
  const path = `${auth.user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return sendError(uploadError.message, 500);
  }

  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = publicData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);

  if (updateError) {
    return sendError(updateError.message, 500);
  }

  return sendSuccess({ avatar_url: avatarUrl }, 200, { message: "Avatar updated." });
}
