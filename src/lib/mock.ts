import { readFileSync } from "node:fs";
import path from "node:path";
import type { KnowledgeEntry, Patient } from "./types";

const root = path.join(process.cwd(), "mock");

function loadJson<T>(name: string): T {
  const full = path.join(root, name);
  return JSON.parse(readFileSync(full, "utf8")) as T;
}

export function listPatients(): Patient[] {
  const map = loadJson<Record<string, Patient>>("patients.json");
  return Object.values(map);
}

export function getPatient(id: string): Patient | null {
  const map = loadJson<Record<string, Patient>>("patients.json");
  return map[id] ?? null;
}

export function getKnowledge(patientId: string): KnowledgeEntry[] {
  const map = loadJson<Record<string, KnowledgeEntry[]>>("knowledge-base.json");
  return map[patientId] ?? [];
}

export function progressPercent(patient: Patient): number {
  if (patient.totalStep <= 0) return 0;
  return Math.round((patient.currentStep / patient.totalStep) * 100);
}
