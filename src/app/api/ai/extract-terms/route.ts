/**
 * POST /api/ai/extract-terms
 * Body: { text: string }  (Bangla, Banglish or English)
 *
 * Turns a free-text rent deal into structured terms.
 * - With GEMINI_API_KEY (or OPENAI_API_KEY) set in .env.local, an LLM reads it.
 * - Without a key, or if the AI call fails, the offline reader is used.
 * The AI only extracts; the rule check is plain code, and both people confirm.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseTermsOffline } from "@/lib/termsParser";
import { getRequester } from "@/lib/serverAuth";
import type { TenancyTerms } from "@/types";

const PROMPT = `You read rent agreements written in Bangla, Banglish (Bangla in Latin letters) or English, from Dhaka, Bangladesh.
Return ONLY a JSON object with these keys, using numbers, or null when the text does not say:
monthlyRent (taka per month), advanceMonths (months of rent paid in advance), securityDeposit (taka),
increasePercent (planned rent increase in percent), increaseEveryMonths (how often the increase happens, in months; "protibochor"/"every year" = 12),
noticeMonths (notice period in months).
Rules: "hajar"/"হাজার" = 1000, "k" = 1000, convert Bangla digits, do not guess values that are not stated.
Text:
`;

const KEYS: (keyof TenancyTerms)[] = [
  "monthlyRent", "advanceMonths", "securityDeposit", "increasePercent", "increaseEveryMonths", "noticeMonths",
];

function clean(raw: unknown): TenancyTerms {
  const out: TenancyTerms = {};
  if (!raw || typeof raw !== "object") return out;
  for (const k of KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return out;
}

function parseJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return JSON.parse(text.slice(start, end + 1));
}

async function withGemini(text: string, key: string): Promise<TenancyTerms> {
  const model = process.env.AI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT + text }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return clean(parseJson(out));
}

async function withOpenAI(text: string, key: string): Promise<TenancyTerms> {
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: PROMPT + text }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return clean(parseJson(data?.choices?.[0]?.message?.content ?? ""));
}

export async function POST(request: NextRequest) {
  const who = getRequester(request);
  if (!who) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { text } = await request.json();
  if (!text || typeof text !== "string" || text.length > 2000) {
    return NextResponse.json({ success: false, message: "Send the terms as text (up to 2,000 characters)." }, { status: 400 });
  }

  const offline = parseTermsOffline(text);
  try {
    let ai: TenancyTerms | null = null;
    if (process.env.GEMINI_API_KEY) ai = await withGemini(text, process.env.GEMINI_API_KEY);
    else if (process.env.OPENAI_API_KEY) ai = await withOpenAI(text, process.env.OPENAI_API_KEY);
    if (ai && Object.keys(ai).length > 0) {
      return NextResponse.json({ success: true, terms: ai, extractedBy: "ai" });
    }
  } catch (error) {
    console.error("[extract-terms] AI call failed, using the offline reader:", error);
  }
  return NextResponse.json({ success: true, terms: offline, extractedBy: "offline" });
}
