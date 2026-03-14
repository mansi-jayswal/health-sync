"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { Report, ReportCreateInput, ReportUpdateInput } from "@/types/schemas";
import type { ReportDetail, ReportListItem } from "@/types/api";

export const reportKeys = {
  byStudy: (studyId: string) => ["reports", "study", studyId] as const,
  list: (filters: { modality?: string }) => ["reports", "list", filters] as const,
};

export function useStudyReport(studyId: string) {
  return useQuery({
    queryKey: reportKeys.byStudy(studyId),
    queryFn: () => apiGet<ReportDetail | null>(`/studies/${studyId}/report`),
    enabled: Boolean(studyId),
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReportCreateInput) => apiPost<Report>("/reports", input),
    onSuccess: async (report) => {
      await qc.invalidateQueries({ queryKey: reportKeys.byStudy(report.study_id) });
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ReportUpdateInput;
    }) => apiPatch<Report>(`/reports/${id}`, data),
    onSuccess: async (report) => {
      await qc.invalidateQueries({ queryKey: reportKeys.byStudy(report.study_id) });
    },
  });
}

export function useReports(filters: { modality?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.modality) {
    params.set("modality", filters.modality);
  }
  const query = params.toString();
  const url = query ? `/reports?${query}` : "/reports";

  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => apiGet<ReportListItem[]>(url),
  });
}
