/* REST de Supabase: compatible con GitHub Pages, sin servidor ni dependencias. */
(() => {
  const form = document.querySelector('#review-form');
  if (!form) return;
  const status = document.querySelector('#review-status');
  const listStatus = document.querySelector('#reviews-list-status');
  const list = document.querySelector('#reviews-list');
  const submit = document.querySelector('#review-submit');
  const config = window.ML_SUPABASE || {};
  const key = String(config.publicKey || '').trim();
  let base;
  try {
    const url = new URL(config.url);
    if (url.protocol !== 'https:' || !key) throw new Error('Configuración pendiente');
    // Rechazar claves privilegiadas conocidas antes de realizar cualquier solicitud.
    if (key.startsWith('sb_secret_')) throw new Error('Clave no pública');
    if (key.startsWith('eyJ')) {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') throw new Error('Clave no pública');
    } else if (!key.startsWith('sb_publishable_')) throw new Error('Clave no pública');
    base = url.origin + '/rest/v1/reviews';
  } catch {
    listStatus.textContent = 'Pronto vas a poder leer las experiencias de nuestros clientes.';
    status.textContent = 'El formulario de reseñas estará disponible próximamente.';
    return;
  }
  const headers = { apikey: key };
  // La clave anon antigua es un JWT; las publishable nuevas solo usan apikey.
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  submit.disabled = false;

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { ...options, headers: {...headers, ...options.headers}, signal:controller.signal });
      if (!response.ok) throw new Error('No se pudo completar la solicitud');
      return response;
    } finally { clearTimeout(timeout); }
  }
  async function loadReviews() {
    try {
      // RLS limita la consulta a reseñas aprobadas, incluso si se modifica esta URL.
      const response = await request(base + '?select=id,name,rating,comment,created_at&order=created_at.desc&limit=30');
      const reviews = await response.json();
      if (!Array.isArray(reviews)) throw new Error('Respuesta inesperada');
      list.replaceChildren();
      for (const review of reviews) {
        const card = document.createElement('article'); card.className = 'review-card';
        const stars = document.createElement('p'); stars.className = 'review-stars';
        const rating = Math.max(1, Math.min(5, Number(review.rating) || 1));
        stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        stars.setAttribute('aria-label', `${rating} de 5 estrellas`);
        const comment = document.createElement('p'); comment.className = 'review-comment'; comment.textContent = review.comment;
        const name = document.createElement('strong'); name.textContent = review.name;
        const time = document.createElement('time');
        const date = new Date(review.created_at);
        if (!Number.isNaN(date.getTime())) {
          time.dateTime = date.toISOString(); time.textContent = new Intl.DateTimeFormat('es-AR', {month:'long', year:'numeric'}).format(date);
        }
        card.append(stars, comment, name, time); list.appendChild(card);
      }
      listStatus.textContent = reviews.length ? 'Experiencias compartidas por nuestros clientes.' : 'Todavía no hay reseñas publicadas. ¿Compartís tu experiencia?';
    } catch {
      listStatus.textContent = 'No pudimos cargar las reseñas. Recargá la página para volver a intentar.';
    }
  }
  loadReviews();
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const data = new FormData(form);
    if (String(data.get('website') || '').trim()) return;
    const name = String(data.get('name') || '').trim();
    const comment = String(data.get('comment') || '').trim();
    const rating = Number(data.get('rating'));
    if (name.length < 2 || name.length > 80 || comment.length < 10 || comment.length > 2000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      status.textContent = 'Ingresá un nombre de 2 a 80 caracteres, una valoración y un comentario de 10 a 2000 caracteres.';
      return;
    }
    sending = true; submit.disabled = true; submit.textContent = 'Enviando…'; status.textContent = '';
    try {
      await request(base, {
        method:'POST', headers:{'Content-Type':'application/json', Prefer:'return=minimal'},
        body:JSON.stringify({ name, rating, comment })
      });
      form.reset();
      status.textContent = 'Gracias. Tu reseña se publicará en breve.';
    } catch {
      status.textContent = 'No pudimos confirmar el envío. Tu comentario sigue aquí; intentá nuevamente en unos momentos.';
    } finally {
      sending = false; submit.disabled = false; submit.textContent = 'Enviar reseña';
    }
  });
})();
