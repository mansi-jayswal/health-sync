import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { ROLES, type Role } from "@/constants/roles";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === "/auth/sign-in" ||
    pathname === "/auth/sign-up" ||
    pathname.startsWith("/auth/");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  const isEmailVerifiedPage = pathname === "/auth/email-verified";
  const isSetPasswordPage = pathname === "/auth/set-password";
  if (isAuthRoute && user && !isEmailVerifiedPage && !isSetPasswordPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isProtectedRoute && user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profileData?.role ?? null) as Role | null;

    const isClinicAdminOnly =
      pathname.startsWith("/dashboard/patients") ||
      pathname.startsWith("/dashboard/radiologists") ||
      pathname.startsWith("/dashboard/upload") ||
      pathname.startsWith("/dashboard/study-types");

    const isRadiologistOnly = pathname.startsWith("/dashboard/reports");

    const isStudiesRoute = pathname.startsWith("/dashboard/studies");

    if (isClinicAdminOnly && role !== ROLES.CLINIC_ADMIN) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isRadiologistOnly && role !== ROLES.RADIOLOGIST) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isStudiesRoute && role !== ROLES.CLINIC_ADMIN && role !== ROLES.RADIOLOGIST) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
