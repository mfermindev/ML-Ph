-- Ejecutar una vez en el SQL Editor del proyecto Supabase.
begin;
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 10 and 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_approved_date on public.reviews (created_at desc) where approved = true;
alter table public.reviews enable row level security;
revoke all on table public.reviews from anon, authenticated;
grant select (id, name, rating, comment, created_at) on public.reviews to anon;
grant insert (name, rating, comment) on public.reviews to anon;
create policy "Public reads approved reviews" on public.reviews
  for select to anon using (approved = true);
create policy "Public submits pending reviews" on public.reviews
  for insert to anon with check (approved = false);
-- No se conceden UPDATE ni DELETE: la aprobación se realiza desde el dashboard.
commit;
