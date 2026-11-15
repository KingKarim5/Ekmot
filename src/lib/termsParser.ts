/**
 * Offline reader for tenancy terms written in Bangla, Banglish or English.
 *
 * Used when no AI key is set, or when the AI call fails, so the demo never
 * depends on the network. It only understands common phrasings; the AI route
 * handles messier text. People always check and edit the result.
 *
 * Examples it reads:
 *   "bhara 20 hajar, 6 mash advance, protibochor 10% barbe, 1 mash notice"
 *   "ভাড়া ২০০০০ টাকা, ৩ মাসের অ্যাডভান্স, প্রতি বছর ১০% বাড়বে"
 *   "rent 25k, advance 2 months, notice 2 months"
 */

import type { TenancyTerms } from "@/types";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

const WORD_NUMBERS: Record<string, string> = {
  ek: "1", dui: "2", tin: "3", char: "4", panch: "5", choy: "6", chhoy: "6",
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6",
  "এক": "1", "দুই": "2", "তিন": "3", "চার": "4", "পাঁচ": "5", "ছয়": "6",
};

export function normalise(text: string): string {
  let t = text.replace(/[০-৯]/g, (c) => String(BN_DIGITS.indexOf(c)));
  t = t.toLowerCase().replace(/,(?=\d{3})/g, "");
  // "ek mash" -> "1 mash", "তিন মাস" -> "3 মাস"
  for (const [word, digit] of Object.entries(WORD_NUMBERS)) {
    t = t.replace(new RegExp(`(^|[^a-z\\u0980-\\u09ff])${word}(?=\\s*(mash|mas|month|মাস|bochor|year|বছর))`, "g"), `$1${digit}`);
  }
  return t;
}

function toTaka(num: string, unit?: string): number {
  const n = parseFloat(num);
  if (!unit) return Math.round(n);
  if (/^(k|hajar|hazar|হাজার)$/.test(unit)) return Math.round(n * 1000);
  if (/^(lakh|lac|লাখ)$/.test(unit)) return Math.round(n * 100000);
  return Math.round(n);
}

const MONTH = "(?:mash|mas|maser|month|months|mo|মাস|মাসের)";
const ADV = "(?:advance|adv|odvance|অ্যাডভান্স|এডভান্স|অগ্রিম)";
const NOTICE = "(?:notice|nutish|নোটিশ)";
const UNIT = "(k|hajar|hazar|হাজার|lakh|lac|লাখ)?";
const RENT = "(?:bhara|vara|bhada|rent|ভাড়া|ভারা)";

export function parseTermsOffline(text: string): TenancyTerms {
  const t = normalise(text);
  const terms: TenancyTerms = {};

  // Monthly rent: "bhara 20 hajar", "rent: 25000", "ভাড়া ২০০০০ টাকা", "20k bhara"
  let m = t.match(new RegExp(`${RENT}\\s*(?:holo|hobe|is|:|=|-)?\\s*(?:tk\\.?|taka|৳|টাকা)?\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}`));
  if (!m) m = t.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT}\\s*(?:tk|taka|৳|টাকা)?\\s*${RENT}`));
  if (m) terms.monthlyRent = toTaka(m[1], m[2]);

  // Advance months: "6 mash advance", "advance 3 month", "৩ মাসের অ্যাডভান্স"
  m = t.match(new RegExp(`(\\d+)\\s*${MONTH}\\s*(?:er|ar)?\\s*${ADV}`)) ||
      t.match(new RegExp(`${ADV}\\s*(?::|=|-)?\\s*(\\d+)\\s*${MONTH}`));
  if (m) terms.advanceMonths = parseInt(m[1], 10);

  // Notice months: "2 mash notice", "notice 1 month"
  m = t.match(new RegExp(`(\\d+)\\s*${MONTH}\\s*(?:er|ar)?\\s*${NOTICE}`)) ||
      t.match(new RegExp(`${NOTICE}\\s*(?::|=|-)?\\s*(\\d+)\\s*${MONTH}`));
  if (m) terms.noticeMonths = parseInt(m[1], 10);

  // Rent increase: "10% barbe", "protibochor 10% increase", "প্রতি বছর ১০% বাড়বে"
  m = t.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|parcent|শতাংশ)/);
  if (m && /(barbe|barano|bariye|increase|hike|বাড়বে|বাড়ানো|বৃদ্ধি)/.test(t)) {
    terms.increasePercent = parseFloat(m[1]);
    if (/(protibochor|proti\s*bochor|prottek\s*bochor|every\s*year|yearly|per\s*year|annually|প্রতি\s*বছর|প্রতিবছর|বছরে)/.test(t)) {
      terms.increaseEveryMonths = 12;
    }
    const every = t.match(new RegExp(`(\\d+)\\s*(bochor|year|years|বছর)\\s*(?:por|after|পর)`)) ||
                  t.match(new RegExp(`(\\d+)\\s*${MONTH}\\s*(?:por\\s*por|porpor|after|পরপর|পর)`));
    if (every) {
      const n = parseInt(every[1], 10);
      terms.increaseEveryMonths = /bochor|year|বছর/.test(every[2] || "") ? n * 12 : n;
    }
    if (terms.increaseEveryMonths === undefined) terms.increaseEveryMonths = 12;
  }

  // Security deposit: "jamanot 10 hajar", "security deposit 20000"
  m = t.match(new RegExp(`(?:jamanot|jamanat|security|deposit|জামানত)\\s*(?:deposit)?\\s*(?::|=|-)?\\s*(?:tk\\.?|taka|৳|টাকা)?\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}`));
  if (m) terms.securityDeposit = toTaka(m[1], m[2]);

  return terms;
}
