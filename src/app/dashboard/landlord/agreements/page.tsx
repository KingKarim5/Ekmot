/**
 * Landlord: new Ekmot agreement
 *
 * 1. Type the deal the way you would text it (Bangla, Banglish or English).
 * 2. "Read terms" turns it into structured terms (AI, or the offline reader).
 * 3. The rule check shows, in Bangla and English, anything outside the
 *    1991 Act or the city corporation's guideline. Fix it here.
 * 4. Confirm and send: the tenant sees the same terms and flags and confirms.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { FlagList, TermsTable, authHeaders } from "@/components/Ekmot";
import { checkTerms } from "@/lib/rules";
import type { Agreement, Property, TenancyTerms } from "@/types";

type Row = Agreement & { propertyAddress: string; tenantName: string };

const EXAMPLE = "bhara 20 hajar, 6 mash advance, protibochor 10% barbe, 1 mash notice";

const FIELDS: { key: keyof TenancyTerms; label: string }[] = [
  { key: "monthlyRent", label: "Monthly rent (৳)" },
  { key: "advanceMonths", label: "Advance (months)" },
  { key: "securityDeposit", label: "Security deposit (৳)" },
  { key: "increasePercent", label: "Rent increase (%)" },
  { key: "increaseEveryMonths", label: "Increase every (months)" },
  { key: "noticeMonths", label: "Notice (months)" },
];

export default function LandlordAgreementsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [agreements, setAgreements] = useState<Row[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [text, setText] = useState("");
  const [terms, setTerms] = useState<TenancyTerms | null>(null);
  const [extractedBy, setExtractedBy] = useState<"ai" | "offline">("offline");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    const res = await fetch("/api/agreements", { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      setProperties(data.properties);
      setAgreements(data.agreements);
      if (!propertyId && data.properties.length) setPropertyId(data.properties[0].id);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const property = properties.find((p) => p.id === propertyId);
  const cityCorp = property?.cityCorp ?? "DNCC";
  const flags = useMemo(() => (terms ? checkTerms(terms, cityCorp) : []), [terms, cityCorp]);

  const readTerms = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/extract-terms", { method: "POST", headers: authHeaders(), body: JSON.stringify({ text }) });
      const data = await res.json();
      if (data.success) {
        setTerms({ monthlyRent: property?.rent, ...data.terms });
        setExtractedBy(data.extractedBy);
      } else setMessage({ ok: false, text: data.message });
    } finally {
      setBusy(false);
    }
  };

  const setField = (key: keyof TenancyTerms, value: string) => {
    setTerms((t) => {
      const next = { ...(t || {}) };
      if (value === "") delete next[key];
      else next[key] = Number(value);
      return next;
    });
  };

  const send = async () => {
    if (!terms || !property) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ propertyId, tenantEmail, termsText: text, terms, startDate, extractedBy }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ ok: true, text: "Sent. The tenant will see the same terms and rule notes, and can confirm or decline." });
        setText("");
        setTerms(null);
        load();
      } else setMessage({ ok: false, text: data.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout role="landlord">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agreements</h1>
          <p className="text-gray-600 mt-1">Write the deal the way you would text it. Ekmot reads it, checks it against the rules, and both of you confirm.</p>
        </div>

        <Card title="New agreement">
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm">
              <span className="text-gray-600">Flat</span>
              <select className="mt-1 w-full border rounded-lg px-3 py-2" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address.slice(0, 50)} {p.cityCorp ? `(${p.cityCorp}${p.ward ? `, ward ${p.ward}` : ""})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Tenant's email</span>
              <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="rahim@test.ekmot" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Start date</span>
              <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Rules checked: Premises Rent Control Act 1991{cityCorp === "DNCC" ? " + DNCC guideline (Jan 2026)" : " (DSCC has no separate guideline)"}
          </p>

          <label className="block text-sm mt-4">
            <span className="text-gray-600">The deal, in Bangla, Banglish or English</span>
            <textarea className="mt-1 w-full border rounded-lg px-3 py-2 h-24" placeholder={EXAMPLE} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="mt-3 flex gap-3">
            <Button onClick={readTerms} disabled={busy || !text.trim()}>{busy ? "Reading..." : "Read terms"}</Button>
            <Button variant="outline" onClick={() => setText(EXAMPLE)}>Use example</Button>
          </div>

          {terms && (
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800">
                  Terms {extractedBy === "ai" ? "read by AI" : "read by the offline reader"}. Check and edit:
                </h4>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {FIELDS.map((f) => (
                    <label key={f.key} className="text-sm">
                      <span className="text-gray-600">{f.label}</span>
                      <input
                        type="number"
                        min={0}
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={terms[f.key] ?? ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <Button onClick={send} disabled={busy || !tenantEmail}>Confirm my side and send to tenant</Button>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Rule check</h4>
                <FlagList flags={flags} />
              </div>
            </div>
          )}

          {message && (
            <p className={`mt-4 text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>
          )}
        </Card>

        <Card title="My agreements">
          {agreements.length === 0 ? (
            <p className="text-gray-500">No agreements yet.</p>
          ) : (
            <div className="space-y-4">
              {agreements.map((a) => (
                <div key={a.id} className="border rounded-lg p-4">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">{a.tenantName} · {a.propertyAddress.slice(0, 60)}</p>
                      <p className="text-xs text-gray-500">{a.cityCorp}{a.ward ? `, ward ${a.ward}` : ""} · starts {a.startDate}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold h-fit ${a.status === "confirmed" ? "bg-green-100 text-green-800" : a.status === "declined" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                      {a.status === "confirmed" ? "Confirmed by both" : a.status === "declined" ? "Declined by tenant" : "Waiting for tenant"}
                    </span>
                  </div>
                  <div className="mt-3"><TermsTable terms={a.terms} /></div>
                  {a.hash && <p className="mt-2 text-xs text-gray-500 font-mono">Fingerprint: {a.hash.slice(0, 16)}…</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
