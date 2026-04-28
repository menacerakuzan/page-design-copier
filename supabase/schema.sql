create extension if not exists pgcrypto;

-- Core hierarchy for Odeshchyna tourism content
create table if not exists public.regions (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.districts (
  id text primary key,
  region_id text not null references public.regions(id) on delete cascade,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.cities (
  id text primary key,
  district_id text not null references public.districts(id) on delete cascade,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.tourism_objects (
  id text primary key,
  district_id text not null references public.districts(id) on delete cascade,
  city_id text not null references public.cities(id) on delete cascade,
  type text not null check (type in ('event', 'hotel', 'restaurant', 'attraction')),
  name text not null,
  slug text not null unique,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.content_cards (
  id text primary key,
  page_key text not null,
  section_key text not null,
  card_type text not null,
  title text not null,
  subtitle text,
  image_url text,
  href text,
  city_id text references public.cities(id) on delete set null,
  district_id text references public.districts(id) on delete set null,
  region_id text references public.regions(id) on delete set null,
  sort_order int not null default 0,
  published boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_change_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('tourism_object', 'content_card', 'region', 'district', 'city')),
  entity_id text not null,
  action text not null check (action in ('create', 'update', 'delete', 'rollback')),
  before_data jsonb,
  after_data jsonb,
  actor_email text,
  created_at timestamptz not null default now()
);

alter table public.regions enable row level security;
alter table public.districts enable row level security;
alter table public.cities enable row level security;
alter table public.tourism_objects enable row level security;
alter table public.content_cards enable row level security;
alter table public.admin_change_logs enable row level security;

drop policy if exists "public read regions" on public.regions;
create policy "public read regions" on public.regions
for select using (true);

drop policy if exists "public read districts" on public.districts;
create policy "public read districts" on public.districts
for select using (true);

drop policy if exists "public read cities" on public.cities;
create policy "public read cities" on public.cities
for select using (true);

drop policy if exists "public read published objects" on public.tourism_objects;
create policy "public read published objects" on public.tourism_objects
for select using (published = true);

drop policy if exists "editor full regions" on public.regions;
create policy "editor full regions" on public.regions
for all to authenticated using (true) with check (true);

drop policy if exists "editor full districts" on public.districts;
create policy "editor full districts" on public.districts
for all to authenticated using (true) with check (true);

drop policy if exists "editor full cities" on public.cities;
create policy "editor full cities" on public.cities
for all to authenticated using (true) with check (true);

drop policy if exists "editor full objects" on public.tourism_objects;
create policy "editor full objects" on public.tourism_objects
for all to authenticated using (true) with check (true);

drop policy if exists "public read published cards" on public.content_cards;
create policy "public read published cards" on public.content_cards
for select using (published = true);

drop policy if exists "editor full cards" on public.content_cards;
create policy "editor full cards" on public.content_cards
for all to authenticated using (true) with check (true);

drop policy if exists "editor full audit logs" on public.admin_change_logs;
create policy "editor full audit logs" on public.admin_change_logs
for all to authenticated using (true) with check (true);

-- Storage bucket for admin media uploads
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
for select to public
using (bucket_id = 'media');

drop policy if exists "authenticated upload media" on storage.objects;
create policy "authenticated upload media" on storage.objects
for insert to authenticated
with check (bucket_id = 'media');

drop policy if exists "authenticated update media" on storage.objects;
create policy "authenticated update media" on storage.objects
for update to authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');

drop policy if exists "authenticated delete media" on storage.objects;
create policy "authenticated delete media" on storage.objects
for delete to authenticated
using (bucket_id = 'media');
