"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { Patient } from "@/types/database";
import type { CreatePatientInput, UpdatePatientInput } from "@/types/schemas";

export function usePatients() {
  return useQuery({
    queryKey: QUERY_KEYS.patients.all,
    queryFn: () => apiGet<Patient[]>("/patients"),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patients.detail(id),
    queryFn: () => apiGet<Patient>(`/patients/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePatientInput) => {
      return apiPost<Patient>("/patients", input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
    },
  });
}

export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePatientInput) => {
      return apiPatch<Patient>(`/patients/${patientId}`, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.detail(patientId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
    },
  });
}

export function useDeletePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiDelete(`/patients/${patientId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
    },
  });
}
