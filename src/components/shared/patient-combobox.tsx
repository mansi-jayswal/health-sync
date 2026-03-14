"use client";

import * as React from "react";
import { usePatients } from "@/hooks/use-patients";
import type { Patient } from "@/types/database";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

type PatientComboboxProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaInvalid?: boolean;
};

export function PatientCombobox({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Search patient",
  ariaInvalid = false,
}: PatientComboboxProps) {
  const { data: patients, isLoading, isError } = usePatients();
  const patientList = patients ?? [];
  const selectedPatient =
    patientList.find((patient) => patient.id === value) ?? null;

  return (
    <Combobox
      value={selectedPatient}
      onValueChange={(patient) => {
        const selected = patient as Patient | null;
        onValueChange(selected?.id ?? "");
      }}
      items={patientList}
      itemToStringLabel={(patient) => patient.name}
      itemToStringValue={(patient) => patient.id}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        showClear={Boolean(value)}
        aria-invalid={ariaInvalid}
        disabled={disabled}
      />
      <ComboboxContent>
        <ComboboxList>
          {isLoading && (
            <div className="px-2 py-2 text-sm text-muted-foreground">
              Loading patients...
            </div>
          )}
          {isError && (
            <div className="px-2 py-2 text-sm text-destructive">
              Failed to load patients.
            </div>
          )}
          {!isLoading && !isError && (
            <>
              <ComboboxEmpty>No patients found.</ComboboxEmpty>
              <ComboboxCollection>
                {(patient: Patient) => (
                  <ComboboxItem key={patient.id} value={patient}>
                    <span className="font-medium">{patient.name}</span>
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
