"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Patient } from "@/types/database";

type PatientsTableProps = {
  patients: Patient[];
};

export function PatientsTable({ patients }: PatientsTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <Link
                  href={`/dashboard/patients/${patient.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {patient.name}
                </Link>
              </TableCell>
              <TableCell>{patient.age}</TableCell>
              <TableCell className="capitalize">{patient.gender}</TableCell>
              <TableCell>{format(new Date(patient.created_at), "yyyy-MM-dd")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
