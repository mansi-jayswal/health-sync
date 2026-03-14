"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/use-profile";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/types/schemas";
import { getErrorMessage } from "@/lib/utils";

type ProfileFormProps = {
  initialName: string | null;
};

export function ProfileForm({ initialName }: ProfileFormProps) {
  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: initialName ?? "" },
  });

  const { mutate, isPending } = useUpdateProfile();

  useEffect(() => {
    form.reset({ full_name: initialName ?? "" });
  }, [initialName, form]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 space-y-1">
        <h3 className="text-sm font-semibold">Personal Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your display name.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) =>
            mutate(values, {
              onSuccess: () => toast.success("Profile updated."),
              onError: (error) =>
                toast.error(getErrorMessage(error, "Failed to update profile.")),
            })
          )}
        >
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
