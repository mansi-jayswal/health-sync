"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRadiologists } from "@/hooks/use-users";
import { useUpdateStudy } from "@/hooks/use-studies";
import { getErrorMessage } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AssignRadiologistDialogProps = {
  studyId: string;
  currentAssigneeId: string | null;
};

export function AssignRadiologistDialog({
  studyId,
  currentAssigneeId,
}: AssignRadiologistDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(currentAssigneeId);
  const { data: radiologists, isLoading } = useRadiologists();
  const { mutateAsync, isPending } = useUpdateStudy();

  React.useEffect(() => {
    if (open) {
      setSelectedId(currentAssigneeId);
    }
  }, [open, currentAssigneeId]);

  const onSubmit = async () => {
    try {
      await mutateAsync({
        id: studyId,
        data: { assigned_to: selectedId ?? null },
      });
      toast.success("Radiologist assigned.");
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to assign radiologist."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button type="button" variant="outline" size="sm">
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign radiologist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Radiologist</label>
            <Select
              value={selectedId ?? "__unassigned__"}
              onValueChange={(value) => {
                setSelectedId(value === "__unassigned__" ? null : value);
              }}
              disabled={isLoading || isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a radiologist">
                  {selectedId
                    ? radiologists?.find((u) => u.id === selectedId)?.full_name ??
                      radiologists?.find((u) => u.id === selectedId)?.email ??
                      "Radiologist"
                    : "Select a radiologist"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {(radiologists ?? []).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name ?? user.email ?? "Radiologist"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => void onSubmit()}
              loading={isPending}
              loadingText="Saving..."
            >
              Save assignment
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
