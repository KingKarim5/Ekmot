/**
 * Ekmot rule check
 *
 * Plain code, not AI: the same terms always give the same flags.
 *
 * Layer 1 (every flat in Dhaka): Premises Rent Control Act 1991.
 * Layer 2 (only flats in a DNCC ward): Dhaka North City Corporation guideline, 20 Jan 2026.
 * DSCC has not published its own guideline, so DSCC flats get layer 1 plus a note.
 *
 * Wording says "outside the Act" or "outside the guideline", never "illegal":
 * the platform shows the rule, people decide.
 */

import type { CityCorp, RuleFlag, TenancyTerms } from "@/types";

const ACT = "Premises Rent Control Act 1991";
const DNCC = "DNCC rent guideline, 20 Jan 2026";

function bnNum(n: number | string): string {
  const d = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (c) => d[Number(c)]);
}

export function checkTerms(terms: TenancyTerms, cityCorp: CityCorp): RuleFlag[] {
  const flags: RuleFlag[] = [];
  const adv = terms.advanceMonths;

  // ---------- Layer 1: the 1991 Act (DNCC and DSCC) ----------
  if (adv !== undefined && adv > 1) {
    flags.push({
      id: "act-advance",
      source: `${ACT}, section 10`,
      severity: "outside",
      en: `${adv} months' advance is above the Act's one-month limit, unless the Rent Controller approves more in advance.`,
      bn: `${bnNum(adv)} মাসের অগ্রিম ভাড়া আইনের এক মাসের সীমার বেশি, যদি না ভাড়া নিয়ন্ত্রক আগে থেকে অনুমোদন দেন।`,
    });
  } else if (adv !== undefined) {
    flags.push({
      id: "act-advance-ok",
      source: `${ACT}, section 10`,
      severity: "ok",
      en: "Advance is within the Act's one-month limit.",
      bn: "অগ্রিম ভাড়া আইনের এক মাসের সীমার মধ্যে আছে।",
    });
  }

  if (terms.securityDeposit && terms.securityDeposit > 0) {
    flags.push({
      id: "act-deposit",
      source: `${ACT}, section 10`,
      severity: "outside",
      en: "The Act does not allow a separate security deposit, premium or salami.",
      bn: "আইন অনুযায়ী আলাদা জামানত, প্রিমিয়াম বা সালামি নেওয়া যায় না।",
    });
  }

  flags.push({
    id: "act-receipt",
    source: `${ACT}, section 13`,
    severity: "info",
    en: "A signed receipt is required for every payment. Ekmot issues one for each payment both sides confirm.",
    bn: "প্রতিটি ভাড়া পরিশোধের স্বাক্ষরিত রসিদ দিতে হয়। দুই পক্ষ নিশ্চিত করলে Ekmot রসিদ তৈরি করে।",
  });

  // ---------- Layer 2: city corporation guideline ----------
  if (cityCorp === "DNCC") {
    if (adv !== undefined && adv > 3) {
      flags.push({
        id: "dncc-advance",
        source: DNCC,
        severity: "outside",
        en: `${adv} months' advance is also above the DNCC guideline's three-month limit.`,
        bn: `${bnNum(adv)} মাসের অগ্রিম ভাড়া উত্তর সিটির নির্দেশিকার তিন মাসের সীমারও বেশি।`,
      });
    } else if (adv !== undefined && adv > 1) {
      flags.push({
        id: "dncc-advance-conflict",
        source: `${DNCC} vs ${ACT}`,
        severity: "conflict",
        en: `The DNCC guideline allows 1 to 3 months' advance, but the Act allows one. The two rules disagree; both are shown.`,
        bn: "উত্তর সিটির নির্দেশিকা ১ থেকে ৩ মাসের অগ্রিম অনুমতি দেয়, কিন্তু আইন এক মাস। দুই নিয়মে অমিল আছে।",
      });
    }

    if (terms.increasePercent && terms.increasePercent > 0) {
      const every = terms.increaseEveryMonths ?? 12;
      if (every < 24) {
        flags.push({
          id: "dncc-increase",
          source: DNCC,
          severity: "outside",
          en: `A rent increase every ${every} months is outside the DNCC guideline, which allows no increase within two years.`,
          bn: `প্রতি ${bnNum(every)} মাসে ভাড়া বাড়ানো উত্তর সিটির নির্দেশিকার বাইরে; দুই বছরের আগে ভাড়া বাড়ানো যাবে না।`,
        });
      }
    }

    if (terms.noticeMonths !== undefined && terms.noticeMonths < 2) {
      flags.push({
        id: "dncc-notice",
        source: DNCC,
        severity: "outside",
        en: `${terms.noticeMonths} month notice is shorter than the two months the DNCC guideline asks for.`,
        bn: `${bnNum(terms.noticeMonths)} মাসের নোটিশ উত্তর সিটির নির্দেশিকার দুই মাসের চেয়ে কম।`,
      });
    }
  } else {
    flags.push({
      id: "dscc-none",
      source: "Dhaka South City Corporation",
      severity: "info",
      en: "DSCC has not published its own rent guideline, so only the 1991 Act is checked.",
      bn: "দক্ষিণ সিটি করপোরেশন আলাদা ভাড়া নির্দেশিকা প্রকাশ করেনি, তাই শুধু ১৯৯১ সালের আইন যাচাই করা হয়েছে।",
    });
    if (terms.increasePercent && terms.increasePercent > 0) {
      flags.push({
        id: "act-standard-rent",
        source: `${ACT}, sections 15 and 16`,
        severity: "info",
        en: "Under the Act, standard rent is fixed by the Rent Controller on application and can be revised every two years on application.",
        bn: "আইন অনুযায়ী আবেদন করলে ভাড়া নিয়ন্ত্রক মানসম্মত ভাড়া ঠিক করেন, যা আবেদনে দুই বছর পরপর পুনর্নির্ধারণ করা যায়।",
      });
    }
  }

  return flags;
}

export function hasProblems(flags: RuleFlag[]): boolean {
  return flags.some((f) => f.severity === "outside");
}
