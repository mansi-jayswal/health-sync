"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreatePatient } from "@/hooks/use-patients";
import {
  createPatientSchema,
  type CreatePatientInput,
  PATIENT_GENDERS,
} from "@/types/schemas";
import { getErrorMessage } from "@/lib/utils";

export function CreatePatientForm() {
  const [open, setOpen] = React.useState(false);
  const form = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      name: "",
      age: 0,
      gender: "male",
    },
  });

  const { mutateAsync, isPending } = useCreatePatient();

  const onSubmit = async (values: CreatePatientInput) => {
    try {
      await mutateAsync(values);
      toast.success("Patient created.");
      form.reset({ name: "", age: 0, gender: "male" });
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create patient."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Create patient</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-name">Name</Label>
            <Input
              id="patient-name"
              placeholder="Patient name"
              disabled={isPending}
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
              placeholder="Age"
              disabled={isPending}
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
              disabled={isPending}
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

          <Button type="submit" loading={isPending} loadingText="Creating...">
            Create patient
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
