# Linde – Web

Connects seniors with (international) students for language exchange, company and cultural exchange.
Next.js app, deployed on Vercel. The mobile app lives in `linde-mobile`.

The Supabase schema lives here in `supabase/` and is shared by both apps. **This repo is the only
place migrations are written.**

## Setup

Requires Node 20+ and a container runtime for local Supabase (Docker Desktop, OrbStack or
[Colima](https://github.com/abiosoft/colima) — `brew install colima && colima start`).

```bash
npm install
npm run db:start             # starts local Supabase, prints URL + keys
cp .env.example .env.local   # then paste in the API URL + anon/publishable key
npm run db:types             # generate src/lib/supabase/database.types.ts
npm run dev                  # http://localhost:3000
```

Demo accounts (password `linde1234` for all): `lena@`, `tariq@`, `ingrid@`, `werner@`,
`elisabeth@` — all `…@linde.test`. Mail sent locally lands in Inbucket on <http://localhost:54324>.

| Command | |
|---|---|
| `npm run db:reset` | reapply all migrations + seed from scratch |
| `npm run db:test` | run the row level security tests |
| `npm run db:types` | regenerate the TypeScript types after a schema change |

## Secrets — this repo is public

`.gitignore` ignores `.env*` except `.env.example`, and nothing secret is committed. Know which
of these is which before you paste anything anywhere:

| | Secret? | Lives in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | `.env.local`, Vercel env vars |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `sb_publishable_…`) | no — designed to ship to the browser | same |
| `RESEND_API_KEY` | **yes** | local `.env`; for cloud, Supabase dashboard → Auth → SMTP |
| `service_role` / `sb_secret_…` | **yes** | nowhere — nothing in this app needs it |
| database password | **yes** | Supabase dashboard only |

The anon/publishable key is not a credential. It names the project and nothing else; row level
security decides who sees what. It is safe in the client bundle and safe in a public repo — **but
only because RLS is on for every table.** That is also exactly why the service-role key must never
appear here: it bypasses RLS, and would turn a public key into a public database.

`supabase/config.toml` is committed, so it never contains a literal secret — it uses
`env(RESEND_API_KEY)` substitution, which the CLI fills in from your shell or `.env`.

`.env.example` holds variable *names* with empty values and nothing else. If you add a variable,
add its name there so the next person knows it exists.

### Email (Resend)

SMTP is configured for Resend in `config.toml` but **disabled locally** — mail goes to Mailpit on
<http://localhost:54324> instead, so the demo accounts work without an inbox. For the cloud
project, set SMTP in the Supabase dashboard rather than in this file: host `smtp.resend.com`,
port `587`, username `resend`, password = the Resend API key. Resend needs the sending domain
verified before it will deliver to real addresses.

## Architecture

### Two roles, and a profile *is* an auth user

`student` and `senior`. Everyone owns their own account, so `profiles.id` **is** `auth.users.id` —
which is what keeps every RLS policy a direct comparison against `auth.uid()` instead of a subquery.

Four tables: `profiles` (the person), `offers` ("Meine Karte" — what they post, one per person,
enforced by `unique (user_id)`), `connections`, and `messages`. Keeping the offer separate from the
person is what gives location somewhere natural to live.

### Location, and why there are no addresses

`offers` stores `postal_code`, `city` and a `lat`/`lng` **centroid of the postal code — never a
street address**. `discover_feed` does not select the coordinates at all.

This is deliberate and worth not undoing. A radius filter is trilaterable: probe it from three
positions and you recover whatever is stored. Because what's stored is a postal-code centroid, the
most anyone can ever recover is the postal area the user already chose to disclose. For an app whose
purpose is sending a stranger to an elderly person's front door, that difference matters.

If you add distance sorting, compute it server-side in the view and return a rounded band. Do not
send coordinates to the client.

### Security

Row level security is on for every table, and it is the real boundary — not the UI, and not
`proxy.ts`. Read `supabase/migrations/0001_init.sql` top to bottom before touching a policy; the
reasoning is in the comments.

Rules worth knowing before you write a query:

- **Never use the service-role key.** It bypasses RLS entirely. If a query returns nothing, the
  policy is telling you something — fix the query, not the client.
- **Server Actions are directly reachable POST endpoints.** `proxy.ts` does not protect them. Every
  action in `src/lib/actions/` re-reads the session itself.
- Helpers in the private `app` schema are `SECURITY DEFINER` and always called wrapped —
  `(select app.foo())` — so Postgres evaluates them once per statement, not once per row.
- After changing any policy, helper or trigger: `npm run db:test`.

### One round trip per screen

Every list screen is a single query. Two `security_invoker` views do the work
(`supabase/migrations/0002_views.sql`):

- `discover_feed` — published cards of the opposite role you are not already connected to.
- `connection_overview` — per connection: the other person's card, the last message, and an unread
  count, via `LATERAL`s rather than aggregates over a join.

Fetching a list and then looping for related rows is the thing these exist to prevent.

### Next.js 16 — read this before writing a component

This is **not** the Next.js most tutorials describe. The bundled docs in `node_modules/next/dist/docs/`
are the authority.

- `middleware.ts` is now **`proxy.ts`**, exporting `proxy`. Node runtime, not configurable.
- `cookies()`, `headers()`, `params` and `searchParams` are **async**.
- `revalidateTag` takes a **required** second argument; `updateTag` and `refresh` are new.
- `dynamic`, `revalidate` and `fetchCache` segment exports no longer exist under Cache Components.

### Caching

`cacheComponents: true` is on, which gives Partial Prerendering: the shell prerenders and loads
instantly, anything reading the session streams in behind `<Suspense>`.

Deliberately, only the signed-in user's own profile is cached — `'use cache: private'`, which keeps
it in the browser and never on a server. **Do not put a Supabase query behind a plain `use cache`:**
it cannot read cookies, so the only way to make it work would be a service-role client, which
disables RLS. Discover, connections and chat are dynamic. Slow and correct beats fast and leaking.

### Realtime chat

Clients subscribe to `postgres_changes` on `messages` filtered by `connection_id`; RLS is enforced
per subscriber. **Call `supabase.realtime.setAuth()` when the token refreshes** or the channel
silently stops delivering after an hour.

## Cloud

The project is linked and these migrations are **already deployed**. To promote a new one:

```bash
supabase db push
```

**The dashboard is not the source of truth.** Schema written there is invisible to review, never
reaches the generated types the mobile app depends on, and is silently destroyed by the next
`db push`. Every schema change belongs in `supabase/migrations`. If you need to explore in the
dashboard, fine — but write the result as a migration before anyone builds on it.

The cloud database is deliberately **not seeded**: `seed.sql` is committed to a public repo, so
seeding it would put five accounts with a published password on the internet. Sign up through the
app instead. Demo accounts exist locally only.

Before real use, turn on email confirmations (`[auth.email] enable_confirmations`) — it is off
locally so the demo logins work without an inbox.

## Sharing the schema with `linde-mobile`

`src/lib/supabase/database.types.ts` is generated and committed. It is the type-level contract
between the two apps — copy it into `linde-mobile` after any schema change. Mobile additionally
needs `AsyncStorage` for session persistence and the same `setAuth()` call on token refresh.
