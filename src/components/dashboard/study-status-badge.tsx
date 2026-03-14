"use client";

import { Badge } from "@/components/ui/badge";

type StudyStatus = "pending" | "in_review" | "completed";

const STATUS_LABELS: Record<StudyStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  completed: "Completed",
};

const STATUS_CLASSES: Record<StudyStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  in_review: "bg-blue-100 text-blue-900",
  completed: "bg-emerald-100 text-emerald-900",
};

export function StudyStatusBadge({ status }: { status: StudyStatus }) {
  return (
    <Badge className={STATUS_CLASSES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
