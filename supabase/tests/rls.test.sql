-- Row level security tests.
--
--   supabase test db
--
-- The security brief made executable: every assertion corresponds to a way the
-- data model could leak or be tampered with. Run after ANY change to a policy,
-- helper or trigger in 0001_init.sql.
--
-- Fixtures come from supabase/seed.sql. Everything runs in a transaction that
-- is rolled back, so the demo data survives.
--
--   Lena      11111111… student, published  ─ pending request to Werner
--   Tariq     22222222… student, published  ─┐ accepted, bbbbbbbb…0001
--   Ingrid    33333333… senior,  published  ─┘
--   Werner    44444444… senior,  published
--   Elisabeth 55555555… senior,  published (unpublished below, for the visibility test)

begin;

create extension if not exists pgtap with schema extensions;

select plan(33);

create function tests_as(p_user uuid) returns void
language plpgsql
as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text,
    true
  );
end;
$$;

create function tests_as_owner() returns void
language plpgsql
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

-- Elisabeth pulls her card, so she should vanish from discovery entirely.
update public.offers set is_published = false
where user_id = '55555555-5555-5555-5555-555555555555';


-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- A brand-new user must be able to create their own profile. Guards the classic
-- WITH CHECK trap: a policy that looks the row up by id rather than checking
-- the NEW row's columns makes every insert fail.
select tests_as_owner();
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000',
        '99999999-9999-9999-9999-999999999999',
        'authenticated', 'authenticated', 'neu@linde.test', now(), now());

select tests_as('99999999-9999-9999-9999-999999999999');
select lives_ok(
  $$insert into public.profiles (id, username, role, name, birth_year, postal_code, city) values
    ('99999999-9999-9999-9999-999999999999', 'neue-nutzerin', 'student', 'Neue Nutzerin', 2003,
     '49074', 'Osnabrück')$$,
  'a new user can create their own profile'
);

select throws_ok(
  $$insert into public.profiles (id, username, role, name, birth_year, postal_code, city) values
    ('88888888-8888-8888-8888-888888888888', 'gestohlen', 'student', 'Gestohlen', 2003,
     '49074', 'Osnabrück')$$,
  -- Any error: the WITH CHECK and the foreign key both refuse this, and which
  -- fires first is not guaranteed.
  null, null,
  'cannot create a profile under someone else''s id'
);

select tests_as('11111111-1111-1111-1111-111111111111');

select is(
  (select count(*)::int from public.profiles
   where id = '55555555-5555-5555-5555-555555555555'),
  0,
  'a profile whose card is unpublished is invisible to a stranger'
);

select is(
  (select count(*)::int from public.profiles
   where id = '33333333-3333-3333-3333-333333333333'),
  1,
  'a profile with a published card is discoverable'
);

-- USING picks the row, WITH CHECK validates the result. The UPDATE raises
-- nothing; it simply matches no row.
update public.profiles set name = 'Gekapert'
where id = '33333333-3333-3333-3333-333333333333';

select is(
  (select name from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'Ingrid Schäfer',
  'cannot update another user''s profile'
);

update public.offers set availability = 'Gekapert'
where user_id = '33333333-3333-3333-3333-333333333333';

select is(
  (select availability from public.offers
   where user_id = '33333333-3333-3333-3333-333333333333'),
  'Fast jeden Nachmittag',
  'cannot update another user''s card'
);


-- ---------------------------------------------------------------------------
-- discover_feed
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.discover_feed
   where profile_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'discover never shows you your own card'
);

select is(
  (select count(*)::int from public.discover_feed where role = 'student'),
  0,
  'discover only shows the opposite role'
);

-- Lena already has a pending request out to Werner.
select is(
  (select count(*)::int from public.discover_feed
   where profile_id = '44444444-4444-4444-4444-444444444444'),
  0,
  'discover excludes people you already have a connection with'
);


-- ---------------------------------------------------------------------------
-- connections
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.connections
   where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0,
  'a connection is invisible to non-participants'
);

-- Lena is the requester of the pending request, not the recipient.
select throws_ok(
  $$update public.connections set status = 'accepted'
    where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  '42501', null,
  'the requester cannot accept their own request'
);

select throws_ok(
  $$insert into public.connections (requester_id, recipient_id) values
    ('11111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222')$$,
  '42501', null,
  'cannot connect to someone of your own role'
);


-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.messages
   where connection_id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0,
  'messages are invisible to non-participants'
);

-- Tariq is in the thread, but the sender must be him. messages_insert binds the
-- two together so a sender cannot be forged.
select tests_as('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$insert into public.messages (connection_id, sender_id, body) values
    ('bbbbbbbb-0000-0000-0000-000000000001',
     '33333333-3333-3333-3333-333333333333',
     'Im Namen von Frau Schäfer')$$,
  '42501', null,
  'cannot post a message as another person'
);

-- He may mark Ingrid's message read, but not rewrite what she said.
select throws_ok(
  $$update public.messages set body = 'Etwas ganz anderes'
    where connection_id = 'bbbbbbbb-0000-0000-0000-000000000001'
      and sender_id = '33333333-3333-3333-3333-333333333333'$$,
  '42501', null,
  'a message body is immutable'
);

-- Marking your own message read would fake a read receipt.
select tests_as('33333333-3333-3333-3333-333333333333');
update public.messages set read_at = now()
where connection_id = 'bbbbbbbb-0000-0000-0000-000000000001'
  and sender_id = '33333333-3333-3333-3333-333333333333'
  and read_at is null;

select is(
  (select count(*)::int from public.messages
   where connection_id = 'bbbbbbbb-0000-0000-0000-000000000001'
     and sender_id = '33333333-3333-3333-3333-333333333333'
     and read_at is null),
  1,
  'cannot mark your own message as read'
);


-- ---------------------------------------------------------------------------
-- Profile fields
-- ---------------------------------------------------------------------------

-- "Rentner" is a senior's self-description; a student has no business carrying
-- one, and the constraint rather than the UI is what guarantees it.
select tests_as('11111111-1111-1111-1111-111111111111');
select throws_ok(
  $$update public.profiles set status = 'rentner'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null,
  'a student cannot take a senior status'
);


-- ---------------------------------------------------------------------------
-- Intro message
-- ---------------------------------------------------------------------------

-- Werner is the recipient of Lena's pending request, so the UPDATE policy lets
-- him touch the row — but not to rewrite what she said to him.
select tests_as('44444444-4444-4444-4444-444444444444');
select throws_ok(
  $$update public.connections set intro_message = 'Etwas ganz anderes'
    where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  '42501', null,
  'a request greeting cannot be rewritten after the fact'
);


-- ---------------------------------------------------------------------------
-- Offer views
-- ---------------------------------------------------------------------------

-- Werner viewing his own card would let him inflate his own numbers.
select throws_ok(
  $$insert into public.offer_views (offer_id, viewer_id)
    select o.id, '44444444-4444-4444-4444-444444444444'
    from public.offers o
    where o.user_id = '44444444-4444-4444-4444-444444444444'$$,
  '42501', null,
  'cannot register a view on your own offer'
);

-- How often someone's card is looked at is theirs alone.
select tests_as('11111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from public.offer_views),
  0,
  'cannot read another user''s view log'
);

-- my_offer_stats is scoped to the caller by construction.
select is(
  (select count(*)::int from public.my_offer_stats),
  1,
  'offer stats only ever cover your own offer'
);


-- ---------------------------------------------------------------------------
-- Location
-- ---------------------------------------------------------------------------

select tests_as('11111111-1111-1111-1111-111111111111');

-- A postal code that does not exist must not enter the database with a
-- plausible-looking place name attached to it.
select throws_ok(
  $$update public.profiles set postal_code = '00000'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null,
  'an unknown postal code is refused'
);

-- The place name comes from the reference table, not from whatever the form
-- sent, so the "80331 → München" confirmation means something.
update public.profiles
set postal_code = '80331', city = 'Entenhausen'
where id = '11111111-1111-1111-1111-111111111111';

select is(
  (select city from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'München',
  'the place name is taken from the postal code table, not from the client'
);

-- Lena has a pending request out to Werner, so distance search must not offer
-- him back to her however wide she searches.
select is(
  (select count(*)::int from public.discover('80331', 100)
   where profile_id = '44444444-4444-4444-4444-444444444444'),
  0,
  'distance search still excludes people you already have a connection with'
);


-- ---------------------------------------------------------------------------
-- Profile photo: only from your own storage folder
-- ---------------------------------------------------------------------------

-- The avatars bucket is public. Without this, Lena could point her profile at
-- Ingrid's photo and appear in discover wearing someone else's face.
select tests_as('11111111-1111-1111-1111-111111111111');
select throws_ok(
  $$update public.profiles set avatar_path = '33333333-3333-3333-3333-333333333333/1.jpg'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null,
  'cannot use a photo from someone else''s folder'
);

select lives_ok(
  $$update public.profiles set avatar_path = '11111111-1111-1111-1111-111111111111/1.jpg'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  'can use a photo from your own folder'
);


-- ---------------------------------------------------------------------------
-- Retention: offer views older than 90 days are deleted nightly
-- ---------------------------------------------------------------------------

select tests_as_owner();

insert into public.offer_views (offer_id, viewer_id, viewed_on)
select o.id, '22222222-2222-2222-2222-222222222222', current_date - 91
from public.offers o where o.user_id = '33333333-3333-3333-3333-333333333333';

insert into public.offer_views (offer_id, viewer_id, viewed_on)
select o.id, '22222222-2222-2222-2222-222222222222', current_date - 89
from public.offers o where o.user_id = '33333333-3333-3333-3333-333333333333';

-- Run exactly what the cron job runs, so the test breaks if the job does.
select lives_ok(
  (select command from cron.job where jobname = 'expire-offer-views'),
  'the retention job runs'
);

select is(
  (select count(*)::int from public.offer_views where viewed_on < current_date - 90),
  0,
  'offer views older than 90 days are gone'
);

select is(
  (select count(*)::int from public.offer_views where viewed_on = current_date - 89),
  1,
  'offer views inside 90 days are kept'
);


-- ---------------------------------------------------------------------------
-- Account deletion (Art. 17). Last, because it removes a fixture.
-- ---------------------------------------------------------------------------

select tests_as_owner();
set local role anon;
select throws_ok(
  'select public.delete_my_account()',
  '42501', null,
  'a signed-out caller cannot delete anything'
);

-- Tariq has a profile, a card, an accepted connection with Ingrid and messages.
select tests_as('22222222-2222-2222-2222-222222222222');
select lives_ok('select public.delete_my_account()', 'a user can delete their own account');

select tests_as_owner();

select is(
  (select count(*)::int from auth.users where id = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.profiles where id = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.offers where user_id = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.connections
       where '22222222-2222-2222-2222-222222222222' in (requester_id, recipient_id))
  + (select count(*)::int from public.messages where sender_id = '22222222-2222-2222-2222-222222222222'),
  0,
  'deleting an account removes the user, profile, card, connections and messages'
);

-- The function takes no argument, so there is no way to aim it at someone else;
-- this checks the cascade did not wander either.
select is(
  (select count(*)::int from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  1,
  'the other person in the conversation keeps their account'
);


select * from finish();

rollback;
