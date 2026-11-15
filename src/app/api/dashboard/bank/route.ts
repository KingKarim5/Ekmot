/**
 * Lender view: GET /api/dashboard/bank
 *
 * Ekmot replaces T-ODRE's 0-1000 score over every tenant with a Rent Record:
 * only tenants who gave this lender consent appear, consent expires after 30
 * days and can be revoked, and the lender sees facts with their evidence level.
 * The lender, not Ekmot, decides what the facts mean.
 */

import { NextRequest, NextResponse } from "next/server";
import { readJSON } from "@/utils/jsonDb";
import { getRequester } from "@/lib/serverAuth";
import { rentFacts } from "@/lib/rentRecord";
import type { Consent, Payment, Rental, RentRecord, User } from "@/types";

export async function GET(request: NextRequest) {
  const who = getRequester(request);
  if (!who || who.role !== "bank") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const [consents, users, rentals, payments] = await Promise.all([
    readJSON<Consent[]>("consents.json"),
    readJSON<User[]>("users.json"),
    readJSON<Rental[]>("rentals.json"),
    readJSON<Payment[]>("payments.json"),
  ]);
  const now = Date.now();
  const active = consents.filter((c) => c.lenderId === who.userId && !c.revokedAt && c.expiresAt > now);

  const records: RentRecord[] = active.map((c) => {
    const facts = rentFacts(c.tenantId, rentals, payments);
    return {
      tenantId: c.tenantId,
      tenantName: users.find((u) => u.id === c.tenantId)?.name ?? "Tenant",
      ...facts,
      consentExpiresAt: c.expiresAt,
    };
  });

  return NextResponse.json({ success: true, data: { records } });
}
