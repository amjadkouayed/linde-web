-- Showcase sign-in without the e-mail code, switched from the database.
--
-- For the showcase, anyone types an e-mail address and is in. Supabase has no
-- code-free e-mail login, and the admin API needs the service-role key, which
-- this app deliberately never holds. So: this function hands the server a
-- fresh random password for a showcase account, and the server signs in with
-- it. The password never reaches the browser and is replaced on every call.
--
-- Only showcase accounts (app_metadata.showcase): new addresses, created here,
-- and the demo profiles. A real account — made with a code — is refused, or
-- typing someone's address would be enough to read their chats.
--
-- Open while app.showcase.open_until is in the future. To close it early:
--   update app.showcase set open_until = now();
-- After the showcase, also remove the passwords this handed out:
--   update auth.users set encrypted_password = '' where raw_app_meta_data->>'showcase' = 'true';

create table app.showcase (
  id         boolean primary key default true check (id),
  open_until timestamptz not null
);

-- Closed by default. Production opens it for the showcase by hand.
insert into app.showcase (open_until) values ('-infinity');

create function public.showcase_password(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email    text := lower(btrim(p_email));
  v_password text := encode(extensions.gen_random_bytes(24), 'base64');
  v_user     auth.users%rowtype;
  v_id       uuid;
begin
  if not exists (select 1 from app.showcase where open_until > now()) then
    return null;
  end if;
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return null;
  end if;

  select * into v_user from auth.users where lower(email) = v_email;

  if found then
    if coalesce(v_user.raw_app_meta_data->>'showcase', '') <> 'true' then
      return null;
    end if;
    update auth.users
    set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
        updated_at = now()
    where id = v_user.id;
    return v_password;
  end if;

  -- Same shape as seed.sql: the token columns must be '' not NULL, or GoTrue
  -- fails every sign-in with "Database error querying schema".
  v_id := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"],"showcase":true}'::jsonb, '{}'::jsonb,
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', v_id::text, now(), now(), now());

  return v_password;
end;
$$;

-- Called before anyone is signed in, so anon must be able to run it. While
-- closed it returns null for everyone.
revoke all on function public.showcase_password(text) from public;
grant execute on function public.showcase_password(text) to anon, authenticated;
