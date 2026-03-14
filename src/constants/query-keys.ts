export const QUERY_KEYS = {
  items: {
    all: ["items"] as const,
  },
  patients: {
    all: ["patients"] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
  },
  studies: {
    all: ["studies"] as const,
    detail: (id: string) => ["studies", "detail", id] as const,
    byPatient: (patientId: string) => ["studies", "patient", patientId] as const,
  },
  studyTypes: {
    all: ["study-types"] as const,
    detail: (id: string) => ["study-types", "detail", id] as const,
  },
  profile: {
    current: ["profile", "current"] as const,
  },
  users: {
    all: ["users"] as const,
  },
} as const;
