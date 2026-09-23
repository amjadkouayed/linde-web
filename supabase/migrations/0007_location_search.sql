-- Distance search by postal code.
--
-- Deliberately earthdistance rather than PostGIS: the whole question is "which
-- published offers are within N km of this point", and cube + earthdistance
-- answer it in a few lines with a GiST index. PostGIS would be a large
-- dependency for one query.
--
-- No geocoding service either. A postal code resolves to a centre point from a
-- table we ship, so there is no API key, no rate limit, no network call that
-- can fail during the presentation — and, more importantly, no street address
-- anywhere in the database.

create extension if not exists cube          with schema extensions;
create extension if not exists earthdistance with schema extensions;


-- ---------------------------------------------------------------------------
-- Keep the profile's point in step with its postal code
-- ---------------------------------------------------------------------------

-- Also rewrites `city` from the table rather than trusting what the form sent,
-- which makes the "80331 → München" confirmation authoritative instead of
-- decorative, and means a typo cannot enter the database with a plausible name
-- attached to it.
create function app.profiles_fill_location()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  area record;
begin
  if tg_op = 'UPDATE' and new.postal_code is not distinct from old.postal_code then
    return new;
  end if;

  select pc.city, pc.lat, pc.lng into area
  from public.postal_codes pc
  where pc.plz = new.postal_code;

  if not found then
    raise exception 'Diese Postleitzahl kennen wir nicht: %', new.postal_code
      using errcode = '23514';
  end if;

  new.city := area.city;
  new.lat  := area.lat;
  new.lng  := area.lng;
  return new;
end;
$$;

-- Backfill before the trigger exists, so rows written by 0005 get their point.
update public.profiles p
set lat  = pc.lat,
    lng  = pc.lng,
    city = pc.city
from public.postal_codes pc
where pc.plz = p.postal_code;

create trigger profiles_fill_location
  before insert or update of postal_code on public.profiles
  for each row execute function app.profiles_fill_location();

-- Narrows the candidate set before any distance arithmetic runs.
create index profiles_geo_idx
  on public.profiles using gist (extensions.ll_to_earth(lat, lng));


-- ---------------------------------------------------------------------------
-- One function both apps call
-- ---------------------------------------------------------------------------

-- SECURITY INVOKER, so this runs as the signed-in user and every policy still
-- applies: it can return nothing the caller could not already select. It reads
-- discover_feed rather than rebuilding its filters, so "published, opposite
-- role, not already connected" stays defined in exactly one place.
--
-- Coordinates are never returned — only a rounded distance.
create function public.discover(search_plz text, radius_km int)
returns table (
  profile_id   uuid,
  name         text,
  role         text,
  bio          text,
  interests    text[],
  study_field  text,
  avatar_path  text,
  status       text,
  age          int,
  city         text,
  postal_code  text,
  offer_id     uuid,
  availability text,
  description  text,
  created_at   timestamptz,
  km           numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    d.profile_id, d.name, d.role, d.bio, d.interests, d.study_field,
    d.avatar_path, d.status, d.age, d.city, d.postal_code,
    d.offer_id, d.availability, d.description, d.created_at,
    round((extensions.earth_distance(
             extensions.ll_to_earth(me.lat, me.lng),
             extensions.ll_to_earth(p.lat, p.lng)) / 1000)::numeric, 0) as km
  from public.discover_feed d
  join public.profiles p on p.id = d.profile_id
  cross join (
    select pc.lat, pc.lng
    from public.postal_codes pc
    where pc.plz = search_plz
  ) me
  -- Clamped rather than validated: the UI only offers 5/10/25/50/100, and a
  -- hand-crafted call asking for half the planet should not become a seq scan.
  cross join (select least(greatest(radius_km, 1), 200) * 1000 as metres) r
  where p.lat is not null
    -- earth_box is a square, so it only narrows. Without the exact test after
    -- it, the corners would let in points at up to ~1.4x the radius.
    and extensions.earth_box(extensions.ll_to_earth(me.lat, me.lng), r.metres)
        operator(extensions.@>) extensions.ll_to_earth(p.lat, p.lng)
    and extensions.earth_distance(
          extensions.ll_to_earth(me.lat, me.lng),
          extensions.ll_to_earth(p.lat, p.lng)) <= r.metres
  order by km, d.created_at desc
$$;

revoke execute on function public.discover(text, int) from anon, public;
grant execute on function public.discover(text, int) to authenticated;

comment on function public.discover(text, int) is
  'Published offers of the opposite role within radius_km of search_plz, nearest first, with an approximate distance in km. Returns no coordinates.';
