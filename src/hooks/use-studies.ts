"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { Study } from "@/types/database";
import type { CreateStudyInput, StudyUpdateInput } from "@/types/schemas";

export type StudyWithPatient = Study & {
  patient_name?: string | null;
  study_type_name?: string | null;
  assigned_to_name?: string | null;
  report_count?: number;
};

export type StudyFilters = {
  status?: "pending" | "in_review" | "completed";
  modality?: "XRAY" | "CT" | "MRI" | "US";
};

export function useStudies(filters: StudyFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.modality) {
    params.set("modality", filters.modality);
  }
  const query = params.toString();
  const url = query ? `/studies?${query}` : "/studies";

  return useQuery({
    queryKey: [QUERY_KEYS.studies.all, filters],
    queryFn: () => apiGet<StudyWithPatient[]>(url),
  });
}

export function usePatientStudies(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.studies.byPatient(patientId),
    queryFn: () => apiGet<StudyWithPatient[]>(`/studies?patientId=${patientId}`),
    enabled: Boolean(patientId),
  });
}

export function useStudy(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.studies.detail(id),
    queryFn: () => apiGet<Study>(`/studies/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateStudy(inputPatientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStudyInput) => {
      return apiPost<Study>("/studies", input);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studies.all });
      const patientId = inputPatientId ?? data.patient_id;
      if (patientId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.studies.byPatient(patientId),
        });
      }
    },
  });
}

export function useUpdateStudy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: StudyUpdateInput;
    }) => {
      return apiPatch<Study>(`/studies/${id}`, data);
    },
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studies.detail(id) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studies.all });
      await queryClient.invalidateQueries({ queryKey: ["studies", "patient"] });
    },
  });
}

export function useDeleteStudy(studyId: string, patientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiDelete(`/studies/${studyId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studies.all });
      if (patientId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.studies.byPatient(patientId),
        });
      }
    },
  });
}
