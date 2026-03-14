"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStatsCard } from "@/components/dashboard/dashboard-stats-card";
import { usePatients } from "@/hooks/use-patients";
import { useStudies } from "@/hooks/use-studies";
import { useRole } from "@/hooks/use-role";
import { ROLES } from "@/constants/roles";

export default function DashboardPage() {
  const { role } = useRole();
  const { data: patients } = usePatients();
  const { data: studies } = useStudies();
  const patientCount = patients?.length ?? 0;
  const studyCount = studies?.length ?? 0;

  return (
    <div className="space-y-6">
      {role === ROLES.RADIOLOGIST ? (
        <DashboardStatsCard />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{patientCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total studies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{studyCount}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
