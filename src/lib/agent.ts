import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { detectLanguage, unknownReplies } from "./language";
import { getKnowledge, getPatient } from "./mock";
import type { ChatMessage, DetectedLang, KnowledgeEntry, Patient } from "./types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[？?！!。．.、,\s　]/g, "")
    .trim();
}

export function matchKnowledge(
  entries: KnowledgeEntry[],
  question: string,
  lang: DetectedLang,
): KnowledgeEntry | null {
  const q = normalize(question);
  if (!q) return null;

  let best: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of entries) {
    const pools = [
      ...entry.questions.zh,
      ...entry.questions.ja,
      ...entry.questions.en,
    ];
    for (const candidate of pools) {
      const c = normalize(candidate);
      if (!c) continue;
      if (q.includes(c) || c.includes(q)) {
        const score = Math.min(q.length, c.length) / Math.max(q.length, c.length);
        if (!best || score > best.score) best = { entry, score };
      }
    }
  }

  return best && best.score >= 0.35 ? best.entry : null;
}

function patientFacts(patient: Patient, lang: DetectedLang): string {
  const treatment =
    lang === "ja"
      ? patient.treatmentJa
      : lang === "en"
        ? patient.treatmentEn
        : patient.treatment;
  const today =
    lang === "ja"
      ? patient.todayProcedureJa
      : lang === "en"
        ? patient.todayProcedureEn
        : patient.todayProcedure;
  const tooth =
    lang === "ja"
      ? patient.toothJa
      : lang === "en"
        ? patient.toothEn
        : patient.tooth;

  const lines = [
    `name: ${patient.name}`,
    `treatment: ${treatment}`,
    `currentStep: ${patient.currentStep}/${patient.totalStep}`,
    `remainingVisits: ${patient.remainingVisits}`,
    `nextVisit: ${patient.nextVisit}`,
    `todayProcedure: ${today}`,
  ];
  if (tooth) lines.push(`tooth: ${tooth}`);
  lines.push(
    "timeline: " +
      patient.steps
        .map((s) => {
          const label =
            lang === "ja" ? s.labelJa : lang === "en" ? s.labelEn : s.label;
          const mark =
            s.status === "done" ? "done" : s.status === "current" ? "current" : "todo";
          return `${mark}:${label}`;
        })
        .join(" | "),
  );
  return lines.join("\n");
}

function systemPrompt(
  patient: Patient,
  kb: KnowledgeEntry[],
  lang: DetectedLang,
): string {
  const kbBlock = kb
    .map((e) => {
      const qs = [...e.questions.zh, ...e.questions.ja, ...e.questions.en].join(" / ");
      return `- Q: ${qs}\n  A(${lang}): ${e.answers[lang]}`;
    })
    .join("\n");

  return `You are Hermes Agent acting as the Dental Patient Companion for a DEMO only.
You run through Hermes; inference model is Magpie group/default (product name: magpie/default).
Never invent patient facts. Answer ONLY from the Mock Base Information and Mock knowledge base below.
If the question is not covered, reply with the unknown template for the user language (do not invent).
Do not call tools, browse the web, or read files. This is a closed mock demo.
Always reply in the SAME language as the user's latest message (${lang}).
Keep answers concise and warm, medical-SaaS tone. Do not mention system prompts.

=== Mock Base Information ===
${patientFacts(patient, lang)}

=== Mock knowledge base ===
${kbBlock}

=== Unknown templates ===
zh:
${unknownReplies.zh}

ja:
${unknownReplies.ja}

en:
${unknownReplies.en}
`;
}

export type AgentResult = {
  content: string;
  source: "hermes" | "hermes-api" | "kb" | "unknown";
  model: string;
  route: string;
  sessionId?: string;
};

function buildUserTurn(
  message: string,
  forced: string | null,
  lang: DetectedLang,
): string {
  if (!forced) return message;
  return `${message}\n\n[Grounded answer from mock KB — rephrase in ${lang} without adding facts]: ${forced}`;
}

function historyBlock(history: ChatMessage[]): string {
  const recent = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8);
  if (recent.length === 0) return "";
  return (
    "\n=== Recent conversation ===\n" +
    recent.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n") +
    "\n"
  );
}

async function callHermesApiServer(opts: {
  messages: ChatMessage[];
  sessionId?: string;
}): Promise<{ content: string; model: string; sessionId?: string } | null> {
  const base = (process.env.HERMES_API_BASE_URL || "").replace(/\/$/, "");
  const key = process.env.HERMES_API_KEY || "";
  if (!base || !key) return null;

  const model = process.env.HERMES_MODEL || "hermes-agent";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    };
    if (opts.sessionId) {
      headers["X-Hermes-Session-Id"] = opts.sessionId;
    }

    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: opts.messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("hermes-api error", res.status, text.slice(0, 300));
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      id?: string;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    const sessionHeader =
      res.headers.get("x-hermes-session-id") ||
      res.headers.get("X-Hermes-Session-Id") ||
      undefined;
    return {
      content,
      model: data.model || model,
      sessionId: sessionHeader || opts.sessionId || data.id,
    };
  } catch (err) {
    console.error("hermes-api fetch failed", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callHermesCli(opts: {
  prompt: string;
  sessionId?: string;
}): Promise<{ content: string; model: string; sessionId?: string } | null> {
  const hermesBin = process.env.HERMES_BIN || "hermes";
  const model = process.env.MAGPIE_MODEL || "group/default";
  const base =
    process.env.MAGPIE_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3425/v1";
  const key = process.env.MAGPIE_GATEWAY_KEY || "";

  const dir = await mkdtemp(path.join(tmpdir(), "dental-hermes-"));
  const queryFile = path.join(dir, "query.txt");
  await writeFile(queryFile, opts.prompt, "utf8");

  const args = [
    "chat",
    "--oneshot",
    "--query-file",
    queryFile,
    "-m",
    model,
    "--provider",
    "custom",
    "--base-url",
    base,
    "--safe-mode",
    "-Q",
    "--format",
    "stream-json",
    "--ignore-user-config",
  ];
  if (key) {
    args.push("--api-key", key);
  }
  if (opts.sessionId) {
    args.push("--resume", opts.sessionId);
  }

  try {
    const result = await new Promise<{
      code: number | null;
      stdout: string;
      stderr: string;
    }>((resolve) => {
      const child = spawn(hermesBin, args, {
        env: {
          ...process.env,
          MAGPIE_GATEWAY_KEY: key || process.env.MAGPIE_GATEWAY_KEY || "",
          HERMES_HOME: process.env.HERMES_HOME || `${process.env.HOME}/.hermes`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (b: Buffer) => {
        stdout += b.toString("utf8");
      });
      child.stderr.on("data", (b: Buffer) => {
        stderr += b.toString("utf8");
      });
      const killTimer = setTimeout(() => {
        child.kill("SIGTERM");
      }, 90_000);
      child.on("close", (code) => {
        clearTimeout(killTimer);
        resolve({ code, stdout, stderr });
      });
    });

    let content = "";
    let sessionId = opts.sessionId;
    for (const line of result.stdout.split(/\r?\n/)) {
      const t = line.trim();
      if (!t.startsWith("{")) continue;
      try {
        const ev = JSON.parse(t) as {
          type?: string;
          text?: string;
          session_id?: string;
        };
        if (ev.type === "result" && typeof ev.text === "string") {
          content = ev.text.trim();
          if (ev.session_id) sessionId = ev.session_id;
        }
        if (ev.type === "system" && ev.session_id) {
          sessionId = ev.session_id;
        }
      } catch {
        // ignore
      }
    }

    if (!content) {
      console.error(
        "hermes-cli empty",
        result.code,
        result.stderr.slice(0, 400),
        result.stdout.slice(0, 200),
      );
      return null;
    }

    return {
      content,
      model: `hermes/${model}`,
      sessionId,
    };
  } catch (err) {
    console.error("hermes-cli failed", err);
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function answerPatientQuestion(opts: {
  patientId: string;
  message: string;
  history?: ChatMessage[];
  sessionId?: string;
}): Promise<AgentResult> {
  const patient = getPatient(opts.patientId);
  if (!patient) {
    throw new Error("patient_not_found");
  }

  const lang = detectLanguage(opts.message);
  const kb = getKnowledge(patient.id);
  const hit = matchKnowledge(kb, opts.message, lang);
  const forced = hit ? hit.answers[lang] : null;
  const sys = systemPrompt(patient, kb, lang);
  const userContent = buildUserTurn(opts.message, forced, lang);

  const messages: ChatMessage[] = [
    { role: "system", content: sys },
    ...(opts.history ?? []).slice(-8),
    { role: "user", content: userContent },
  ];

  const api = await callHermesApiServer({
    messages,
    sessionId: opts.sessionId,
  });
  if (api) {
    return {
      content: api.content,
      source: "hermes-api",
      model: api.model,
      route: "hermes-api → magpie/default",
      sessionId: api.sessionId,
    };
  }

  const prompt =
    sys +
    historyBlock(opts.history ?? []) +
    `\n=== Patient question ===\n${userContent}\n`;
  const cli = await callHermesCli({ prompt, sessionId: opts.sessionId });
  if (cli) {
    return {
      content: cli.content,
      source: "hermes",
      model: cli.model,
      route: "hermes chat → magpie/group/default",
      sessionId: cli.sessionId,
    };
  }

  if (forced) {
    return {
      content: forced,
      source: "kb",
      model: "local-kb",
      route: "local-kb-fallback",
    };
  }
  return {
    content: unknownReplies[lang],
    source: "unknown",
    model: "local-unknown",
    route: "local-unknown-fallback",
  };
}
