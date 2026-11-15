/**
 * Tenant: share my rent history
 *
 * - A link for a prospective landlord ("Apply with Ekmot"), valid 7 days.
 * - Consent for one lender to see my Rent Record, valid 30 days, revocable.
 * Before each share the tenant sees, in plain Bangla, exactly what is shared.
 */

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { authHeaders } from "@/components/Ekmot";
import type { Consent, ShareLink } from "@/types";

type ConsentRow = Consent & { lenderName: string };

export default function TenantSharePage() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [lenders, setLenders] = useState<{ id: string; name: string; email: string }[]>([]);
  const [lenderEmail, setLenderEmail] = useState("");
  const [origin, setOrigin] = useState("");

  const load = async () => {
    const res = await fetch("/api/share", { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      setLinks(data.links);
      setConsents(data.consents);
      setLenders(data.lenders);
      if (!lenderEmail && data.lenders.length) setLenderEmail(data.lenders[0].email);
    }
  };

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const post = async (body: object) => {
    await fetch("/api/share", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
    load();
  };

  const now = Date.now();
  const fmt = (t: number) => new Date(t).toLocaleDateString("en-GB");

  return (
    <DashboardLayout role="tenant">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Share my rent history</h1>
          <p className="text-gray-600 mt-1">You decide who sees your record, and for how long.</p>
        </div>

        <Card title="Apply for a new flat">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
            <p>যিনি লিংকটি পাবেন, তিনি দেখবেন: কত মাস ভাড়া দিয়েছেন, কত মাস দুই পক্ষের এসএমএস মিলেছে, এলাকা ও সময়কাল।</p>
            <p className="mt-1">They will see: how many months you paid, how many were matched by both sides' SMS, the area and dates. Not your phone, email, full address, marital status, religion or gender.</p>
          </div>
          <div className="mt-3"><Button onClick={() => post({ kind: "link" })}>Create a 7-day link</Button></div>
          <div className="mt-4 space-y-2">
            {links.map((l) => {
              const live = l.expiresAt > now;
              const url = `${origin}/share/${l.id}`;
              return (
                <div key={l.id} className="flex flex-wrap items-center gap-3 text-sm border rounded-lg p-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${live ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{live ? `Valid until ${fmt(l.expiresAt)}` : "Ended"}</span>
                  {live && <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">{url}</a>}
                  {live && <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(url)}>Copy</Button>}
                  {live && <Button size="sm" variant="danger" onClick={() => post({ kind: "revoke", id: l.id })}>End now</Button>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Let a lender see my Rent Record">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
            <p>ঋণদাতা ৩০ দিন আপনার ভাড়ার রেকর্ড দেখতে পারবে। যেকোনো সময় বন্ধ করতে পারবেন।</p>
            <p className="mt-1">The lender sees your Rent Record for 30 days: tenancies, months in each evidence level, and whether you have six or more matched months. Ekmot gives no score. You can stop it at any time.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            <select className="border rounded-lg px-3 py-2 text-sm" value={lenderEmail} onChange={(e) => setLenderEmail(e.target.value)}>
              {lenders.map((l) => <option key={l.id} value={l.email}>{l.name}</option>)}
            </select>
            <Button onClick={() => post({ kind: "lender", lenderEmail })} disabled={!lenderEmail}>I agree to share for 30 days</Button>
          </div>
          <div className="mt-4 space-y-2">
            {consents.map((c) => {
              const live = !c.revokedAt && c.expiresAt > now;
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 text-sm border rounded-lg p-3">
                  <span className="font-medium">{c.lenderName}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${live ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {live ? `Sharing until ${fmt(c.expiresAt)}` : c.revokedAt ? "Stopped" : "Ended"}
                  </span>
                  {live && <Button size="sm" variant="danger" onClick={() => post({ kind: "revoke", id: c.id })}>Stop sharing</Button>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
