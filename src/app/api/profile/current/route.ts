import { requireAuth } from "@/lib/auth";
import { sendSuccess, sendError } from "@/lib/utils/api";
import type { CurrentUserProfile } from "@/types/api";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) {
    return sendError("Unauthorized", 401);
  }

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
