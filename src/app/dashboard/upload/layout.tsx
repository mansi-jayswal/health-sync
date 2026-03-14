import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/constants/roles";

export default async function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireRole([ROLES.CLINIC_ADMIN]);
  if (!auth) {
    redirect("/dashboard");
  }

  return children;
}
