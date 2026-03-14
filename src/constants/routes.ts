export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/auth/sign-in",
  SIGN_UP: "/auth/sign-up",
  EMAIL_VERIFIED: "/auth/email-verified",
  SET_PASSWORD: "/auth/set-password",
  DASHBOARD: "/dashboard",
  DASHBOARD_PATIENTS: "/dashboard/patients",
  DASHBOARD_RADIOLOGISTS: "/dashboard/radiologists",
  DASHBOARD_STUDIES: "/dashboard/studies",
  DASHBOARD_STUDY_TYPES: "/dashboard/study-types",
  DASHBOARD_UPLOAD: "/dashboard/upload",
  DASHBOARD_REPORTS: "/dashboard/reports",
  PROFILE: "/profile",
} as const;

export type RouteKey = keyof typeof ROUTES;
