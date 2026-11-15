/**
 * Lender: how Ekmot's Rent Record works (replaces the old score page).
 */

"use client";

import DashboardLayout from "@/components/DashboardLayout";
import Card from "@/components/Card";

export default function HowRentRecordsWork() {
  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">How Rent Records work</h1>
        <Card title="What you see">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>Only tenants who chose to share with your bank, for up to 30 days. They can stop sharing at any time.</li>
            <li>Each month of rent is shown with its evidence: <b>matched</b> (the tenant's and landlord's bKash or Nagad SMS show the same transaction ID and amount), <b>one side only</b>, or <b>disputed</b>.</li>
            <li>The tenancy agreement behind each rental was confirmed by both tenant and landlord and fingerprinted, so it cannot be changed afterwards without showing.</li>
          </ul>
        </Card>
        <Card title="What Ekmot does not do">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>Ekmot gives no credit score. Your bank applies its own policy, and a person can review any decision.</li>
            <li>No gender, religion or marital status is ever recorded or shared.</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
