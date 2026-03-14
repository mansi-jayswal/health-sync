"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { ModalityBadge } from "@/components/shared/modality-badge";
import { StudyStatusBadge } from "@/components/dashboard/study-status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { useStudies, type StudyFilters } from "@/hooks/use-studies";
import { getErrorMessage } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Review", value: "in_review" },
  { label: "Completed", value: "completed" },
];

const MODALITY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "X-Ray", value: "XRAY" },
  { label: "CT", value: "CT" },
  { label: "MRI", value: "MRI" },
  { label: "Ultrasound", value: "US" },
];

export function RadiologistWorklist() {
  const [status, setStatus] = useState("all");
  const [modality, setModality] = useState("all");

  const filters: StudyFilters = {
    status: status === "all" ? undefined : (status as StudyFilters["status"]),
    modality: modality === "all" ? undefined : (modality as StudyFilters["modality"]),
  };

  const { data, isLoading, isError, error } = useStudies(filters);
  const studies = data ?? [];

  const hasFilters = status !== "all" || modality !== "all";

  if (isLoading) {
    return <ItemsTableSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error, "Failed to load worklist.")}
      </p>
    );
  }

  const resolveModality = (name?: string | null) => {
    const value = (name ?? "").toUpperCase();
    if (value.includes("CT")) return "CT";
    if (value.includes("MRI")) return "MRI";
    if (value.includes("XRAY") || value.includes("X-RAY")) return "XRAY";
    if (value.includes("US") || value.includes("ULTRASOUND")) return "US";
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Worklist</h1>
        <p className="text-sm text-muted-foreground">
          Assigned studies and report status.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={modality} onValueChange={setModality}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Modality" />
          </SelectTrigger>
          <SelectContent>
            {MODALITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStatus("all");
              setModality("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {studies.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={
            hasFilters
              ? "No studies match your filters."
              : "No studies have been assigned to you yet."
          }
          description={
            hasFilters
              ? "Try adjusting your filters."
              : "Check back when new studies are assigned."
          }
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Study Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Report</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.map((study) => (
                <TableRow key={study.id}>
                  <TableCell className="font-medium">
                    {study.patient_name ?? "Unknown"}
                  </TableCell>
                  <TableCell>
                    {resolveModality(study.study_type_name) ? (
                      <ModalityBadge
                        modality={resolveModality(study.study_type_name) ?? "US"}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(study.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StudyStatusBadge status={study.status} />
                  </TableCell>
                  <TableCell>
                    {study.report_count && study.report_count > 0 ? (
                      <span className="text-sm text-green-600">Written</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not started</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/studies/${study.id}`}>
                      <Button type="button" size="sm" variant="outline">
                        Open Study
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
