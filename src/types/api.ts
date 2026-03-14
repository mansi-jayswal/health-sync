import type { Role } from "@/constants/roles";
import type { Patient, Study, StudyType } from "@/types/database";
import type { ScanImage, Report } from "@/types/schemas";

/**
 * Standard API response types. All success responses use ApiSuccess<T>;
 * all error responses use ApiErrorPayload (in JSON body) and appropriate HTTP status.
 */

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiMetadata {
  pagination?: ApiPagination;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  metadata?: ApiMetadata;
}

export interface ApiErrorPayload {
  code?: string;
  message: string;
}

/** Zod validation details when present (e.g. from safeParse). */
export interface ApiErrorDetails {
  details?: unknown;
}

export interface ApiErrorBody extends ApiErrorDetails {
  success: false;
  error: ApiErrorPayload;
  message?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

/** Response with paginated list. */
export interface PaginatedResponse<T> extends ApiSuccess<T[]> {
  metadata: ApiMetadata & { pagination: ApiPagination };
}

/** GET /api/profile/current response data shape. */
export interface CurrentUserProfile {
  user: { id: string; email: string | null } | null;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: Role;
    created_at: string | null;
  } | null;
}

/** User item in admin Users list (backed by profiles). */
export interface UserListItem {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

export type PatientListItem = Patient;

export type StudyListItem = Study;

export type StudyTypeListItem = StudyType;

export interface RadiologistListItem {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
}

export type ScanImageListItem = ScanImage;

export interface ScanSignedUrl {
  url: string;
  expiresAt: string;
}

export type ReportDetail = Report & {
  author_name?: string | null;
  author_email?: string | null;
};

export interface ReportListItem {
  id: string;
  findings: string;
  impression: string;
  created_at: string;
  updated_at: string;
  study: {
    id: string;
    modality: "XRAY" | "CT" | "MRI" | "US";
    study_date: string;
    status: "pending" | "in_review" | "completed";
    patient: { id: string; full_name: string };
  };
}
