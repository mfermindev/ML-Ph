# Reseñas y perfiles sociales

En una instalación nueva, ejecutar `reviews.sql`. Si la tabla ya existe, ejecutar **solo** `reviews-social-migration.sql` en el SQL Editor de Supabase. Luego ejecutar `reviews-check.sql` para comprobar permisos; la prueba termina con rollback.

La migración conserva las reseñas y les asigna origen `milu`. El frontend puede seguir leyendo el esquema anterior, pero guardar un perfil social requiere aplicar la migración.

El formulario permite un usuario opcional de Instagram, Facebook o X. No inicia sesión ni comprueba que el perfil pertenezca al autor. Los perfiles se muestran con enlace, sin distintivo de identidad verificada. Revisarlos antes de aprobar.

Para publicar una reseña real de Google o un comentario de Instagram, cargar una fila desde Table Editor (administración):

- `name`: nombre o @usuario del autor tal como aparece en el original.
- `comment`: texto real autorizado para publicar.
- `source`: `google` o `instagram`.
- `source_url`: enlace HTTPS al original. Google admite google.com, www.google.com, maps.google.com, maps.app.goo.gl o g.co; Instagram requiere instagram.com/p/… o /reel/… (también www).
- `rating`: valoración real de Google; para un comentario de Instagram sin estrellas, dejar NULL.
- `social_network` y `social_username`: opcionales, completar ambos o ninguno. Usuario sin @.
- `approved`: activar después de cotejar autor, contenido y enlace.

Las reseñas web conservan `source=milu` y `source_url=NULL`. El acceso público no tiene permiso para escribir el origen, aprobar, modificar ni borrar reseñas. No se importan comentarios automáticamente. Nunca publicar los ejemplos de diseño como testimonios reales. La aprobación editorial no se presenta como verificación de identidad.
