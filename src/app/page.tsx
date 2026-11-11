import Image from "next/image";
import { listPatients, progressPercent } from "@/lib/mock";
import fs from "node:fs";
import path from "node:path";

function qrExists(name: string) {
  return fs.existsSync(path.join(process.cwd(), "public", name));
}

export default function HomePage() {
  const patients = listPatients();
  const cards = [
    {
      patient: patients.find((p) => p.id === "yamada")!,
      qr: "patient-a.png",
      path: "/patient/yamada",
      label: "QRコード A",
    },
    {
      patient: patients.find((p) => p.id === "sato")!,
      qr: "patient-b.png",
      path: "/patient/sato",
      label: "QRコード B",
    },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
          Dental Patient Companion Demo
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          AI が治療の理解を、ずっとそばで支える
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          QR を読み取ると、患者専用ページが開きます。本日の治療・現在の段階・次回予約を確認し、すぐに
          AI と会話できます。データはすべてモックで、実在の病院 / 電子カルテ / LINE /
          データベースには接続しません。チャット経路：
          <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[13px]">
            magpie/default
          </code>
          （Hermes Agent）。
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {cards.map(({ patient, qr, path: href, label }) => (
          <article
            key={patient.id}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-sky-700">{label}</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  {patient.name}
                </h2>
                <p className="text-sm text-slate-500">{patient.treatmentJa}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs tabular-nums text-slate-600">
                {progressPercent(patient)}%
              </span>
            </div>

            <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              {qrExists(qr) ? (
                <Image
                  src={`/${qr}`}
                  alt={`${patient.name} QR`}
                  width={220}
                  height={220}
                  className="rounded-xl bg-white p-2"
                  unoptimized
                />
              ) : (
                <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-white text-center text-xs text-slate-400 ring-1 ring-dashed ring-slate-200">
                  pnpm qr で生成
                  <br />
                  {qr}
                </div>
              )}
              <p className="text-xs text-slate-500">
                URL · <code>{href}</code>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={href}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                患者ページを開く
              </a>
              <span className="inline-flex items-center rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
                次回 {patient.nextVisitDisplay}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
        <h3 className="font-semibold text-slate-900">院長が 5 秒で掴む価値</h3>
        <p className="mt-2 leading-relaxed">
          カルテ情報 → AI の説明 → 患者の理解 → 継続的な寄り添い。焦点は Patient Companion
          Agent であり、予約システムや病院管理システムではありません。
        </p>
      </section>
    </main>
  );
}
