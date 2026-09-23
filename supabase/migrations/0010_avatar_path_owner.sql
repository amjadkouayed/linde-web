-- A profile photo must come from the owner's own storage folder.
--
-- avatar_path is written by the client. Without this, anyone could point their
-- profile at another user's photo — the avatars bucket is public — and appear
-- in discover wearing someone else's face. The storage policy already confines
-- uploads to `<auth uid>/…`; this closes the other half by refusing a path
-- outside the row's own folder. profiles.id IS the auth uid, so the rule is a
-- plain comparison on the row and needs no lookup.
alter table public.profiles
  add constraint profiles_avatar_path_own_folder
    check (avatar_path is null or avatar_path like id::text || '/%');
