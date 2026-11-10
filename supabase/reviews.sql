-- Ejecutar una vez en el SQL Editor del proyecto Supabase.
begin;
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  rating smallint check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 10 and 2000),
  social_network text,
  social_username text,
  source text not null default 'milu' check (source in ('milu','google','instagram')),
  source_url text,
  constraint reviews_social_profile check (
    (social_network is null and social_username is null) or
    (social_network is not null and social_username is not null and
     social_network in ('instagram','facebook','x') and social_username ~ '^[A-Za-z0-9_.]{1,50}$')
  ),
  constraint reviews_source_link check (
    (source = 'milu' and source_url is null and rating is not null) or
    (source = 'google' and source_url is not null and rating is not null and
     source_url ~ '^https://(www\.google\.com|google\.com|maps\.google\.com|maps\.app\.goo\.gl|g\.co)/[^[:space:]]{1,1900}$') or
    (source = 'instagram' and source_url is not null and
     source_url ~ '^https://(www\.)?instagram\.com/(p|reel)/[^[:space:]]{1,1900}$')
  ),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_approved_date on public.reviews (created_at desc) where approved = true;
alter table public.reviews enable row level security;
revoke all on table public.reviews from anon, authenticated;
grant select (id, name, rating, comment, created_at, social_network, social_username, source, source_url) on public.reviews to anon;
grant insert (name, rating, comment, social_network, social_username) on public.reviews to anon;
create policy "Public reads approved reviews" on public.reviews
  for select to anon using (approved = true);
create policy "Public submits pending reviews" on public.reviews
  for insert to anon with check (approved = false);
-- No se conceden UPDATE ni DELETE: la aprobación se realiza desde el dashboard.
commit;
