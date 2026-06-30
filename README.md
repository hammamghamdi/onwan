# Onwan

Onwan is an Arabic-first public address sharing app. Users reserve a short public address name, add a map link, photos, and arrival instructions, then share a stable URL such as:

```text
https://onwans.com/{username}
```

The app includes public address pages, QR/share flows, owner-token management, Supabase Magic Link login for normal users, account deletion, abuse reporting, address suspension, public policy pages, and a protected admin panel.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Custom admin password login with a signed HTTP-only cookie

## Required Environment Variables

Set these in the deployment environment. Do not commit values to the repository.

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
RATE_LIMIT_HASH_SECRET
```

Backward-compatible admin identifier fallbacks supported by the code:

```text
ADMIN_EMAILS
ADMIN_EMAIL
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Deployment Notes

- The canonical production domain is `https://onwans.com`.
- Set `NEXT_PUBLIC_APP_URL` to the canonical production origin.
- Configure all server-only secrets in the hosting provider dashboard.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, or `RATE_LIMIT_HASH_SECRET` to client-side code.
- `NEXT_PUBLIC_*` variables are intentionally available to browser code.
- Ensure the Supabase Storage bucket used for address photos exists and matches the code expectation.

## CI/CD Guardrails

GitHub Actions runs on pull requests and on pushes to `main`.

The CI workflow installs dependencies with `npm ci` and runs:

- `npm run lint`
- `npm run typecheck`
- `npm run security:csrf`
- `npm run build`

The workflow uses safe placeholder values for build-time environment variables. Real production secrets must stay in Vercel or GitHub secrets and must never be committed to the repository or printed in CI logs.

## Supabase Migration Notes

Apply migrations in timestamp order from `supabase/migrations`.

The migrations define:

- Profile ownership fields and RLS policies
- Public profile insertion behavior
- Public address rate limiting tables and RPC
- Visit analytics tables
- Daily visit analytics aggregation and retention cleanup RPCs
- Address photos table and replacement RPC
- Username normalization and display username preservation
- Abuse reports
- Address suspension fields
- Admin analytics and monitoring RPCs

For production, apply new migrations once in the Supabase SQL Editor or through the Supabase CLI. Confirm that all tables referenced by the app exist before deploying:

```text
profiles
address_photos
address_visits
homepage_visits
abuse_reports
public_address_access_logs
public_address_blocks
```

## Data Retention

Visit analytics and public-address rate-limit logs have retention support so raw operational tables do not grow without bound.

- `address_visit_daily_stats` stores daily public-address totals by username.
- `homepage_visit_daily_stats` stores daily homepage visit totals.
- `aggregate_visit_daily_stats()` aggregates raw visit rows older than the supplied cutoff and is safe to run repeatedly.
- `retention_cleanup_preview()` reports how many rows are eligible for cleanup without changing data.
- `run_retention_cleanup()` aggregates old visit rows first, then deletes eligible raw rows.

Default retention windows:

- Raw `address_visits`: aggregate and delete eligible rows older than 90 days.
- Raw `homepage_visits`: aggregate and delete eligible rows older than 90 days.
- `public_address_access_logs`: delete rows older than 30 days.
- `public_address_blocks`: delete only expired blocks whose `blocked_until` is older than 30 days.

Production warning: run `retention_cleanup_preview()` and review the counts before calling `run_retention_cleanup()`. The cleanup function is intentionally not executed by migrations. Optional pg_cron scheduling is kept outside migrations in `supabase/optional`; enable it only after production SQL review and after confirming pg_cron is available in Supabase.

## Admin Login Notes

Admin access is separate from normal Supabase Magic Link login.

- Admin login route: `/admin/login`
- Protected admin routes: `/admin`, `/admin/analytics`, `/admin/monitor`
- The admin password must be stored as `ADMIN_PASSWORD_HASH`.
- The admin session is signed with `ADMIN_SESSION_SECRET`.
- The admin session cookie is HTTP-only and must not be read from client-side JavaScript.

## Security Notes

- Never commit `.env.local`, `.env.production`, service-role keys, password hashes, session secrets, owner tokens, or private credentials.
- Treat owner-token management links as bearer secrets.
- Keep `/admin` and private/token routes out of sitemap output.
- Robots rules are not access control; private data must be protected by server-side authorization.
- Admin state-changing APIs require a signed admin session cookie and an `X-CSRF-Token` header derived from that session.
- Public users must not be granted read access to abuse reports, visit analytics, or admin data.
- Apply Supabase RLS policies carefully and verify them after every schema change.
