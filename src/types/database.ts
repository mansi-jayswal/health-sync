import type { Role } from "@/constants/roles";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  created_by: string;
  created_at: string;
}

export interface Study {
  id: string;
  patient_id: string;
  study_type_id: string;
  description: string | null;
  created_by: string;
  assigned_to: string | null;
  status: "pending" | "in_review" | "completed";
  created_at: string;
}

export interface StudyType {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Report {
  id: string;
  study_id: string;
  author_id: string;
  findings: string;
  impression: string;
  created_at: string;
  updated_at: string;
}

export interface ScanImageRow {
  id: string;
  study_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: "image/jpeg" | "image/png";
  uploaded_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Item>;
      };
      patients: {
        Row: Patient;
        Insert: Omit<Patient, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<Patient, "name" | "age" | "gender">>;
      };
      studies: {
        Row: Study;
        Insert: Omit<Study, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<Study, "patient_id" | "study_type_id" | "description">>;
      };
      study_types: {
        Row: StudyType;
        Insert: Omit<StudyType, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<StudyType, "name">>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<Report, "findings" | "impression" | "updated_at">>;
      };
      scan_images: {
        Row: ScanImageRow;
        Insert: Omit<ScanImageRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<ScanImageRow, "file_name" | "file_size" | "mime_type">>;
      };
    };
  };
}
