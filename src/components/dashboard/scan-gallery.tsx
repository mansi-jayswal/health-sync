"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ScanUploadDialog } from "@/components/dashboard/scan-upload-dialog";
import { useDeleteScan, useStudyScans, useStudyScanSignedUrl } from "@/hooks/use-scan-images";
import { RoleGuard } from "@/components/shared/role-guard";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/utils";
import type { ScanImage } from "@/types/schemas";

interface ScanGalleryProps {
  studyId: string;
  onImageClick?: (index: number) => void;
}

function ScanThumbnail({
  studyId,
  scan,
  index,
  onImageClick,
}: {
  studyId: string;
  scan: ScanImage;
  index: number;
  onImageClick?: (index: number) => void;
}) {
  const { data, isLoading, isError } = useStudyScanSignedUrl(studyId, scan.id);
  const { mutateAsync: deleteScan, isPending: isDeleting } = useDeleteScan(studyId);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-background">
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : isError || !data?.url ? (
        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
          Failed to load
        </div>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onImageClick?.(index);
          }}
          className="block w-full"
        >
          <img
            src={data.url}
            alt={`Scan ${index + 1}`}
            className="h-32 w-full cursor-pointer object-cover"
            loading="lazy"
          />
        </button>
      )}

      <RoleGuard allowedRoles={[ROLES.CLINIC_ADMIN]}>
        <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Delete this scan?"
            description="This removes the image from storage and cannot be undone."
            onConfirm={async () => {
              try {
                await deleteScan(scan.id);
                toast.success("Scan deleted.");
              } catch (err) {
                toast.error(getErrorMessage(err, "Failed to delete scan."));
              }
            }}
            isPending={isDeleting}
          />
        </div>
      </RoleGuard>
    </div>
  );
}

export function ScanGallery({ studyId, onImageClick }: ScanGalleryProps) {
  const { data, isLoading, isError, error } = useStudyScans(studyId);
  const scans = data ?? [];
  const handleImageClick = (index: number) => {
    onImageClick?.(index);
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error, "Failed to load scans.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {scans.length === 0
            ? "No scans uploaded yet."
            : `${scans.length} scan${scans.length === 1 ? "" : "s"} uploaded`}
        </p>
        <RoleGuard allowedRoles={[ROLES.CLINIC_ADMIN]}>
          <ScanUploadDialog studyId={studyId} />
        </RoleGuard>
      </div>

      {scans.length === 0 ? (
        <RoleGuard
          allowedRoles={[ROLES.CLINIC_ADMIN]}
          fallback={
            <p className="text-sm text-muted-foreground">
              No scans have been uploaded for this study yet.
            </p>
          }
        >
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Upload scans to start building this study gallery.
          </div>
        </RoleGuard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scans.map((scan, index) => (
            <ScanThumbnail
              key={scan.id}
              studyId={studyId}
              scan={scan}
              index={index}
              onImageClick={handleImageClick}
            />
          ))}
        </div>
      )}

    </div>
  );
}
