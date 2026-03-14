"use client";

import { useStudyTypes } from "@/hooks/use-study-types";
import { StudyTypesTable } from "@/components/dashboard/study-types-table";
import { CreateStudyTypeForm } from "@/components/dashboard/create-study-type-form";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { Tags } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export default function StudyTypesPage() {
  const { data: studyTypes, isLoading, isError, error } = useStudyTypes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Study Types</h1>
          <p className="text-muted-foreground">
            Manage the list of study types available for studies.
          </p>
        </div>
        <CreateStudyTypeForm />
      </div>

      {isLoading && <ItemsTableSkeleton />}
      {isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Failed to load study types.")}
        </p>
      )}
      {!isLoading && !isError && studyTypes && studyTypes.length === 0 && (
        <EmptyState
          icon={Tags}
          title="No study types found"
          description="Create your first study type to start creating studies."
        />
      )}
      {!isLoading && !isError && studyTypes && studyTypes.length > 0 && (
        <StudyTypesTable studyTypes={studyTypes} />
      )}
    </div>
  );
}
