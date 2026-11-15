/**
 * Rent receipts from bKash / Nagad SMS, for tenant and landlord.
 * Each side pastes the SMS they received; when the transaction IDs and amounts
 * match, the month is "Matched by both SMS" and counts as paid.
 */

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Table from "@/components/Table";
import { EvidenceBadge, authHeaders } from "@/components/Ekmot";
import { parseSms } from "@/lib/smsParser";
import type { Payment, Rental } from "@/types";

type Row = { rental: Rental; address: string; otherParty: string; payments: Payment[] };

const SAMPLE = {
  tenant: "You have sent Tk 20,000.00 to 01712345678 successful. Ref rent. Fee Tk 0.00. Balance Tk 3,450.00. TrxID BKA7Q2M9XZ at 05/11/2026 10:15",
  landlord: "You have received Tk 20,000.00 from 01812345678. Ref rent. Fee Tk 0.00. Balance Tk 85,000.00. TrxID BKA7Q2M9XZ at 05/11/2026 10:15",
};

export default function SmsReceipts({ role }: { role: "tenant" | "landlord" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [rentalId, setRentalId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [sms, setSms] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch("/api/payments/sms", { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      setRows(data.rentals);
      if (!rentalId && data.rentals.length) setRentalId(data.rentals[0].rental.id);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = sms.trim() ? parseSms(sms) : null;

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payments/sms", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ rentalId, month, sms }),
      });
      const data = await res.json();
      if (data.success) {
        const ev = data.payment.evidence;
        setMessage({
          ok: true,
          text:
            (ev === "matched"
              ? "Matched: both SMS show the same transaction ID and amount. Receipt issued."
              : ev === "disputed"
              ? "The two SMS do not match. Check the transaction ID and amount with the other side."
              : `Saved. Waiting for the ${role === "tenant" ? "landlord" : "tenant"} to paste their SMS.`) +
            (data.warning ? ` Note: ${data.warning}` : ""),
        });
        setSms("");
        load();
      } else setMessage({ ok: false, text: data.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Rent receipts</h1>
          <p className="text-gray-600 mt-1">
            Paste the bKash or Nagad SMS you {role === "tenant" ? "got when you sent the rent" : "got when the rent arrived"}. When both sides' SMS match, the month is confirmed. No money moves through Ekmot.
          </p>
        </div>

        <Card title="Add an SMS">
          {rows.length === 0 ? (
            <p className="text-gray-500">No rentals yet. A rental starts when both sides confirm an agreement.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="text-gray-600">Rental</span>
                  <select className="mt-1 w-full border rounded-lg px-3 py-2" value={rentalId} onChange={(e) => setRentalId(e.target.value)}>
                    {rows.map((r) => (
                      <option key={r.rental.id} value={r.rental.id}>{r.otherParty} · {r.address.slice(0, 45)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-gray-600">Month this payment is for</span>
                  <input type="month" className="mt-1 w-full border rounded-lg px-3 py-2" value={month} onChange={(e) => setMonth(e.target.value)} />
                </label>
              </div>
              <label className="block text-sm mt-4">
                <span className="text-gray-600">SMS text</span>
                <textarea className="mt-1 w-full border rounded-lg px-3 py-2 h-24 font-mono text-xs" value={sms} onChange={(e) => setSms(e.target.value)} />
              </label>
              {preview && (
                <p className="text-sm text-gray-700 mt-2">
                  Read: {preview.provider} · {preview.direction} · amount {preview.amount !== undefined ? `৳${preview.amount.toLocaleString()}` : "?"} · transaction ID {preview.trxId ?? "?"}
                </p>
              )}
              <div className="mt-3 flex gap-3">
                <Button onClick={submit} disabled={busy || !sms.trim() || !rentalId}>Save SMS</Button>
                <Button variant="outline" onClick={() => setSms(SAMPLE[role])}>Paste sample SMS</Button>
              </div>
            </>
          )}
          {message && <p className={`mt-4 text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
        </Card>

        {rows.map((r) => (
          <Card key={r.rental.id} title={`${r.otherParty} · ${r.address.slice(0, 60)}`}>
            {r.payments.length === 0 ? (
              <p className="text-gray-500">No payments recorded yet.</p>
            ) : (
              <Table
                headers={["Month", "Amount", "Transaction ID", "Evidence"]}
                rows={r.payments.map((p) => [
                  p.month,
                  `৳${p.amount.toLocaleString()}`,
                  p.trxId ?? p.tenantTrxId ?? p.landlordTrxId ?? "—",
                  <EvidenceBadge key={p.id} level={p.evidence} />,
                ])}
              />
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
