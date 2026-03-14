"use client";

import { EmptyState } from "@/components/common/empty-state";
import { CreatePatientForm } from "@/components/dashboard/create-patient-form";
import { PatientsTable } from "@/components/dashboard/patients-table";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { Users } from "lucide-react";
import { usePatients } from "@/hooks/use-patients";
import { getErrorMessage } from "@/lib/utils";

export default function PatientsPage() {
  const { data: patients, isLoading, isError, error } = usePatients();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground">
            Create and manage patient records for upcoming studies and scan uploads.
          </p>
        </div>
        <CreatePatientForm />
      </div>

      {isLoading && <ItemsTableSkeleton />}

      {isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Failed to load patients.")}
        </p>
      )}

      {!isLoading && !isError && patients && patients.length === 0 && (
        <EmptyState
          icon={Users}
          title="No patients found"
          description="Create your first patient to start managing studies."
        />
      )}

      {!isLoading && !isError && patients && patients.length > 0 && (
        <PatientsTable patients={patients} />
      )}
    </div>
  );
}
