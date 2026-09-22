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

select plan(16);

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
  $$insert into public.profiles (id, role, name) values
    ('99999999-9999-9999-9999-999999999999', 'student', 'Neue Nutzerin')$$,
  'a new user can create their own profile'
);

select throws_ok(
  $$insert into public.profiles (id, role, name) values
    ('88888888-8888-8888-8888-888888888888', 'student', 'Gestohlen')$$,
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


select * from finish();

rollback;
