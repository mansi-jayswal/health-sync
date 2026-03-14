"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
};

export interface DashboardStats {
  pending: number;
  in_review: number;
  completed: number;
  total: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => apiGet<DashboardStats>("/dashboard/stats"),
  });
}
