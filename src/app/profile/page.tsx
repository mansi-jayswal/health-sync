"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileSkeleton } from "@/components/dashboard/profile-skeleton";
import { getErrorMessage } from "@/lib/utils";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { data, isLoading, isError, error } = useCurrentUser();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error, "Failed to load profile.")}
      </p>
    );
  }

  if (!data?.user) {
    return null;
  }

  const { user, profile } = data;
  const roleLabel =
    profile?.role === "radiologist" ? "Radiologist" : "Clinic Admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">
          Your account details.
        </p>
      </div>

      <div className="space-y-4">
        <ProfileHeader
          name={profile?.full_name ?? null}
          email={user.email ?? null}
          role={profile?.role ?? "clinic_admin"}
          memberSince={profile?.created_at ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProfileForm initialName={profile?.full_name ?? ""} />
          </div>
          <AvatarUploader
            currentUrl={profile?.avatar_url ?? null}
            name={profile?.full_name ?? user.email ?? null}
            role={profile?.role ?? "clinic_admin"}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Account</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">
                {roleLabel}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
