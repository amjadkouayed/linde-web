-- Demo data for local development and the presentation.
-- Runs automatically after migrations on `supabase db reset`.
--
-- Every account uses the password: linde1234
--
-- profiles.id IS auth.users.id, so the uuids below are both at once.
--
-- Postal codes are real and spread across the region on purpose: Mettingen is
-- ~25 km from Osnabrück, so a radius filter has something meaningful to do.
-- lat/lng are PLZ centroids, never addresses.
--
-- Everything here is plain set-based SQL: the CLI's seed runner batches
-- statements, and a dollar-quoted function body breaks it.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('linde1234', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'lena@linde.test'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'tariq@linde.test'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'ingrid@linde.test'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'werner@linde.test'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'elisabeth@linde.test')
) as u(id, email)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', u.id::text, now(), now(), now()
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'lena@linde.test'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'tariq@linde.test'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'ingrid@linde.test'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'werner@linde.test'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'elisabeth@linde.test')
) as u(id, email)
on conflict do nothing;


-- Profiles ------------------------------------------------------------------

insert into public.profiles (id, role, name, birth_year, status, bio, interests, study_field,
                             postal_code, city, lat, lng)
values
  ('11111111-1111-1111-1111-111111111111', 'student', 'Lena Vogt', 2002, null,
   'Medizinstudentin im 4. Semester. Ich koche gern und höre gern Geschichten von früher.',
   array['Kochen', 'Musik', 'Spazieren'], 'Medizin',
   '49074', 'Osnabrück', 52.272, 8.0498),

  ('22222222-2222-2222-2222-222222222222', 'student', 'Tariq Haddad', 2003, null,
   'Ich komme aus Jordanien und studiere seit einem Jahr in Osnabrück. Ich möchte mein Deutsch verbessern.',
   array['Sprache', 'Schach', 'Fotografie'], 'Informatik',
   '49080', 'Osnabrück', 52.253, 8.03),

  ('33333333-3333-3333-3333-333333333333', 'senior', 'Ingrid Schäfer', 1948, 'rentnerin',
   'Ich war 35 Jahre lang Lehrerin. Heute lese ich viel und arbeite im Garten.',
   array['Lesen', 'Garten', 'Sprache'], null,
   '49090', 'Osnabrück', 52.302, 8.052),

  ('44444444-4444-4444-4444-444444444444', 'senior', 'Werner Pohl', 1945, 'rentner',
   'Früher Schlosser, heute Schachspieler. Ich erkläre gern, wie Dinge funktionieren.',
   array['Schach', 'Technik', 'Musik'], null,
   '49191', 'Belm', 52.305, 8.137),

  ('55555555-5555-5555-5555-555555555555', 'senior', 'Elisabeth Wagner', 1957, 'berufstaetig',
   'Ich singe im Chor und erzähle gern von meiner Zeit in Hamburg.',
   array['Musik', 'Geschichte', 'Kochen'], null,
   '49497', 'Mettingen', 52.3167, 7.7833)
on conflict (id) do nothing;


-- Offers ("Meine Karte") -----------------------------------------------------

insert into public.offers (
  user_id, availability, description, is_published
)
values
  ('11111111-1111-1111-1111-111111111111',
   'Dienstags und donnerstags nachmittags',
   'Ich würde mich freuen, jemanden regelmäßig zu besuchen und gemeinsam zu kochen.', true),

  ('22222222-2222-2222-2222-222222222222',
   'Montags, mittwochs und am Wochenende',
   'Ich suche jemanden, mit dem ich auf Deutsch reden kann – über alles, gern bei einem Spaziergang.', true),

  ('33333333-3333-3333-3333-333333333333',
   'Fast jeden Nachmittag',
   'Ich helfe gern beim Deutschlernen und freue mich über Gesellschaft im Garten.', true),

  ('44444444-4444-4444-4444-444444444444',
   'Wochentags vormittags',
   'Wer Schach lernen möchte, ist bei mir richtig. Kaffee gibt es dazu.', true),

  -- Mettingen is ~25 km out — the one that makes a radius filter interesting.
  ('55555555-5555-5555-5555-555555555555',
   'Nachmittags, am liebsten mit Voranmeldung',
   'Ich freue mich über Besuch – gern jemand, der mit mir singt oder vorliest.', true)
on conflict (user_id) do nothing;


-- Connections and chat -------------------------------------------------------

-- Accepted: Tariq and Ingrid are already talking.
insert into public.connections (id, requester_id, recipient_id, status)
values
  ('bbbbbbbb-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333333',
   'accepted')
on conflict (id) do nothing;

-- Pending: gives the requests UI something to answer, greeting and all.
insert into public.connections (id, requester_id, recipient_id, status, intro_message)
values
  ('bbbbbbbb-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   '44444444-4444-4444-4444-444444444444',
   'pending',
   'Guten Tag Herr Pohl! Ich würde sehr gern Schach lernen und bringe Kuchen mit.')
on conflict (id) do nothing;

-- A few views, so "Aufrufe diese Woche" is not zero on first load.
insert into public.offer_views (offer_id, viewer_id, viewed_on)
select o.id, v.viewer_id, current_date - v.days_ago
from public.offers o
join (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 1),
  ('11111111-1111-1111-1111-111111111111'::uuid, 3),
  ('22222222-2222-2222-2222-222222222222'::uuid, 2)
) as v(viewer_id, days_ago) on true
where o.user_id = '44444444-4444-4444-4444-444444444444'
on conflict do nothing;

-- The last message is unread, so the badge has something to show on first load.
insert into public.messages (connection_id, sender_id, body, read_at, created_at)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Guten Tag Frau Schäfer! Ich heiße Tariq und würde sehr gern mein Deutsch mit Ihnen üben.',
   now() - interval '3 days', now() - interval '3 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Hallo Tariq, das freut mich! Kommen Sie doch am Donnerstag auf einen Kaffee vorbei.',
   now() - interval '2 days', now() - interval '3 days' + interval '2 hours'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Der Garten blüht gerade, das müssen Sie sehen.',
   null, now() - interval '1 hour');
