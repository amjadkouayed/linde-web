-- Public, stable usernames for profile URLs.

alter table public.profiles
  add column username text;

update public.profiles
set username = case id::text
  when '11111111-1111-1111-1111-111111111111' then 'lena-vogt'
  when '22222222-2222-2222-2222-222222222222' then 'tariq-haddad'
  when '33333333-3333-3333-3333-333333333333' then 'ingrid-schaefer'
  when '44444444-4444-4444-4444-444444444444' then 'werner-pohl'
  when '55555555-5555-5555-5555-555555555555' then 'elisabeth-wagner'
  else 'profil-' || left(replace(id::text, '-', ''), 12)
end
where username is null;

alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_format
    check (username ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$');

create unique index profiles_username_uniq on public.profiles (username);
