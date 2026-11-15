/**
 * Public page a tenant sends to a prospective landlord.
 * Confirmed facts only; no contact details or personal attributes.
 */

"use client";

import { useEffect, useState } from "react";

interface Tenancy {
  area: string;
  startDate: string;
  endDate?: string;
  status: string;
  confirmedByBoth: boolean;
  months: number;
  matched: number;
  disputed: number;
}

interface Data {
  tenantName: string;
  expiresAt: number;
  facts: { tenancies: number; tenureMonths: number; monthsMatched: number; monthsOneSided: number; monthsDisputed: number };
  tenancies: Tenancy[];
}

export default function SharedRecordPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then((r) => r.json())
      .then((d) => (d.success ? setData(d) : setError(d.message)))
      .catch(() => setError("Could not load this record."));
  }, [params.token]);

  if (error) return <main className="max-w-2xl mx-auto p-6"><p className="text-red-700">{error}</p></main>;
  if (!data) return <main className="max-w-2xl mx-auto p-6"><p>Loading...</p></main>;

  const f = data.facts;
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <p className="text-sm text-gray-500">Ekmot · rent history shared by the tenant</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">{data.tenantName}</h1>
        <p className="text-sm text-gray-500 mt-1">This link ends on {new Date(data.expiresAt).toLocaleDateString("en-GB")}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Months matched by both sides' SMS", f.monthsMatched],
          ["Months recorded by one side", f.monthsOneSided],
          ["Months disputed", f.monthsDisputed],
          ["Months as a tenant", f.tenureMonths],
        ].map(([label, value]) => (
          <div key={String(label)} className="border rounded-lg p-4 bg-white">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="p-3">Area</th><th className="p-3">Period</th><th className="p-3">Agreement</th><th className="p-3">Months matched</th>
            </tr>
          </thead>
          <tbody>
            {data.tenancies.map((t, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-3">{t.area}</td>
                <td className="p-3">{t.startDate} → {t.endDate ?? "now"}</td>
                <td className="p-3">{t.confirmedByBoth ? "Confirmed by both" : "Recorded before Ekmot"}</td>
                <td className="p-3">{t.matched} of {t.months}{t.disputed ? ` · ${t.disputed} disputed` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Ekmot shows confirmed facts and how strong the evidence is. It does not rate tenants and never shares phone, email, full address, marital status, religion or gender.
      </p>
    </main>
  );
}
