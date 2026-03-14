import { requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { createClient } from "@/lib/supabase/server";
import { sendError, sendSuccess } from "@/lib/utils/api";

export async function GET() {
  const auth = await requireRole([ROLES.RADIOLOGIST]);
  if (!auth) {
    return sendError("Forbidden", 403);
  }

  const supabase = await createClient();

  const countByStatus = async (status: "pending" | "in_review" | "completed") => {
    const { count, error } = await supabase
      .from("studies")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", auth.user.id)
      .eq("status", status);
    if (error) {
      throw error;
    }
    return count ?? 0;
  };

  let pendingCount = 0;
  let inReviewCount = 0;
  let completedCount = 0;

  try {
    [pendingCount, inReviewCount, completedCount] = await Promise.all([
      countByStatus("pending"),
      countByStatus("in_review"),
      countByStatus("completed"),
    ]);
  } catch (err) {
    return sendError(err instanceof Error ? err.message : "Failed to load stats.", 500);
  }

  return sendSuccess({
    pending: pendingCount,
    in_review: inReviewCount,
    completed: completedCount,
    total: pendingCount + inReviewCount + completedCount,
  });
}
