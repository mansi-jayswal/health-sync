"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { StudyType } from "@/types/database";

interface StudyTypeSelectProps {
  studyTypes: StudyType[] | undefined;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StudyTypeSelect({
  studyTypes,
  value,
  onChange,
  placeholder = "Select a study type",
  disabled,
}: StudyTypeSelectProps) {
  const selected = studyTypes?.find((type) => type.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <span className="truncate">
          {selected?.name ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {(studyTypes ?? []).map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.name || type.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
