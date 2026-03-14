"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { CreateStudyForm } from "@/components/dashboard/create-study-form";
import { StudiesTable } from "@/components/dashboard/studies-table";
import {
  createPatientSchema,
  PATIENT_GENDERS,
  type CreatePatientInput,
} from "@/types/schemas";
import { useDeletePatient, usePatient, useUpdatePatient } from "@/hooks/use-patients";
import { getErrorMessage } from "@/lib/utils";
import { Trash2, FolderKanban } from "lucide-react";
import { usePatientStudies } from "@/hooks/use-studies";
import { EmptyState } from "@/components/common/empty-state";

export default function PatientDetailsPage() {
  const params = useParams<{ id: string }>();
  const patientId = params?.id ?? "";
  const router = useRouter();
  const { data: patient, isLoading, isError, error } = usePatient(patientId);
  const { data: studies, isLoading: studiesLoading } = usePatientStudies(patientId);
  const { mutateAsync: updatePatient, isPending: isUpdating } = useUpdatePatient(patientId);
  const { mutateAsync: deletePatient, isPending: isDeleting } = useDeletePatient(patientId);

  const form = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: patient
      ? {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
        }
      : {
          name: "",
          age: 0,
          gender: "male",
        },
    values: patient
      ? {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
        }
      : undefined,
  });

  if (isLoading) {
    return <ItemsTableSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error, "Failed to load patient details.")}
      </p>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Patient Details</h1>
        <p className="text-sm text-muted-foreground">Patient not found.</p>
        <Link href="/dashboard/patients">
          <Button variant="outline">Back to patients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patient Details</h1>
        <Link href="/dashboard/patients">
          <Button variant="outline">Back to patients</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit patient</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await updatePatient(values);
                toast.success("Patient updated.");
              } catch (err) {
                toast.error(getErrorMessage(err, "Failed to update patient."));
              }
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="patient-name">Name</Label>
              <Input
                id="patient-name"
                disabled={isUpdating}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-age">Age</Label>
              <Input
                id="patient-age"
                type="number"
                min={0}
                disabled={isUpdating}
                {...form.register("age", { valueAsNumber: true })}
              />
              {form.formState.errors.age && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.age.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={form.watch("gender")}
                onValueChange={(value) =>
                  form.setValue("gender", value as CreatePatientInput["gender"], {
                    shouldValidate: true,
                  })
                }
                className="flex flex-wrap gap-4"
                disabled={isUpdating}
              >
                {PATIENT_GENDERS.map((gender) => (
                  <label
                    key={gender}
                    className="flex items-center gap-2 text-sm capitalize"
                  >
                    <RadioGroupItem value={gender} />
                    {gender}
                  </label>
                ))}
              </RadioGroup>
              {form.formState.errors.gender && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.gender.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-between">
              <Button type="submit" loading={isUpdating} loadingText="Saving...">
                Save changes
              </Button>
              <ConfirmDialog
                trigger={
                  <Button
                    type="button"
                    variant="destructive"
                    loading={isDeleting}
                    loadingText="Deleting..."
                    className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete patient
                  </Button>
                }
                title="Delete this patient?"
                description="This action cannot be undone."
                onConfirm={async () => {
                  try {
                    await deletePatient();
                    toast.success("Patient deleted.");
                    router.push("/dashboard/patients");
                  } catch (err) {
                    toast.error(getErrorMessage(err, "Failed to delete patient."));
                  }
                }}
                isPending={isDeleting}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Created at:</span>{" "}
            {new Date(patient.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Studies</CardTitle>
            <p className="text-sm text-muted-foreground">
              Studies linked to this patient.
            </p>
          </div>
          <CreateStudyForm patientId={patient.id} />
        </CardHeader>
        <CardContent>
          {studiesLoading && <ItemsTableSkeleton />}
          {!studiesLoading && (!studies || studies.length === 0) && (
            <EmptyState
              icon={FolderKanban}
              title="No studies yet"
              description="Create a study for this patient to get started."
            />
          )}
          {!studiesLoading && studies && studies.length > 0 && (
            <StudiesTable studies={studies} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
