# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two roles, one app, different content per role.

- **Seniors.** Mostly 65+, living alone or with time on their hands, looking for company, conversation and a bit of variety. Many are **not comfortable with technology**: they use a phone or tablet occasionally, distrust anything that looks like a form, and give up when something is unclear. Several will be helped through their first sign-up by a relative or by us at the presentation.
- **Students, many of them international.** They want to practise everyday German with a real person, get to know the city and the people who have lived in it for decades, and they often have time on weekday afternoons. They are comfortable with apps and will not need help.

Both sides sign up for themselves. A profile *is* an auth user; nobody administers anyone else's account.

## Product Purpose

Linde connects seniors with students in the same area for language exchange, company and cultural exchange.

The product succeeds when **two people actually meet**, not when they sign up. Everything in the app exists to get from "I see someone nearby" to "we agreed on Thursday at three": a card that says who you are and when you have time, a request with a message, and a chat where the meeting is arranged.

## Positioning

Linde borrows the post-and-browse mechanic from classifieds apps like eBay Kleinanzeigen — one offer per person, a location filter with a radius, cards you scroll — because that pattern is already familiar to German users of every age.

**It is not a marketplace.** No price, no transaction, no ratings, no reviews, no bookings and no calendar. People arrange meeting times themselves in the chat. That restraint is the point: a rating system or a booking flow would turn company into a service.

## Operating Context

- Seniors mostly use a phone or tablet, often one-handed, sometimes with reading glasses, usually at home.
- Students use a phone, occasionally a laptop.
- The first meeting happens in public — a café, a park, a walk. The app says so in the chat.
- Nobody uses Linde every day. Sessions are short and rare, so nothing may rely on remembering how it worked last time.

Project context: a school project for the **UNESCO Projekttage**, built in one week by a team of five. The web app ships first (Vercel), the mobile app is tested through Expo Go and is not published to any app store this week. It ends in a presentation, where the app has to work on an unfamiliar device and network.

## Capabilities and Constraints

**Confirmed**

- Two roles, `student` and `senior`, chosen once during onboarding and not changeable afterwards. Students see seniors, seniors see students.
- **One offer per person** ("Meine Karte"), with two fields of its own — availability as free text and a description — plus the location, which comes from the profile. Create, edit, delete; deleting asks for confirmation.
- **Location is the postal code only.** It belongs to the person, not the offer (migration 0005): asked once in onboarding step 2, required, pre-filled into both the offer form and the search filter, so somebody without an offer can still search. No street, no house number, no device coordinates. Distances are shown rounded ("ca. 3 km").
- **Offer views are counted as distinct people per week**, once per person per day, so refreshing a page cannot inflate the number. The screen says "34 Personen haben Ihr Angebot diese Woche angesehen".
- Discover has an always-visible location filter: postal code plus a radius of 5 / 10 / 25 / 50 / 100 km, with 25 km pre-selected.
- Connections: a request carries a written message, the recipient accepts or declines, an accepted request becomes a chat with an unread badge.
- Login is passwordless: Google, Apple, or a 6-digit code by e-mail. No phone number, no password. Onboarding is three short steps: role, profile, interests.
- **Age is never shown next to a name.** It is collected in onboarding, stored as `birth_year` so it cannot go stale, and displayed as a small chip alongside location and availability — a fact among facts, not a headline.
- German throughout, formal "Sie", which matters for the senior audience.
- Row-level security in Supabase is the real boundary. The service-role key is never used in the app.
- Realtime chat via Supabase; unread counts come from per-side read timestamps.

**Open, to be decided**

- Whether "Sign in with Apple" is affordable: it needs an Apple Developer account at 99 €/year, including for the web version. Google and e-mail are free.
- **Which city the project is set in.** The seed data uses Osnabrück; the design mockups use München. They should agree before the presentation.
- The radius search itself: `profiles.lat`/`lng` are empty and there is no `postal_codes` table yet, so the filter currently cannot search by distance.
- Whether the mobile app reuses the web onboarding flow screen for screen or gets its own.

## Brand Commitments

- Name: **Linde**. Logo: two overlapping brand-green circles with a gold lens where they intersect.
- **No botanical imagery** despite the name: no leaves, trees, plants or flowers. It would read as a flower shop or a wellness app. Iconography is plain geometry — circles, rings, pills.
- Typefaces: **Bitter** for headings and names, **Karla** for body text and buttons.
- Palette: ivory background `#F6F1E3`, raised surfaces `#FFFCF4`, ink `#2F2B1E`, forest green `#55713F` for primary actions, gold `#C99A3E` for tags and badges only — never a primary button.
- Voice: plain, warm, respectful. Short sentences. No jargon, no exclamation marks, no emoji.

## Evidence on Hand

- A complete UI design for both platforms exists as a Claude Design canvas: login, three onboarding steps, Discover, request, offer (empty / form / live), contacts, chat, and the web equivalents.
- The schema, RLS policies, security tests and a data layer for profiles and connections are implemented in this repo.
- `supabase/seed.sql` contains five demo people. **This is test data for local development only** and must never be loaded into the live database, since its shared password is published in the README.

**Not available, and not to be invented:**

- No real user photos. Every avatar in the design is a hatched placeholder with initials.
- No real support phone number yet. The design shows `[IHRE SERVICENUMMER]` as a placeholder.
- No real users, no testimonials, no usage figures. The "34 Personen" view count in the design is sample data.

## Product Principles

1. **One clear action per screen.** A senior should never have to work out which of three buttons is the one that matters.
2. **Nothing hidden behind an icon or a menu.** Buttons carry words; the location filter is always visible, never behind a sheet.
3. **The database protects people, not the interface.** Location stays at postal-code precision, names may be shortened, and messages are readable only by the two people in the conversation.
4. **Reversible, and confirmed before it's destructive.** Delete asks first; a role, once chosen, is stated as permanent before it is picked.
5. **The meeting happens outside the app.** No booking, no calendar, no reviews — the chat is where people agree, and the app steps back.

## Accessibility & Inclusion

- Body text at least 17px on mobile, never below 15px anywhere; headings and numbers larger.
- Tap targets at least 44px; primary buttons 60px or more.
- Text contrast at least 4.5:1, and form controls have a visible boundary of at least 3:1. The muted grey and input borders were darkened for this reason.
- No icon-only controls. Every button and back affordance has a label.
- Animation stays under 300ms and respects `prefers-reduced-motion`.
- The one-time code field uses the platform's own autofill, so the code does not have to be typed.
- Screen-reader labels are German, and gendered terms are written out ("Seniorinnen und Senioren") rather than using a colon form, which screen readers mispronounce.
