"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useUploadAvatar } from "@/hooks/use-profile";
import { getInitials, getRoleAvatarColors } from "@/lib/utils/avatar";
import { getErrorMessage } from "@/lib/utils";
import type { Role } from "@/constants/roles";

type AvatarUploaderProps = {
  currentUrl: string | null;
  name: string | null;
  role: Role;
};

export function AvatarUploader({ currentUrl, name, role }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { mutate, isPending } = useUploadAvatar();

  const handleSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    mutate(file, {
      onSuccess: () => {
        toast.success("Avatar updated.");
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Failed to upload avatar."));
        setPreviewUrl(null);
      },
    });
  };

  const initials = getInitials(name);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 space-y-1">
        <h3 className="text-sm font-semibold">Avatar</h3>
        <p className="text-sm text-muted-foreground">
          Upload a square PNG or JPG (max 5MB).
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={previewUrl ?? currentUrl ?? undefined}
            alt={name ?? ""}
          />
          <AvatarFallback
            className={getRoleAvatarColors(role)}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleSelect} disabled={isPending}>
              {isPending ? "Uploading..." : "Change avatar"}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended size: 256×256.
          </p>
        </div>
      </div>
    </div>
  );
}
