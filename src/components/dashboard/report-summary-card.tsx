"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModalityBadge } from "@/components/shared/modality-badge";
import { StudyStatusBadge } from "@/components/dashboard/study-status-badge";
import { relativeTime } from "@/lib/utils/date";
import type { ReportListItem } from "@/types/api";

interface ReportSummaryCardProps {
  report: ReportListItem;
}

export function ReportSummaryCard({ report }: ReportSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{report.study.patient.full_name}</p>
            <p className="text-xs text-muted-foreground">
              Study: {new Date(report.study.study_date).toLocaleDateString()} · Updated:{" "}
              {relativeTime(report.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ModalityBadge modality={report.study.modality} />
            <StudyStatusBadge status={report.study.status} />
          </div>
        </div>

        {!expanded ? (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Impression: </span>
            <span className={report.impression ? "line-clamp-2" : ""}>
              {report.impression || "No impression written yet."}
            </span>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Findings</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {report.findings || "No findings written yet."}
              </p>
            </div>
            <div>
              <p className="font-medium">Impression</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {report.impression || "No impression written yet."}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Link href={`/dashboard/studies/${report.study.id}`}>
            <Button type="button" variant="outline" size="sm">
              Open Study
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
