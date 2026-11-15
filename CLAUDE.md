# Ekmot

Ekmot builds on the T-ODRE prototype (Hossain, Rahim and Mahmud, IEOM Bangladesh 2025; MIT licence, keep the credit). Tenant and landlord confirm every term and payment. That confirmed record feeds two more users:
- a lender, with the tenant's consent;
- the government, as ward-level totals only.

The full spec, feature list and status are in `docs/EKMOT_SPEC.md`. Read it before starting a feature. Run steps and the demo script are in `EKMOT_README.md`.

## Commands

- `npm install`, then `npm run dev`, then open http://localhost:3000. The OTP code is printed in the dev server terminal.
- `npm run build` must pass before any commit to main.
- Test logins:
  - landlord: karim@test.ekmot
  - tenant: rahim@test.ekmot
  - tenant with synthetic history: mahmud.hossain@test.ekmot
  - lender: bank@example.com
  - ministry: ministry@example.com

## Stack

- Next.js 14 App Router, TypeScript (strict), Tailwind.
- Data lives in JSON files in `src/data`, accessed through `src/utils/jsonDb.ts`.
- Every API route authenticates with `getRequester(request)` from `src/lib/serverAuth.ts`. Client fetches use `authHeaders()` from `src/components/Ekmot.tsx`.
- Ekmot types are at the end of `src/types/index.ts`. New fields on existing types must stay optional, so old records still load.

## Rules that must not be broken

1. **Both sides confirm.** Nothing counts as fact until tenant and landlord both confirm it. Every payment carries an evidence level: `matched`, `one-sided` or `disputed`.
2. **AI extracts, code checks, people decide.**
   - Rule checks live in `src/lib/rules.ts` and are plain, deterministic code.
   - The LLM never rules on disputes and never gives a credit score.
   - Whenever the AI route is used, keep the offline fallback (`src/lib/termsParser.ts`).
3. **Lenders see a tenant's data only with active consent:** 30 days at most, and revocable.
4. **Government sees aggregates only.** Hide any cell with fewer than 10 tenancies. Never show an individual household.
5. **No protected attributes.** Never store or share gender, religion or marital status, or anything that stands in for them.
6. **Wording.** Say "outside the Act" or "outside the guideline", never "illegal". Where the 1991 Act and the DNCC guideline disagree, show both.
7. **Location rules.** Every flat is checked against the 1991 Act. DNCC wards also get the DNCC guideline. DSCC has no guideline yet. A new city layer is a rule table, not new logic.
8. **Rent plausibility stays internal.** A rent that looks implausible only lowers that record's weight. It is never reported to the government.
9. **Label demo data.** Synthetic data and preview screens are marked as such in the UI.
10. **No public deployment** until the JSON storage and the email-OTP login are replaced (spec features F-05 and F-04).

## Working style

- Keep the T-ODRE code that works. Replace only what the spec marks Rebuilt.
- Put shared logic in `src/lib` and keep API routes thin.
- Write user-facing text in plain English, with Bangla where the screen faces tenants or landlords.
