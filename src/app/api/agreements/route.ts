/**
 * Ekmot agreements
 *
 * GET  /api/agreements  -> agreements for the signed-in tenant or landlord
 *                          (landlords also get their flats, for the form)
 * POST /api/agreements  -> landlord creates a draft and confirms their side
 *   body: { propertyId, tenantEmail, termsText, terms, startDate, extractedBy }
 */

import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, generateId } from "@/utils/jsonDb";
import { getRequester } from "@/lib/serverAuth";
import { checkTerms } from "@/lib/rules";
import type { Agreement, Property, TenancyTerms, User } from "@/types";

export async function GET(request: NextRequest) {
  const who = getRequester(request);
  if (!who || (who.role !== "tenant" && who.role !== "landlord")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const [agreements, users, properties] = await Promise.all([
    readJSON<Agreement[]>("agreements.json"),
    readJSON<User[]>("users.json"),
    readJSON<Property[]>("properties.json"),
  ]);
  const mine = agreements
    .filter((a) => (who.role === "tenant" ? a.tenantId : a.landlordId) === who.userId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((a) => ({
      ...a,
      propertyAddress: properties.find((p) => p.id === a.propertyId)?.address ?? "",
      tenantName: users.find((u) => u.id === a.tenantId)?.name ?? "",
      landlordName: users.find((u) => u.id === a.landlordId)?.name ?? "",
    }));
  const myProperties = who.role === "landlord" ? properties.filter((p) => p.ownerId === who.userId) : [];
  return NextResponse.json({ success: true, agreements: mine, properties: myProperties });
}

export async function POST(request: NextRequest) {
  const who = getRequester(request);
  if (!who || who.role !== "landlord") {
    return NextResponse.json({ success: false, message: "Only a landlord can start an agreement." }, { status: 401 });
  }
  const body = await request.json();
  const { propertyId, tenantEmail, termsText, startDate, extractedBy, cityCorp: bodyCorp, ward: bodyWard } = body;
  const terms: TenancyTerms = body.terms || {};

  const [users, properties, agreements] = await Promise.all([
    readJSON<User[]>("users.json"),
    readJSON<Property[]>("properties.json"),
    readJSON<Agreement[]>("agreements.json"),
  ]);

  const property = properties.find((p) => p.id === propertyId && p.ownerId === who.userId);
  if (!property) return NextResponse.json({ success: false, message: "Choose one of your flats." }, { status: 400 });

  const tenant = users.find((u) => u.email.toLowerCase() === String(tenantEmail || "").toLowerCase().trim() && u.role === "tenant");
  if (!tenant) return NextResponse.json({ success: false, message: "No tenant account with that email." }, { status: 400 });

  const cityCorp = property.cityCorp || (bodyCorp === "DSCC" ? "DSCC" : "DNCC");
  const now = Date.now();
  const agreement: Agreement = {
    id: generateId("ag"),
    landlordId: who.userId,
    tenantId: tenant.id,
    propertyId: property.id,
    cityCorp,
    ward: property.ward ?? (bodyWard ? Number(bodyWard) : undefined),
    termsText: String(termsText || ""),
    terms: { ...terms, monthlyRent: terms.monthlyRent ?? property.rent },
    extractedBy: extractedBy === "ai" ? "ai" : "offline",
    flags: [],
    confirmed: { landlord: true, landlordAt: now, tenant: false },
    status: "draft",
    startDate: startDate || new Date().toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
  agreement.flags = checkTerms(agreement.terms, cityCorp);

  agreements.push(agreement);
  await writeJSON("agreements.json", agreements);
  return NextResponse.json({ success: true, agreement });
}
