"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { userInviteSchema, type UserInviteInput } from "@/types/schemas";
import { useInviteUser } from "@/hooks/use-users";
import { getErrorMessage } from "@/lib/utils";

interface InviteUserDialogProps {
  triggerLabel?: string;
  defaultRole?: "clinic_admin" | "radiologist";
}

export function InviteUserDialog({
  triggerLabel = "Invite",
  defaultRole = "radiologist",
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: inviteUser, isPending } = useInviteUser();

  const form = useForm<UserInviteInput>({
    resolver: zodResolver(userInviteSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: defaultRole,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset({ full_name: "", email: "", role: defaultRole });
        }
      }}
    >
      <DialogTrigger>
        <Button type="button">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Send an invite to set up an account with the correct role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await inviteUser(values);
                toast.success(`Invite sent to ${values.email}.`);
                setOpen(false);
              } catch (err) {
                toast.error(getErrorMessage(err, "Failed to send invite."));
              }
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="dr@clinic.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="radiologist">Radiologist</SelectItem>
                      <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isPending} loadingText="Sending...">
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
