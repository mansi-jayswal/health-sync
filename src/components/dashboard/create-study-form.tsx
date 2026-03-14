"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateStudy } from "@/hooks/use-studies";
import { PatientCombobox } from "@/components/shared/patient-combobox";
import { StudyTypeSelect } from "@/components/shared/study-type-select";
import { useStudyTypes } from "@/hooks/use-study-types";
import Link from "next/link";
import { createStudySchema, type CreateStudyInput } from "@/types/schemas";
import { getErrorMessage } from "@/lib/utils";

type CreateStudyFormProps = {
  patientId?: string;
};

export function CreateStudyForm({ patientId }: CreateStudyFormProps) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<CreateStudyInput>({
    resolver: zodResolver(createStudySchema),
    defaultValues: {
      patient_id: patientId ?? "",
      study_type_id: "",
      description: "",
    },
  });

  React.useEffect(() => {
    if (patientId) {
      form.setValue("patient_id", patientId, { shouldValidate: true });
    }
  }, [patientId, form]);

  const { mutateAsync, isPending } = useCreateStudy(patientId);

  const onSubmit = async (values: CreateStudyInput) => {
    try {
      await mutateAsync(values);
      toast.success("Study created.");
      form.reset({
        patient_id: patientId ?? "",
        study_type_id: "",
        description: "",
      });
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create study."));
    }
  };

  const { data: studyTypes, isLoading: typesLoading } = useStudyTypes();
  const hasStudyTypes = (studyTypes?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Create study</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create study</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!patientId && (
            <div className="space-y-2">
              <Label htmlFor="study-patient">Patient name</Label>
              <Controller
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <PatientCombobox
                    id="study-patient"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                    placeholder="Search patient"
                    ariaInvalid={Boolean(form.formState.errors.patient_id)}
                  />
                )}
              />
              {form.formState.errors.patient_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.patient_id.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="study-type">Study type</Label>
            <Controller
              control={form.control}
              name="study_type_id"
              render={({ field }) => (
                <StudyTypeSelect
                  studyTypes={studyTypes}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending || typesLoading}
                />
              )}
            />
            {form.formState.errors.study_type_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.study_type_id.message}
              </p>
            )}
            {!typesLoading && !hasStudyTypes && (
              <p className="text-sm text-muted-foreground">
                No study types yet.{" "}
                <Link
                  href="/dashboard/study-types"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Create one
                </Link>
                .
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-description">Description</Label>
            <Input
              id="study-description"
              placeholder="Optional notes about the study"
              disabled={isPending}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            loading={isPending}
            loadingText="Creating..."
            disabled={!hasStudyTypes || isPending}
          >
            Create study
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
