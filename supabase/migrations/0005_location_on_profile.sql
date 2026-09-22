-- Location belongs to the person, not to the card.
--
-- 0001 put postal_code/city/lat/lng on offers, which mirrors a classifieds
-- posting. It breaks down here because the Discover filter is pre-filled from
-- the searcher's own location: someone who has not written an offer yet has
-- nowhere for that value to live, and their first search starts empty. One
-- person also has exactly one location, so keeping it on the profile means a
-- move is edited in one place instead of two.
--
-- Onboarding step 2 asks for it (required), the offer form shows it pre-filled
-- from the profile, and the Discover filter starts with it. Still the postal
-- code only: lat/lng are its centroid, never an address.


-- ---------------------------------------------------------------------------
-- The view first: it selects o.city / o.postal_code, so the columns cannot be
-- dropped while it exists.
-- ---------------------------------------------------------------------------

drop view if exists public.discover_feed;


-- ---------------------------------------------------------------------------
-- Move the columns
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column postal_code text check (postal_code ~ '^[0-9]{5}$'),
  add column city        text check (length(btrim(city)) between 1 and 120),
  add column lat         double precision,
  add column lng         double precision;

update public.profiles p
set postal_code = o.postal_code,
    city        = o.city,
    lat         = o.lat,
    lng         = o.lng
from public.offers o
where o.user_id = p.id;

-- Fails loudly on a profile that has no offer to inherit from. That is the
-- intended outcome: such a row predates onboarding asking for the postal code,
-- and guessing a location for it would be worse than stopping here.
alter table public.profiles
  alter column postal_code set not null,
  alter column city        set not null;

alter table public.offers
  drop column postal_code,
  drop column city,
  drop column lat,
  drop column lng;

create index profiles_postal_code_idx on public.profiles (postal_code);

comment on column public.profiles.postal_code is
  'Five digits, asked once during onboarding. The only location we store; no street, no house number.';
comment on column public.profiles.lat is
  'Centroid of the postal code area, not the person. Filled once the postal_codes table exists (0006).';


-- ---------------------------------------------------------------------------
-- Rebuild the feed off the profile
-- ---------------------------------------------------------------------------

create view public.discover_feed
with (security_invoker = on, security_barrier = on) as
select
  p.id           as profile_id,
  p.name,
  p.role,
  p.bio,
  p.interests,
  p.study_field,
  p.avatar_path,
  p.status,
  extract(year from now())::int - p.birth_year as age,
  p.city,
  p.postal_code,
  o.id           as offer_id,
  o.availability,
  o.description,
  o.created_at
from public.offers o
join public.profiles p on p.id = o.user_id
where o.is_published
  and p.id <> (select auth.uid())
  and p.role <> (select me.role from public.profiles me where me.id = (select auth.uid()))
  and not exists (
    select 1
    from public.connections c
    where (c.requester_id = p.id and c.recipient_id = (select auth.uid()))
       or (c.recipient_id = p.id and c.requester_id = (select auth.uid()))
  );

grant select on public.discover_feed to authenticated;

comment on view public.discover_feed is
  'Published cards of the opposite role the caller has no connection with yet. Backs the discover screen in a single query. Location comes from the profile; coordinates are deliberately not exposed.';
