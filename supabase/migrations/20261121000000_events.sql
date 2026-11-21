create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique check (url ~ '^https://'),
  feed_url text unique check (feed_url ~ '^https://'),
  source_type text not null check (source_type in ('newsletter', 'blog', 'website', 'rss')),
  enabled boolean not null default false,
  last_checked_at timestamptz
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text,
  category text not null check (category in ('Music', 'Food', 'Nightlife', 'Arts', 'Festivals', 'Sports', 'Community', 'Other')),
  start_time timestamptz not null,
  end_time timestamptz check (end_time > start_time),
  venue text,
  address text,
  neighborhood text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  price_amount numeric(10, 2) check (price_amount >= 0),
  price_currency text check (price_currency ~ '^[A-Z]{3}$'),
  is_free boolean,
  image_url text check (image_url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  source_name text not null,
  source_event_id text not null,
  source_id uuid not null references public.sources(id),
  dedupe_key text not null unique,
  official_url text check (official_url ~ '^https://'),
  featured boolean not null default false,
  status text not null default 'pending' check (status in ('draft', 'pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_event_id),
  check (price_amount is null or price_currency is not null)
);

create index events_published_start_idx on public.events (start_time, id) where status = 'published';
create index events_published_end_idx on public.events (end_time) where status = 'published' and end_time is not null;
create index events_review_idx on public.events (status, created_at desc);

create function public.update_event_timestamp() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end
$$;
create trigger events_updated_at before update on public.events
for each row execute function public.update_event_timestamp();

alter table public.events enable row level security;
alter table public.sources enable row level security;
revoke all on public.sources, public.events from anon, authenticated;
grant select on public.events to anon, authenticated;
grant select, insert, update, delete on public.sources, public.events to service_role;
create policy "Read published events" on public.events for select to anon, authenticated using (status = 'published');
