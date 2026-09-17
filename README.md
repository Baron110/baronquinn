# Baronquinn

Gifting site — Next.js/TypeScript, Mongo-backed catalog and orders, PayGate for payment,
Resend for email, Cloudinary for photos, Google Places for address autocomplete.

## Run locally
```
npm install
npm run dev
```

## Env vars (`.env.local`)
```
# Mongo
MONGODB_URI=

# NextAuth
NEXTAUTH_SECRET=          # generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_URL=http://localhost:3000

# Resend (email verification + order confirmations)
RESEND_API_KEY=
RESEND_FROM_EMAIL=Baronquinn <noreply@baronquinn.com>   # must be on a domain verified in Resend

# Cloudinary (product photo upload — client-side unsigned upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=     # create an UNSIGNED preset in Cloudinary → Settings → Upload

# Google Places (address autocomplete at checkout)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=          # enable "Places API" on this key in Google Cloud Console

# PayGate — NOTE: built against paygate.co.za's PayWeb3 API. If Baronquinn is
# actually on paygate.ng (a different, unrelated company), this needs to be
# redone against their docs — do not assume it works as-is.
PAYGATE_ID=
PAYGATE_ENCRYPTION_KEY=
PAYGATE_CURRENCY=NGN
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## First-time setup
```
# 1. Seed the starter catalog into Mongo (safe to re-run)
MONGODB_URI="..." npm run seed

# 2. Create your admin login (signup only ever creates "customer" accounts)
MONGODB_URI="..." npm run create-admin -- you@example.com "a strong password" "Your Name"
```
Then log in at `/login` and visit `/admin`.

## What's here

**Storefront**
- `app/page.tsx` — homepage, reads categories/products live from Mongo
- `app/category/[slug]/page.tsx` — category listing
- `app/product/[slug]/page.tsx` — product detail + related items
- `app/checkout/page.tsx` — contact/recipient/love-note/address, address autocomplete,
  creates a real `Order`, then hands off to PayGate

**Auth**
- `/login`, `/signup` — credentials auth via NextAuth, floating-card design
- Signup sends a verification email (Resend); checkout is blocked until the account
  is verified (`/verify?token=...` confirms it)
- `middleware.ts` — `/admin/*` is locked to `role: "admin"`

**Admin** (`/admin`)
- Dashboard — total revenue, paid/pending/failed counts, last-30-days breakdown
- Products — list, toggle active/hidden, delete, and `/admin/products/new` to create
  (photo upload via Cloudinary, category, delivery duration, customized-item flag)
- Categories — list and quick-create
- Orders — table of every order with status

**Data model** (`models/`)
- `User` — role (`customer`/`admin`), `emailVerified`
- `Category`, `Product` — admin-managed catalog
- `Order` — full snapshot of a checkout (sender, recipient, love note, address,
  product, amount, PayGate reference, status)

**Wallet** (`/wallet`)
- Deposit funds via PayGate (same hosted flow as checkout), stored as a balance on
  the `User` document
- Checkout offers "Pay with wallet balance" as an instant, no-redirect option
  whenever the balance covers the order — the PayGate button stays available too
- `models/WalletTransaction.ts` logs every deposit and debit; the wallet page shows
  balance, total transactions, total spent, and a recent-activity table
- The header shows the logged-in user's balance next to the cart icon, linking to
  `/wallet`

**Payments** (`lib/paygate.ts`, `app/api/paygate/`)
- Hosted PayWeb3 flow, restricted to bank transfer (`PAY_METHOD=BT`) to match the
  PartyWithZell checkout
- `notify` webhook is the source of truth for both flows — it tells apart an order
  payment from a wallet deposit by the reference prefix (`wallet-...` = deposit,
  anything else = order), updates the right record, and sends the confirmation
  email for order payments
- `checkout/return` re-reads status from Mongo (Order or WalletTransaction,
  depending on the reference) rather than trusting the redirect alone

## Not built yet
- Cart / multi-item checkout — still single-product via `?product=slug`
- Admin can't edit existing products yet (can toggle active/delete, but not change
  price/photos/etc — would need an `/admin/products/[id]/edit` page hitting the
  existing `PATCH` endpoint)
- Search (`/search`, linked from the header) has no route yet
- No pagination anywhere (admin orders caps at 200, fine for now)
- No admin view of wallet balances/deposits across all users — each user only sees
  their own
- Resend/Cloudinary/Google Places all silently degrade if their env vars are
  missing (logs a warning, or shows a manual-entry fallback) rather than crashing —
  worth testing each once real keys are in
