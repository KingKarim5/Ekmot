/**
 * GET /api/share/:token  (public, no login)
 *
 * What a prospective landlord sees from a tenant's share link: confirmed facts
 * about past tenancies and payments. No phone, email, marital status, religion
 * or gender is ever included.
 */

import { NextRequest, NextResponse } from "next/server";
import { readJSON } from "@/utils/jsonDb";
import { rentFacts } from "@/lib/rentRecord";
import type { Agreement, Payment, Property, Rental, ShareLink, User } from "@/types";

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const links = await readJSON<ShareLink[]>("share_links.json");
  const link = links.find((l) => l.id === params.token);
  if (!link || link.expiresAt < Date.now()) {
    return NextResponse.json({ success: false, message: "This link has expired or does not exist." }, { status: 404 });
  }
  const [users, rentals, payments, properties, agreements] = await Promise.all([
    readJSON<User[]>("users.json"),
    readJSON<Rental[]>("rentals.json"),
    readJSON<Payment[]>("payments.json"),
    readJSON<Property[]>("properties.json"),
    readJSON<Agreement[]>("agreements.json"),
  ]);
  const tenant = users.find((u) => u.id === link.tenantId);
  const tenancies = rentals
    .filter((r) => r.tenantId === link.tenantId)
    .map((r) => {
      const area = properties.find((p) => p.id === r.propertyId)?.address.split(",").slice(-2).join(",").trim() ?? "";
      const pays = payments.filter((p) => p.rentalId === r.id);
      const agreement = agreements.find((a) => a.id === r.agreementId);
      return {
        area, // area only, not the full address
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        confirmedByBoth: !!agreement && agreement.status === "confirmed",
        months: pays.length,
        matched: pays.filter((p) => p.evidence === "matched").length,
        disputed: pays.filter((p) => p.evidence === "disputed").length,
      };
    });
  return NextResponse.json({
    success: true,
    tenantName: tenant?.name ?? "Tenant",
    expiresAt: link.expiresAt,
    facts: rentFacts(link.tenantId, rentals, payments),
    tenancies,
  });
}
