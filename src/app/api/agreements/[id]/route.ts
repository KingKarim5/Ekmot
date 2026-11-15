/**
 * PATCH /api/agreements/:id
 *   { action: "confirm" }                 -> tenant or landlord says yes
 *   { action: "decline" }                 -> tenant says no
 *   { action: "update", terms, termsText } -> landlord edits; tenant must confirm again
 *
 * When both sides have confirmed, the terms are fingerprinted (sha256) and an
 * active rental is created from them.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readJSON, writeJSON, generateId } from "@/utils/jsonDb";
import { getRequester } from "@/lib/serverAuth";
import { checkTerms } from "@/lib/rules";
import type { Agreement, Property, Rental } from "@/types";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const who = getRequester(request);
  if (!who || (who.role !== "tenant" && who.role !== "landlord")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { action, terms, termsText } = await request.json();
  const agreements = await readJSON<Agreement[]>("agreements.json");
  const a = agreements.find((x) => x.id === params.id);
  if (!a) return NextResponse.json({ success: false, message: "Agreement not found" }, { status: 404 });

  const isLandlord = who.role === "landlord" && a.landlordId === who.userId;
  const isTenant = who.role === "tenant" && a.tenantId === who.userId;
  if (!isLandlord && !isTenant) return NextResponse.json({ success: false, message: "Not your agreement" }, { status: 403 });
  if (a.status !== "draft") return NextResponse.json({ success: false, message: `This agreement is already ${a.status}.` }, { status: 400 });

  const now = Date.now();

  if (action === "update") {
    if (!isLandlord) return NextResponse.json({ success: false, message: "Only the landlord edits the draft." }, { status: 403 });
    a.terms = { ...a.terms, ...(terms || {}) };
    if (typeof termsText === "string") a.termsText = termsText;
    a.flags = checkTerms(a.terms, a.cityCorp);
    a.confirmed = { landlord: true, landlordAt: now, tenant: false };
  } else if (action === "decline") {
    if (!isTenant) return NextResponse.json({ success: false, message: "Only the tenant can decline." }, { status: 403 });
    a.status = "declined";
  } else if (action === "confirm") {
    if (isLandlord) { a.confirmed.landlord = true; a.confirmed.landlordAt = now; }
    if (isTenant) { a.confirmed.tenant = true; a.confirmed.tenantAt = now; }
  } else {
    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  }

  // Both sides said yes: seal the terms and create the rental
  if (a.status === "draft" && a.confirmed.landlord && a.confirmed.tenant) {
    a.status = "confirmed";
    const sealed = JSON.stringify({
      terms: a.terms, cityCorp: a.cityCorp, ward: a.ward ?? null, propertyId: a.propertyId,
      tenantId: a.tenantId, landlordId: a.landlordId, startDate: a.startDate,
      landlordAt: a.confirmed.landlordAt, tenantAt: a.confirmed.tenantAt,
    });
    a.hash = crypto.createHash("sha256").update(sealed).digest("hex");

    const [rentals, properties] = await Promise.all([
      readJSON<Rental[]>("rentals.json"),
      readJSON<Property[]>("properties.json"),
    ]);
    const property = properties.find((p) => p.id === a.propertyId);
    const rental: Rental = {
      id: generateId("r"),
      tenantId: a.tenantId,
      landlordId: a.landlordId,
      propertyId: a.propertyId,
      startDate: a.startDate,
      status: "active",
      monthlyRent: a.terms.monthlyRent ?? property?.rent ?? 0,
      createdAt: new Date(now).toISOString(),
      agreementId: a.id,
      cityCorp: a.cityCorp,
      ward: a.ward,
      advanceMonths: a.terms.advanceMonths,
      noticeMonths: a.terms.noticeMonths,
      confirmed: a.confirmed,
    };
    rentals.push(rental);
    a.rentalId = rental.id;
    if (property) property.available = false;
    await writeJSON("rentals.json", rentals);
    await writeJSON("properties.json", properties);
  }

  a.updatedAt = now;
  await writeJSON("agreements.json", agreements);
  return NextResponse.json({ success: true, agreement: a });
}
