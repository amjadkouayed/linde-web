-- Row level security tests.
--
--   supabase test db
--
-- These are the security brief made executable: every assertion below
-- corresponds to a way the data model could leak or be tampered with. Run them
-- after ANY change to a policy, helper or trigger in 0001_init.sql.
--
-- Fixtures come from supabase/seed.sql. Everything runs inside a transaction
-- that is rolled back, so the demo data survives.
--
--   Lena      11111111… student, published
--   Tariq     22222222… student, published   ─┐ accepted connection
--   Ingrid    33333333… senior,  published   ─┘ bbbbbbbb…0001
--   Werner    44444444… senior,  published   ── pending from Lena, bbbbbbbb…0002
--   Elisabeth 55555555… senior,  published

begin;

create extension if not exists pgtap with schema extensions;

select plan(16);


-- Become a given user for subsequent statements, exactly as PostgREST does.
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

-- An unpublished card to test discovery visibility against.
update public.profiles set is_published = false
where id = '55555555-5555-5555-5555-555555555555';


-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- A brand-new user must be able to create their own profile. This guards the
-- classic WITH CHECK trap: a policy that looks the row up by id instead of
-- checking the NEW row's columns makes every insert fail.
select tests_as_owner();
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000',
        '99999999-9999-9999-9999-999999999999',
        'authenticated', 'authenticated', 'neu@linde.test', now(), now());

select tests_as('99999999-9999-9999-9999-999999999999');
select lives_ok(
  $$insert into public.profiles (id, role, full_name)
    values ('99999999-9999-9999-9999-999999999999', 'student', 'Neue Nutzerin')$$,
  'a new user can create their own profile'
);

select throws_ok(
  $$insert into public.profiles (id, role, full_name)
    values ('88888888-8888-8888-8888-888888888888', 'student', 'Gestohlen')$$,
  -- Any error will do: the WITH CHECK and the foreign key both refuse this, and
  -- which one fires first is not guaranteed.
  null,
  null,
  'cannot create a profile under someone else''s id'
);

select tests_as('11111111-1111-1111-1111-111111111111');

select is(
  (select count(*)::int from public.profiles
   where id = '55555555-5555-5555-5555-555555555555'),
  0,
  'an unpublished profile is invisible to a stranger'
);

select is(
  (select count(*)::int from public.profiles
   where id = '33333333-3333-3333-3333-333333333333'),
  1,
  'a published profile is discoverable'
);

-- USING picks the row, WITH CHECK validates the result. Without both, a profile
-- could be handed to another user.
select is(
  (with attempt as (
     update public.profiles set full_name = 'Gekapert'
     where id = '33333333-3333-3333-3333-333333333333'
     returning 1)
   select count(*)::int from attempt),
  0,
  'cannot update another user''s profile'
);

select throws_ok(
  $$update public.profiles set id = '77777777-7777-7777-7777-777777777777'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  null,
  null,
  'cannot hand your own profile to another id'
);


-- ---------------------------------------------------------------------------
-- discover_feed
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.discover_feed
   where id = '11111111-1111-1111-1111-111111111111'),
  0,
  'discover never shows you your own card'
);

select is(
  (select count(*)::int from public.discover_feed
   where role = 'student'),
  0,
  'discover only shows the opposite role'
);

-- Lena already has a pending request out to Werner.
select is(
  (select count(*)::int from public.discover_feed
   where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'discover excludes people you already have a connection with'
);


-- ---------------------------------------------------------------------------
-- connections
-- ---------------------------------------------------------------------------

-- Lena is not part of Tariq and Ingrid's connection.
select is(
  (select count(*)::int from public.connections
   where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0,
  'a connection is invisible to non-participants'
);

-- Lena is the requester of the pending request to Werner, not the addressee.
select throws_ok(
  $$update public.connections set status = 'accepted'
    where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  '42501',
  null,
  'the requester cannot accept their own request'
);

select throws_ok(
  $$update public.connections set addressee_last_read_at = now()
    where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  '42501',
  null,
  'cannot mark the other participant''s side read'
);

select lives_ok(
  $$update public.connections set requester_last_read_at = now()
    where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  'can mark your own side read'
);

-- Students connect with seniors, not with each other.
select throws_ok(
  $$insert into public.connections (requester_profile_id, addressee_profile_id)
    values ('11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222')$$,
  '42501',
  null,
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

-- Tariq is a participant of the accepted connection, but the sender must be
-- him. messages_insert binds the two together so a sender cannot be forged.
select tests_as('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$insert into public.messages (connection_id, sender_profile_id, body)
    values ('bbbbbbbb-0000-0000-0000-000000000001',
            '33333333-3333-3333-3333-333333333333',
            'Im Namen von Frau Schäfer')$$,
  '42501',
  null,
  'cannot post a message as another person'
);


select * from finish();

rollback;
