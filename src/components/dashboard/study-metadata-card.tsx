"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGuard } from "@/components/shared/role-guard";
import { ModalityBadge } from "@/components/shared/modality-badge";
import { StudyStatusBadge } from "@/components/dashboard/study-status-badge";
import { StudyStatusControl } from "@/components/dashboard/study-status-control";
import { AssignRadiologistDialog } from "@/components/dashboard/assign-radiologist-dialog";
import { ROLES } from "@/constants/roles";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateStudy } from "@/hooks/use-studies";
import { getErrorMessage } from "@/lib/utils";
import type { Patient, Study } from "@/types/database";

interface StudyMetadataCardProps {
  study: Study & {
    study_type_name?: string | null;
    assigned_to_name?: string | null;
  };
  patient: Patient | null;
}

function toModality(value?: string | null) {
  const normalized = value?.toUpperCase().replace("-", "") ?? "";
  if (normalized.includes("XRAY") || normalized.includes("X-RAY")) return "XRAY";
  if (normalized.includes("MRI")) return "MRI";
  if (normalized.includes("CT")) return "CT";
  if (normalized.includes("US") || normalized.includes("ULTRASOUND")) return "US";
  return null;
}

export function StudyMetadataCard({ study, patient }: StudyMetadataCardProps) {
  const modality = toModality(study.study_type_name);
  const [description, setDescription] = useState(study.description ?? "");
  const { mutateAsync: updateStudy, isPending } = useUpdateStudy();

  useEffect(() => {
    // Sync latest study description into editable state when data changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescription(study.description ?? "");
  }, [study.description]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Study overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient</p>
            {patient ? (
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                {patient.name}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Unknown</p>
            )}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Modality</p>
            {modality ? (
              <ModalityBadge modality={modality} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {study.study_type_name ?? "—"}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Study date</p>
            <p className="text-sm font-semibold">
              {format(new Date(study.created_at), "MMMM dd, yyyy")}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              <StudyStatusBadge status={study.status} />
              <RoleGuard allowedRoles={[ROLES.CLINIC_ADMIN]}>
                <StudyStatusControl
                  studyId={study.id}
                  currentStatus={study.status}
                />
              </RoleGuard>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Assigned to: </span>
            {study.assigned_to_name ? (
              <span className="font-semibold">{study.assigned_to_name}</span>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </div>
          <RoleGuard allowedRoles={[ROLES.CLINIC_ADMIN]}>
            <AssignRadiologistDialog
              studyId={study.id}
              currentAssigneeId={study.assigned_to ?? null}
            />
          </RoleGuard>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Description
          </p>
          {study.description ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {study.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No description added.</p>
          )}
          <RoleGuard allowedRoles={[ROLES.CLINIC_ADMIN]}>
            <div className="space-y-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add or edit study description"
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                loading={isPending}
                loadingText="Saving..."
                onClick={async () => {
                  try {
                    await updateStudy({ id: study.id, data: { description } });
                    toast.success("Description updated.");
                  } catch (err) {
                    toast.error(getErrorMessage(err, "Failed to update description."));
                  }
                }}
              >
                Save description
              </Button>
            </div>
          </RoleGuard>
        </div>
      </CardContent>
    </Card>
  );
}
