"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUploadScan } from "@/hooks/use-scan-images";
import { getErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;

type UploadStatus = "pending" | "uploading" | "success" | "error";

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
};

interface ScanUploadDialogProps {
  studyId: string;
  triggerLabel?: string;
}

function formatFileSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export function ScanUploadDialog({
  studyId,
  triggerLabel = "Upload Scans",
}: ScanUploadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { mutateAsync: uploadScan } = useUploadScan(studyId);

  const resetState = React.useCallback(() => {
    setItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const validateFile = React.useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return "Only JPG and PNG files are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File exceeds 10 MB limit.";
    }
    return undefined;
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const mapped = selected.map((file) => {
      const error = validateFile(file);
      return {
        id: crypto.randomUUID(),
        file,
        status: error ? "error" : "pending",
        error,
      } as UploadItem;
    });
    setItems(mapped);
  };

  const updateItem = React.useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const handleUpload = async () => {
    if (items.length === 0) return;
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      if (item.status === "error") {
        errorCount += 1;
        continue;
      }

      updateItem(item.id, { status: "uploading", error: undefined });
      try {
        await uploadScan(item.file);
        updateItem(item.id, { status: "success" });
        successCount += 1;
      } catch (err) {
        updateItem(item.id, {
          status: "error",
          error: getErrorMessage(err, "Failed to upload scan."),
        });
        errorCount += 1;
      }
    }

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} scan${successCount === 1 ? "" : "s"}.`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} scan${errorCount === 1 ? "" : "s"} failed to upload.`);
      return;
    }

    setOpen(false);
    resetState();
  };

  const isUploading = items.some((item) => item.status === "uploading");
  const hasValidFiles = items.some((item) => item.status !== "error");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload scans</DialogTitle>
          <DialogDescription>
            Upload JPG or PNG images (max 10 MB each). Files are uploaded one at a time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="scan-files">Select files</Label>
            <Input
              id="scan-files"
              type="file"
              multiple
              accept="image/jpeg,image/png"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.file.size)}
                    </p>
                    {item.error && (
                      <p className="text-xs text-destructive">{item.error}</p>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      item.status === "success" && "bg-green-100 text-green-800",
                      item.status === "error" && "bg-red-100 text-red-800",
                      item.status === "uploading" && "bg-yellow-100 text-yellow-800"
                    )}
                    variant="secondary"
                  >
                    {item.status === "pending" && "Pending"}
                    {item.status === "uploading" && "Uploading"}
                    {item.status === "success" && "Uploaded"}
                    {item.status === "error" && "Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!hasValidFiles || isUploading}
            loading={isUploading}
            loadingText="Uploading..."
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
