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
  const networks = {
    instagram: {label:'Instagram', base:'https://www.instagram.com/'},
    facebook: {label:'Facebook', base:'https://www.facebook.com/'},
    x: {label:'X', base:'https://x.com/'}
  };
  function socialProfile(network, username) {
    if (!Object.hasOwn(networks, network) || !/^[A-Za-z0-9_.]{1,50}$/.test(username)) return null;
    return networks[network].base + encodeURIComponent(username) + '/';
  }
  function originalLink(source, value) {
    try {
      const url = new URL(value);
      const hosts = source === 'google' ? ['google.com','www.google.com','maps.google.com','maps.app.goo.gl','g.co'] : source === 'instagram' ? ['instagram.com','www.instagram.com'] : [];
      return url.protocol === 'https:' && !url.username && !url.password && hosts.includes(url.hostname) ? url.href : null;
    } catch { return null; }
  }
  function link(text, href, className) {
    const anchor = document.createElement('a'); anchor.className = className;
    anchor.textContent = text; anchor.href = href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
    return anchor;
  }
  async function loadReviews() {
    try {
      // RLS limita la consulta a reseñas aprobadas, incluso si se modifica esta URL.
      let response;
      try {
        response = await request(base + '?select=id,name,rating,comment,created_at,social_network,social_username,source,source_url&order=created_at.desc&limit=30');
      } catch {
        // Mantener las reseñas existentes visibles antes de aplicar la migración.
        response = await request(base + '?select=id,name,rating,comment,created_at&order=created_at.desc&limit=30');
      }
      const reviews = await response.json();
      if (!Array.isArray(reviews)) throw new Error('Respuesta inesperada');
      list.replaceChildren();
      for (const review of reviews) {
        const card = document.createElement('article'); card.className = 'review-card';
        const identity = document.createElement('div'); identity.className = 'review-identity';
        const avatar = document.createElement('span'); avatar.className = 'review-avatar'; avatar.setAttribute('aria-hidden','true');
        avatar.textContent = String(review.name || '?').replace(/^@/,'').trim().slice(0,1).toUpperCase();
        const author = document.createElement('div');
        const name = document.createElement('strong'); name.textContent = review.name;
        author.append(name);
        const username = String(review.social_username || '');
        const profile = socialProfile(review.social_network, username);
        if (profile) author.append(link('@' + username + ' · ' + networks[review.social_network].label, profile, 'review-profile'));
        identity.append(avatar, author);
        const original = originalLink(review.source, review.source_url);
        const source = document.createElement('p'); source.className = 'review-origin';
        source.textContent = original ? (review.source === 'google' ? 'Reseña de Google' : 'Comentario de Instagram') : (review.source && review.source !== 'milu' ? 'Reseña compartida por MILU' : 'Reseña enviada desde MILU');
        const stars = document.createElement('p'); stars.className = 'review-stars';
        const rating = Number(review.rating);
        if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
          stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
          stars.setAttribute('aria-label', `${rating} de 5 estrellas`);
        }
        const comment = document.createElement('blockquote'); comment.className = 'review-comment'; comment.textContent = review.comment;
        const footer = document.createElement('div'); footer.className = 'review-footer';
        if (original) footer.append(link('Ver ' + (review.source === 'google' ? 'reseña' : 'comentario') + ' original ↗', original, 'review-original'));
        else {
          const note = document.createElement('span'); note.textContent = 'Reseña aprobada'; footer.append(note);
        }
        const time = document.createElement('time');
        const date = new Date(review.created_at);
        if (!Number.isNaN(date.getTime())) {
          time.dateTime = date.toISOString(); time.textContent = new Intl.DateTimeFormat('es-AR', {month:'long', year:'numeric'}).format(date);
        }
        footer.append(time); card.append(identity, source, stars, comment, footer); list.appendChild(card);
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
    const network = String(data.get('social_network') || '').trim();
    const username = String(data.get('social_username') || '').trim().replace(/^@/, '');
    if ((network || username) && !socialProfile(network, username)) {
      status.textContent = 'Elegí una red social e ingresá tu usuario (sin espacios ni enlaces).';
      return;
    }
    if (name.length < 2 || name.length > 80 || comment.length < 10 || comment.length > 2000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      status.textContent = 'Ingresá un nombre de 2 a 80 caracteres, una valoración y un comentario de 10 a 2000 caracteres.';
      return;
    }
    sending = true; submit.disabled = true; submit.textContent = 'Enviando…'; status.textContent = '';
    try {
      await request(base, {
        method:'POST', headers:{'Content-Type':'application/json', Prefer:'return=minimal'},
        body:JSON.stringify({ name, rating, comment, ...(network ? {social_network:network, social_username:username} : {}) })
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
