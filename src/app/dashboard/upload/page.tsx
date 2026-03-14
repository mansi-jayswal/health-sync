"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { ScanUploadDialog } from "@/components/dashboard/scan-upload-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useStudies } from "@/hooks/use-studies";
import { getErrorMessage } from "@/lib/utils";

export default function UploadScansPage() {
  const { data: studies, isLoading, isError, error } = useStudies();

  if (isLoading) {
    return <ItemsTableSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error, "Failed to load studies.")}
      </p>
    );
  }

  if (!studies || studies.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Upload Scans</h1>
        <p className="text-sm text-muted-foreground">
          No studies available yet. Create a study to upload scans.
        </p>
        <Link href="/dashboard/studies">
          <Button variant="outline">Go to studies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Upload Scans</h1>
          <p className="text-sm text-muted-foreground">
            Upload scan images for an existing study.
          </p>
        </div>
        <Link href="/dashboard/studies">
          <Button variant="outline">Manage studies</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Study type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Upload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studies.map((study) => (
              <TableRow key={study.id}>
                <TableCell>
                  {study.patient_name ? (
                    <span className="font-medium">{study.patient_name}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/studies/${study.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {study.study_type_name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {study.description ?? "—"}
                </TableCell>
                <TableCell>{format(new Date(study.created_at), "yyyy-MM-dd")}</TableCell>
                <TableCell className="text-right">
                  <ScanUploadDialog studyId={study.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
