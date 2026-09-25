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

### Email — the one thing production cannot do without

Sign-in **is** an email: the app mails a six-digit code and the person types it. Supabase's
built-in sender cannot carry that on the free tier, for three independent reasons:

- **Templates are locked.** The default template holds only a link, never the code, and the
  Management API refuses to change it (`400: Email template modification is not available for
  free tier projects using the default email provider`).
- **Two emails an hour.** The third person to sign in within an hour gets nothing.
- **It only delivers to members of the Supabase organisation**, not to the public.

So production needs custom SMTP. Locally none of this applies — mail goes to Mailpit on
<http://localhost:54324>. See **Deploying → Email** below for the setup.

### Showcase sign-in (no e-mail code)

For a showcase, anyone can sign in by typing an e-mail address — no code. It is switched in the
database, not in Vercel, and needs no secret key (`0015_showcase_login.sql`):

```sql
update app.showcase set open_until = '2026-09-25 23:59+02';  -- open until then
update app.showcase set open_until = now();                  -- close now
```

It only ever opens **showcase accounts** (`app_metadata.showcase`): new addresses, created on the
spot, and the demo profiles. A real account, made with a code, still gets its code — otherwise
typing someone's address would be enough to read their chats. After closing, clear the one-time
passwords it handed out:

```sql
update auth.users set encrypted_password = '' where raw_app_meta_data->>'showcase' = 'true';
```

## Architecture

### Two roles, and a profile *is* an auth user

`student` and `senior`. Everyone owns their own account, so `profiles.id` **is** `auth.users.id` —
which is what keeps every RLS policy a direct comparison against `auth.uid()` instead of a subquery.

Four tables: `profiles` (the person), `offers` ("Meine Karte" — what they post, one per person,
enforced by `unique (user_id)`), `connections`, and `messages`. Keeping the offer separate from the
person is what gives location somewhere natural to live.

### Distance search

One database function, `discover(search_plz, radius_km)`, does the whole query: role, published,
not-already-connected, and the distance maths. Web and mobile call the same thing, so neither app
contains distance arithmetic and the two cannot drift apart.

It uses `cube` + `earthdistance` rather than PostGIS — one question, a few lines, a GiST index —
and resolves a postal code to a point from `postal_codes`, a table we ship. No geocoding service:
no API key, no rate limit, and nothing that can fail on the day of the presentation.

`postal_codes` is German postal code data from **[GeoNames](https://www.geonames.org/), licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** — attribution is required, so keep this
credit and the one in the legal notice. It lives in a migration rather than `seed.sql` because the
app needs it in production, and `seed.sql` never runs against the live database.

Codes with several villages are collapsed to the mean of their points, which is why distances are
approximate and the UI says "ca. 3 km". Bulk-mail codes belonging to single companies are excluded:
nobody lives at one, and GeoNames points them at the administering city, so `10875` would have
searched Stuttgart.

### Location, and why there are no addresses

`profiles` stores `postal_code`, `city` and a `lat`/`lng` **centroid of the postal code — never a
street address** (it moved off `offers` in `0005`, since the Discover filter needs a location before
anyone has written a card). `discover()` returns a rounded distance, never the coordinates.

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
- The database enforces its own limits (`0012_limits.sql`), because PostgREST is reachable without
  the web app: age 18–100, 20 requests an hour, 30 messages a minute (HTTP 429), avatars JPEG only
  up to 512 KB. Actions show `friendlyError()` instead of raw database messages.
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

- `middleware.ts` is now **`proxy.ts`**, exporting `proxy`. Node runtime, not configurable. It must
  sit **beside `app/`** — so `src/proxy.ts` here, not the repo root. In the wrong place it does not
  run and nothing tells you: pages still render, and the only symptom is that sessions quietly stop
  refreshing an hour in.
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

## Deploying

Three pieces, each deployed differently.

### Web — Vercel

`main` deploys automatically to <https://linde-web-wine.vercel.app>. Environment variables in the
Vercel project:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://prufsrctzkilvhmatymd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the project's **publishable** key (`sb_publishable_…`) |
| `NEXT_PUBLIC_SUPPORT_PHONE` | optional — shows a phone help line on login and the welcome page |

Never the secret / service-role key — nothing in this app needs it, and it bypasses RLS.

### Database — Supabase migrations

```bash
supabase db push          # applies anything in supabase/migrations not yet on the project
supabase migration list   # local and remote columns must match afterwards
```

**The dashboard is not the source of truth.** Schema written there is invisible to review, never
reaches the generated types the mobile app depends on, and is silently destroyed by the next push.
Every change belongs in `supabase/migrations`.

The cloud database is deliberately **not seeded**: `seed.sql` is committed to a public repo, so
seeding it would put five accounts with a published password on the internet.

### Auth settings — dashboard only, never `supabase config push`

Production auth lives in the Supabase dashboard. `config.toml` describes local development and
nothing else; `supabase config push` would overwrite the entire live auth block with local values
and break sign-in for everyone.

Current production values (set 23 Sep 2026): Site URL `https://linde-web-wine.vercel.app`, redirect
allow-list `https://linde-web-wine.vercel.app/**`, OTP length **6**.

### Email — custom SMTP, then the templates

1. **Authentication → Emails → SMTP Settings** in the dashboard: enable custom SMTP. Enter the
   password there yourself; it never goes in this repo.
   - **Resend** (needs a domain you own, verified under Resend → Domains): host `smtp.resend.com`,
     port `587`, user `resend`, password = API key, sender `noreply@<your-domain>`.
   - **Gmail** (no domain needed): 2-step verification on, then an app password; host
     `smtp.gmail.com`, port `587`, user and sender = the Gmail address.
2. Only once SMTP is on, the templates can be set. Paste `supabase/templates/magic_link.html` and
   `confirmation.html` (without their leading `<!-- -->` comment) into **Authentication → Emails →
   Templates**, with the subjects from `config.toml`. Both show the code and contain no link.
3. **Authentication → Rate Limits**: raise *emails sent per hour* from 2 (e.g. 60).
4. Sign in on the live site with a real address to confirm the code arrives.

### After every deploy

- `supabase migration list` — local and remote in sync
- the live site: sign in, onboard, publish a card, request, accept, chat both ways

## Sharing the schema with `linde-mobile`

`src/lib/supabase/database.types.ts` is generated and committed. It is the type-level contract
between the two apps — copy it into `linde-mobile` after any schema change. Mobile additionally
needs `AsyncStorage` for session persistence and the same `setAuth()` call on token refresh.
