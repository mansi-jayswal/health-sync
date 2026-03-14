"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPostForm } from "@/lib/api/client";
import type { ScanImage } from "@/types/schemas";
import type { ScanSignedUrl } from "@/types/api";

export const scanKeys = {
  list: (studyId: string) => ["scans", studyId] as const,
  signedUrl: (studyId: string, imageId: string) =>
    ["scans", studyId, imageId, "signed-url"] as const,
};

export function useStudyScans(studyId: string) {
  return useQuery({
    queryKey: scanKeys.list(studyId),
    queryFn: () => apiGet<ScanImage[]>(`/studies/${studyId}/scans`),
    enabled: Boolean(studyId),
  });
}

export function useUploadScan(studyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiPostForm<ScanImage>(`/studies/${studyId}/scans`, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scanKeys.list(studyId) });
    },
  });
}

export function useDeleteScan(studyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      apiDelete(`/studies/${studyId}/scans/${imageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scanKeys.list(studyId) });
    },
  });
}

export function useStudyScanSignedUrl(
  studyId: string,
  imageId: string,
  options?: UseQueryOptions<ScanSignedUrl>
) {
  return useQuery({
    queryKey: scanKeys.signedUrl(studyId, imageId),
    queryFn: () =>
      apiGet<ScanSignedUrl>(`/studies/${studyId}/scans/${imageId}/signed-url`),
    enabled: Boolean(studyId && imageId),
    staleTime: 50 * 60 * 1000,
    ...options,
  });
}
