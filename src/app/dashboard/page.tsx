"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Users, ClipboardList, Upload, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStatsCard } from "@/components/dashboard/dashboard-stats-card";
import { usePatients } from "@/hooks/use-patients";
import { useStudies } from "@/hooks/use-studies";
import { useRole } from "@/hooks/use-role";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { Skeleton } from "@/components/ui/skeleton";

function StudyStatusBar({
  pending,
  inReview,
  completed,
  total,
}: {
  pending: number;
  inReview: number;
  completed: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full rounded-full bg-muted-foreground/20" />
      </div>
    );
  }
  const pct = (n: number) => (n / total) * 100;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-l-full bg-amber-500/80 transition-all"
        style={{ width: `${pct(pending)}%` }}
      />
      <div
        className="h-full bg-blue-500/80 transition-all"
        style={{ width: `${pct(inReview)}%` }}
      />
      <div
        className="h-full rounded-r-full bg-emerald-500/80 transition-all"
        style={{ width: `${pct(completed)}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { role, isLoading: roleLoading } = useRole();
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: studies, isLoading: studiesLoading } = useStudies();

  const patientCount = patients?.length ?? 0;
  const studyCount = studies?.length ?? 0;

  const studiesByStatus = (studies ?? []).reduce(
    (acc, s) => {
      acc[s.status] += 1;
      return acc;
    },
    { pending: 0, in_review: 0, completed: 0 } as Record<string, number>
  );
  const recentStudies = (studies ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const unassignedStudies = (studies ?? []).filter((s) => !s.assigned_to);
  const inReviewStudies = (studies ?? []).filter((s) => s.status === "in_review");

  if (role === ROLES.RADIOLOGIST) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your assigned studies and report progress.
          </p>
        </div>
        <DashboardStatsCard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your clinic: patients, studies, and quick actions.
        </p>
      </div>

      {/* Main stats – clickable cards */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={ROUTES.DASHBOARD_PATIENTS}>
            <Card className="transition hover:border-primary/40 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {patientsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-semibold">{patientCount}</div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  View and manage patients
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href={ROUTES.DASHBOARD_STUDIES}>
            <Card className="transition hover:border-primary/40 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total studies
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {studiesLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-semibold">{studyCount}</div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  View and manage studies
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href={ROUTES.DASHBOARD_UPLOAD}>
            <Card className="transition hover:border-primary/40 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upload scans
                </CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-muted-foreground">
                  —
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add scan images to studies
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Studies by status – bar + counts */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Studies by status
        </h2>
        <Card>
          <CardContent className="pt-6">
            {studiesLoading ? (
              <Skeleton className="h-6 w-full rounded-full" />
            ) : (
              <>
                <StudyStatusBar
                  pending={studiesByStatus.pending}
                  inReview={studiesByStatus.in_review}
                  completed={studiesByStatus.completed}
                  total={studyCount}
                />
                <div className="mt-4 flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="text-sm text-muted-foreground">
                      Pending: {studiesByStatus.pending}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500/80" />
                    <span className="text-sm text-muted-foreground">
                      In review: {studiesByStatus.in_review}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-sm text-muted-foreground">
                      Completed: {studiesByStatus.completed}
                    </span>
                  </div>
                </div>
                <Link
                  href={ROUTES.DASHBOARD_STUDIES}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View all studies
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Two columns: Recent studies + Quick actions */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent studies */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Recent studies
          </h2>
          <Card>
            <CardContent className="pt-6">
              {studiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentStudies.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No studies yet. Create a study from the Patients or Studies
                  page.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {recentStudies.map((study) => (
                    <li key={study.id}>
                      <Link
                        href={`${ROUTES.DASHBOARD_STUDIES}/${study.id}`}
                        className="flex items-center justify-between gap-2 py-3 transition hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {study.patient_name ?? "Unknown patient"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {study.study_type_name ?? "Study"} ·{" "}
                            {format(new Date(study.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            study.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : study.status === "in_review"
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {study.status.replace("_", " ")}
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {!studiesLoading && recentStudies.length > 0 && (
                <Link
                  href={ROUTES.DASHBOARD_STUDIES}
                  className="mt-2 flex items-center justify-center gap-1 border-t border-border pt-3 text-sm font-medium text-primary hover:underline"
                >
                  View all studies
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Studies needing attention */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Studies needing attention
          </h2>
          <Card>
            <CardContent className="pt-6">
              {studiesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">
                          Unassigned studies
                        </span>
                      </div>
                      <span className="text-2xl font-semibold tabular-nums">
                        {unassignedStudies.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Assign a radiologist so reports can be completed.
                    </p>
                    {unassignedStudies.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {unassignedStudies.slice(0, 3).map((s) => (
                          <li key={s.id}>
                            <Link
                              href={`${ROUTES.DASHBOARD_STUDIES}/${s.id}`}
                              className="flex items-center justify-between gap-2 rounded-md py-1.5 pr-1 text-sm transition hover:bg-muted/60"
                            >
                              <span className="truncate">
                                {s.patient_name ?? "Unknown"} ·{" "}
                                {s.study_type_name ?? "Study"}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {unassignedStudies.length > 0 && (
                      <Link
                        href={ROUTES.DASHBOARD_STUDIES}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Assign in Studies
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        In review
                      </span>
                      <span className="text-xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                        {inReviewStudies.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Studies currently being read by a radiologist.
                    </p>
                    {inReviewStudies.length > 0 && (
                      <Link
                        href={ROUTES.DASHBOARD_STUDIES}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View in Studies
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
