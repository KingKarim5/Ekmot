/**
 * Tenant-controlled sharing
 *
 * GET  /api/share                       -> my share links and lender consents
 * POST /api/share { kind: "link" }      -> new link for a prospective landlord, valid 7 days
 * POST /api/share { kind: "lender", lenderEmail } -> let one lender see my Rent Record for 30 days
 * POST /api/share { kind: "revoke", id } -> end a link or a consent now
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readJSON, writeJSON, generateId } from "@/utils/jsonDb";
import { getRequester } from "@/lib/serverAuth";
import type { Consent, ShareLink, User } from "@/types";

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const who = getRequester(request);
  if (!who || who.role !== "tenant") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const [links, consents, users] = await Promise.all([
    readJSON<ShareLink[]>("share_links.json"),
    readJSON<Consent[]>("consents.json"),
    readJSON<User[]>("users.json"),
  ]);
  return NextResponse.json({
    success: true,
    links: links.filter((l) => l.tenantId === who.userId),
    consents: consents
      .filter((c) => c.tenantId === who.userId)
      .map((c) => ({ ...c, lenderName: users.find((u) => u.id === c.lenderId)?.name ?? "" })),
    lenders: users.filter((u) => u.role === "bank").map((u) => ({ id: u.id, name: u.name, email: u.email })),
  });
}

export async function POST(request: NextRequest) {
  const who = getRequester(request);
  if (!who || who.role !== "tenant") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const now = Date.now();

  if (body.kind === "link") {
    const links = await readJSON<ShareLink[]>("share_links.json");
    const link: ShareLink = { id: crypto.randomBytes(16).toString("hex"), tenantId: who.userId, createdAt: now, expiresAt: now + 7 * DAY };
    links.push(link);
    await writeJSON("share_links.json", links);
    return NextResponse.json({ success: true, link });
  }

  if (body.kind === "lender") {
    const users = await readJSON<User[]>("users.json");
    const lender = users.find((u) => u.role === "bank" && u.email.toLowerCase() === String(body.lenderEmail || "").toLowerCase());
    if (!lender) return NextResponse.json({ success: false, message: "No lender with that email." }, { status: 400 });
    const consents = await readJSON<Consent[]>("consents.json");
    const consent: Consent = { id: generateId("cs"), tenantId: who.userId, lenderId: lender.id, createdAt: now, expiresAt: now + 30 * DAY };
    consents.push(consent);
    await writeJSON("consents.json", consents);
    return NextResponse.json({ success: true, consent });
  }

  if (body.kind === "revoke") {
    const links = await readJSON<ShareLink[]>("share_links.json");
    const link = links.find((l) => l.id === body.id && l.tenantId === who.userId);
    if (link) {
      link.expiresAt = now;
      await writeJSON("share_links.json", links);
      return NextResponse.json({ success: true });
    }
    const consents = await readJSON<Consent[]>("consents.json");
    const consent = consents.find((c) => c.id === body.id && c.tenantId === who.userId);
    if (consent) {
      consent.revokedAt = now;
      await writeJSON("consents.json", consents);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: false, message: "Unknown request" }, { status: 400 });
}
