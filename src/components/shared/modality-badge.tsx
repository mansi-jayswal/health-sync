"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Modality = "XRAY" | "CT" | "MRI" | "US";

const MODALITY_LABELS: Record<Modality, string> = {
  XRAY: "X-Ray",
  CT: "CT",
  MRI: "MRI",
  US: "Ultrasound",
};

const MODALITY_STYLES: Record<Modality, string> = {
  XRAY: "bg-blue-100 text-blue-800",
  CT: "bg-purple-100 text-purple-800",
  MRI: "bg-indigo-100 text-indigo-800",
  US: "bg-teal-100 text-teal-800",
};

interface ModalityBadgeProps {
  modality: Modality;
}

export function ModalityBadge({ modality }: ModalityBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(MODALITY_STYLES[modality])}>
      {MODALITY_LABELS[modality]}
    </Badge>
  );
}
