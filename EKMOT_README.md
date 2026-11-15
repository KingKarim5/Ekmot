# Ekmot: preliminary build (Nov 20)

Built on the T-ODRE prototype (Hossain, Rahim and Mahmud, IEOM Bangladesh 2025), MIT licence.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Log in with an email below; the 6-digit code appears in the terminal running `npm run dev` (look for `[Send OTP]`).

| Role | Email |
| --- | --- |
| Tenant (new, for the agreement demo) | rahim@test.ekmot |
| Landlord | karim@test.ekmot |
| Tenant with 11 months of history (synthetic demo data) | mahmud.hossain@test.ekmot |
| Lender | bank@example.com |
| Ministry | ministry@example.com |

### Optional: `.env.local`

```
AUTH_SECRET=any-long-random-text
GEMINI_API_KEY=your-key        # or OPENAI_API_KEY=your-key
AI_MODEL=gemini-2.5-flash      # optional; change if Google renames the model
```

Without an AI key, terms are read by the built-in offline reader, so the demo works without internet. `.env.local` is already in `.gitignore`; never commit it.

## What changed from T-ODRE

- **Login tokens are signed** (HMAC-SHA256, 7-day expiry); they can no longer be forged by hand. Old browser sessions must log in again.
- **Seed data cleaned:** Gmail addresses replaced with `@test.ekmot`; OTP logs emptied. Two demo flats added for Karim: Mirpur (DNCC, ward 2) and Dhanmondi (DSCC, ward 15). Mahmud Hossain's payments are marked as SMS-matched **synthetic demo data**.
- **Next.js** set to `^14.2.25` or newer (security fix).
- **Agreement template** now follows the 1991 Act on advance rent and DNCC's two-month notice.

## New features

| Screen | What it does |
| --- | --- |
| Landlord → Agreements | Type the deal in Bangla, Banglish or English → "Read terms" (AI or offline) → edit → live rule check (1991 Act for every flat; DNCC guideline too for DNCC wards) → confirm your side and send |
| Tenant → Agreements | See the original message, terms and the same rule notes → confirm or decline. When both confirm, the terms get a SHA-256 fingerprint and an active rental is created |
| Tenant / Landlord → Rent Receipts (SMS) | Each side pastes their own bKash or Nagad SMS. Same transaction ID and amount = "Matched by both SMS" (paid). One side = "One side only". Mismatch = "Disputed". No money moves through Ekmot |
| Tenant → Share My Record | 7-day link for a new landlord; 30-day, revocable consent for a lender. Plain-Bangla preview of what is shared |
| /share/&lt;link&gt; | Public page: months matched, one-sided, disputed, tenure, area and dates. No phone, email, full address, marital status, religion or gender |
| Lender → Rent Records | Replaces the 0–1,000 score. Shows only tenants who consented, with facts and evidence levels. Ekmot gives no score |

Code: `src/lib/rules.ts` (rule check), `src/lib/termsParser.ts` (offline reader), `src/lib/smsParser.ts`, `src/lib/rentRecord.ts`, `src/app/api/ai/extract-terms`, `src/app/api/agreements`, `src/app/api/payments/sms`, `src/app/api/share`.

## 3-minute demo script

1. **Landlord** (karim@test.ekmot) → Agreements → flat: Mirpur (DNCC) → tenant: rahim@test.ekmot → "Use example" → **Read terms**. The rule check flags: 6 months' advance (outside the Act and the DNCC guideline), a yearly 10% increase (outside DNCC's two-year rule), one month's notice (DNCC asks for two).
2. Change advance to **1**, increase every **24** months, notice **2** → the flags turn green → **Confirm my side and send**.
3. Switch the flat to **Dhanmondi (DSCC)** in a second try to show that only the Act applies there.
4. **Tenant** (rahim@test.ekmot) → Agreements → **I confirm these terms** → "Confirmed by both" with a fingerprint.
5. Tenant → Rent Receipts → **Paste sample SMS** → Save ("One side only"). Landlord → Rent Receipts → same month → **Paste sample SMS** → Save → **Matched by both SMS**.
6. Log in as **mahmud.hossain@test.ekmot** → Share My Record → create a link and open it (what a new landlord sees) → share with the bank.
7. **Lender** (bank@example.com) → Rent Records → Mahmud's record with evidence, no score. Back as Mahmud → **Stop sharing** → the lender's list is empty again.

Say on screen: Mahmud's history is synthetic demo data; the lender and ministry views are previews.

## Not done yet (finals)

Real database instead of JSON files; phone OTP; ministry view with computed ward medians and hidden small cells; fake-tenancy checks; dispute timeline; Advance Shield; Bangla rights assistant. Do not deploy publicly until the database and phone login are in place.
