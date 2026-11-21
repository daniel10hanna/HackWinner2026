create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text,
  address text,
  neighborhood text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  duration_minutes integer check (duration_minutes > 0),
  price_amount numeric(10, 2) check (price_amount >= 0),
  price_currency text default 'CAD' check (price_currency ~ '^[A-Z]{3}$'),
  image_url text check (image_url ~ '^https://'),
  source_name text not null,
  source_url text check (source_url ~ '^https://'),
  official_url text check (official_url ~ '^https://'),
  published boolean not null default false,
  check (price_amount is null or price_currency is not null)
);

alter table public.restaurants enable row level security;
revoke all on public.restaurants from anon, authenticated;
grant select on public.restaurants to anon, authenticated;
grant select, insert, update, delete on public.restaurants to service_role;
create policy "Read published restaurants" on public.restaurants for select to anon, authenticated using (published);
