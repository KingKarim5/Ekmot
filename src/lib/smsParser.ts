/**
 * Reads a bKash or Nagad SMS that a tenant or landlord pastes in.
 *
 * Android apps on Google Play cannot read SMS by themselves, so each side
 * pastes their own message. When the tenant's "sent" SMS and the landlord's
 * "received" SMS carry the same transaction ID and amount, the payment is
 * "matched". Formats vary, so people always see what was read before saving.
 */

export interface ParsedSms {
  provider: "bkash" | "nagad" | "unknown";
  direction: "sent" | "received" | "unknown";
  amount?: number;
  trxId?: string;
  counterparty?: string; // the other phone number in the message
  date?: string; // YYYY-MM-DD if found
}

export function parseSms(raw: string): ParsedSms {
  const text = raw.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();

  const provider: ParsedSms["provider"] = /trxid|bkash/.test(lower)
    ? "bkash"
    : /txnid|nagad/.test(lower)
    ? "nagad"
    : "unknown";

  const direction: ParsedSms["direction"] = /received|sender|from 01/.test(lower)
    ? "received"
    : /sent|send money|receiver|to 01|payment/.test(lower)
    ? "sent"
    : "unknown";

  const amountMatch =
    text.match(/amount\s*:?\s*(?:tk\.?|৳)?\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    text.match(/(?:tk\.?|৳)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? Math.round(parseFloat(amountMatch[1].replace(/,/g, ""))) : undefined;

  const trxMatch = text.match(/(?:trx\s*id|txn\s*id|transaction\s*id|trxid|txnid)\s*[:#.]?\s*([A-Z0-9]{6,20})/i);
  const trxId = trxMatch ? trxMatch[1].toUpperCase() : undefined;

  const phoneMatch = text.match(/(?:\+?88)?(01[3-9]\d{8})/);
  const counterparty = phoneMatch ? phoneMatch[1] : undefined;

  let date: string | undefined;
  const d = text.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (d) date = `${d[3]}-${d[2]}-${d[1]}`;

  return { provider, direction, amount, trxId, counterparty, date };
}
