# Crypto Smart Money — Production Deployment Guide

คู่มือนี้สำหรับ Deploy โปรเจกต์ `crypto-smart-money` จาก Local Development ไป Production

---

# 1. Production Architecture

```text
                         Users
                           │
                           ▼
                    ┌──────────────┐
                    │    Vercel    │
                    │ React Web App│
                    └──────┬───────┘
                           │ HTTPS
                           ▼
                    ┌──────────────┐
                    │   Railway    │
                    │ Fastify API  │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌──────────────┐         ┌──────────────┐
       │   Supabase   │         │   Notifier   │
       │ Auth + DB    │         │   Telegram   │
       └──────────────┘         └──────▲───────┘
                                       │
                                ┌──────┴───────┐
                                │    Indexer    │
                                │    Worker     │
                                └──────▲────────┘
                                       │
                                ┌──────┴───────┐
                                │ Ethereum RPC  │
                                │    Alchemy    │
                                └───────────────┘
```

## Production Services

| Service        | Platform                     |
| -------------- | ---------------------------- |
| Web            | Vercel                       |
| API            | Railway                      |
| Indexer        | Railway Worker               |
| Notifier       | Railway Worker               |
| Database       | Supabase PostgreSQL          |
| Authentication | Supabase Auth                |
| Ethereum RPC   | Alchemy                      |
| Telegram       | Telegram Bot API             |
| DNS            | Cloudflare / Domain Provider |

---

# 2. Repository Structure

Current project:

```text
crypto-smart-money/
├── apps/
│   ├── web/
│   ├── api/
│   ├── indexer/
│   └── notifier/
│
├── packages/
│   ├── db/
│   ├── shared/
│   └── config/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

# 3. Production Deployment Order

Deploy in this order:

```text
1. Git / Secrets
       ↓
2. Supabase PostgreSQL
       ↓
3. API
       ↓
4. API /health
       ↓
5. Supabase Auth
       ↓
6. Web
       ↓
7. Google Login
       ↓
8. Terms & Conditions
       ↓
9. Settings
       ↓
10. Notifier
       ↓
11. Indexer
       ↓
12. Telegram
       ↓
13. Custom Domain
       ↓
14. Final Smoke Test
```

Do not deploy everything simultaneously.

---

# 4. Phase 1 — Git & Secret Safety

Go to project:

```bash
cd /Users/jakkit/Desktop/_jakkit/GitHub/crypto-smart-money
```

Check status:

```bash
git status
```

Check tracked `.env` files:

```bash
git ls-files | grep -E '(^|/)\.env'
```

There must NOT be production secrets committed.

Do not commit:

```text
.env
.env.local
.env.production
```

Recommended `.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
```

---

# 5. Production Environment Variables

Create an example file:

```text
.env.example
```

Example:

```env
DATABASE_URL=

ETHEREUM_RPC_URL=
ETHEREUM_WS_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=

API_URL=
NOTIFIER_URL=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

WHALE_DIGEST_INTERVAL_MINUTES=5
WHALE_THRESHOLD_ETH=10
TELEGRAM_MAX_MESSAGE_LENGTH=3500

INDEXER_PORT=3002
NOTIFIER_PORT=3001

CORS_ORIGIN=
```

Never put real values in `.env.example`.

---

# 6. Phase 2 — Production Database

Production database:

```text
Supabase PostgreSQL
```

The production database will contain:

```text
users
whale_alerts
user_whale_alerts
notification_configs
user_tracking_configs
user_smart_money_rules
```

---

## 6.1 Check DB package

Run:

```bash
pnpm --filter db typecheck
```

Check migrations:

```bash
ls packages/db/drizzle
```

Verify the latest schema contains:

```text
terms_accepted_at
terms_version
```

---

## 6.2 Production DATABASE_URL

Get the PostgreSQL connection string from Supabase.

Do NOT use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/crypto_smart_money
```

That is local development only.

Production should use the Supabase PostgreSQL connection string.

---

## 6.3 Run Production Migration

Before migration:

```text
IMPORTANT

Make sure DATABASE_URL points to Production.

Do NOT accidentally run migrations against Local DB.
```

Use the migration command defined by:

```text
packages/db/package.json
```

For example, if the project uses Drizzle Kit:

```bash
DATABASE_URL="PRODUCTION_DATABASE_URL" pnpm --filter db migrate
```

Use the actual script defined in the project.

---

# 7. Phase 3 — Production API

Recommended:

```text
Railway
```

Production API target:

```text
https://api.example.com
```

Replace `example.com` with your real domain.

---

# 8. API Environment Variables

Production API should have:

```env
NODE_ENV=production

DATABASE_URL=...

SUPABASE_URL=https://xxxxx.supabase.co

CORS_ORIGIN=https://app.example.com

ETHEREUM_RPC_URL=...
ETHEREUM_WS_URL=...

NOTIFIER_URL=https://...
```

Add any other variables currently required by `apps/api`.

---

# 9. Important — Remove Local URLs

Production must NOT use:

```text
localhost
127.0.0.1
192.168.64.1
```

For example, this is wrong:

```env
API_URL=http://192.168.64.1:3000
```

Production should use:

```env
API_URL=https://api.example.com
```

---

# 10. API CORS

Current development configuration uses:

```text
http://localhost:5173
```

Production needs:

```text
https://app.example.com
```

Recommended API implementation:

```ts
const corsOrigin = process.env.CORS_ORIGIN;

if (!corsOrigin) {
  throw new Error("CORS_ORIGIN is not configured");
}

await app.register(cors, {
  origin: corsOrigin,
  credentials: true,
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
});
```

Local:

```env
CORS_ORIGIN=http://localhost:5173
```

Production:

```env
CORS_ORIGIN=https://app.example.com
```

---

# 11. API Health Check

After API deployment:

```text
GET https://api.example.com/health
```

Expected:

```json
{
  "status": "ok"
}
```

This must work before deploying the frontend.

---

# 12. API Production Checklist

Verify:

```text
[ ] API process starts
[ ] No duplicate Fastify routes
[ ] Database connection works
[ ] /health returns 200
[ ] Supabase JWT verification works
[ ] /me/status works
[ ] /me/accept-terms works
[ ] /me/settings works
[ ] /me/tracking works
[ ] /me/smart-money-rule works
[ ] /me/notification/telegram works
```

---

# 13. Phase 4 — Supabase Auth

Supabase handles:

```text
Google OAuth
Session
JWT
User identity
```

Production flow:

```text
Google
   ↓
Supabase Auth
   ↓
Access Token
   ↓
React
   ↓
Fastify API
   ↓
JWT Verification
```

---

# 14. Supabase Production URL

In Supabase:

```text
Authentication
→ URL Configuration
```

Set:

```text
Site URL

https://app.example.com
```

Add the required production redirect URL.

Example:

```text
https://app.example.com/**
```

Use the exact redirect configuration required by the current application.

---

# 15. Google OAuth Production

Google Cloud OAuth credentials must include the production redirect configuration required by Supabase.

Check:

```text
Google Cloud Console
→ APIs & Services
→ Credentials
→ OAuth Client
```

Verify production callback configuration.

Test:

```text
Production Web
     ↓
Login with Google
     ↓
Google
     ↓
Supabase
     ↓
Production Web
```

---

# 16. Terms & Conditions Flow

Current intended business flow:

```text
Google Login
     ↓
Supabase Auth User
     ↓
GET /me/status
     ↓
Does local user exist?
     │
     ├── YES
     │    ↓
     │  Dashboard
     │
     └── NO
          ↓
     Terms & Conditions
          ↓
        Accept
          ↓
POST /me/accept-terms
          ↓
Create users row
          ↓
       Dashboard
```

Important:

Supabase Auth creates the Google identity before the application can show Terms.

Therefore the application controls creation of the local `users` account.

It does not prevent Supabase from creating the Auth identity.

---

# 17. Terms Database Fields

The `users` table contains:

```text
termsAcceptedAt
termsVersion
```

After acceptance:

```text
termsAcceptedAt != null
termsVersion = "1.0"
```

Example:

```text
termsAcceptedAt = 2026-...
termsVersion = 1.0
```

---

# 18. Phase 5 — Production Web

Recommended:

```text
Vercel
```

Production web:

```text
https://app.example.com
```

---

# 19. Vercel Environment Variables

Set:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co

VITE_SUPABASE_ANON_KEY=...

VITE_API_URL=https://api.example.com
```

Important:

Variables beginning with:

```text
VITE_
```

are exposed to the browser.

Therefore NEVER put these in Vite frontend variables:

```text
DATABASE_PASSWORD
TELEGRAM_BOT_TOKEN
SUPABASE_SERVICE_ROLE_KEY
PRIVATE_KEY
RPC_SECRET
```

---

# 20. Web Build

Test locally:

```bash
pnpm --filter web build
```

If successful:

```text
dist/
```

should be generated.

Fix all TypeScript/build errors before production deployment.

---

# 21. Production Web Test

Open:

```text
https://app.example.com
```

Expected:

```text
Login page
```

Then:

```text
Login with Google
```

---

# 22. Phase 6 — Settings

After login:

```text
Dashboard
   ↓
Settings
   ↓
GET /me/settings
```

Verify:

```text
Whale Tracking
Smart Money Rule
Telegram Notification
```

---

# 23. Tracking Test

Change:

```text
Threshold
Enabled
```

Click:

```text
Save Tracking
```

Reload page.

The values must remain.

---

# 24. Smart Money Rule Test

Test:

```text
Net Flow Weight
Large Transactions Weight
Activity Weight
Positive Flow Weight
Net Flow Threshold
Large Transaction Count
Activity Count
Positive Flow Threshold
Enabled
```

Click:

```text
Save Smart Money Rule
```

Reload.

Values must persist.

---

# 25. Telegram Settings Test

Set:

```text
Telegram Chat ID
Enabled
```

Click:

```text
Save Telegram Settings
```

Reload.

Values must persist.

Never expose:

```text
TELEGRAM_BOT_TOKEN
```

to the frontend.

---

# 26. Phase 7 — Notifier Worker

Notifier should run as a separate worker.

Production variables:

```env
DATABASE_URL=

TELEGRAM_BOT_TOKEN=

NOTIFIER_PORT=3001

WHALE_DIGEST_INTERVAL_MINUTES=5

TELEGRAM_MAX_MESSAGE_LENGTH=3500
```

Notifier flow:

```text
Whale Alert
    ↓
PostgreSQL
    ↓
Notifier
    ↓
Digest
    ↓
Telegram
```

---

# 27. Telegram Security

Telegram Bot Token must exist only on the server.

Never place it in:

```text
React
VITE_*
Git
Browser
Public API response
```

If a Telegram token is ever exposed, rotate it immediately.

---

# 28. Phase 8 — Indexer Worker

Indexer should run as a long-running worker.

Production variables:

```env
DATABASE_URL=

ETHEREUM_RPC_URL=

ETHEREUM_WS_URL=

API_URL=

NOTIFIER_URL=
```

Indexer flow:

```text
Ethereum
    ↓
RPC / WebSocket
    ↓
Indexer
    ↓
PostgreSQL
    ↓
Whale Alert
    ↓
Notifier
```

---

# 29. Indexer Production Rules

Indexer must NOT use:

```text
localhost
127.0.0.1
192.168.64.1
```

All production service communication must use production service URLs.

---

# 30. Alchemy

Use a dedicated Production Alchemy application.

Production:

```env
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
```

and:

```env
ETHEREUM_WS_URL=wss://eth-mainnet.g.alchemy.com/v2/...
```

Never commit these credentials to Git.

If an API key is accidentally exposed:

```text
Rotate / revoke it
```

immediately.

---

# 31. Phase 9 — Domain

Recommended:

```text
app.example.com
api.example.com
```

DNS:

```text
app.example.com → Vercel
api.example.com → Railway
```

Production should use:

```text
HTTPS
```

not:

```text
HTTP
```

---

# 32. Final Architecture

Final production architecture:

```text
https://app.example.com
        │
        ▼
     Vercel
        │
        │ HTTPS
        ▼
https://api.example.com
        │
        ▼
     Railway API
        │
        ├───────────────┐
        ▼               ▼
   Supabase         Notifier
   Auth + DB           │
                       ▼
                    Telegram

Ethereum
   │
   ▼
Alchemy
   │
   ▼
Indexer Worker
   │
   ▼
Supabase PostgreSQL
```

---

# 33. Production Smoke Test

Run these tests after deployment.

## Test 1 — API

```text
GET https://api.example.com/health
```

Expected:

```json
{
  "status": "ok"
}
```

---

## Test 2 — Web

```text
https://app.example.com
```

Expected:

```text
Login page
```

---

## Test 3 — Google Login

```text
Login
 ↓
Google
 ↓
Supabase
 ↓
Production Web
```

---

## Test 4 — New Account

Use a test Google account that does not have a local user.

Expected:

```text
Login
 ↓
Terms
 ↓
Accept
 ↓
POST /me/accept-terms
 ↓
users row created
 ↓
Dashboard
```

Verify:

```text
users.auth_user_id
users.terms_accepted_at
users.terms_version
```

---

## Test 5 — Existing Account

Existing local user:

```text
Login
 ↓
GET /me/status
 ↓
hasLocalUser = true
 ↓
Dashboard
```

Terms should NOT appear again.

---

## Test 6 — Settings

Verify:

```text
GET /me/settings
```

Then:

```text
PUT /me/tracking
PUT /me/smart-money-rule
PUT /me/notification/telegram
```

Reload page.

Data must persist.

---

## Test 7 — Indexer

Verify:

```text
Indexer connected
Block processed
Transaction processed
Whale detected
```

---

## Test 8 — Telegram

Verify a qualifying alert is delivered.

---

# 34. Monitoring

At minimum monitor:

```text
Web
API
Indexer
Notifier
Database
```

API logs should contain requests such as:

```text
GET /health
GET /me/status
GET /me/settings
PUT /me/tracking
PUT /me/smart-money-rule
PUT /me/notification/telegram
```

Indexer logs:

```text
Indexer started
RPC connected
Block processed
Whale detected
```

Notifier logs:

```text
Notifier started
Digest created
Telegram sent
```

---

# 35. Common Production Errors

## ERR_CONNECTION_REFUSED

Usually:

```text
API is down
Wrong API URL
Wrong port
Service not listening
```

Check:

```env
VITE_API_URL=https://api.example.com
```

Do not use:

```text
localhost
192.168.64.1
```

---

## CORS Error

Check:

```env
CORS_ORIGIN=https://app.example.com
```

The origin must match the browser origin exactly.

For example:

```text
https://app.example.com
```

is different from:

```text
https://www.example.com
```

---

## 401 Unauthorized

Check:

```text
Authorization: Bearer <Supabase access token>
```

Then verify:

```text
JWT signature
issuer
audience
expiration
subject
```

---

## Google OAuth Redirect Error

Check:

```text
Supabase Site URL
Supabase Redirect URLs
Google OAuth Redirect URI
```

---

## FST_ERR_DUPLICATED_ROUTE

Example:

```text
Method 'POST' already declared for route '/me/accept-terms'
```

This means the same:

```text
HTTP Method + Route
```

has been registered more than once.

Search:

```bash
grep -R '"/me/accept-terms"' apps/api/src
```

There should only be one POST route.

---

## Database Connection Error

Check:

```text
DATABASE_URL
Supabase database status
SSL requirements
Connection limits
```

---

# 36. Security Checklist

Before public launch:

```text
[ ] No .env committed
[ ] No database password in Git
[ ] No Telegram bot token in Git
[ ] No Supabase service-role key in frontend
[ ] No private key in frontend
[ ] No Alchemy secret exposed
[ ] HTTPS enabled
[ ] CORS restricted
[ ] JWT verification enabled
[ ] Production database protected
[ ] Production logs checked
```

---

# 37. Backup Strategy

Before production launch:

```text
Database backup
        ↓
Migration
        ↓
Deploy
        ↓
Smoke test
```

Never run destructive database migrations directly against production without a backup/rollback plan.

---

# 38. Rollback Strategy

If a deployment breaks production:

```text
1. Stop the affected worker/service
2. Check logs
3. Identify the failed deployment
4. Roll back application version
5. Verify /health
6. Verify login
7. Verify database
8. Verify indexer/notifier
```

Do not immediately change multiple systems at once.

---

# 39. Recommended Deployment Checkpoints

## Checkpoint 1

```text
Git clean
Secrets safe
```

## Checkpoint 2

```text
Production DB ready
Migration successful
```

## Checkpoint 3

```text
API deployed
/health = 200
```

## Checkpoint 4

```text
Supabase Auth production configured
Google Login works
```

## Checkpoint 5

```text
Web deployed
API requests work
```

## Checkpoint 6

```text
Terms flow works
```

## Checkpoint 7

```text
Settings work
```

## Checkpoint 8

```text
Notifier works
Telegram works
```

## Checkpoint 9

```text
Indexer works
Whale alerts work
```

## Checkpoint 10

```text
Full production smoke test passed
```

---

# 40. Final Production Checklist

```text
GIT
[ ] Repository clean
[ ] No secrets committed
[ ] .env ignored
[ ] .env.example exists

DATABASE
[ ] Supabase PostgreSQL ready
[ ] Production migration complete
[ ] users table ready
[ ] Terms fields ready

API
[ ] Railway deployment online
[ ] /health returns 200
[ ] CORS configured
[ ] JWT verification works
[ ] /me/status works
[ ] /me/accept-terms works
[ ] /me/settings works
[ ] /me/tracking works
[ ] /me/smart-money-rule works
[ ] /me/notification/telegram works

AUTH
[ ] Supabase Site URL configured
[ ] Redirect URL configured
[ ] Google OAuth production configured
[ ] New account shows Terms
[ ] Accept creates local account
[ ] Existing account goes to Dashboard

WEB
[ ] Vercel deployment online
[ ] VITE_API_URL points to production API
[ ] Supabase URL configured
[ ] Publishable/anon key configured
[ ] Google Login works
[ ] Settings works

NOTIFIER
[ ] Worker running
[ ] Telegram token configured server-side
[ ] Digest works
[ ] Telegram delivery works

INDEXER
[ ] RPC configured
[ ] Worker running
[ ] Ethereum blocks processed
[ ] Whale detection works
[ ] User tracking works

SECURITY
[ ] HTTPS enabled
[ ] CORS restricted
[ ] No secrets in frontend
[ ] No service-role key in frontend
[ ] No Telegram token in frontend
[ ] No database password in frontend

FINAL
[ ] Production smoke test passed
[ ] Logs checked
[ ] Backup strategy ready
[ ] Rollback strategy ready
```

---

# 41. Target Production URLs

Final target:

```text
Web
https://app.example.com

API
https://api.example.com

Supabase
https://xxxxx.supabase.co
```

Local development remains:

```text
Web
http://localhost:5173

API
http://localhost:3000

PostgreSQL
localhost:5433
```

Do not mix local and production URLs.

---

# 42. Golden Rule

Deploy one service at a time.

Always verify:

```text
Service starts
      ↓
Health check passes
      ↓
Authentication works
      ↓
Database works
      ↓
Next service
```

If something fails:

```text
STOP
 ↓
Read logs
 ↓
Fix one problem
 ↓
Test again
 ↓
Continue
```

Do not change Web + API + Database + Auth simultaneously.

This makes production debugging much easier.
