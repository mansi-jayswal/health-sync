"use client";

import { useStudies } from "@/hooks/use-studies";
import { StudiesTable } from "@/components/dashboard/studies-table";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { CreateStudyForm } from "@/components/dashboard/create-study-form";
import { EmptyState } from "@/components/common/empty-state";
import { FolderKanban } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export function AdminStudyList() {
  const { data: studies, isLoading, isError, error } = useStudies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Studies</h1>
          <p className="text-muted-foreground">
            Create and manage imaging studies for your patients.
          </p>
        </div>
        <CreateStudyForm />
      </div>

      {isLoading && <ItemsTableSkeleton />}
      {isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Failed to load studies.")}
        </p>
      )}
      {!isLoading && !isError && studies && studies.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No studies found"
          description="Create your first study to begin organizing scans."
        />
      )}
      {!isLoading && !isError && studies && studies.length > 0 && (
        <StudiesTable studies={studies} />
      )}
    </div>
  );
}
