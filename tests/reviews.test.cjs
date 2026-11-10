const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/reviews.js'), 'utf8');

function setup({config={url:'https://example.supabase.co',publicKey:'sb_publishable_test'}, reviews=[], failPost=false, failGet=false, legacySchema=false}={}) {
  const nodes = {};
  function element() {return {textContent:'',children:[],disabled:true,append(...children){this.children.push(...children);},appendChild(child){this.children.push(child);},replaceChildren(){this.children=[];},setAttribute(){}};}
  for(const id of ['#review-form','#review-status','#reviews-list-status','#reviews-list','#review-submit']) nodes[id]=element();
  const form=nodes['#review-form']; form.values={name:'Ana',rating:'5',comment:'Una experiencia hermosa.'};
  form.reportValidity=()=>true; form.reset=()=>{form.resetCalled=true;};form.addEventListener=(_,callback)=>{form.submit=callback;};
  const calls=[];
  vm.runInNewContext(source, {
    window:{ML_SUPABASE:config},document:{querySelector:id=>nodes[id],createElement:element},
    URL, AbortController, setTimeout, clearTimeout, Intl, Date, atob,
    FormData:class {constructor(form){this.values=form.values;}get(name){return this.values[name];}},
    fetch:async(url,options)=>{calls.push({url,options});return {ok:options.method==='POST' ? !failPost : (!failGet && !(legacySchema && url.includes("social_network"))),json:async()=>reviews};}
  });
  return {nodes,form,calls,flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('sin configuración o con clave secreta no hace solicitudes ni habilita envío',()=>{
  for(const config of [{},{url:'https://example.supabase.co',publicKey:'sb_secret_private'}]) {
    const app=setup({config});assert.equal(app.calls.length,0);assert.equal(app.nodes['#review-submit'].disabled,true);
  }
});
test('envía únicamente campos públicos y confirma después de guardar',async()=>{
  const app=setup(); await app.form.submit({preventDefault(){}});
  const post=app.calls.find(call=>call.options.method==='POST');
  assert.deepEqual(JSON.parse(post.options.body),{name:'Ana',rating:5,comment:'Una experiencia hermosa.'});
  assert.equal(post.options.headers.Prefer,'return=minimal');assert.equal(post.options.headers.Authorization,undefined);
  assert.equal(app.nodes['#review-status'].textContent,'Gracias. Tu reseña se publicará en breve.');
  assert.equal(app.form.resetCalled,true);assert.equal(app.nodes['#review-submit'].disabled,false);
});
test('un error de guardado conserva el formulario y permite reintentar',async()=>{
  const app=setup({failPost:true});await app.form.submit({preventDefault(){}});
  assert.equal(app.form.resetCalled,undefined);assert.match(app.nodes['#review-status'].textContent,/No pudimos/);
  assert.equal(app.nodes['#review-submit'].disabled,false);
});
test('rechaza campos vacíos, ratings inválidos y bots sin enviar',async()=>{
  for(const values of [{name:'  '},{rating:'6'},{rating:'2.5'},{comment:'corto'},{website:'spam'}]) {
    const app=setup();Object.assign(app.form.values,values);await app.form.submit({preventDefault(){}});
    assert.equal(app.calls.filter(call=>call.options.method==='POST').length,0);
  }
});
test('doble envío simultáneo genera un solo POST',async()=>{
  const app=setup();await Promise.all([app.form.submit({preventDefault(){}}),app.form.submit({preventDefault(){}})]);
  assert.equal(app.calls.filter(call=>call.options.method==='POST').length,1);
});
test('renderiza el contenido como texto y muestra fecha y valoración',async()=>{
  const app=setup({reviews:[{name:'<img src=x onerror=alert(1)>',comment:'<script>alert(1)</script>',rating:4,created_at:'2026-11-09T12:00:00Z'}]});
  await app.flush();const card=app.nodes['#reviews-list'].children[0];
  assert.equal(card.children[3].textContent,'<script>alert(1)</script>');
  assert.equal(card.children[0].children[1].children[0].textContent,'<img src=x onerror=alert(1)>');assert.equal(card.children[2].textContent,'★★★★☆');
});
test('fallo de lectura no impide dejar una reseña',async()=>{
  const app=setup({failGet:true});await app.flush();assert.match(app.nodes['#reviews-list-status'].textContent,/No pudimos/);
  await app.form.submit({preventDefault(){}});assert.equal(app.form.resetCalled,true);
});

test('normaliza el usuario social y no envía origen ni aprobación',async()=>{
  const app=setup();Object.assign(app.form.values,{social_network:'instagram',social_username:' @ana.fotos ',source:'google',approved:true});
  await app.form.submit({preventDefault(){}});
  const payload=JSON.parse(app.calls.find(c=>c.options.method==='POST').options.body);
  assert.equal(payload.social_username,'ana.fotos');assert.equal(payload.social_network,'instagram');
  assert.equal(payload.source,undefined);assert.equal(payload.approved,undefined);
});
test('rechaza perfiles incompletos, enlaces y redes inválidas',async()=>{
  for(const values of [{social_network:'instagram'},{social_username:'ana'},{social_network:'google',social_username:'ana'},{social_network:'instagram',social_username:'https://evil.com'},{social_network:'__proto__',social_username:'ana'}]){
    const app=setup();Object.assign(app.form.values,values);await app.form.submit({preventDefault(){}});
    assert.equal(app.calls.filter(c=>c.options.method==='POST').length,0);
  }
});
test('enlaza el perfil sin afirmar que su identidad está verificada',async()=>{
  const app=setup({reviews:[{name:'Ana',comment:'Hermosas fotografías.',rating:5,social_network:'instagram',social_username:'ana.fotos',source:'milu'}]});await app.flush();
  const card=app.nodes['#reviews-list'].children[0];
  const profile=card.children[0].children[1].children[1];
  assert.equal(profile.href,'https://www.instagram.com/ana.fotos/');assert.equal(profile.rel,'noopener noreferrer');
  assert.equal(card.children[1].textContent,'Reseña enviada desde MILU');
  assert.equal(card.children[4].children[0].textContent,'Reseña aprobada');
});
test('distingue originales externos y no inventa estrellas para Instagram',async()=>{
  for(const source of ['google','instagram']){
    const url=source==='google'?'https://maps.app.goo.gl/real':'https://www.instagram.com/p/real/';
    const app=setup({reviews:[{name:'Ana',comment:'Hermosas fotografías.',rating:source==='google'?5:null,source,source_url:url}]});await app.flush();
    const card=app.nodes['#reviews-list'].children[0];
    assert.equal(card.children[1].textContent,source==='google'?'Reseña de Google':'Comentario de Instagram');
    assert.equal(card.children[4].children[0].href,url);
    assert.equal(card.children[2].textContent,source==='google'?'★★★★★':'');
  }
});
test('no crea enlaces a fuentes peligrosas o dominios imitadores',async()=>{
  for(const source_url of ['javascript:alert(1)','https://www.instagram.com.evil.com/p/1','https://user:pass@instagram.com/p/1']){
    const app=setup({reviews:[{name:'Ana',comment:'Una experiencia hermosa.',rating:5,source:'instagram',source_url}]});await app.flush();
    const card=app.nodes['#reviews-list'].children[0];assert.equal(card.children[4].children[0].href,undefined);
  }
});

test('sigue mostrando reseñas antes de aplicar la migración social',async()=>{
  const app=setup({legacySchema:true,reviews:[{name:'Ana',rating:5,comment:'Una experiencia hermosa.'}]});await app.flush();
  assert.equal(app.calls.length,2);assert.equal(app.nodes['#reviews-list'].children.length,1);
  assert.equal(app.nodes['#reviews-list'].children[0].children[1].textContent,'Reseña enviada desde MILU');
});
