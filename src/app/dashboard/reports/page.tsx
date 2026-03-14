"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ReportSummaryCard } from "@/components/dashboard/report-summary-card";
import { useReports } from "@/hooks/use-reports";
import { getErrorMessage } from "@/lib/utils";
import { FileText } from "lucide-react";

const MODALITY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "X-Ray", value: "XRAY" },
  { label: "CT", value: "CT" },
  { label: "MRI", value: "MRI" },
  { label: "Ultrasound", value: "US" },
];

export default function ReportsPage() {
  const [modality, setModality] = useState("all");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useReports({
    modality: modality === "all" ? undefined : modality,
  });

  const reports = data ?? [];
  const query = search.trim().toLowerCase();
  const filtered =
    query.length === 0
      ? reports
      : reports.filter((report) =>
          report.study.patient.full_name.toLowerCase().includes(query)
        );

  if (isLoading) {
    return <ItemsTableSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error, "Failed to load reports.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Reports</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} report{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={modality} onValueChange={setModality}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by modality" />
          </SelectTrigger>
          <SelectContent>
            {MODALITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by patient name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-[240px]"
        />
        {(modality !== "all" || search) && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setModality("all");
              setSearch("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            data && data.length > 0
              ? "No reports match your search."
              : "You haven't written any reports yet."
          }
          description={
            data && data.length > 0
              ? "Try adjusting your filters."
              : "Open a study to get started."
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => (
            <ReportSummaryCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
