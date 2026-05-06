-- ============================================================
-- BookMe — Initial Schema
-- Run this in your Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── profiles ───────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users not null unique,
  name        text,
  username    text unique,
  bio         text,
  avatar_url  text,
  skills      text[] default '{}',
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are readable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = user_id);

-- ─── availability_slots ─────────────────────────────────────
create table if not exists availability_slots (
  id            uuid primary key default uuid_generate_v4(),
  freelancer_id uuid references profiles(id) on delete cascade not null,
  day_of_week   int check (day_of_week between 0 and 6) not null,
  start_time    time not null,
  end_time      time not null,
  created_at    timestamptz default now()
);

alter table availability_slots enable row level security;

create policy "Anyone can read availability"
  on availability_slots for select using (true);

create policy "Freelancers can manage their availability"
  on availability_slots for all
  using (
    freelancer_id in (select id from profiles where user_id = auth.uid())
  );

-- ─── service_offerings ──────────────────────────────────────
create table if not exists service_offerings (
  id            uuid primary key default uuid_generate_v4(),
  freelancer_id uuid references profiles(id) on delete cascade not null,
  title         text not null,
  description   text,
  duration_hours numeric(4,1) not null,
  price         numeric(10,2) not null,
  created_at    timestamptz default now()
);

alter table service_offerings enable row level security;

create policy "Anyone can read services"
  on service_offerings for select using (true);

create policy "Freelancers can manage their services"
  on service_offerings for all
  using (
    freelancer_id in (select id from profiles where user_id = auth.uid())
  );

-- ─── booking_requests ───────────────────────────────────────
create table if not exists booking_requests (
  id             uuid primary key default uuid_generate_v4(),
  freelancer_id  uuid references profiles(id) on delete cascade not null,
  service_id     uuid references service_offerings(id) on delete set null,
  client_name    text not null,
  client_email   text not null,
  client_message text,
  booking_date   date not null,
  start_time     time not null,
  duration_hours numeric(4,1) not null,
  status         text check (status in ('pending','approved','rejected'))
                   not null default 'pending',
  created_at     timestamptz default now()
);

alter table booking_requests enable row level security;

-- Freelancer can see and manage all their requests
create policy "Freelancers manage their requests"
  on booking_requests for all
  using (
    freelancer_id in (select id from profiles where user_id = auth.uid())
  );

-- Anyone can insert a booking request (clients don't need accounts)
create policy "Anyone can submit a booking request"
  on booking_requests for insert with check (true);

-- Allow clients to read their own requests by email
create policy "Clients can read their own requests"
  on booking_requests for select
  using (true);

-- ─── reviews ────────────────────────────────────────────────
create table if not exists reviews (
  id             uuid primary key default uuid_generate_v4(),
  booking_id     uuid references booking_requests(id) on delete cascade unique not null,
  freelancer_id  uuid references profiles(id) on delete cascade not null,
  reviewer_name  text not null,
  reviewer_email text not null,
  rating         int check (rating between 1 and 5) not null,
  comment        text,
  created_at     timestamptz default now()
);

alter table reviews enable row level security;

create policy "Anyone can read reviews"
  on reviews for select using (true);

create policy "Anyone can insert a review for an approved booking"
  on reviews for insert
  with check (
    booking_id in (
      select id from booking_requests where status = 'approved'
    )
  );
