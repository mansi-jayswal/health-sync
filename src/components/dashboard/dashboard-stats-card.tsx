"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard";

export function DashboardStatsCard() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: "Pending", value: data?.pending ?? 0, className: "text-yellow-600" },
        { label: "In Review", value: data?.in_review ?? 0, className: "text-blue-600" },
        { label: "Completed", value: data?.completed ?? 0, className: "text-green-600" },
      ].map((stat) => (
        <Link key={stat.label} href="/dashboard/studies">
          <Card className="transition hover:border-primary/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-2xl font-bold ${stat.className}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
