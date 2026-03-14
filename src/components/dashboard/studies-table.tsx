"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { StudyWithPatient } from "@/hooks/use-studies";
import { StudyStatusBadge } from "@/components/dashboard/study-status-badge";
import { StudyStatusControl } from "@/components/dashboard/study-status-control";
import { AssignRadiologistDialog } from "@/components/dashboard/assign-radiologist-dialog";
import { RoleGuard } from "@/components/shared/role-guard";
import { ROLES } from "@/constants/roles";

type StudiesTableProps = {
  studies: StudyWithPatient[];
};

export function StudiesTable({ studies }: StudiesTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Study type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studies.map((study) => (
            <TableRow key={study.id}>
              <TableCell>
                {study.patient_name ? (
                  <span className="font-medium">{study.patient_name}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/studies/${study.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {study.study_type_name ?? "—"}
                </Link>
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {study.description ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {study.status ? (
                    <StudyStatusBadge status={study.status} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  <RoleGuard allowedRoles={[ROLES.CLINIC_ADMIN]}>
                    {study.status && (
                      <StudyStatusControl
                        studyId={study.id}
                        currentStatus={study.status}
                      />
                    )}
                  </RoleGuard>
                </div>
              </TableCell>
              <TableCell>
                {study.assigned_to_name ? (
                  <span className="text-sm">{study.assigned_to_name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>{format(new Date(study.created_at), "yyyy-MM-dd")}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/dashboard/studies/${study.id}`}>
                    <Button type="button" variant="outline" size="sm">
                      Open
                    </Button>
                  </Link>
                  <RoleGuard allowedRoles={[ROLES.CLINIC_ADMIN]}>
                    <AssignRadiologistDialog
                      studyId={study.id}
                      currentAssigneeId={study.assigned_to ?? null}
                    />
                  </RoleGuard>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
