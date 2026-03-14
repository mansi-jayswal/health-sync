"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { StudyType } from "@/types/database";
import type { CreateStudyTypeInput, UpdateStudyTypeInput } from "@/types/schemas";

export function useStudyTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.studyTypes.all,
    queryFn: () => apiGet<StudyType[]>("/study-types"),
  });
}

export function useCreateStudyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStudyTypeInput) => {
      return apiPost<StudyType>("/study-types", input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyTypes.all });
    },
  });
}

export function useUpdateStudyType(studyTypeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStudyTypeInput) => {
      return apiPatch<StudyType>(`/study-types/${studyTypeId}`, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyTypes.all });
    },
  });
}

export function useDeleteStudyType(studyTypeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiDelete(`/study-types/${studyTypeId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyTypes.all });
    },
  });
}
