/**
 * Lender view: Rent Records shared with consent.
 * Replaces T-ODRE's 0-1000 score over all tenants. Ekmot shows facts with their
 * evidence level; the lender applies its own credit policy.
 */

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Card from "@/components/Card";
import type { RentRecord } from "@/types";

export default function BankDashboard() {
  const [records, setRecords] = useState<RentRecord[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/bank", { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } })
      .then((r) => r.json())
      .then((d) => setRecords(d.success ? d.data.records : []))
      .catch(() => setRecords([]));
  }, []);

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Rent Records shared with you</h1>
          <p className="text-gray-600 mt-1">
            Only tenants who chose to share appear here, for 30 days at most. Ekmot gives facts and how strong the evidence is; your bank applies its own credit policy.
          </p>
        </div>

        {records === null ? (
          <p>Loading...</p>
        ) : records.length === 0 ? (
          <Card><p className="text-gray-500">No tenant has shared a Rent Record with you yet.</p></Card>
        ) : (
          records.map((r) => (
            <Card key={r.tenantId} title={r.tenantName}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  ["Months matched by both SMS", r.monthsMatched],
                  ["Months one side only", r.monthsOneSided],
                  ["Months disputed", r.monthsDisputed],
                  ["Months as a tenant", r.tenureMonths],
                  ["Tenancies", r.tenancies],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-600">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 items-center text-sm">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${r.meetsMinimum ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {r.meetsMinimum ? "Has 6+ matched months" : "Fewer than 6 matched months"}
                </span>
                <span className="text-gray-500">Latest month: {r.latestMonth ?? "—"}</span>
                <span className="text-gray-500">Shared until {new Date(r.consentExpiresAt).toLocaleDateString("en-GB")}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
