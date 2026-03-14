"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPatch, apiPostForm } from "@/lib/api/client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ProfileUpdateInput } from "@/types/schemas";
import type { CurrentUserProfile } from "@/types/api";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) =>
      apiPatch<CurrentUserProfile>("/profile", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile.current });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiPostForm<{ avatar_url: string }>("/profile/avatar", formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile.current });
    },
  });
}
