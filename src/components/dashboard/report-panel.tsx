"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/hooks/use-role";
import { useCreateReport, useStudyReport, useUpdateReport } from "@/hooks/use-reports";
import { reportUpdateSchema, type ReportUpdateInput } from "@/types/schemas";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/utils";
import { relativeTime } from "@/lib/utils/date";

interface ReportPanelProps {
  studyId: string;
}

export function ReportPanel({ studyId }: ReportPanelProps) {
  const { role, isLoading: roleLoading } = useRole();
  const { data: report, isLoading, isError, error } = useStudyReport(studyId);
  const { mutateAsync: createReport, isPending: isCreating } = useCreateReport();
  const { mutateAsync: updateReport, isPending: isSaving } = useUpdateReport();
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ReportUpdateInput>({
    resolver: zodResolver(reportUpdateSchema),
    defaultValues: {
      findings: report?.findings ?? "",
      impression: report?.impression ?? "",
    },
    values: report
      ? { findings: report.findings, impression: report.impression }
      : undefined,
  });

  useEffect(() => {
    if (report?.updated_at) {
      setLastSavedAt(report.updated_at);
    }
  }, [report?.updated_at]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (!report || role !== ROLES.RADIOLOGIST) return;
      if (!form.formState.isDirty) return;
      setHasPendingChanges(true);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const values = form.getValues();
          const updated = await updateReport({ id: report.id, data: values });
          setLastSavedAt(updated.updated_at);
          setHasPendingChanges(false);
          form.reset(values);
        } catch {
          setHasPendingChanges(true);
        }
      }, 3000);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [form, report, role, updateReport]);

  if (isLoading || roleLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {getErrorMessage(error, "Failed to load report.")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (role === ROLES.RADIOLOGIST) {
    if (!report) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">No report written yet.</p>
            <Button
              type="button"
              onClick={async () => {
                try {
                  await createReport({ study_id: studyId, findings: "", impression: "" });
                  toast.success("Report started.");
                } catch (err) {
                  toast.error(getErrorMessage(err, "Failed to create report."));
                }
              }}
              loading={isCreating}
              loadingText="Starting..."
            >
              Start Report
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={form.handleSubmit(async (values) => {
              try {
                const updated = await updateReport({ id: report.id, data: values });
                setLastSavedAt(updated.updated_at);
                setHasPendingChanges(false);
                toast.success("Report saved.");
              } catch (err) {
                toast.error(getErrorMessage(err, "Failed to save report."));
              }
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium">Findings</p>
              <Textarea
                rows={6}
                placeholder="Write findings..."
                {...form.register("findings")}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Impression</p>
              <Textarea
                rows={4}
                placeholder="Write impression..."
                {...form.register("impression")}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {hasPendingChanges
                  ? "Unsaved changes"
                  : lastSavedAt
                    ? `Last saved: ${relativeTime(lastSavedAt)}`
                    : "Not saved yet"}
              </div>
              <Button type="submit" loading={isSaving} loadingText="Saving...">
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No report has been written for this study yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Findings</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.findings || "No findings written yet."}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Impression</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.impression || "No impression written yet."}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Written by: {report.author_name ?? report.author_email ?? "Unknown"}
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {relativeTime(report.updated_at)}
        </div>
      </CardContent>
    </Card>
  );
}
