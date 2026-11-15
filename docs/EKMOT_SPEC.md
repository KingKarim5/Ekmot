# Ekmot: system specification

Last updated: 15 November 2026. Team: Team_Excuse me. Event: AI Builders Congress 2026 (CloudCamp Bangladesh), preliminary due 20 Nov 2026, finals 26 Dec 2026 at Daffodil International University.

---

## 1. What Ekmot is

Ekmot (একমত, "in agreement") turns a rent deal in Dhaka into a record that **both tenant and landlord confirm**. That confirmed record is the data pipeline for two more users:

- a **lender** can see a tenant's rent history, only with the tenant's consent, to lend without collateral;
- the **government** can see ward-level totals, never one household, to oversee the rental market.

One line: *T-ODRE built the pipe; Ekmot makes sure what flows through it is true, and only reaches people allowed to see it.*

## 2. The problem

- Most of Dhaka rents (the T-ODRE paper cites about 90% of the capital), but deals are verbal, rent is paid by bKash or cash with no receipt, and records do not exist.
- Tenants lose advances and cannot prove the flat's condition; good tenants are refused on stereotypes such as being a bachelor.
- Landlords cannot prove late payment or damage either.
- Renters without collateral cannot borrow, because their on-time rent is invisible to lenders.
- The government cannot see rents: the Premises Rent Control Act 1991 is rarely followed, DNCC issued a guideline in January 2026 with no system behind it, and in December 2025 the High Court asked the government, DNCC and DSCC why an area-wise rent policy should not be adopted.

## 3. Prior work: the T-ODRE paper and prototype

**Paper:** Shahriar Hossain, Kazi Abdur Rahim, Mehzabin Mahmud (BRAC University, EEE), *Transparency-Oriented Digital Rental Ecosystem (T-ODRE Model) for Economical Equity and Sustainability*, 8th IEOM Bangladesh Conference, 20–21 Dec 2025, DOI 10.46254/BA08.20250235. Code: github.com/KaziAbdurRahim/landlord (MIT). Ekmot is built on this code with the authors' agreement; keep the licence and credit.

**Idea:** solve the rental problem as one ecosystem for four stakeholders (tenant, landlord, bank or creditor, regulator), not as separate apps.

**Objectives:** reduce information asymmetry; traceable, immutable rental interactions; a credit portfolio from rent history; aggregated, anonymised statistics for regulators; data-driven housing decisions; a modular platform.

**Method:**

1. Identified operational gaps in Dhaka's rental market and the four stakeholders.
2. Reviewed platforms abroad (RentPayment, USA; RentBetter, Australia) and at home (Bproperty, To-Let); none connects all four.
3. Designed four divisions: **interface** (role dashboards), **logic** (KYC, contracts, payments, receipts, analytics), **data management** (users, properties, payments, reviews, market rates), **integration** (bank APIs, government ID, payment gateways, regulatory stats).
4. Data flow: register and verify → landlord lists or tenant searches → contract by agreement of both → payment → automatic receipt, tenant history and landlord income log updated → analytics and compliance.
5. Built a prototype with role-based modules: identity, property and renting, contract management, payment and receipt, rental history and portfolio, admin.
6. Expected outcomes per stakeholder, mapped to SDG 8, 10 and 11.
7. Future work: scale, secondary cities, national ID and land and tax data, blockchain smart contracts, geospatial rent heat map.

**Paper vs code:** the paper describes Express and MongoDB on Vercel; the repository is Next.js 14 (App Router, TypeScript, Tailwind) with API routes and JSON files in `src/data`.

**What the prototype left open** (normal for a prototype; this is Ekmot's job list):

- records are entered by one side and taken as true;
- a payment was marked paid the moment the tenant clicked;
- the bank API returned every tenant's history without consent (the paper intended consent);
- the credit score was 500 + 7 × on-time %, capped at 1,000, so one paid month scored 1,000;
- ministry rent averages were hard-coded (Tk 12,000, 25,000, 18,000) and areas matched by address text;
- the login token was unsigned (`userId_role_time_random`) and could be forged;
- data in JSON files does not persist on Vercel's serverless hosting.

## 4. Design principles (do not break these)

1. **Both sides confirm.** Nothing counts as fact until tenant and landlord both confirm it.
2. **Evidence decides weight.** Every record carries how strong its proof is: `matched` (both sides' SMS agree), `one-sided`, or `disputed`. Records from before Ekmot count as one-sided.
3. **AI extracts, code checks, people decide.** The LLM only turns text into structured fields. Rule checks are plain, deterministic code. People confirm. The platform never rules on disputes and never gives a credit score.
4. **Share only what is allowed.** Lenders see a tenant's record only with consent (30 days max, revocable). Government sees ward aggregates only, with cells under 10 tenancies hidden.
5. **No protected attributes.** Never store or share gender, religion or marital status, and nothing that stands in for them. Removing the "bachelor" bias is part of the product.
6. **Wording.** Say "outside the Act" or "outside the guideline", never "illegal". Show both sources when they disagree.
7. **Rent plausibility stays internal.** A rent far below its ward median only lowers that record's weight; it is never reported to government (holding tax risk would drive landlords away).
8. **Honest demos.** Synthetic data and preview screens are labelled as such.

## 5. Stakeholders and what each gets

| Stakeholder | Gets | Never gets |
| --- | --- | --- |
| Tenant | Confirmed agreement, matched receipts, advance protection, a portable record, control over sharing | — |
| Landlord | Proof against false claims, compliant agreements, a track record, a tenant's shared history | A searchable tenant pool or blacklist |
| Lender | Consented Rent Record with evidence levels | A score from Ekmot; any data without consent |
| Government (DNCC, DSCC, ministry) | Ward medians, compliance indicators, dispute topics | Any individual household's rent |

## 6. Rules engine (`src/lib/rules.ts`)

**Layer 1, every flat in Dhaka: Premises Rent Control Act 1991**

- s.10: advance rent up to one month unless the Rent Controller approves more in advance; no premium, salami or separate security deposit.
- s.13: a signed receipt for every payment, landlord keeps the counterfoil.
- s.15–16: standard rent is 15% of market value a year, fixed by the Rent Controller on application, revisable every two years on application.
- s.18: no eviction while rent is paid and terms are kept, except listed grounds.
- s.19: tenant may deposit rent with the Rent Controller if the landlord refuses it.
- Extent: applies where the 1986 Ordinance applied; the government can extend or exclude areas by gazette. Confirm with a lawyer that no DSCC area is excluded.

**Layer 2, DNCC wards only: DNCC guideline, 20 Jan 2026** (implemented points)

- advance 1–3 months (conflicts with the Act's one month: show both);
- no rent increase within two years;
- two months' notice either way.

Other points (receipts, written agreement, ward-level owner and tenant associations for arbitration then the zonal executive officer) exist, but the associations are not formed yet.

**DSCC:** no guideline published as of 14 Nov 2026; DSCC flats get layer 1 plus a note. Adding a city layer is a new rule table, not new code.

## 7. Where AI is used

| Point | Job | Implementation | Guardrail |
| --- | --- | --- | --- |
| In | Bangla or Banglish text to terms | `api/ai/extract-terms`: Gemini or OpenAI if a key is set, else `lib/termsParser.ts` offline | People edit and confirm every field |
| In | Payment SMS to amount and transaction ID | `lib/smsParser.ts` (pattern based) | Both sides paste their own SMS; match by transaction ID and amount |
| Middle | Fake-tenancy detection (to build) | Rules first, graph model later | Flagged records held from lenders until reviewed |
| Out | Complaint topics, consent preview text, ward statistics (to build) | LLM with fixed labels; code for statistics | Measured accuracy reported; no individual data |

Known limits: noisy Bangla speech still has about 36–38% word errors in 2026 systems; multimodal LLMs failed on handwritten Bengali land records (KhatianDoc, Sept 2026). So: typed text first, voice only short with a read-back, printed deeds only. Android apps on Google Play cannot read SMS, hence the paste flow.

## 8. Architecture and code map

- Next.js 14 App Router; pages under `src/app/dashboard/<role>/...`; API routes under `src/app/api/...`.
- Storage: JSON files in `src/data` through `src/utils/jsonDb.ts` (`readJSON`, `writeJSON`, `generateId`). To be replaced by a real database.
- Auth: email OTP (code printed to the server console), HMAC-signed token in `localStorage`, sent as `Authorization: Bearer`. Server helpers: `src/utils/auth.ts` (`generateToken`, `parseToken`), `src/lib/serverAuth.ts` (`getRequester`). Client: `src/lib/auth.ts`, `authHeaders()` in `src/components/Ekmot.tsx`.
- Ekmot modules:
  - `src/lib/rules.ts`, `termsParser.ts`, `smsParser.ts`, `rentRecord.ts`;
  - APIs: `api/ai/extract-terms`, `api/agreements` (+ `[id]`), `api/payments/sms`, `api/share` (+ `[token]`), `api/dashboard/bank` (rewritten);
  - pages: `dashboard/landlord/agreements`, `dashboard/tenant/agreements`, `dashboard/{tenant,landlord}/receipts`, `dashboard/tenant/share`, `share/[token]`, `dashboard/bank` (rewritten), `dashboard/bank/credit` (explainer);
  - components: `Ekmot.tsx` (FlagList, EvidenceBadge, TermsTable, authHeaders), `SmsReceipts.tsx`.
- New data files: `agreements.json`, `share_links.json`, `consents.json`.
- Types: `src/types/index.ts`; Ekmot additions at the end (CityCorp, EvidenceLevel, Confirmation, TenancyTerms, RuleFlag, Agreement, ShareLink, Consent, RentRecord) plus optional fields on Property, Rental and Payment.

## 9. Feature list and status

Status: **Done** = in the preliminary build; **Partial** = started; **To do**. Origin: Kept / Rebuilt / New relative to T-ODRE.

| ID | Feature | Origin | Phase | Status | What is left / acceptance |
| --- | --- | --- | --- | --- | --- |
| F-01 | Role dashboards (tenant, landlord, lender, government) | Kept | Prelim | Done | — |
| F-02 | Landlord's flat records, no public listing | Kept | Prelim | Partial | Add city corporation and ward fields to the add and edit property forms |
| F-03 | Data model with advance, notice, ward, confirmations, evidence | Rebuilt | Prelim | Done | — |
| F-04 | Phone OTP and signed sessions | Rebuilt | Finals | Partial | Tokens signed; move to phone OTP and an http-only cookie |
| F-05 | Real database | Rebuilt | Finals | To do | Postgres (Supabase or Neon) or MongoDB Atlas; replace `jsonDb` calls; seed script |
| F-06 | Agreement confirmed by both sides | Rebuilt | Prelim | Partial | API supports landlord edits of a draft; add the edit UI |
| F-07 | AI terms extraction (typed Bangla or Banglish) | New | Prelim | Done | Measure accuracy on 50 real messages; short voice notes later |
| F-08 | Rule check: Act everywhere plus city layer | New | Prelim | Done | — |
| F-09 | Receipts from pasted SMS, matched by transaction ID | Rebuilt | Prelim | Done | — |
| F-10 | Receipt view in Bangla and English | Kept | Prelim | Partial | Issue the existing receipt component for matched payments |
| F-11 | Evidence weight on every field | New | Prelim | Partial | Done for payments; add for agreement fields |
| F-12 | Evidence log with file hashes | New | Finals | Partial | Agreement fingerprint done; append-only log for files and events |
| F-13 | Renewal and termination with notice check | Kept | Finals | To do | Use `noticeMonths` and the rules engine |
| F-14 | Repair and notice log | Kept | Finals | Done (as T-ODRE) | — |
| F-15 | Advance Shield: move-in and move-out reports, itemised deductions, settlement | New | Finals | To do | Photo checklists both confirm; deductions listed; settlement both confirm |
| F-16 | Share link for a new landlord (7 days) | New | Prelim | Done | — |
| F-17 | Structured references, five fixed questions, revealed at the same time; replaces star reviews | Rebuilt | Finals | To do | No free text; reveal when both submit or after 14 days |
| F-18 | See and contest every reference | New | Finals | To do | — |
| F-19 | Landlord track record | New | Finals | To do | Receipts issued, advances settled, repairs answered |
| F-20 | Dispute timeline | New | Finals | To do | Agreed terms against events, contradictions highlighted |
| F-21 | Complaint pack routed to the right office | New | Finals | To do | Rent Controller, city corporation or police |
| F-22 | Bangla rights assistant | New | Finals | To do | Answers only from the Act and the guideline, cites the section, shows conflicts, no verdicts |
| F-23 | Rent Record for lenders, no score | Rebuilt | Finals | Done | — |
| F-24 | Consent preview with expiry and revoke | New | Finals | Partial | Expiry and revoke done; generate the preview from the actual data |
| F-25 | Verify page: signed PDF with QR | New | Finals | To do | — |
| F-26 | Fake-tenancy rules | New | Finals | To do | One payer for many tenants, swapped roles, no matched SMS, rent far off the ward median; hold from lenders |
| F-27 | Lender scorecard with reasons | New | Roadmap | — | Lender-side only |
| F-28 | Advance loan from a partner lender, paid to the landlord | New | Roadmap | — | Rental deposit loans already exist in India; pitch as a partner product |
| F-29 | Repayment feedback loop | New | Roadmap | — | — |
| F-30 | Ward median rents, cells under 10 hidden, rounded | Rebuilt | Finals | To do | Replace hard-coded ministry averages |
| F-31 | Compliance indicators | Rebuilt | Finals | To do | Written terms, advance within rules, receipts matched, notice given |
| F-32 | Complaint topics from Bangla text | New | Finals | To do | LLM with a fixed label list; report accuracy |
| F-33 | Hedonic rent index on labelled synthetic data | New | Finals | To do | — |
| F-34 | Coverage correction, rent-shock warning, open data | New | Roadmap | — | — |

## 10. Suggested order for the finals

1. F-05 database and F-04 phone login (needed before any public deployment).
2. F-30, F-31 ministry view.
3. F-26 fake-tenancy rules (second demo moment: two accounts invent a tenancy and Ekmot holds it back).
4. F-15 Advance Shield.
5. F-17, F-18 structured references.
6. F-24 generated consent preview; F-25 verify page.
7. F-22 rights assistant; F-32 complaint topics; F-20 and F-21.
8. Pilot of 15–20 real tenancies; measure extraction accuracy.

## 11. Out of scope

Public listings and search (RentRadar and listing sites do this), payments inside the app (needs a payment licence), a platform credit score, police form pre-fill (on BharaKhata's roadmap), screenshot-tamper AI, blockchain, platform rulings on disputes.

## 12. Running and demo

See `EKMOT_README.md` for commands, test logins, `.env.local` keys (`AUTH_SECRET`, `GEMINI_API_KEY` or `OPENAI_API_KEY`, `AI_MODEL`) and the 7-step demo script.

## 13. Facts for the pitch (checked 14 Nov 2026)

- Personal Data Protection Act 2026 in force from 10 April 2026: consent must be specific, informed and revocable; right to restrict automated decisions.
- Private credit bureaus: five firms got letters of intent in Sept 2025; none reported operating yet. So the first credit partner is a bank or MFI.
- City Bank–bKash nano loans: over Tk 100 billion to 3.5 million borrowers by July 2026, average about Tk 3,000, 0.5% non-performing or written off.
- Positive rent data helped VantageScore 4.0 identify up to 11% more defaults across 600,000+ US renters (Nov 2025).
- Similar products: BharaKhata and Housely (Bangladesh, one-sided rent ledgers), Canopy (UK) and RentenPe (India) for rent-to-credit, RTB (Ireland) and Ejari (Dubai) as mandatory government registers.
