-- Community health risk mapping schema for Supabase
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  responsible_name text not null,
  address text not null,
  cep text,
  city text default 'Fernandopolis - SP',
  address_number text,
  address_complement text,
  contact_phone text,
  micro_area text,
  notes text,
  lat numeric,
  lng numeric,
  created_at timestamptz default now()
);

alter table households add column if not exists cep text;
alter table households add column if not exists city text default 'Fernandopolis - SP';
alter table households alter column city set default 'Fernandopolis - SP';
alter table households add column if not exists address_number text;
alter table households add column if not exists address_complement text;
alter table households add column if not exists contact_phone text;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'risk_factor_type') then
    create type risk_factor_type as enum (
      'Agua parada',
      'Presenca de animais',
      'Falta de saneamento',
      'Lixo acumulado',
      'Outro'
    );
  end if;
end $$;

create table if not exists risk_factors (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  factor_type risk_factor_type not null,
  notes text,
  recorded_at date not null default current_date,
  created_at timestamptz default now()
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  visit_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists residents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null,
  age integer,
  notes text,
  created_at timestamptz default now()
);

create index if not exists households_user_id_idx on households(user_id);
create index if not exists risk_factors_household_id_idx on risk_factors(household_id);
create index if not exists visits_household_id_idx on visits(household_id);
create index if not exists residents_household_id_idx on residents(household_id);

alter table profiles enable row level security;
alter table households enable row level security;
alter table risk_factors enable row level security;
alter table visits enable row level security;
alter table residents enable row level security;

drop policy if exists "Profiles are user-owned" on profiles;
create policy "Profiles are user-owned" on profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Households are user-owned" on households;
create policy "Households are user-owned" on households
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Risk factors are user-owned" on risk_factors;
create policy "Risk factors are user-owned" on risk_factors
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Visits are user-owned" on visits;
create policy "Visits are user-owned" on visits
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Residents are user-owned" on residents;
create policy "Residents are user-owned" on residents
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Optional seed example (adjust user_id with a real auth uid)
-- insert into households (user_id, responsible_name, address, micro_area, notes, lat, lng)
-- values ('00000000-0000-0000-0000-000000000000', 'Maria Souza', 'Rua Um, 123', 'A1', 'House near school', -15.793889, -47.882778);
