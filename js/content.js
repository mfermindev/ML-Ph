// ==========================================================
// ML-STORY · CONTENIDO
// Para cambiar el portfolio, en general SOLO editá este archivo
// y reemplazá los archivos ficticios dentro de /assets.
// ==========================================================

window.ML_CONTENT = {
  gallery: [
    {src:"assets/photos/gallery/image1.jpg", title:"Atardecer en Barilove", category:"paisajes", story:"Ultimo destello sobre las montañas.", camera:"Sony  III", lens:"24mm", aperture:"f/8", shutter:"1/250", iso:"100"},
    {src:"assets/photos/gallery/gallery-02.svg", title:"Atardecer sobre el lago", category:"atardeceres", story:"El último reflejo cálido sobre el agua.", camera:"Sony  III", lens:"35mm", aperture:"f/5.6", shutter:"1/320", iso:"100"},
    {src:"assets/photos/gallery/gallery-03.svg", title:"Naturaleza", category:"naturaleza", story:"Texturas y pequeños detalles del bosque.", camera:"Sony  III", lens:"85mm", aperture:"f/2.8", shutter:"1/500", iso:"200"},
    {src:"assets/photos/gallery/gallery-04.svg", title:"Personas", category:"personas", story:"Retratos con luz natural.", camera:"Sony  III", lens:"85mm", aperture:"f/1.8", shutter:"1/500", iso:"200"},
    {src:"assets/photos/gallery/gallery-05.svg", title:"Lago", category:"paisajes", story:"Silencio, agua y montaña.", camera:"Sony  III", lens:"24mm", aperture:"f/8", shutter:"1/200", iso:"100"},
    {src:"assets/photos/gallery/gallery-06.svg", title:"Montaña", category:"paisajes", story:"Una tarde entre cumbres.", camera:"Sony  III", lens:"70mm", aperture:"f/7.1", shutter:"1/400", iso:"100"}
  ],

  stories: [
    {title:"Patagonia", subtitle:"Montañas · Lagos · Silencio", cover:"assets/photos/stories/story-01.svg", text:"Una historia visual entre montañas, caminos y reflejos."},
    {title:"Personas", subtitle:"Retratos · Luz natural", cover:"assets/photos/stories/story-02.svg", text:"Momentos simples y personas reales."},
    {title:"Atardeceres", subtitle:"Hora dorada · Lago", cover:"assets/photos/stories/story-03.svg", text:"La luz cambia y con ella cambia toda la historia."}
  ],

  beforeAfter: {
    raw:"assets/photos/before-after/raw.svg",
    edited:"assets/photos/before-after/edited.svg",
    title:"Del RAW a la historia final",
    notes:"Misma escena, dos momentos del proceso. Arrastrá el control para comparar."
  },

  immersive: {
    photo360: {
      preview:"assets/photos-360/panorama-360.svg",
      title:"Lago 360°",
      description:"Panorama interactivo. Para el visor 360 real, reemplazá el archivo y activá Pannellum según README."
    },
    video360: {
      poster:"assets/photos/hero/hero-sunset.svg",
      src:"assets/videos/360/REEMPLAZAR-video-360.mp4",
      title:"Patagonia 360°"
    },
    model3d: {
      poster:"assets/photos/gallery/gallery-01.svg",
      src:"assets/models/REEMPLAZAR-modelo-3d.glb",
      title:"Modelo 3D"
    }
  },

  videos: [
    {title:"Patagonia en movimiento", poster:"assets/photos/hero/hero-sunset.svg", src:"assets/videos/normal/REEMPLAZAR-video-normal.mp4"}
  ]
};
