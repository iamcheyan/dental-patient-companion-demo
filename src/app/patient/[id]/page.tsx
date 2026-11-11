import { ChatPanel } from "@/components/ChatPanel";
import { PatientHero, TreatmentTimeline } from "@/components/PatientCard";
import { getPatient, listPatients } from "@/lib/mock";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return listPatients().map((p) => ({ id: p.id }));
}

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <a
          href="/"
          className="text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← デモ入口
        </a>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
          /patient/{patient.slug}
        </span>
      </div>

      <PatientHero patient={patient} />
      <TreatmentTimeline patient={patient} />

      <div className="flex min-h-[420px] flex-1 flex-col pb-4">
        <ChatPanel patientId={patient.id} greeting={patient.greetingJa} />
      </div>
    </main>
  );
}
