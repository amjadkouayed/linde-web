-- Chat URLs by the other person's username rather than the connection's
-- UUID, like the request page (0011). The view gains one column; everything
-- else is 0004's definition unchanged.

create or replace view public.connection_overview
with (security_invoker = on, security_barrier = on) as
select
  c.id           as connection_id,
  c.status,
  c.created_at,
  c.intro_message,
  c.requester_id = (select auth.uid()) as i_am_requester,
  other.id       as other_profile_id,
  other.name     as other_name,
  other.role     as other_role,
  other.avatar_path as other_avatar_path,
  other.status   as other_status,
  extract(year from now())::int - other.birth_year as other_age,
  last_message.body       as last_message_body,
  last_message.created_at as last_message_at,
  last_message.sender_id  as last_message_sender_id,
  unread.count   as unread_count,
  -- Appended: CREATE OR REPLACE VIEW may only add columns at the end.
  other.username as other_username
from public.connections c
cross join lateral (
  select case when c.requester_id = (select auth.uid())
              then c.recipient_id else c.requester_id end as other_id
) s
join public.profiles other on other.id = s.other_id
left join lateral (
  select m.body, m.created_at, m.sender_id
  from public.messages m
  where m.connection_id = c.id
  order by m.created_at desc
  limit 1
) last_message on true
cross join lateral (
  select count(*)::int as count
  from public.messages m
  where m.connection_id = c.id
    and m.read_at is null
    and m.sender_id <> (select auth.uid())
) unread;
