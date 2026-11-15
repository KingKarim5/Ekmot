/**
 * Rent receipts from pasted bKash / Nagad SMS
 *
 * GET  /api/payments/sms                      -> my rentals and their payments with evidence
 * POST /api/payments/sms { rentalId, month, sms }
 *
 * The tenant pastes the "sent" SMS, the landlord pastes the "received" SMS.
 *  - one side only                      -> evidence "one-sided", status "pending"
 *  - both, same transaction ID + amount -> evidence "matched",   status "paid"
 *  - both, but they disagree            -> evidence "disputed",  status "pending"
 * No money moves through Ekmot.
 */

import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, generateId } from "@/utils/jsonDb";
import { getRequester } from "@/lib/serverAuth";
import { parseSms } from "@/lib/smsParser";
import type { Payment, Property, Rental, User } from "@/types";

function evaluate(p: Payment) {
  const t = p.tenantSms ? parseSms(p.tenantSms) : null;
  const l = p.landlordSms ? parseSms(p.landlordSms) : null;
  if (t && l) {
    const same = !!t.trxId && t.trxId === l.trxId && t.amount !== undefined && t.amount === l.amount;
    p.evidence = same ? "matched" : "disputed";
    p.status = same ? "paid" : "pending";
    if (same) p.trxId = t.trxId;
  } else {
    p.evidence = "one-sided";
    p.status = "pending";
  }
}

export async function GET(request: NextRequest) {
  const who = getRequester(request);
  if (!who || (who.role !== "tenant" && who.role !== "landlord")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const [rentals, payments, properties, users] = await Promise.all([
    readJSON<Rental[]>("rentals.json"),
    readJSON<Payment[]>("payments.json"),
    readJSON<Property[]>("properties.json"),
    readJSON<User[]>("users.json"),
  ]);
  const mine = rentals.filter((r) => (who.role === "tenant" ? r.tenantId : r.landlordId) === who.userId);
  const data = mine.map((r) => ({
    rental: r,
    address: properties.find((p) => p.id === r.propertyId)?.address ?? "",
    otherParty: users.find((u) => u.id === (who.role === "tenant" ? r.landlordId : r.tenantId))?.name ?? "",
    payments: payments.filter((p) => p.rentalId === r.id).sort((a, b) => b.month.localeCompare(a.month)),
  }));
  return NextResponse.json({ success: true, rentals: data });
}

export async function POST(request: NextRequest) {
  const who = getRequester(request);
  if (!who || (who.role !== "tenant" && who.role !== "landlord")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { rentalId, month, sms } = await request.json();
  if (!rentalId || !/^\d{4}-\d{2}$/.test(String(month)) || !sms) {
    return NextResponse.json({ success: false, message: "Choose the rental and month, and paste the SMS." }, { status: 400 });
  }

  const rentals = await readJSON<Rental[]>("rentals.json");
  const rental = rentals.find((r) => r.id === rentalId);
  const allowed = rental && (who.role === "tenant" ? rental.tenantId : rental.landlordId) === who.userId;
  if (!rental || !allowed) return NextResponse.json({ success: false, message: "Not your rental" }, { status: 403 });

  const parsed = parseSms(String(sms));
  if (!parsed.trxId || parsed.amount === undefined) {
    return NextResponse.json(
      { success: false, message: "Could not find a transaction ID and amount in that SMS.", parsed },
      { status: 400 }
    );
  }

  const payments = await readJSON<Payment[]>("payments.json");
  let p = payments.find((x) => x.rentalId === rentalId && x.month === month);
  if (!p) {
    p = {
      id: generateId("pay"),
      rentalId,
      month,
      amount: parsed.amount,
      status: "pending",
      timestamp: Date.now(),
      method: parsed.provider,
    };
    payments.push(p);
  }
  if (p.evidence === "matched" && p.status === "paid" && !p.tenantSms && !p.landlordSms) {
    return NextResponse.json({ success: false, message: "This month is already recorded." }, { status: 400 });
  }

  if (who.role === "tenant") { p.tenantSms = String(sms); p.tenantTrxId = parsed.trxId; }
  else { p.landlordSms = String(sms); p.landlordTrxId = parsed.trxId; }
  p.amount = parsed.amount;
  p.method = parsed.provider;
  evaluate(p);

  await writeJSON("payments.json", payments);
  const warning =
    who.role === "tenant" && parsed.direction === "received"
      ? "This looks like a 'received' SMS. Tenants should paste the SMS they got when sending money."
      : who.role === "landlord" && parsed.direction === "sent"
      ? "This looks like a 'sent' SMS. Landlords should paste the SMS they got when receiving money."
      : undefined;
  return NextResponse.json({ success: true, payment: p, parsed, warning });
}
