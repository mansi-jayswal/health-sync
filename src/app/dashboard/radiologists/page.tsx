"use client";

import { format } from "date-fns";
import { Users } from "lucide-react";
import { InviteUserDialog } from "@/components/dashboard/invite-user-dialog";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsersByRole } from "@/hooks/use-users";
import { getErrorMessage } from "@/lib/utils";

export default function RadiologistsPage() {
  const { data, isLoading, isError, error } = useUsersByRole("radiologist");

  if (isLoading) {
    return <ItemsTableSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getErrorMessage(error, "Failed to load radiologists.")}
      </p>
    );
  }

  const radiologists = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Radiologists</h1>
          <p className="text-sm text-muted-foreground">
            Manage radiologist access and invitations.
          </p>
        </div>
        <InviteUserDialog triggerLabel="Invite" defaultRole="radiologist" />
      </div>

      {radiologists.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No radiologists have been added yet."
          description="Invite your first radiologist to get started."
          action={<InviteUserDialog triggerLabel="Invite your first radiologist" />}
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {radiologists.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name ?? "—"}
                  </TableCell>
                  <TableCell>{user.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Radiologist</Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), "yyyy-MM-dd") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
