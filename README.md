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

## Architecture

### Two roles, and a profile *is* an auth user

`student` and `senior`. Everyone owns their own account, so `profiles.id` **is** `auth.users.id` —
which is what keeps every RLS policy a direct comparison against `auth.uid()` instead of a subquery.

"Meine Karte" is two columns on `profiles` (`availability`, `card_description`) rather than its own
table: one card per person, so a separate table would buy only a join and an N+1 on the busiest
screen.

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

Build against local Supabase, then promote the same migrations unchanged:

```bash
supabase link --project-ref <ref>
supabase db push
```

Before going live, turn on email confirmations (`[auth.email] enable_confirmations`) — it is off
locally so the demo accounts work without an inbox.

## Sharing the schema with `linde-mobile`

`src/lib/supabase/database.types.ts` is generated and committed. It is the type-level contract
between the two apps — copy it into `linde-mobile` after any schema change. Mobile additionally
needs `AsyncStorage` for session persistence and the same `setAuth()` call on token refresh.
