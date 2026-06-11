-- ============================================
-- Garden Pilot — My Plants Module Schema
-- Run this in your Supabase SQL editor
-- ADD to your existing schema
-- ============================================

-- Extended plants table (replaces basic one)
create table if not exists plants (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references profiles(id) on delete cascade not null,
  name            text not null,
  variety         text,
  category        text,
  status          text default 'Seeded'
                  check (status in ('Seeded','Sprouting','Seedling','Growing','Flowering','Fruiting','Harvesting','Finished')),
  health          text default 'Good'
                  check (health in ('Excellent','Good','Fair','Poor')),
  bed             text,
  sun_exposure    text,
  planted_date    date,
  seeds_planted   int default 0,
  seeds_sprouted  int default 0,
  days_to_harvest int,
  next_action     text,
  seed_source     text,
  seed_packet_name text,
  purchase_year   text,
  start_location  text,
  germ_days       int,
  notes           text,
  grow_again      boolean,
  photo_url       text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table plants enable row level security;
create policy "Users manage own plants" on plants
  for all using (auth.uid() = user_id);

-- Plant timeline milestones
create table plant_milestones (
  id          uuid default uuid_generate_v4() primary key,
  plant_id    uuid references plants(id) on delete cascade not null,
  milestone   text not null,
  completed   boolean default true,
  completed_at timestamptz default now()
);

alter table plant_milestones enable row level security;
create policy "Users manage own milestones" on plant_milestones
  for all using (
    exists (select 1 from plants where plants.id = plant_id and plants.user_id = auth.uid())
  );

-- Plant activity log (quick updates)
create table plant_activity (
  id          uuid default uuid_generate_v4() primary key,
  plant_id    uuid references plants(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  action_type text not null,
  note        text,
  emoji       text,
  logged_at   timestamptz default now()
);

alter table plant_activity enable row level security;
create policy "Users manage own activity" on plant_activity
  for all using (auth.uid() = user_id);

-- Harvest log
create table harvest_log (
  id          uuid default uuid_generate_v4() primary key,
  plant_id    uuid references plants(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  weight      numeric(8,2),
  unit        text default 'lbs' check (unit in ('lbs','oz','count','kg')),
  harvested_at date default current_date,
  notes       text,
  created_at  timestamptz default now()
);

alter table harvest_log enable row level security;
create policy "Users manage own harvests" on harvest_log
  for all using (auth.uid() = user_id);

-- Plant measurements (optional tracking)
create table plant_measurements (
  id            uuid default uuid_generate_v4() primary key,
  plant_id      uuid references plants(id) on delete cascade not null,
  height_in     numeric(6,1),
  width_in      numeric(6,1),
  flower_count  int,
  fruit_count   int,
  measured_at   date default current_date,
  notes         text
);

alter table plant_measurements enable row level security;
create policy "Users manage own measurements" on plant_measurements
  for all using (
    exists (select 1 from plants where plants.id = plant_id and plants.user_id = auth.uid())
  );

-- Plant problems log
create table plant_problems (
  id            uuid default uuid_generate_v4() primary key,
  plant_id      uuid references plants(id) on delete cascade not null,
  problem_type  text not null,
  notes         text,
  treatment     text,
  photo_url     text,
  noticed_at    date default current_date,
  resolved      boolean default false,
  created_at    timestamptz default now()
);

alter table plant_problems enable row level security;
create policy "Users manage own problems" on plant_problems
  for all using (
    exists (select 1 from plants where plants.id = plant_id and plants.user_id = auth.uid())
  );
