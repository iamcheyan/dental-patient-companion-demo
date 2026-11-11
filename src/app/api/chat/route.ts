import { NextResponse } from "next/server";
import { answerPatientQuestion } from "@/lib/agent";
import type { ChatMessage } from "@/lib/types";

type Body = {
  patientId?: string;
  message?: string;
  history?: ChatMessage[];
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  const message = body.message?.trim();
  if (!patientId || !message) {
    return NextResponse.json(
      { error: "patientId_and_message_required" },
      { status: 400 },
    );
  }

  try {
    const result = await answerPatientQuestion({
      patientId,
      message,
      history: Array.isArray(body.history) ? body.history : [],
    });
    return NextResponse.json({
      reply: result.content,
      source: result.source,
      model: result.model,
      route: "magpie/default",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    if (msg === "patient_not_found") {
      return NextResponse.json({ error: "patient_not_found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "chat_failed" }, { status: 500 });
  }
}
