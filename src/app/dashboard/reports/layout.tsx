import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireRole([ROLES.RADIOLOGIST]);
  if (!auth) {
    redirect("/dashboard");
  }

  return children;
}
