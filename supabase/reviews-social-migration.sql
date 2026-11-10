-- Para una tabla reviews existente: ejecutar una vez en el SQL Editor.
begin;
alter table public.reviews
  alter column rating drop not null,
  add column social_network text,
  add column social_username text,
  add column source text not null default 'milu' check (source in ('milu','google','instagram')),
  add column source_url text;
alter table public.reviews
add constraint reviews_social_profile check (
    (social_network is null and social_username is null) or
    (social_network is not null and social_username is not null and
     social_network in ('instagram','facebook','x') and social_username ~ '^[A-Za-z0-9_.]{1,50}$')
  ),
  add constraint reviews_source_link check (
    (source = 'milu' and source_url is null and rating is not null) or
    (source = 'google' and source_url is not null and rating is not null and
     source_url ~ '^https://(www\.google\.com|google\.com|maps\.google\.com|maps\.app\.goo\.gl|g\.co)/[^[:space:]]{1,1900}$') or
    (source = 'instagram' and source_url is not null and
     source_url ~ '^https://(www\.)?instagram\.com/(p|reel)/[^[:space:]]{1,1900}$')
  );
grant select (social_network, social_username, source, source_url) on public.reviews to anon;
grant insert (social_network, social_username) on public.reviews to anon;
-- source y source_url se cargan solamente desde administración.
commit;
