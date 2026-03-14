"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { useCreateStudyType } from "@/hooks/use-study-types";
import { createStudyTypeSchema, type CreateStudyTypeInput } from "@/types/schemas";
import { getErrorMessage } from "@/lib/utils";

export function CreateStudyTypeForm() {
  const [open, setOpen] = React.useState(false);
  const form = useForm<CreateStudyTypeInput>({
    resolver: zodResolver(createStudyTypeSchema),
    defaultValues: { name: "" },
  });

  const { mutateAsync, isPending } = useCreateStudyType();

  const onSubmit = async (values: CreateStudyTypeInput) => {
    try {
      await mutateAsync(values);
      toast.success("Study type created.");
      form.reset({ name: "" });
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create study type."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Create study type</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create study type</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="study-type-name">Name</Label>
            <Input
              id="study-type-name"
              placeholder="e.g. CT, MRI, Ultrasound"
              disabled={isPending}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <Button type="submit" loading={isPending} loadingText="Creating...">
            Create study type
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
