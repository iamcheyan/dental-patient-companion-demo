#!/usr/bin/env node
/**
 * Generate patient QR codes pointing at PUBLIC_BASE_URL + /patient/{id}
 * Default base is local demo URL; override for Tailscale hostname.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");

const base = (process.env.PUBLIC_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

const targets = [
  { file: "patient-a.png", path: "/patient/yamada", name: "山田太郎" },
  { file: "patient-b.png", path: "/patient/sato", name: "佐藤花子" },
];

fs.mkdirSync(pub, { recursive: true });

for (const t of targets) {
  const url = `${base}${t.path}`;
  const out = path.join(pub, t.file);
  await QRCode.toFile(out, url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  console.log(`wrote ${t.file}  ${t.name}  ->  ${url}`);
}

console.log("done");
