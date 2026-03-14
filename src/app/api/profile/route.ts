import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendError, sendSuccess } from "@/lib/utils/api";
import { profileUpdateSchema } from "@/types/schemas";
import type { CurrentUserProfile } from "@/types/api";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return sendError("Unauthorized", 401);

  const { user, profile } = auth;
  return sendSuccess<CurrentUserProfile>({
    user: { id: user.id, email: user.email ?? null },
    profile: profile
      ? {
          id: profile.id,
          full_name: profile.full_name ?? null,
          avatar_url: profile.avatar_url ?? null,
          role: profile.role,
          created_at: profile.created_at ?? null,
        }
      : null,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return sendError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.user.id)
    .select()
    .single();

  if (error) {
    return sendError(error.message, 500);
  }

  return sendSuccess<CurrentUserProfile>(
    {
      user: { id: auth.user.id, email: auth.user.email ?? null },
      profile: data
        ? {
            id: data.id,
            full_name: data.full_name ?? null,
            avatar_url: data.avatar_url ?? null,
            role: data.role,
            created_at: data.created_at ?? null,
          }
        : null,
    },
    200,
    { message: "Profile updated." }
  );
}
