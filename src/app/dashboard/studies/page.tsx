"use client";

import { useRole } from "@/hooks/use-role";
import { ROLES } from "@/constants/roles";
import { AdminStudyList } from "@/components/dashboard/admin-study-list";
import { RadiologistWorklist } from "@/components/dashboard/radiologist-worklist";

export default function StudiesPage() {
  const { role, isLoading } = useRole();

  if (isLoading || !role) {
    return null;
  }

  return role === ROLES.CLINIC_ADMIN ? <AdminStudyList /> : <RadiologistWorklist />;
}
