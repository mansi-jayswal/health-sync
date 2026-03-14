"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ItemsTableSkeleton } from "@/components/dashboard/items-table-skeleton";
import { StudyMetadataCard } from "@/components/dashboard/study-metadata-card";
import { ScanGallery } from "@/components/dashboard/scan-gallery";
import { ScanViewer } from "@/components/dashboard/scan-viewer";
import { ReportPanel } from "@/components/dashboard/report-panel";
import { useStudy } from "@/hooks/use-studies";
import { usePatient } from "@/hooks/use-patients";
import { useStudyScans } from "@/hooks/use-scan-images";
import { getErrorMessage } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import { ROLES } from "@/constants/roles";
import { ApiRequestError } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudyDetailsPage() {
  const params = useParams<{ id: string }>();
  const studyId = params?.id ?? "";
  const { data: study, isLoading, isError, error } = useStudy(studyId);
  const { role, isLoading: roleLoading } = useRole();
  const patientId = study?.patient_id ?? "";
  const {
    data: patient,
    isLoading: patientLoading,
    isError: patientError,
  } = usePatient(patientId);
  const { data: scans = [] } = useStudyScans(studyId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (isLoading) {
    return <ItemsTableSkeleton />;
  }

  if (isError) {
    const isForbidden =
      error instanceof ApiRequestError &&
      error.status === 404 &&
      !roleLoading &&
      role === ROLES.RADIOLOGIST;
    const isNotFound =
      error instanceof ApiRequestError &&
      error.status === 404 &&
      (!role || role === ROLES.CLINIC_ADMIN);
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Study Details</h1>
        <p className="text-sm text-muted-foreground">
          {isForbidden
            ? "You do not have access to this study."
            : isNotFound
              ? "Study not found."
              : getErrorMessage(error, "Failed to load study details.")}
        </p>
        <Link href="/dashboard/studies">
          <Button variant="outline">Back to studies</Button>
        </Link>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Study Details</h1>
        <p className="text-sm text-muted-foreground">Study not found.</p>
        <Link href="/dashboard/studies">
          <Button variant="outline">Back to studies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/studies" className="text-sm text-muted-foreground hover:underline">
        &larr; Back to studies
      </Link>

      {patientLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Study metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
          </CardContent>
        </Card>
      ) : (
        <StudyMetadataCard
          study={study}
          patient={!patientError ? patient ?? null : null}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <ScanGallery
              studyId={studyId}
              onImageClick={(index) => {
                setViewerIndex(index);
                setViewerOpen(true);
              }}
            />
          </CardContent>
        </Card>

        <ReportPanel studyId={study.id} />
      </div>

      {viewerOpen && scans.length > 0 && (
        <ScanViewer
          studyId={studyId}
          images={scans}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
