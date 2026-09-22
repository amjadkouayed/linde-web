-- Demo data for local development and the presentation.
-- Runs automatically after migrations on `supabase db reset`.
--
-- Every account uses the password: linde1234
--
-- profiles.id IS auth.users.id, so the uuids below are both at once.
--
-- Everything here is plain set-based SQL on purpose: the CLI's seed runner
-- batches statements, and a dollar-quoted function body breaks it.

-- Auth users. Password sign-in needs BOTH an auth.users row and a matching
-- auth.identities row, or login fails with "invalid credentials".
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

insert into public.profiles (
  id, role, full_name, bio, interests, study_field,
  availability, card_description, is_published
)
values
  ('11111111-1111-1111-1111-111111111111',
   'student', 'Lena Vogt',
   'Medizinstudentin im 4. Semester. Ich koche gern und höre gern Geschichten von früher.',
   array['Kochen', 'Musik', 'Spazieren'], 'Medizin',
   'Dienstags und donnerstags nachmittags',
   'Ich würde mich freuen, jemanden regelmäßig zu besuchen und gemeinsam zu kochen.',
   true),

  ('22222222-2222-2222-2222-222222222222',
   'student', 'Tariq Haddad',
   'Ich komme aus Jordanien und studiere seit einem Jahr in Osnabrück. Ich möchte mein Deutsch verbessern.',
   array['Sprache', 'Schach', 'Fotografie'], 'Informatik',
   'Montags, mittwochs und am Wochenende',
   'Ich suche jemanden, mit dem ich auf Deutsch reden kann – über alles, gern bei einem Spaziergang.',
   true),

  ('33333333-3333-3333-3333-333333333333',
   'senior', 'Ingrid Schäfer',
   'Ich war 35 Jahre lang Lehrerin. Heute lese ich viel und arbeite im Garten.',
   array['Lesen', 'Garten', 'Sprache'], null,
   'Fast jeden Nachmittag',
   'Ich helfe gern beim Deutschlernen und freue mich über Gesellschaft im Garten.',
   true),

  ('44444444-4444-4444-4444-444444444444',
   'senior', 'Werner Pohl',
   'Früher Schlosser, heute Schachspieler. Ich erkläre gern, wie Dinge funktionieren.',
   array['Schach', 'Technik', 'Musik'], null,
   'Wochentags vormittags',
   'Wer Schach lernen möchte, ist bei mir richtig. Kaffee gibt es dazu.',
   true),

  ('55555555-5555-5555-5555-555555555555',
   'senior', 'Elisabeth Wagner',
   'Ich singe im Chor und erzähle gern von meiner Zeit in Hamburg.',
   array['Musik', 'Geschichte', 'Kochen'], null,
   'Nachmittags, am liebsten mit Voranmeldung',
   'Ich freue mich über Besuch – gern jemand, der mit mir singt oder vorliest.',
   true)
on conflict (id) do nothing;


-- Connections and chat -------------------------------------------------------

-- Accepted: Tariq and Ingrid are already talking.
insert into public.connections (
  id, requester_profile_id, addressee_profile_id, status,
  requester_last_read_at, addressee_last_read_at
)
values
  ('bbbbbbbb-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333333',
   'accepted', now() - interval '2 days', now() - interval '2 days')
on conflict (id) do nothing;

-- Pending: gives the requests UI something to answer.
insert into public.connections (
  id, requester_profile_id, addressee_profile_id, status
)
values
  ('bbbbbbbb-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   '44444444-4444-4444-4444-444444444444',
   'pending')
on conflict (id) do nothing;

-- The last message is newer than both last_read_at values, so the unread badge
-- has something to show on first load.
insert into public.messages (connection_id, sender_profile_id, body, created_at)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Guten Tag Frau Schäfer! Ich heiße Tariq und würde sehr gern mein Deutsch mit Ihnen üben.',
   now() - interval '3 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Hallo Tariq, das freut mich! Kommen Sie doch am Donnerstag auf einen Kaffee vorbei.',
   now() - interval '3 days' + interval '2 hours'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Der Garten blüht gerade, das müssen Sie sehen.',
   now() - interval '1 hour')
on conflict do nothing;
