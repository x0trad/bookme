-- ============================================================
-- BookMe — Demo profile seed
-- One-time script to create a public "demo" profile so the
-- "/u/demo" link on the landing page has something to show.
--
-- This is NOT a real login — BookMe only supports magic-link
-- sign-in, and nobody needs to be signed in to view a public
-- profile. This script just creates the underlying auth.users
-- row needed to satisfy the profiles.user_id foreign key.
--
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: it skips creation if the demo user already exists.
-- ============================================================

do $$
declare
  demo_user_id    uuid := '11111111-1111-1111-1111-111111111111';
  demo_profile_id uuid;
  svc_lesson_id   uuid;
  svc_song_id     uuid;
  svc_crash_id    uuid;
  booking1_id     uuid;
  booking2_id     uuid;
begin
  -- ── Auth user (placeholder — never used to sign in) ──────────
  if not exists (select 1 from auth.users where id = demo_user_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      demo_user_id, 'authenticated', 'authenticated',
      'demo@bookme.app',
      '$2a$10$abcdefghijklmnopqrstuvuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      '', '', '', ''
    );
  end if;

  -- ── Profile ────────────────────────────────────────────────────
  insert into profiles (user_id, name, username, bio, skills)
  values (
    demo_user_id,
    'Alex Rivera',
    'demo',
    'Guitar teacher and songwriter with 8 years of experience. I teach beginners through advanced players, in person or over video call.',
    array['Guitar','Music Theory','Songwriting']
  )
  on conflict (user_id) do update set
    name = excluded.name, username = excluded.username,
    bio = excluded.bio, skills = excluded.skills
  returning id into demo_profile_id;

  -- ── Services (only add if this demo profile has none yet) ──────
  if not exists (select 1 from service_offerings where freelancer_id = demo_profile_id) then
    insert into service_offerings (freelancer_id, title, description, duration_hours, price)
    values
      (demo_profile_id, '1-on-1 Guitar Lesson', 'Personalized lesson at your level — technique, theory, or song-specific coaching.', 1, 40)
      returning id into svc_lesson_id;

    insert into service_offerings (freelancer_id, title, description, duration_hours, price)
    values
      (demo_profile_id, 'Songwriting Session', 'Work through an original song idea together, from chords to lyrics.', 1.5, 55)
      returning id into svc_song_id;

    insert into service_offerings (freelancer_id, title, description, duration_hours, price)
    values
      (demo_profile_id, 'Beginner Crash Course', 'A focused 2-hour session to get you playing your first songs.', 2, 90)
      returning id into svc_crash_id;
  else
    select id into svc_lesson_id from service_offerings where freelancer_id = demo_profile_id order by created_at limit 1;
  end if;

  -- ── Availability: Mon–Fri 9–5, Sat 10–2 ────────────────────────
  if not exists (select 1 from availability_slots where freelancer_id = demo_profile_id) then
    insert into availability_slots (freelancer_id, day_of_week, start_time, end_time)
    values
      (demo_profile_id, 1, '09:00', '17:00'),
      (demo_profile_id, 2, '09:00', '17:00'),
      (demo_profile_id, 3, '09:00', '17:00'),
      (demo_profile_id, 4, '09:00', '17:00'),
      (demo_profile_id, 5, '09:00', '17:00'),
      (demo_profile_id, 6, '10:00', '14:00');
  end if;

  -- ── A couple of approved bookings + reviews, for a realistic rating ──
  if not exists (select 1 from reviews where freelancer_id = demo_profile_id) then
    insert into booking_requests (freelancer_id, service_id, client_name, client_email, booking_date, start_time, duration_hours, status)
    values (demo_profile_id, svc_lesson_id, 'Maya Chen', 'maya@example.com', current_date - 6, '10:00', 1, 'approved')
    returning id into booking1_id;

    insert into booking_requests (freelancer_id, service_id, client_name, client_email, booking_date, start_time, duration_hours, status)
    values (demo_profile_id, svc_lesson_id, 'Jordan Lee', 'jordan@example.com', current_date - 2, '14:00', 1, 'approved')
    returning id into booking2_id;

    insert into reviews (booking_id, freelancer_id, reviewer_name, reviewer_email, rating, comment)
    values
      (booking1_id, demo_profile_id, 'Maya Chen', 'maya@example.com', 5, 'Alex is an incredible teacher — patient, clear, and genuinely fun to learn from.'),
      (booking2_id, demo_profile_id, 'Jordan Lee', 'jordan@example.com', 5, 'Booked in two minutes, showed up, had a great lesson. Exactly as advertised.');
  end if;

end $$;
