const C = window.ML_CONTENT;

const gallery = document.querySelector("#gallery");
function renderGallery(filter="todas"){
  gallery.innerHTML = "";
  C.gallery.filter(x => filter==="todas" || x.category===filter).forEach(item=>{
    const card=document.createElement("button");
    card.className="photo-card";
    card.innerHTML=`<img src="${item.src}" alt="${item.title}" loading="lazy"><span>${item.title}</span>`;
    card.onclick=()=>openPhoto(item);
    gallery.appendChild(card);
  });
}
document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); renderGallery(b.dataset.filter);
});
renderGallery();

const modal=document.querySelector("#photo-modal");
function openPhoto(x){
  modal.querySelector("img").src=x.src;
  modal.querySelector("h2").textContent=x.title;
  modal.querySelector(".story").textContent=x.story;
  modal.querySelector(".exif").innerHTML=`<b>Cámara</b> ${x.camera}<br><b>Lente</b> ${x.lens}<br><b>Apertura</b> ${x.aperture}<br><b>Velocidad</b> ${x.shutter}<br><b>ISO</b> ${x.iso}`;
  modal.classList.add("open");
}
document.querySelectorAll(".close-modal").forEach(x=>x.onclick=()=>x.closest(".modal").classList.remove("open"));

const stories=document.querySelector("#stories-grid");
C.stories.forEach(s=>{
  const a=document.createElement("article"); a.className="story-card";
  a.innerHTML=`<img src="${s.cover}" alt="${s.title}"><div><small>${s.subtitle}</small><h3>${s.title}</h3><p>${s.text}</p></div>`;
  stories.appendChild(a);
});

document.querySelector("#raw-img").src=C.beforeAfter.raw;
document.querySelector("#edited-img").src=C.beforeAfter.edited;
const slider=document.querySelector("#compare-range"), rawWrap=document.querySelector("#raw-wrap");
slider.oninput=()=>rawWrap.style.width=slider.value+"%";

document.querySelector("#p360").src=C.immersive.photo360.preview;
document.querySelector("#v360-poster").src=C.immersive.video360.poster;

const videoGrid=document.querySelector("#video-grid");
C.videos.forEach(v=>{
 const card=document.createElement("article"); card.className="video-card";
 card.innerHTML=`<img src="${v.poster}" alt="${v.title}"><h3>${v.title}</h3><p>Reemplazá el MP4 ficticio por tu video real.</p>`;
 videoGrid.appendChild(card);
});

const menu=document.querySelector("#menu"), toggle=document.querySelector("#menu-toggle");
toggle.onclick=()=>menu.classList.toggle("show");

// ==========================================================
// MILU - JAZZ
// ==========================================================

const audio = document.querySelector("#jazz-audio");
const music = document.querySelector("#music-toggle");
const volume = document.querySelector("#music-volume");
const volumeLabel = document.querySelector("#volume-label");

if (audio) {
    audio.volume = Number(volume?.value || 0.35);
}

function updateMusicUI() {
    if (!audio || !music) return;

    music.textContent = audio.paused
        ? "♪ Jazz"
        : "❚❚ Jazz";
}

async function startMusic() {
    if (!audio || !audio.paused) return;

    try {
        await audio.play();

        console.log("Jazz reproduciendo");

        updateMusicUI();

        // Ya arrancó: eliminamos los listeners
        removeStartListeners();

    } catch (error) {
        console.log("Audio todavía bloqueado:", error);
    }
}

function removeStartListeners() {
    document.removeEventListener("pointerdown", startMusic);
    document.removeEventListener("keydown", startMusic);
}

// PRIMERA interacción del usuario
document.addEventListener("pointerdown", startMusic);
document.addEventListener("keydown", startMusic);


// Botón Jazz
music?.addEventListener("click", async (event) => {

    event.stopPropagation();

    if (!audio) return;

    if (audio.paused) {

        await startMusic();

    } else {

        audio.pause();
        updateMusicUI();

    }
});


// Volumen
volume?.addEventListener("input", () => {

    if (!audio) return;

    audio.volume = Number(volume.value);

    if (volumeLabel) {
        volumeLabel.textContent =
            Math.round(audio.volume * 100) + "%";
    }
});


audio?.addEventListener("play", updateMusicUI);
audio?.addEventListener("pause", updateMusicUI);

updateMusicUI();

function msg(){
 const n=document.querySelector("#name").value||"Visitante";
 const e=document.querySelector("#email").value||"";
 const m=document.querySelector("#message").value||"Quisiera información.";
 return `Hola ML-Story! Soy ${n}.${e?`\nEmail: ${e}`:""}\n${m}`;
}
document.querySelector("#wa").onclick=()=>window.open("https://wa.me/54294?text="+encodeURIComponent(msg()),"_blank");
document.querySelector("#mail").onclick=()=>location.href="mailto:mljm@gmail.com?subject="+encodeURIComponent("Consulta ML-Story")+"&body="+encodeURIComponent(msg());


// UX / responsive fixes
document.querySelectorAll("#menu a").forEach(link=>{
  link.addEventListener("click", ()=>document.querySelector("#menu")?.classList.remove("show"));
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape"){
    document.querySelectorAll(".modal.open").forEach(m=>m.classList.remove("open"));
    document.querySelector("#menu")?.classList.remove("show");
  }
});

