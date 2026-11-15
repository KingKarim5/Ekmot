# Ekmot (একমত)

Ekmot turns a rent deal in Dhaka into a record that **both tenant and landlord confirm**. That confirmed record gives a lender consented rent history (no score) and the government ward-level totals only.

Team: Team_Excuse me. AI Builders Congress 2026 (CloudCamp Bangladesh).

> Status: preliminary build. It runs on JSON files and email OTP, so it is **not for public deployment**. Demo data is synthetic, and the lender and ministry views are previews.

## Built on T-ODRE

Ekmot is built on the T-ODRE prototype: Hossain, Rahim and Mahmud (BRAC University), *Transparency-Oriented Digital Rental Ecosystem (T-ODRE Model) for Economical Equity and Sustainability*, 8th IEOM Bangladesh Conference, 2025, DOI 10.46254/BA08.20250235. Original code: https://github.com/KaziAbdurRahim/Landlord (MIT).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The 6-digit login code is printed in the terminal (`[Send OTP]`).

| Role | Email |
| --- | --- |
| Tenant | rahim@test.ekmot |
| Landlord | karim@test.ekmot |
| Tenant with synthetic history | mahmud.hossain@test.ekmot |
| Lender | bank@example.com |
| Ministry | ministry@example.com |

Optional `.env.local` (never commit it): `AUTH_SECRET`, `GEMINI_API_KEY` or `OPENAI_API_KEY`, `AI_MODEL`. Without an AI key, the offline reader is used.

## More

- [EKMOT_README.md](EKMOT_README.md): what changed, features, 3-minute demo script
- [docs/EKMOT_SPEC.md](docs/EKMOT_SPEC.md): full spec and feature status
- [CLAUDE.md](CLAUDE.md): rules for working on the code

## Licence

MIT. See [LICENSE](LICENSE).
