# ML-Story — Momentos Llenos de Luz

Proyecto preparado para que, en lo posible, **solo reemplaces archivos ficticios** y edites `js/content.js`.

## 1. Qué reemplazar

### Portada
`assets/photos/hero/hero-sunset.svg`
Reemplazalo por tu JPG/WebP y cambiá esa ruta en `js/content.js` o `index.html` si cambia el nombre.

### Galería
`assets/photos/gallery/`
Hay 6 SVG ficticios. Podés reemplazarlos manteniendo los nombres, o agregar tus propias rutas en `js/content.js`.

### Historias
`assets/photos/stories/`
Reemplazá las portadas ficticias. Los títulos/textos están en `js/content.js`.

### RAW / Edición
`assets/photos/before-after/raw.svg`
`assets/photos/before-after/edited.svg`
Deben ser la MISMA fotografía, mismo encuadre y dimensiones. Así el slider queda perfectamente alineado.

### Foto 360°
`assets/photos-360/panorama-360.svg`
Para una experiencia real usá una fotografía equirectangular 2:1 (ejemplo 6000x3000). El proyecto deja el espacio preparado.

### Video normal
`assets/videos/normal/REEMPLAZAR-video-normal.mp4`
El archivo incluido es ficticio. Reemplazalo por MP4 real. Para videos pesados conviene Vimeo/YouTube/hosting de video.

### Video 360°
`assets/videos/360/REEMPLAZAR-video-360.mp4`
Reemplazalo por MP4 equirectangular 360°. Para reproducción 360 real se debe integrar un player WebGL o usar un proveedor compatible.

### Modelo 3D
`assets/models/REEMPLAZAR-modelo-3d.glb`
Reemplazalo por GLB/GLTF. Para visualizarlo interactivamente se puede integrar `<model-viewer>`.

### Música
`assets/music/jazz.mp3`
Es un archivo ficticio. Reemplazalo por un MP3 propio o con licencia.

## 2. Archivo principal de contenido

`js/content.js`

Ahí están:
- fotografías y categorías
- EXIF
- historias
- RAW/edición
- fotografía 360
- video 360
- modelo 3D
- videos normales

Esto evita llenar `index.html` de contenido manual.

## 3. Formatos recomendados

- Fotos normales: WebP/JPG, 1600–2400 px lado largo.
- Hero: WebP/JPG, 2200–3000 px lado largo.
- 360°: equirectangular 2:1, JPG/WebP.
- Video: MP4 H.264 para máxima compatibilidad.
- 3D: GLB.
- Audio: MP3.

## 4. Importante sobre 360° y 3D

Este ZIP deja **la arquitectura, carpetas, tarjetas y contenido ficticio** preparados. Los visores 360/3D reales requieren librerías WebGL externas. Para mantener este proyecto simple y compatible con GitHub Pages, no se incluyeron dependencias externas todavía.

Cuando tengas una foto 360 real, un video 360 real o un GLB real, se puede activar el visor correspondiente sin reorganizar el proyecto.

## 5. Contacto de prueba

WhatsApp: +54 351 5058695
Email: af.mauro7@gmail.com


## Acerca de mí

Se agregó una sección completa del fotógrafo sin quitar ninguna sección anterior.

Reemplazá:
`assets/photos/about/photographer.svg`

por tu retrato real. Si mantenés el mismo nombre/ruta no necesitás tocar el HTML. Si usás `.webp` o `.jpg`, actualizá la ruta de la imagen en `index.html`.

La biografía de ejemplo está en la sección `#acerca` de `index.html`.

## Reproductor de jazz

Ahora incluye:
- play / pause
- slider de volumen
- porcentaje de volumen en escritorio
- control compacto en celular

El archivo sigue siendo:
`assets/music/jazz.mp3`

Reemplazalo por un MP3 real que tengas derecho a utilizar.


## Corrección responsive v2

Esta versión corrige especialmente el encabezado cuando se agregó "Acerca de mí" y el control de volumen:
- el menú cambia a hamburguesa antes de que los elementos se superpongan;
- Jazz/volumen no empuja el menú fuera de pantalla;
- galería, modal, sección Acerca de mí y RAW/Edición se adaptan mejor a tablet y móvil;
- se incluye `.nojekyll` para publicar el sitio como HTML/CSS/JS estático en GitHub Pages.
