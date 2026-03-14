import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getInitials, getRoleAvatarColors } from "@/lib/utils/avatar";
import type { Role } from "@/constants/roles";

type ProfileHeaderProps = {
  name: string | null;
  email: string | null;
  role: Role;
  memberSince: string | null;
  avatarUrl: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function ProfileHeader({
  name,
  email,
  role,
  memberSince,
  avatarUrl,
}: ProfileHeaderProps) {
  const initials = getInitials(name, email?.[0]?.toUpperCase() ?? "U");
  const roleLabel = role === "clinic_admin" ? "Clinic Admin" : "Radiologist";
  const memberSinceLabel = memberSince
    ? dateFormatter.format(new Date(memberSince))
    : "—";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl ?? undefined} alt={name ?? email ?? ""} />
          <AvatarFallback
            className={cn(
              "text-xl font-semibold",
              getRoleAvatarColors(role)
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold leading-none">
              {name || email || "—"}
            </p>
            <Badge
              variant="secondary"
              className={role === "radiologist" ? "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-100" : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100"}
            >
              {roleLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{email ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            Member since {memberSinceLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
