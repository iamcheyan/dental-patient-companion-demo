export type StepStatus = "done" | "current" | "todo";

export type TreatmentStep = {
  id: number;
  label: string;
  labelJa: string;
  labelEn: string;
  status: StepStatus;
};

export type Patient = {
  id: string;
  slug: string;
  name: string;
  nameReading: string;
  honorificJa: string;
  honorificZh: string;
  honorificEn: string;
  gender: "male" | "female";
  avatarInitials: string;
  treatment: string;
  treatmentJa: string;
  treatmentEn: string;
  tooth: string | null;
  toothJa: string | null;
  toothEn: string | null;
  todayProcedure: string;
  todayProcedureJa: string;
  todayProcedureEn: string;
  currentStep: number;
  totalStep: number;
  remainingVisits: number;
  nextVisit: string;
  nextVisitDisplay: string;
  steps: TreatmentStep[];
  greetingZh: string;
  clinic: string;
};

export type KnowledgeEntry = {
  id: string;
  questions: {
    zh: string[];
    ja: string[];
    en: string[];
  };
  answers: {
    zh: string;
    ja: string;
    en: string;
  };
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type DetectedLang = "zh" | "ja" | "en";
