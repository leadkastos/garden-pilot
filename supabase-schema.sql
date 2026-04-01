-- ============================================
-- Garden Pilot — Supabase Database Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  email       text,
  location    text,
  timezone    text default 'America/Chicago',
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- ============================================
-- PLANTS
-- ============================================
create table plants (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  name        text not null,
  category    text check (category in ('vegetable','flower','herb')) not null,
  variety     text,
  stage       text check (stage in ('seed','germinating','seedling','growing','flowering','harvest','dormant')) default 'seed',
  notes       text,
  bed_id      uuid,
  planted_at  date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table plants enable row level security;
create policy "Users manage own plants" on plants for all using (auth.uid() = user_id);

-- ============================================
-- GARDEN BEDS
-- ============================================
create table beds (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  name        text not null,
  width_ft    numeric(5,1),
  length_ft   numeric(5,1),
  notes       text,
  created_at  timestamptz default now()
);

alter table beds enable row level security;
create policy "Users manage own beds" on beds for all using (auth.uid() = user_id);

-- Bed ↔ Plant join
create table bed_plants (
  id        uuid default uuid_generate_v4() primary key,
  bed_id    uuid references beds(id) on delete cascade,
  plant_id  uuid references plants(id) on delete cascade,
  quantity  int default 1,
  added_at  timestamptz default now()
);

alter table bed_plants enable row level security;
create policy "Users manage own bed plants" on bed_plants for all
  using (exists (select 1 from beds where beds.id = bed_id and beds.user_id = auth.uid()));

-- ============================================
-- TASKS
-- ============================================
create table tasks (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  title       text not null,
  description text,
  due_date    date,
  completed   boolean default false,
  completed_at timestamptz,
  category    text check (category in ('water','fertilize','plant','harvest','prune','other')) default 'other',
  plant_id    uuid references plants(id) on delete set null,
  bed_id      uuid references beds(id) on delete set null,
  is_system   boolean default false,
  created_at  timestamptz default now()
);

alter table tasks enable row level security;
create policy "Users manage own tasks" on tasks for all using (auth.uid() = user_id);

-- ============================================
-- EXPENSES
-- ============================================
create table expenses (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  item_name   text not null,
  category    text check (category in ('Seeds','Soil','Tools','Fertilizer','Other')) not null,
  cost        numeric(10,2) not null,
  purchase_date date default current_date,
  plant_id    uuid references plants(id) on delete set null,
  notes       text,
  created_at  timestamptz default now()
);

alter table expenses enable row level security;
create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table notifications (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  title       text not null,
  body        text,
  type        text check (type in ('frost','task','system','broadcast')) default 'system',
  unread      boolean default true,
  created_at  timestamptz default now()
);

alter table notifications enable row level security;
create policy "Users view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on notifications for update using (auth.uid() = user_id);

-- ============================================
-- PHOTOS
-- ============================================
create table photos (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  storage_path text not null,
  public_url  text,
  caption     text,
  plant_id    uuid references plants(id) on delete set null,
  bed_id      uuid references beds(id) on delete set null,
  taken_at    date default current_date,
  created_at  timestamptz default now()
);

alter table photos enable row level security;
create policy "Users manage own photos" on photos for all using (auth.uid() = user_id);

-- ============================================
-- FLOWER TRACKER
-- ============================================
create table flower_tracker (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  name        text not null,
  variety     text,
  seed_date   date,
  num_seeds   int,
  num_germ    int,
  date_germ   date,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table flower_tracker enable row level security;
create policy "Users manage own flower tracker" on flower_tracker for all using (auth.uid() = user_id);

-- Harvest cycles (expandable)
create table flower_cycles (
  id            uuid default uuid_generate_v4() primary key,
  flower_id     uuid references flower_tracker(id) on delete cascade not null,
  cycle_number  int not null,
  date_planted  date,
  date_harvest  date,
  num_stems     int,
  pull_date     date,
  pull_reason   text,
  notes         text,
  created_at    timestamptz default now()
);

alter table flower_cycles enable row level security;
create policy "Users manage own flower cycles" on flower_cycles for all
  using (exists (select 1 from flower_tracker where flower_tracker.id = flower_id and flower_tracker.user_id = auth.uid()));

-- ============================================
-- REPORTS
-- ============================================
create table reports (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  type        text check (type in ('weekly','monthly','yearly')) not null,
  period_start date not null,
  period_end   date not null,
  data        jsonb,
  created_at  timestamptz default now()
);

alter table reports enable row level security;
create policy "Users manage own reports" on reports for all using (auth.uid() = user_id);

-- ============================================
-- ADMIN BROADCASTS
-- ============================================
create table broadcasts (
  id          uuid default uuid_generate_v4() primary key,
  title       text not null,
  body        text,
  sent_by     uuid references profiles(id),
  target      text default 'all',
  created_at  timestamptz default now()
);

-- Storage bucket for photos
-- Run in Supabase dashboard > Storage > New bucket
-- Name: garden-photos | Public: false
