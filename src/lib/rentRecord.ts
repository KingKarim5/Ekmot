/**
 * Builds a tenant's rent history from confirmed records.
 * Used by the share link (for a new landlord) and the lender view.
 * Facts only, each with its evidence level; no score.
 */

import type { Payment, Rental } from "@/types";

export interface RentFacts {
  tenancies: number;
  tenureMonths: number;
  monthsMatched: number;
  monthsOneSided: number;
  monthsDisputed: number;
  latestMonth?: string;
  meetsMinimum: boolean; // six or more matched months
}

function monthsBetween(start: string, end: Date): number {
  const s = new Date(start);
  return Math.max(0, (end.getFullYear() - s.getFullYear()) * 12 + (end.getMonth() - s.getMonth()));
}

export function rentFacts(tenantId: string, rentals: Rental[], payments: Payment[]): RentFacts {
  const mine = rentals.filter((r) => r.tenantId === tenantId);
  const ids = new Set(mine.map((r) => r.id));
  const pays = payments.filter((p) => ids.has(p.rentalId));
  const now = new Date();
  const tenureMonths = mine.reduce((sum, r) => {
    const end = r.endDate && new Date(r.endDate) < now ? new Date(r.endDate) : now;
    return sum + monthsBetween(r.startDate, end);
  }, 0);
  const monthsMatched = pays.filter((p) => p.evidence === "matched").length;
  const monthsDisputed = pays.filter((p) => p.evidence === "disputed").length;
  // payments recorded before Ekmot (no evidence) count as one-sided
  const monthsOneSided = pays.filter((p) => !p.evidence || p.evidence === "one-sided").length;
  const latestMonth = pays.map((p) => p.month).sort().at(-1);
  return {
    tenancies: mine.length,
    tenureMonths,
    monthsMatched,
    monthsOneSided,
    monthsDisputed,
    latestMonth,
    meetsMinimum: monthsMatched >= 6,
  };
}
