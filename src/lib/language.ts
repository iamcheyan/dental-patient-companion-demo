import type { DetectedLang } from "./types";

export function detectLanguage(text: string): DetectedLang {
  const t = text.trim();
  if (!t) return "zh";

  // Japanese: kana or common Japanese punctuation / particles
  if (/[\u3040-\u30ff]/.test(t) || /[ぁ-んァ-ン]/.test(t)) {
    return "ja";
  }

  // Chinese characters without kana → zh (may also catch pure CJK; prefer zh when no kana)
  if (/[\u4e00-\u9fff]/.test(t)) {
    return "zh";
  }

  // Latin alphabet → English
  if (/[A-Za-z]/.test(t)) {
    return "en";
  }

  return "zh";
}

export const unknownReplies: Record<DetectedLang, string> = {
  zh: `这是演示环境。

当前问题尚未配置。

请尝试询问：

- 今天做了什么
- 为什么还要复诊
- 什么时候结束
- 治疗进度`,
  ja: `これはデモ環境です。

現在この質問に対応する情報は設定されていません。

以下をお試しください：

- 今日の治療内容
- あと何回必要か
- 治療はいつ終わるか
- 現在の進捗`,
  en: `This is a demo environment.

This question is not configured yet.

Please try asking about:

- What was done today
- Why more visits are needed
- When treatment finishes
- Current progress`,
};
