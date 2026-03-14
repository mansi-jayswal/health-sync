import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClientBase } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv, getSupabaseServiceEnv } from "./env";
import type { Database } from "@/types/database";

export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component; ignore.
          }
        },
      },
    }
  );
}

export function createServiceClient() {
  const { url, serviceKey } = getSupabaseServiceEnv();
  return createServiceClientBase<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
