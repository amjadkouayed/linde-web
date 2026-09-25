-- Limits the database enforces itself, because the server actions are not the
-- only way in: the mobile app and anyone holding the public key talk to
-- PostgREST directly.

-- ---------------------------------------------------------------------------
-- discover() returns the username, so the card links by it in one query
-- ---------------------------------------------------------------------------

-- A changed return type cannot be CREATE OR REPLACEd.
drop function public.discover(text, int);

create function public.discover(search_plz text, radius_km int)
returns table (
  profile_id   uuid,
  username     text,
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
    d.profile_id, p.username, d.name, d.role, d.bio, d.interests, d.study_field,
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
  cross join (select least(greatest(radius_km, 1), 200) * 1000 as metres) r
  where p.lat is not null
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

-- ---------------------------------------------------------------------------
-- Age 18 to 100
-- ---------------------------------------------------------------------------

-- A trigger, not a CHECK: "now" is not immutable, and a CHECK using it would
-- make an old dump fail to restore once its rows had aged past the bound.
create function app.profiles_check_age()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if extract(year from now())::int - new.birth_year not between 18 and 100 then
    raise exception 'age must be between 18 and 100' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_check_age
  before insert or update of birth_year on public.profiles
  for each row execute function app.profiles_check_age();

-- ---------------------------------------------------------------------------
-- Rate limits
-- ---------------------------------------------------------------------------

-- PT429 makes PostgREST answer HTTP 429. Counting runs as the caller, who can
-- always see their own requests and messages, so no SECURITY DEFINER.
-- ponytail: a count per insert, served by the requester/sender indexes. Fine
-- at school scale; a token bucket table if it ever shows up in a profile.
create function app.connections_rate_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.connections
      where requester_id = new.requester_id
        and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too many requests' using errcode = 'PT429';
  end if;
  return new;
end;
$$;

create trigger connections_rate_limit
  before insert on public.connections
  for each row execute function app.connections_rate_limit();

create function app.messages_rate_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.messages
      where sender_id = new.sender_id
        and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too many messages' using errcode = 'PT429';
  end if;
  return new;
end;
$$;

create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function app.messages_rate_limit();

-- ---------------------------------------------------------------------------
-- Avatars: only what the photo picker produces
-- ---------------------------------------------------------------------------

-- The picker re-encodes every photo to a 480 px JPEG in the browser (a few
-- dozen KB), which also drops EXIF and anything smuggled after the image
-- data. Anyone skipping the picker still meets these limits.
update storage.buckets
set allowed_mime_types = array['image/jpeg'],
    file_size_limit = 524288
where id = 'avatars';
