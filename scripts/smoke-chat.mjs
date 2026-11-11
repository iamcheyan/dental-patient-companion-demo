#!/usr/bin/env node
/**
 * Smoke-test /api/chat for both patients and three languages.
 * Requires a running server at BASE_URL (default http://127.0.0.1:3000).
 */
const base = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const cases = [
  { patientId: "yamada", message: "为什么还要来两次？", expect: /充填|牙冠|两次/ },
  { patientId: "yamada", message: "あと何回通院する必要がありますか？", expect: /回|充填|クラウン/ },
  { patientId: "yamada", message: "How many visits are left?", expect: /two|visit|crown|filling/i },
  { patientId: "sato", message: "今天做了什么？", expect: /植体|植入/ },
  { patientId: "sato", message: "肿胀正常吗？", expect: /肿胀|常见/ },
  { patientId: "yamada", message: "明天股市怎么样", expect: /演示环境|尚未配置/ },
];

let failed = 0;
for (const c of cases) {
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId: c.patientId, message: c.message }),
  });
  const data = await res.json().catch(() => ({}));
  const reply = String(data.reply || "");
  const ok = res.ok && c.expect.test(reply);
  console.log(
    (ok ? "OK " : "FAIL") +
      `  ${c.patientId}  ${JSON.stringify(c.message)}  model=${data.model || "-"}  route=${data.route || "-"}`,
  );
  if (!ok) {
    failed += 1;
    console.log("  status", res.status, "reply:", reply.slice(0, 200));
  }
}
process.exit(failed ? 1 : 0);
