import type { Patient } from "@/lib/types";
import { progressPercent } from "@/lib/mock";

function statusIcon(status: string) {
  if (status === "done") return "✅";
  if (status === "current") return "🔄";
  return "⬜";
}

export function PatientHero({ patient }: { patient: Patient }) {
  const pct = progressPercent(patient);
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-lg font-semibold text-white shadow-md shadow-sky-200">
          {patient.avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {patient.name}
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {patient.nameReading}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            治疗项目 · {patient.treatment}
            {patient.tooth ? ` · ${patient.tooth}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{patient.clinic}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              治疗进度
            </p>
            <p className="text-sm text-slate-700">
              第 {patient.currentStep} / {patient.totalStep} 步 · 预计还需{" "}
              {patient.remainingVisits} 次
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-sky-700">
            {pct}%
          </p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-sky-50/80 p-3.5 ring-1 ring-sky-100">
          <p className="text-xs font-medium text-sky-700">今日治疗</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">
            {patient.todayProcedure}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50/80 p-3.5 ring-1 ring-emerald-100">
          <p className="text-xs font-medium text-emerald-700">下次预约</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            {patient.nextVisitDisplay}
          </p>
          <p className="text-xs text-slate-500">{patient.nextVisit}</p>
        </div>
      </div>
    </section>
  );
}

export function TreatmentTimeline({ patient }: { patient: Patient }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
      <h2 className="text-sm font-semibold text-slate-900">治疗时间轴</h2>
      <ol className="mt-4 space-y-3">
        {patient.steps.map((step, idx) => (
          <li key={step.id} className="flex gap-3">
            <div className="flex w-6 flex-col items-center">
              <span className="text-base leading-none">{statusIcon(step.status)}</span>
              {idx < patient.steps.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-slate-200" />
              )}
            </div>
            <div
              className={`min-w-0 flex-1 rounded-2xl px-3 py-2 ${
                step.status === "current"
                  ? "bg-sky-50 ring-1 ring-sky-100"
                  : "bg-slate-50"
              }`}
            >
              <p className="text-sm font-medium text-slate-900">
                {step.label}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {step.labelJa}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {step.status === "done"
                  ? "已完成"
                  : step.status === "current"
                    ? "进行中"
                    : "待进行"}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
