"use client";

import { toast } from "sonner";
import { useUpdateStudy } from "@/hooks/use-studies";
import { getErrorMessage } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StudyStatus = "pending" | "in_review" | "completed";

const STATUS_OPTIONS: { value: StudyStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
];

function isTransitionAllowed(current: StudyStatus, next: StudyStatus) {
  if (current === next) return true;
  if (current === "pending" && next === "in_review") return true;
  if (current === "in_review" && next === "completed") return true;
  if (current === "completed" && next === "in_review") return true;
  return false;
}

export function StudyStatusControl({
  studyId,
  currentStatus,
}: {
  studyId: string;
  currentStatus: StudyStatus;
}) {
  const { mutateAsync, isPending } = useUpdateStudy();

  return (
    <Select
      value={currentStatus}
      disabled={isPending}
      onValueChange={async (value) => {
        const next = value as StudyStatus;
        try {
          await mutateAsync({ id: studyId, data: { status: next } });
          toast.success("Status updated.");
        } catch (error) {
          toast.error(getErrorMessage(error, "Invalid status transition."));
        }
      }}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={!isTransitionAllowed(currentStatus, option.value)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
