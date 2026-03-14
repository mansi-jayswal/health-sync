import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { sendError, sendSuccess } from "@/lib/utils/api";
import { userInviteSchema } from "@/types/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const parsed = userInviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return sendError("Validation failed", 400, parsed.error.flatten());
  }

  const { email, full_name, role } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return sendError("Missing NEXT_PUBLIC_APP_URL.", 500);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/set-password`,
    data: { full_name, role },
  });

  if (error || !data?.user) {
    return sendError(error?.message ?? "Failed to send invite.", 400);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    email: data.user.email ?? email,
    full_name,
    role,
    is_active: true,
  });

  if (profileError) {
    return sendError(profileError.message, 500);
  }

  return sendSuccess({ message: "Invite sent." }, 201);
}
