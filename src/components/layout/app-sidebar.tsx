"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  sidebarNav,
  sidebarNavFooter,
  getVisibleNavItems,
} from "@/config/nav";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getRoleAvatarColors } from "@/lib/utils/avatar";
import type { Profile } from "@/types/database";
import { ROUTES } from "@/constants/routes";
import type { Role } from "@/constants/roles";

type AppSidebarProps = {
  userRole: Role;
  collapsed: boolean;
  onToggle: () => void;
  profile: Profile | null;
  userEmail: string | null;
};

export function AppSidebar({
  userRole,
  collapsed,
  onToggle,
  profile,
  userEmail,
}: AppSidebarProps) {
  const pathname = usePathname();
  const mainItems = getVisibleNavItems(sidebarNav, userRole);
  const footerItems = getVisibleNavItems(sidebarNavFooter, userRole);
  const displayName = profile?.full_name ?? userEmail ?? "User";
  const roleLabel = userRole === "radiologist" ? "Radiologist" : "Clinic Admin";
  const initials = getInitials(displayName);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[3.25rem]" : "w-56"
      )}
    >
      <div className="flex flex-1 flex-col gap-1 overflow-hidden p-2">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
      {footerItems.length > 0 && (
        <div className="border-t border-sidebar-border p-2">
          {footerItems.map((item) => {
            const isActive = pathname === item.href;
            const isProfile = item.href === ROUTES.PROFILE;
            if (isProfile) {
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  title={collapsed ? displayName : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                    collapsed ? "justify-center px-2" : "px-3",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={profile?.avatar_url ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className={getRoleAvatarColors(userRole)}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {roleLabel}
                      </span>
                    </div>
                  )}
                </Link>
              );
            }
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      )}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "h-9 w-9 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            collapsed && "w-full"
          )}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
