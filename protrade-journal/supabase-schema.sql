-- ProTrade Journal - Supabase Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles (Supabase auth.users is auto-created)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Settings table (one row per user)
create table settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade unique,
  initial_capital numeric default 10000,
  theme text default 'dark',
  default_risk numeric default 2,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tags table
create table tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  description text,
  color text default '#3b82f6',
  created_at timestamp with time zone default now()
);

-- Trades table
create table trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date timestamp with time zone not null,
  pair text not null,
  direction text not null check (direction in ('buy', 'sell')),
  style text,
  lot_size numeric,
  stop_loss numeric,
  take_profit numeric,
  result numeric,
  tags text[],
  comment text,
  screenshot_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Notes table
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  category text,
  content text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Surveillance table
create table surveillances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  pair text not null,
  direction text not null check (direction in ('buy', 'sell')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Surveillance confirmations (sub-table)
create table surveillance_confirmations (
  id uuid primary key default uuid_generate_v4(),
  surveillance_id uuid references surveillances on delete cascade,
  title text not null,
  stars integer default 3 check (stars between 1 and 5),
  checked boolean default false,
  created_at timestamp with time zone default now()
);

-- Surveillance screenshots (sub-table)
create table surveillance_screenshots (
  id uuid primary key default uuid_generate_v4(),
  surveillance_id uuid references surveillances on delete cascade,
  url text not null,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index idx_trades_user_id on trades(user_id);
create index idx_trades_date on trades(date);
create index idx_notes_user_id on notes(user_id);
create index idx_surveillances_user_id on surveillances(user_id);
create index idx_tags_user_id on tags(user_id);

-- Row Level Security policies
alter table settings enable row level security;
alter table tags enable row level security;
alter table trades enable row level security;
alter table notes enable row level security;
alter table surveillances enable row level security;
alter table surveillance_confirmations enable row level security;
alter table surveillance_screenshots enable row level security;

-- Policies
create policy "Users can view their own settings" on settings for select using (auth.uid() = user_id);
create policy "Users can insert their own settings" on settings for insert with check (auth.uid() = user_id);
create policy "Users can update their own settings" on settings for update using (auth.uid() = user_id);

create policy "Users can view their own tags" on tags for select using (auth.uid() = user_id);
create policy "Users can insert their own tags" on tags for insert with check (auth.uid() = user_id);
create policy "Users can update their own tags" on tags for update using (auth.uid() = user_id);
create policy "Users can delete their own tags" on tags for delete using (auth.uid() = user_id);

create policy "Users can view their own trades" on trades for select using (auth.uid() = user_id);
create policy "Users can insert their own trades" on trades for insert with check (auth.uid() = user_id);
create policy "Users can update their own trades" on trades for update using (auth.uid() = user_id);
create policy "Users can delete their own trades" on trades for delete using (auth.uid() = user_id);

create policy "Users can view their own notes" on notes for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on notes for update using (auth.uid() = user_id);
create policy "Users can delete their own notes" on notes for delete using (auth.uid() = user_id);

create policy "Users can view their own surveillances" on surveillances for select using (auth.uid() = user_id);
create policy "Users can insert their own surveillances" on surveillances for insert with check (auth.uid() = user_id);
create policy "Users can update their own surveillances" on surveillances for update using (auth.uid() = user_id);
create policy "Users can delete their own surveillances" on surveillances for delete using (auth.uid() = user_id);

create policy "Users can view confirmations of their surveillances" on surveillance_confirmations for select using (
  exists (select 1 from surveillances where surveillances.id = surveillance_confirmations.surveillance_id and surveillances.user_id = auth.uid())
);
create policy "Users can manage confirmations of their surveillances" on surveillance_confirmations for all using (
  exists (select 1 from surveillances where surveillances.id = surveillance_confirmations.surveillance_id and surveillances.user_id = auth.uid())
);

create policy "Users can view screenshots of their surveillances" on surveillance_screenshots for select using (
  exists (select 1 from surveillances where surveillances.id = surveillance_screenshots.surveillance_id and surveillances.user_id = auth.uid())
);1
create policy "Users can manage screenshots of their surveillances" on surveillance_screenshots for all using (
  exists (select 1 from surveillances where surveillances.id = surveillance_screenshots.surveillance_id and surveillances.user_id = auth.uid())
);