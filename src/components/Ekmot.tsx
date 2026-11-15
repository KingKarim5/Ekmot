/**
 * Small shared pieces for Ekmot screens: rule flags, evidence badges, terms table.
 */

import React from "react";
import type { EvidenceLevel, RuleFlag, TenancyTerms } from "@/types";

const SEVERITY_STYLE: Record<RuleFlag["severity"], string> = {
  outside: "border-red-300 bg-red-50 text-red-900",
  conflict: "border-amber-300 bg-amber-50 text-amber-900",
  info: "border-gray-200 bg-gray-50 text-gray-700",
  ok: "border-green-300 bg-green-50 text-green-900",
};

const SEVERITY_LABEL: Record<RuleFlag["severity"], string> = {
  outside: "Outside the rule",
  conflict: "Rules disagree",
  info: "Note",
  ok: "Within the rule",
};

export function FlagList({ flags }: { flags: RuleFlag[] }) {
  if (!flags.length) return null;
  const order = { outside: 0, conflict: 1, ok: 2, info: 3 };
  return (
    <div className="space-y-2">
      {[...flags].sort((a, b) => order[a.severity] - order[b.severity]).map((f) => (
        <div key={f.id} className={`border rounded-lg p-3 ${SEVERITY_STYLE[f.severity]}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">
            {SEVERITY_LABEL[f.severity]} · {f.source}
          </div>
          <p className="mt-1 text-sm">{f.bn}</p>
          <p className="mt-1 text-sm opacity-80">{f.en}</p>
        </div>
      ))}
    </div>
  );
}

export function EvidenceBadge({ level }: { level?: EvidenceLevel }) {
  const l = level ?? "one-sided";
  const style =
    l === "matched"
      ? "bg-green-100 text-green-800"
      : l === "disputed"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";
  const text = l === "matched" ? "Matched by both SMS" : l === "disputed" ? "Disputed" : "One side only";
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${style}`}>{text}</span>;
}

export function TermsTable({ terms }: { terms: TenancyTerms }) {
  const rows: [string, string][] = [
    ["Monthly rent", terms.monthlyRent !== undefined ? `৳${terms.monthlyRent.toLocaleString()}` : "Not stated"],
    ["Advance", terms.advanceMonths !== undefined ? `${terms.advanceMonths} month(s)` : "Not stated"],
    ["Security deposit", terms.securityDeposit ? `৳${terms.securityDeposit.toLocaleString()}` : "None"],
    [
      "Rent increase",
      terms.increasePercent
        ? `${terms.increasePercent}% every ${terms.increaseEveryMonths ?? 12} months`
        : "None stated",
    ],
    ["Notice period", terms.noticeMonths !== undefined ? `${terms.noticeMonths} month(s)` : "Not stated"],
  ];
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-gray-100">
            <td className="py-2 text-gray-500">{k}</td>
            <td className="py-2 font-medium text-gray-900">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
