import type { Role } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import {
  LayoutDashboard,
  Home,
  Users,
  FolderKanban,
  Tags,
  FileText,
  Upload,
  User,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Roles that can see this item. Empty = all authenticated. */
  roles?: Role[];
}

/**
 * Sidebar navigation config. Items are shown when user's role is in `roles`.
 * Omit `roles` to show to everyone (clinic_admin + radiologist).
 */
export const sidebarNav: NavItem[] = [
  {
    label: "Home",
    href: ROUTES.HOME,
    icon: Home,
    roles: ["clinic_admin", "radiologist"],
  },
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    roles: ["clinic_admin", "radiologist"],
  },
  {
    label: "Patients",
    href: ROUTES.DASHBOARD_PATIENTS,
    icon: Users,
    roles: ["clinic_admin"],
  },
  {
    label: "Radiologists",
    href: ROUTES.DASHBOARD_RADIOLOGISTS,
    icon: Users,
    roles: ["clinic_admin"],
  },
  {
    label: "Upload Scan",
    href: ROUTES.DASHBOARD_UPLOAD,
    icon: Upload,
    roles: ["clinic_admin"],
  },
  {
    label: "Studies",
    href: ROUTES.DASHBOARD_STUDIES,
    icon: FolderKanban,
    roles: ["clinic_admin", "radiologist"],
  },
  {
    label: "Reports",
    href: ROUTES.DASHBOARD_REPORTS,
    icon: FileText,
    roles: ["radiologist"],
  },
  {
    label: "Study Types",
    href: ROUTES.DASHBOARD_STUDY_TYPES,
    icon: Tags,
    roles: ["clinic_admin"],
  },
];

export const sidebarNavFooter: NavItem[] = [
  {
    label: "Profile",
    href: ROUTES.PROFILE,
    icon: User,
    roles: ["clinic_admin", "radiologist"],
  },
];

export function getVisibleNavItems(
  items: NavItem[],
  userRole: Role
): NavItem[] {
  return items.filter(
    (item) => !item.roles || item.roles.length === 0 || item.roles.includes(userRole)
  );
}
