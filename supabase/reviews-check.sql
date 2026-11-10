-- Ejecutar en SQL Editor después de reviews.sql. No deja datos de prueba.
begin;
insert into public.reviews (name, rating, comment, approved) values
  ('Prueba pendiente', 4, 'Esta reseña debe permanecer oculta.', false),
  ('Prueba aprobada', 5, 'Esta reseña sí puede leerse públicamente.', true);
set local role anon;
do $$
begin
  if exists (select 1 from public.reviews where name = 'Prueba pendiente') then
    raise exception 'FALLO: se pueden leer reseñas pendientes';
  end if;
  if not exists (select 1 from public.reviews where name = 'Prueba aprobada') then
    raise exception 'FALLO: no se pueden leer reseñas aprobadas';
  end if;
  insert into public.reviews (name, rating, comment) values ('Visitante', 5, 'Envío público de prueba correcto.');
  begin
    insert into public.reviews (name, rating, comment, approved) values ('Intruso', 5, 'No debería poder aprobar esta reseña.', true);
    raise exception 'FALLO: permite autoaprobar reseñas';
  exception when insufficient_privilege then null;
  end;
  insert into public.reviews (name, rating, comment, social_network, social_username)
    values ('Cliente social', 5, 'Reseña con perfil público opcional.', 'instagram', 'ana.fotos');
  begin
    insert into public.reviews (name, rating, comment, source, source_url)
      values ('Origen falso', 5, 'No debe poder atribuirse a Google.', 'google', 'https://maps.app.goo.gl/test');
    raise exception 'FALLO: permite falsificar el origen';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.reviews set approved = true;
    raise exception 'FALLO: permite modificar reseñas';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.reviews;
    raise exception 'FALLO: permite borrar reseñas';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
