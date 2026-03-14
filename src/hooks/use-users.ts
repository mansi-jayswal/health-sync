"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { PaginatedResponse, UserListItem, RadiologistListItem } from "@/types/api";
import type { Profile } from "@/types/database";
import type { UserInviteInput } from "@/types/schemas";
import { getErrorMessage } from "@/lib/utils";

export type UseUsersParams = {
  page?: number;
  limit?: number;
};

export function useUsers(params: UseUsersParams = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  return useQuery({
    queryKey: [QUERY_KEYS.users.all, { page, limit }],
    queryFn: async () => {
      const search = new URLSearchParams();
      search.set("page", String(page));
      search.set("limit", String(limit));
      const data = await apiGet<PaginatedResponse<UserListItem>>(
        `/users?${search.toString()}`
      );
      return data;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; role: UserListItem["role"] }) => {
      return apiPatch<UserListItem>(`/users/${input.id}/role`, {
        role: input.role,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
    onError: (error: unknown) => {
      // Surface error via generic handler; UI components can also handle directly.
      console.error(getErrorMessage(error));
    },
  });
}

export function useRadiologists() {
  return useQuery({
    queryKey: ["users", "radiologists"],
    queryFn: () => apiGet<RadiologistListItem[]>("/users?role=radiologist"),
  });
}

export function useUsersByRole(role: "clinic_admin" | "radiologist") {
  return useQuery({
    queryKey: [QUERY_KEYS.users.all, { role }],
    queryFn: () => apiGet<Profile[]>(`/users?role=${role}`),
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInviteInput) =>
      apiPost<{ message: string }>("/users/invite", input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
}
