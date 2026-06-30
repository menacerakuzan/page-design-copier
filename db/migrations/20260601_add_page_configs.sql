-- Migration: add page_configs table
-- Run this in the Supabase SQL editor if the project already exists.

create table if not exists public.page_configs (
  id text primary key,
  entity_type text not null check (entity_type in ('district', 'city', 'attraction', 'event', 'restaurant', 'hotel')),
  entity_id text not null,
  sections_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint page_configs_entity_unique unique (entity_type, entity_id)
);

alter table public.page_configs enable row level security;

drop policy if exists "public read page configs" on public.page_configs;
create policy "public read page configs" on public.page_configs
for select using (true);

drop policy if exists "editor full page configs" on public.page_configs;
create policy "editor full page configs" on public.page_configs
for all using (true) with check (true);
