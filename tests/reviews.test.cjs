const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/reviews.js'), 'utf8');

function setup({config={url:'https://example.supabase.co',publicKey:'sb_publishable_test'}, reviews=[], failPost=false, failGet=false}={}) {
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
    fetch:async(url,options)=>{calls.push({url,options});return {ok:options.method==='POST' ? !failPost : !failGet,json:async()=>reviews};}
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
  assert.equal(card.children[1].textContent,'<script>alert(1)</script>');
  assert.equal(card.children[2].textContent,'<img src=x onerror=alert(1)>');assert.equal(card.children[0].textContent,'★★★★☆');
});
test('fallo de lectura no impide dejar una reseña',async()=>{
  const app=setup({failGet:true});await app.flush();assert.match(app.nodes['#reviews-list-status'].textContent,/No pudimos/);
  await app.form.submit({preventDefault(){}});assert.equal(app.form.resetCalled,true);
});
