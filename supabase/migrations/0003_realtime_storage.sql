-- Realtime chat and avatar storage.

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- Clients subscribe to postgres_changes on messages with
-- `filter: connection_id=eq.<id>`; RLS is enforced per subscriber, so a client
-- that subscribes broadly still receives only its own conversations.
--
-- Clients MUST call supabase.realtime.setAuth() when the access token
-- refreshes, or the channel silently stops delivering. That is the single most
-- common "chat just stopped working" bug in both apps.
--
-- Ceiling: this pays a can_use_thread() check per message per subscriber. Fine
-- at demo scale; the upgrade path is broadcast-from-the-database via an
-- AFTER INSERT trigger.
alter publication supabase_realtime add table public.messages;

-- Messages are updatable (read_at only), and a subscriber needs the old row to
-- tell an insert from a read receipt.
alter table public.messages replica identity full;


-- ---------------------------------------------------------------------------
-- Avatar storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Objects are keyed <auth uid>/<filename>, so the first path segment is the
-- ownership boundary.
create policy "avatars are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "users upload into their own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users replace their own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete their own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
