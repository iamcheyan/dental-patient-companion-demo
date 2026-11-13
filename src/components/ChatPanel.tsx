"use client";

import { useEffect, useRef, useState } from "react";
import knowledgeBase from "../../mock/knowledge-base.json";
import { detectLanguage, unknownReplies } from "@/lib/language";
import type { DetectedLang, KnowledgeEntry } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

const knowledge = knowledgeBase as Record<string, KnowledgeEntry[]>;

function normalize(text: string) {
  return text.toLowerCase().replace(/[？?！!。．.、,\s　]/g, "").trim();
}

function answerFromMock(patientId: string, question: string) {
  const lang: DetectedLang = detectLanguage(question);
  const normalizedQuestion = normalize(question);
  const entries = knowledge[patientId] ?? [];
  let best: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of entries) {
    const candidates = [
      ...entry.questions.zh,
      ...entry.questions.ja,
      ...entry.questions.en,
    ];
    for (const candidate of candidates) {
      const normalizedCandidate = normalize(candidate);
      if (!normalizedQuestion.includes(normalizedCandidate) && !normalizedCandidate.includes(normalizedQuestion)) continue;
      const score = Math.min(normalizedQuestion.length, normalizedCandidate.length) / Math.max(normalizedQuestion.length, normalizedCandidate.length);
      if (!best || score > best.score) best = { entry, score };
    }
  }

  return best && best.score >= 0.35
    ? best.entry.answers[lang]
    : unknownReplies[lang];
}

const mockMode = process.env.NEXT_PUBLIC_MOCK_CHAT === "true";

export function ChatPanel({
  patientId,
  greeting,
}: {
  patientId: string;
  greeting: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [routeLabel, setRouteLabel] = useState(
    mockMode ? "Mock Q&A" : "Hermes · magpie/default",
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setError(null);
    const nextUser: Msg = { role: "user", content };
    const history = [...messages, nextUser];
    setMessages(history);
    setBusy(true);
    try {
      if (mockMode) {
        await Promise.resolve();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: answerFromMock(patientId, content) },
        ]);
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          message: content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          sessionId: sessionId || undefined,
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        model?: string;
        route?: string;
        sessionId?: string | null;
        agent?: string;
      };
      if (!res.ok || !data.reply) {
        throw new Error(data.error || `http_${res.status}`);
      }
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.route) {
        setRouteLabel(
          data.agent === "hermes"
            ? `Hermes · ${data.model || "magpie/default"}`
            : data.route,
        );
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "send_failed");
    } finally {
      setBusy(false);
    }
  }

  const suggestions =
    patientId === "sato"
      ? [
          "今日は何をしましたか？",
          "治癒にはどのくらい必要ですか？",
          "腫れは普通ですか？",
          "治療はいつ終わりますか？",
        ]
      : [
          "今日は何をしましたか？",
          "あと何回通院する必要がありますか？",
          "少し痛いのは普通ですか？",
          "治療はいつ終わりますか？",
        ];

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            あなた専用の歯科アシスタント
          </p>
          <p className="text-xs text-slate-500">{routeLabel}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          {mockMode ? "Mock Q&A · 3 languages" : "Hermes Agent · Mock"}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed sm:max-w-[85%] ${
                m.role === "user"
                  ? "rounded-br-md bg-sky-600 text-white"
                  : "rounded-bl-md bg-slate-50 text-slate-800 ring-1 ring-slate-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 ring-1 ring-slate-100">
              質問を理解しています…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t border-slate-100 px-3 py-3 sm:px-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
            >
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p className="text-xs text-rose-600">送信に失敗しました：{error}</p>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            placeholder="日本語で質問できます（中文 / English も可）…"
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            送信
          </button>
        </form>
      </div>
    </section>
  );
}
