# Wova

A job marketplace where **clients** post work and **talents** apply with connects after a camera-proctored skill test.

## What it does

- Sign up as **Looking for talent** (client) or **Looking for new opportunities** (talent)
- Clients add company name, size, industry, and can connect payment
- Talents upload a resume, add LinkedIn, verify phone, take a skill test with the camera on, and receive a **Talent badge**
- Jobs cost **10 connects** to apply; high-badge jobs cost **15–20**
- Connect pack: **$10 for 100 connects**
- Direct messages between clients and talents
- Admin monitor at `/admin` (owner only)

## Run it

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role   | Email                    | Password            |
|--------|--------------------------|---------------------|
| Admin  | admin@hireline.local     | AdminHireline!2026  |
| Client | jordan@northfield.co     | Hireline123!        |
| Talent | maya@talent.test         | Hireline123!        |
| Talent | diego@talent.test        | Hireline123!        |

Phone verification is demo-mode: the 6-digit code is shown in the UI instead of SMS.

Payments: if `STRIPE_SECRET_KEY` is empty, buying connects and connecting a client card are credited immediately so you can try the full flow locally. Add Stripe keys in `.env` for real Checkout.

## Env

Copy `.env.example` to `.env`. `AUTH_SECRET` must be set. Data lives in `data/hireline.db` (SQLite).
