/**
 * Breadcrumb segment config keyed by pathname (exact or prefix).
 * Used by LayoutBreadcrumbs to render nav. Last segment is current page (no href).
 */
export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

/** Path pattern -> segments. First segment typically Home/Dashboard; last is current page. */
const pathSegments: Record<string, BreadcrumbSegment[]> = {
  "/": [{ label: "Home" }],
  "/dashboard": [
    { label: "Dashboard", href: "/dashboard" },
  ],
  "/dashboard/patients": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Patients" },
  ],
  "/dashboard/studies": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Studies" },
  ],
  "/dashboard/study-types": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Study Types" },
  ],
  "/dashboard/upload": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Upload Scan" },
  ],
  "/dashboard/radiologists": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Radiologists" },
  ],
  "/dashboard/reports": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reports" },
  ],
  "/dashboard/patients/": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Patients", href: "/dashboard/patients" },
  ],
  "/dashboard/studies/": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Studies", href: "/dashboard/studies" },
  ],
  "/dashboard/study-types/": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Study Types", href: "/dashboard/study-types" },
  ],
  "/profile": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Profile" },
  ],
};

/**
 * Returns breadcrumb segments for the given pathname.
 * Matches exact path first, then longest prefix.
 */
export function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  if (pathname.startsWith("/dashboard/patients/")) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Patients", href: "/dashboard/patients" },
      { label: "Patient Details" },
    ];
  }
  if (pathname.startsWith("/dashboard/studies/")) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Studies", href: "/dashboard/studies" },
      { label: "Study Details" },
    ];
  }

  if (pathSegments[pathname]) {
    return pathSegments[pathname];
  }
  const sorted = Object.keys(pathSegments)
    .filter((p) => p !== "/" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length);
  const key = sorted[0];
  const segments = key ? pathSegments[key] : undefined;
  return segments ?? [{ label: pathname.slice(1) || "Home" }];
}
