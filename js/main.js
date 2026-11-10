const C = window.ML_CONTENT;

const modal = document.querySelector('#photo-modal');
let modalPhotos = [], modalIndex = 0;
// Cada colección alimenta su portada WebGL y su propia galería ampliable.
document.querySelectorAll('[data-photo-collection]').forEach(gallery => {
  const photos = C[gallery.dataset.photoCollection] || [];
  gallery.replaceChildren();
  photos.forEach((item, index) => {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'photo-card';
    const image = document.createElement('img'); image.src = item.src; image.alt = item.alt || item.title; image.loading = 'lazy'; image.decoding = 'async';
    const caption = document.createElement('span'); caption.textContent = item.title;
    const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true'); caption.append(arrow);
    card.setAttribute('aria-label', 'Ver fotografía: ' + item.title);
    card.append(image, caption); card.addEventListener('click', () => openPhotos(photos, index)); gallery.append(card);
  });
});
function renderPhoto() {
  const photo = modalPhotos[modalIndex];
  const image = modal.querySelector('img'); image.src = photo.src; image.alt = photo.alt || photo.title;
  modal.querySelector('h2').textContent = photo.title;
  modal.querySelector('.story').textContent = photo.story || photo.subtitle || '';
  modal.querySelector('.modal-count').textContent = `${String(modalIndex + 1).padStart(2,'0')} / ${String(modalPhotos.length).padStart(2,'0')}`;
  const details = [['Cámara',photo.camera],['Lente',photo.lens],['Apertura',photo.aperture],['Velocidad',photo.shutter],['ISO',photo.iso]].filter(([,value]) => value);
  modal.querySelector('.exif').textContent = details.map(([label,value]) => `${label}: ${value}`).join(' · ');
  modal.querySelector('.photo-details').hidden = !details.length;
  modal.querySelectorAll('.modal-prev,.modal-next').forEach(button => button.hidden = modalPhotos.length < 2);
}
function openPhotos(photos, index=0) {
  if (!photos.length) return;
  modalPhotos = photos; modalIndex = index; renderPhoto();
  if (!modal.open) modal.showModal();
}
function stepPhoto(direction) { modalIndex = (modalIndex + direction + modalPhotos.length) % modalPhotos.length; renderPhoto(); }
modal.querySelector('.close-modal').addEventListener('click', () => modal.close());
modal.querySelector('.modal-prev').addEventListener('click', () => stepPhoto(-1));
modal.querySelector('.modal-next').addEventListener('click', () => stepPhoto(1));
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
modal.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); stepPhoto(event.key === 'ArrowRight' ? 1 : -1); }
});
document.querySelector("#raw-img").src=C.beforeAfter.raw;
document.querySelector("#edited-img").src=C.beforeAfter.edited;
const slider=document.querySelector("#compare-range"), rawWrap=document.querySelector("#raw-wrap");
slider.oninput=()=>rawWrap.style.width=slider.value+"%";

document.querySelector("#p360").src=C.immersive.photo360.preview;
document.querySelector("#v360-poster").src=C.immersive.video360.poster;

const menu=document.querySelector("#menu"), toggle=document.querySelector("#menu-toggle");
function closeMenu() { menu.classList.remove('show'); toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Abrir menú'); }
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('show'); toggle.setAttribute('aria-expanded',String(open)); toggle.setAttribute('aria-label',open ? 'Cerrar menú' : 'Abrir menú');
});

// Música: un solo control, evita el doble clic al iniciar.
const audio = document.querySelector("#music");
const music = document.querySelector("#music-toggle");
const volume = document.querySelector("#music-volume");
const volumeLabel = document.querySelector("#volume-label");
if (audio) audio.volume = Number(volume?.value ?? 0.35);
function updateMusicUI() {
  if (music && audio) {
    music.textContent = audio.paused ? '♪ Escuchar jazz' : 'Ⅱ Pausar jazz';
    music.setAttribute('aria-pressed',String(!audio.paused));
    music.setAttribute('aria-label',audio.paused ? 'Reproducir jazz' : 'Pausar jazz');
  }
  if (volumeLabel && audio) volumeLabel.textContent = Math.round(audio.volume * 100) + "%";
}
let musicStarting = false;
let automaticMusic = true;
function stopAutomaticMusic() {
  automaticMusic = false;
  document.removeEventListener('pointermove', autoStartMusic);
  document.removeEventListener('click', autoStartMusic);
}
async function startMusic() {
  if (!audio || !audio.paused || musicStarting) return;
  musicStarting = true;
  try { await audio.play(); stopAutomaticMusic(); }
  catch (error) {
    // Algunos navegadores exigen un clic: mantener ese intento disponible.
    if (error.name !== 'NotAllowedError') console.error('No se pudo reproducir jazz:', error);
  } finally { musicStarting = false; updateMusicUI(); }
}
function autoStartMusic(event) {
  if (!automaticMusic || event.target.closest?.('.music-player')) return;
  startMusic();
}
document.addEventListener('pointermove', autoStartMusic, {once:true, passive:true});
document.addEventListener('click', autoStartMusic);
music?.addEventListener('click', async () => {
  if (!audio) return;
  stopAutomaticMusic();
  if (audio.paused) await startMusic();
  else audio.pause();
  updateMusicUI();
});
volume?.addEventListener("input", () => {
  if (audio) audio.volume = Number(volume.value);
  updateMusicUI();
});
audio?.addEventListener("play", updateMusicUI);
audio?.addEventListener("pause", updateMusicUI);
updateMusicUI();

function msg(){
 const n=document.querySelector("#name").value||"Visitante";
 const e=document.querySelector("#email").value||"";
 const m=document.querySelector("#message").value||"Quisiera información.";
 return `Hola MILU! Soy ${n}. Quisiera consultar por ${document.querySelector("#service").value}.${e?`\nEmail: ${e}`:""}\n${m}`;
}
document.querySelector("#wa").onclick=()=>window.open("https://wa.me/5492944303361?text="+encodeURIComponent(msg()),"_blank","noopener,noreferrer");
document.querySelector("#mail").onclick=()=>location.href="mailto:mljmoncunill@gmail.com?subject="+encodeURIComponent("Consulta MILU")+"&body="+encodeURIComponent(msg());


// La navegación abre los proyectos desplegables antes de desplazarse.
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  const target = document.getElementById(link.hash.slice(1));
  if (target) {
    for (let node = target; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
    requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
  }
  if (link.closest('#menu')) closeMenu();
}));
function openHashTarget() {
  const target = document.getElementById(location.hash.slice(1));
  if (!target) return;
  for (let node = target; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
  requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
}
addEventListener('hashchange', openHashTarget); if (location.hash) openHashTarget();
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {document.querySelector('#service').value = link.dataset.service;}));
document.addEventListener('keydown', event => {if (event.key === 'Escape') closeMenu();});
const contactObserver = new IntersectionObserver(entries => {
  document.querySelector('.mobile-contact').classList.toggle('is-hidden', entries[0].isIntersecting);
}, {threshold:0});
contactObserver.observe(document.querySelector('#contacto'));
