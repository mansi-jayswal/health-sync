"use client";

import * as React from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StudyType } from "@/types/database";
import { updateStudyTypeSchema, type UpdateStudyTypeInput } from "@/types/schemas";
import { useDeleteStudyType, useUpdateStudyType } from "@/hooks/use-study-types";
import { getErrorMessage } from "@/lib/utils";
import { Trash2, Pencil } from "lucide-react";

type StudyTypesTableProps = {
  studyTypes: StudyType[];
};

function EditStudyTypeDialog({ studyType }: { studyType: StudyType }) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<UpdateStudyTypeInput>({
    resolver: zodResolver(updateStudyTypeSchema),
    defaultValues: { name: studyType.name },
  });

  const { mutateAsync, isPending } = useUpdateStudyType(studyType.id);

  const onSubmit = async (values: UpdateStudyTypeInput) => {
    try {
      await mutateAsync(values);
      toast.success("Study type updated.");
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update study type."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button type="button" variant="outline" size="sm" className="inline-flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit study type</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`study-type-${studyType.id}`}>Name</Label>
            <Input
              id={`study-type-${studyType.id}`}
              disabled={isPending}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <Button type="submit" loading={isPending} loadingText="Saving...">
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StudyTypeRow({ studyType }: { studyType: StudyType }) {
  const { mutateAsync, isPending } = useDeleteStudyType(studyType.id);

  return (
    <TableRow key={studyType.id}>
      <TableCell className="font-medium">{studyType.name}</TableCell>
      <TableCell>{format(new Date(studyType.created_at), "yyyy-MM-dd")}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <EditStudyTypeDialog studyType={studyType} />
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="inline-flex items-center gap-2"
                loading={isPending}
                loadingText="Deleting..."
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            }
            title="Delete this study type?"
            description="This action cannot be undone."
            onConfirm={async () => {
              try {
                await mutateAsync();
                toast.success("Study type deleted.");
              } catch (error) {
                toast.error(getErrorMessage(error, "Failed to delete study type."));
              }
            }}
            isPending={isPending}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function StudyTypesTable({ studyTypes }: StudyTypesTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studyTypes.map((studyType) => (
            <StudyTypeRow key={studyType.id} studyType={studyType} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
