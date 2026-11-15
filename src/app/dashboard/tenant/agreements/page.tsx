/**
 * Tenant: agreements waiting for my confirmation
 *
 * The tenant sees exactly what the landlord sent: the original message, the
 * structured terms and the same rule notes. Confirming seals the agreement
 * (both sides said yes) and starts the rental.
 */

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { FlagList, TermsTable, authHeaders } from "@/components/Ekmot";
import type { Agreement } from "@/types";

type Row = Agreement & { propertyAddress: string; landlordName: string };

export default function TenantAgreementsPage() {
  const [agreements, setAgreements] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/agreements", { headers: authHeaders() });
    const data = await res.json();
    if (data.success) setAgreements(data.agreements);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: "confirm" | "decline") => {
    setBusyId(id);
    await fetch(`/api/agreements/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ action }) });
    setBusyId(null);
    load();
  };

  return (
    <DashboardLayout role="tenant">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agreements</h1>
          <p className="text-gray-600 mt-1">Nothing counts until both you and your landlord confirm the same terms.</p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : agreements.length === 0 ? (
          <Card><p className="text-gray-500">No agreements yet. Your landlord starts one from their account.</p></Card>
        ) : (
          agreements.map((a) => (
            <Card key={a.id} title={`${a.landlordName} · ${a.propertyAddress.slice(0, 60)}`}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {a.termsText && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">Landlord's original message</p>
                      <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm italic">{a.termsText}</p>
                    </div>
                  )}
                  <TermsTable terms={a.terms} />
                  <p className="text-xs text-gray-500 mt-2">
                    {a.cityCorp}{a.ward ? `, ward ${a.ward}` : ""} · starts {a.startDate} · landlord confirmed {a.confirmed.landlord ? "✓" : "✗"} · you confirmed {a.confirmed.tenant ? "✓" : "✗"}
                  </p>
                  {a.status === "draft" && !a.confirmed.tenant && (
                    <div className="mt-4 flex gap-3">
                      <Button onClick={() => act(a.id, "confirm")} disabled={busyId === a.id}>I confirm these terms</Button>
                      <Button variant="outline" onClick={() => act(a.id, "decline")} disabled={busyId === a.id}>Decline</Button>
                    </div>
                  )}
                  {a.status === "confirmed" && (
                    <p className="mt-4 text-sm text-green-700 font-semibold">
                      Confirmed by both · fingerprint <span className="font-mono">{a.hash?.slice(0, 16)}…</span>
                    </p>
                  )}
                  {a.status === "declined" && <p className="mt-4 text-sm text-red-700">You declined this agreement.</p>}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Rule check</h4>
                  <FlagList flags={a.flags} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
