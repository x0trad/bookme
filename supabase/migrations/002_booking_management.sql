-- ============================================================
-- BookMe — Client Booking Management
-- Adds: 'cancelled' status, secret manage tokens, and RPCs for
-- token-based lookup / cancel / reschedule (no client account).
-- Run this in your Supabase SQL editor after 001_initial.sql
-- ============================================================

-- ─── allow 'cancelled' status ───────────────────────────────
alter table booking_requests drop constraint if exists booking_requests_status_check;
alter table booking_requests add constraint booking_requests_status_check
  check (status in ('pending','approved','rejected','cancelled'));

-- ─── booking_tokens ─────────────────────────────────────────
-- Kept in a separate table with RLS on and NO policies, so tokens
-- are never readable through the public API. All access goes
-- through the SECURITY DEFINER functions below.
create table if not exists booking_tokens (
  booking_id uuid primary key references booking_requests(id) on delete cascade,
  token      uuid unique not null default uuid_generate_v4(),
  created_at timestamptz default now()
);

alter table booking_tokens enable row level security;

-- Backfill tokens for existing bookings
insert into booking_tokens (booking_id)
select id from booking_requests
on conflict (booking_id) do nothing;

-- ─── create_booking_request ─────────────────────────────────
-- Inserts the booking + its token atomically and returns both,
-- with a server-side conflict check against approved bookings.
create or replace function create_booking_request(
  p_freelancer_id  uuid,
  p_service_id     uuid,
  p_client_name    text,
  p_client_email   text,
  p_client_message text,
  p_booking_date   date,
  p_start_time     time,
  p_duration_hours numeric
) returns table (booking_id uuid, manage_token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_id    uuid;
  v_token uuid;
  v_start numeric := extract(hour from p_start_time);
begin
  if exists (
    select 1 from booking_requests b
    where b.freelancer_id = p_freelancer_id
      and b.booking_date  = p_booking_date
      and b.status        = 'approved'
      and v_start < extract(hour from b.start_time) + b.duration_hours
      and v_start + p_duration_hours > extract(hour from b.start_time)
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  insert into booking_requests
    (freelancer_id, service_id, client_name, client_email, client_message,
     booking_date, start_time, duration_hours, status)
  values
    (p_freelancer_id, p_service_id, p_client_name, p_client_email,
     nullif(p_client_message, ''), p_booking_date, p_start_time,
     p_duration_hours, 'pending')
  returning id into v_id;

  insert into booking_tokens as bt (booking_id)
  values (v_id) returning bt.token into v_token;

  return query select v_id, v_token;
end $$;

-- ─── get_booking_by_token ───────────────────────────────────
create or replace function get_booking_by_token(p_token uuid)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'id',                  b.id,
    'status',              b.status,
    'booking_date',        b.booking_date,
    'start_time',          b.start_time,
    'duration_hours',      b.duration_hours,
    'client_name',         b.client_name,
    'client_email',        b.client_email,
    'client_message',      b.client_message,
    'freelancer_id',       b.freelancer_id,
    'freelancer_name',     p.name,
    'freelancer_username', p.username,
    'freelancer_avatar',   p.avatar_url,
    'service_title',       s.title,
    'service_price',       s.price
  )
  from booking_tokens t
  join booking_requests b on b.id = t.booking_id
  join profiles p on p.id = b.freelancer_id
  left join service_offerings s on s.id = b.service_id
  where t.token = p_token
$$;

-- ─── cancel_booking_by_token ────────────────────────────────
create or replace function cancel_booking_by_token(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v booking_requests;
begin
  select b.* into v
  from booking_tokens t join booking_requests b on b.id = t.booking_id
  where t.token = p_token;

  if v.id is null then raise exception 'NOT_FOUND'; end if;
  if v.status not in ('pending','approved') then raise exception 'NOT_CANCELLABLE'; end if;
  if v.booking_date < current_date then raise exception 'IN_PAST'; end if;

  update booking_requests set status = 'cancelled' where id = v.id;
  return json_build_object('success', true);
end $$;

-- ─── reschedule_booking_by_token ────────────────────────────
-- Moves the booking to a new slot and resets it to 'pending'
-- so the freelancer re-approves.
create or replace function reschedule_booking_by_token(
  p_token      uuid,
  p_date       date,
  p_start_time time
) returns json language plpgsql security definer set search_path = public as $$
declare
  v booking_requests;
  v_start numeric := extract(hour from p_start_time);
begin
  select b.* into v
  from booking_tokens t join booking_requests b on b.id = t.booking_id
  where t.token = p_token;

  if v.id is null then raise exception 'NOT_FOUND'; end if;
  if v.status not in ('pending','approved') then raise exception 'NOT_RESCHEDULABLE'; end if;
  if p_date < current_date then raise exception 'IN_PAST'; end if;

  if exists (
    select 1 from booking_requests b
    where b.freelancer_id = v.freelancer_id
      and b.booking_date  = p_date
      and b.status        = 'approved'
      and b.id           <> v.id
      and v_start < extract(hour from b.start_time) + b.duration_hours
      and v_start + v.duration_hours > extract(hour from b.start_time)
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  update booking_requests
  set booking_date = p_date, start_time = p_start_time, status = 'pending'
  where id = v.id;

  return json_build_object('success', true);
end $$;

-- ─── get_manage_token (freelancer only) ─────────────────────
-- Lets the signed-in freelancer fetch a booking's token so the
-- approval email can include the client's manage link.
create or replace function get_manage_token(p_booking_id uuid)
returns uuid language sql security definer set search_path = public as $$
  select t.token
  from booking_tokens t
  join booking_requests b on b.id = t.booking_id
  join profiles p on p.id = b.freelancer_id
  where t.booking_id = p_booking_id
    and p.user_id = auth.uid()
$$;

-- ─── grants ─────────────────────────────────────────────────
grant execute on function create_booking_request(uuid,uuid,text,text,text,date,time,numeric) to anon, authenticated;
grant execute on function get_booking_by_token(uuid) to anon, authenticated;
grant execute on function cancel_booking_by_token(uuid) to anon, authenticated;
grant execute on function reschedule_booking_by_token(uuid,date,time) to anon, authenticated;
grant execute on function get_manage_token(uuid) to authenticated;
