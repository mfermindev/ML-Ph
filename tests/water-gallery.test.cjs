const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/water-gallery.js'),'utf8');

function setup({zoom=false,effect=null,reduced=false,fine=true,webgl=true,failImage=null}={}){
  let now=0,id=0;const frames=new Map(),timers=new Map(),uniforms={},listeners={};let textureUploads=0;
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.events={};this.style={};this.clientWidth=1000;this.clientHeight=580;this.animations=[];this.textContent='';this.disabled=false;this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};}
    append(...children){this.children.push(...children);}setAttribute(name,value){this.attributes[name]=value;}
    addEventListener(name,fn){(this.events[name]||=[]).push(fn);}dispatch(name,event={}){return Promise.all((this.events[name]||[]).map(fn=>fn(event)));}
    getBoundingClientRect(){return {left:0,top:-40,width:1000,height:580};}
    contains(node){return node===this||this.children.some(child=>child.contains(node));}
    animate(){const animation={finished:Promise.resolve(),cancel(){}};this.animations.push(animation);return animation;}
    getAnimations(){return this.animations;}decode(){return Promise.resolve();}
    getContext(){return webgl?gl:null;}
  }
  const gl=new Proxy({
    NO_ERROR:0,getError:()=>0,
    createProgram:()=>({}),createShader:()=>({}),createBuffer:()=>({}),createTexture:()=>({}),
    getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>0,
    getParameter:()=>4096,getUniformLocation:(_,name)=>name,
    uniform1f:(name,value)=>uniforms[name]=value,uniform2f:(name,...values)=>uniforms[name]=values,
    uniform4fv:(name,values)=>uniforms[name]=Array.from(values),texImage2D:()=>textureUploads++
  },{get(target,name){return name in target?target[name]:(()=>{});}});
  const root=new Element('root');root.dataset={collection:'test',effect:effect||(zoom?'crosszoom':'water')};
  const media={reduced:{matches:reduced,addEventListener(){}},fine:{matches:fine,addEventListener(){}}};
  const items=[0,1,2].map(i=>({src:`photo${i}.jpg`,title:`Título ${i}`,subtitle:`Subtítulo ${i}`,alt:`Alt ${i}`}));
  const document={hidden:false,activeElement:null,querySelectorAll:()=>[root],createElement:tag=>new Element(tag),addEventListener:(name,fn)=>listeners[name]=fn};
  let intersect;
  vm.runInNewContext(source,{
    window:{ML_CONTENT:{test:items}},document,devicePixelRatio:1,innerHeight:900,performance:{now:()=>now},Float32Array,
    matchMedia:query=>query.includes('reduced')?media.reduced:media.fine,
    IntersectionObserver:class {constructor(callback){intersect=callback;}observe(){}},
    Image:class {naturalWidth=1000;naturalHeight=580;set src(value){queueMicrotask(()=>value===failImage?this.onerror():this.onload());}},
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,due:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    addEventListener(){},queueMicrotask
  });
  const [layer,photo,,copy,notice]=root.children;
  const [caption,controls]=copy.children;const [prev,dots,next,pause]=controls.children;
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  function frame(time){now=time;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));}
  function tick(time){now=time;for(const [key,timer] of [...timers])if(timer.due<=time){timers.delete(key);timer.fn();}}
  return {root,layer,photo,caption,prev,next,pause,dots,notice,document,uniforms,media,frames,timers,flush,frame,tick,
    setVisible:visible=>intersect([{isIntersecting:visible}]),uploads:()=>textureUploads,
    async finish(){await flush();frame(now+700);await flush();frame(now+800);await flush();},
    async click(el,event={}){el.dispatch('click',event);await flush();}
  };
}

test('las tres colecciones tienen portada, galería propia e imágenes existentes',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for(const key of ['photography','weddings','delis']){
    assert.ok(html.includes(`data-collection="${key}"`));
    assert.ok(html.includes(`data-photo-collection="${key}"`));
  }
  assert.ok(!html.includes('id="historias"'));
  assert.ok(!html.includes('gallery-title'));
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/content.js'),'utf8'),context);
  for(const key of ['delis','weddings','photography'])for(const item of context.window.ML_CONTENT[key]){
    assert.ok(item.subtitle);assert.ok(fs.existsSync(path.join(__dirname,'..',item.src)));
  }
});
test('flechas, puntos, títulos y subtítulos cambian juntos, incluso sin WebGL',async()=>{
  const app=setup({webgl:false});await app.click(app.next);await app.finish();
  assert.equal(app.caption.children[1].textContent,'Título 1');assert.equal(app.caption.children[2].textContent,'Subtítulo 1');
  assert.equal(app.dots.children[1].attributes['aria-current'],'true');
  await app.click(app.prev);await app.finish();assert.equal(app.caption.children[1].textContent,'Título 0');
  await app.click(app.dots.children[2]);await app.finish();assert.equal(app.caption.children[1].textContent,'Título 2');
});
test('clic en la imagen conserva el origen de la transición',async()=>{
  const app=setup();await app.click(app.photo,{detail:1,clientX:250,clientY:250});await app.finish();
  assert.equal(app.uniforms.origin[0],.25);assert.equal(app.uniforms.origin[1],.5);
  assert.equal(app.caption.children[1].textContent,'Título 1');
});
test('zoom cruzado y agua seleccionan shaders distintos',async()=>{
  for(const zoom of [false,true]){const app=setup({zoom});await app.click(app.next);assert.equal(app.uniforms.effect,zoom?1:0);await app.finish();}
});
test('mouse y reposo no activan WebGL; solo la transición renderiza',async()=>{
  for(const zoom of [false,true]){
    const app=setup({zoom});app.setVisible(true);await app.flush();
    assert.equal(app.uploads(),0);assert.equal(app.frames.size,0);
    await app.photo.dispatch('pointermove',{pointerType:'mouse',clientX:300,clientY:200});
    await app.flush();assert.equal(app.uploads(),0);assert.equal(app.frames.size,0);
    await app.click(app.next);assert.ok(app.root.classes.has('webgl-ready'));
    assert.equal(app.uploads(),2);await app.finish();
    assert.equal(app.frames.size,0);assert.equal(app.uploads(),2);
    assert.ok(!app.root.classes.has('webgl-ready'));
    assert.equal(app.caption.children[1].textContent,'Título 1');
  }
});

test('avance cada 6 segundos, pausa, reproducción y suspensión fuera de pantalla',async()=>{
  const app=setup();app.setVisible(true);await app.flush();
  app.tick(5999);await app.flush();assert.equal(app.next.disabled,false);
  app.tick(6000);await app.flush();assert.equal(app.next.disabled,true);await app.finish();
  assert.equal(app.caption.children[1].textContent,'Título 1');
  await app.click(app.pause);assert.equal(app.pause.textContent,'Reproducir');assert.equal(app.timers.size,0);
  app.document.activeElement=app.pause;await app.root.dispatch('focusin');
  await app.click(app.pause);assert.equal(app.pause.textContent,'Pausar');assert.equal(app.timers.size,1);
  app.setVisible(false);assert.equal(app.timers.size,0);
});
test('movimiento reducido evita autoplay y cambia fotos sin animaciones',async()=>{
  const app=setup({reduced:true});app.setVisible(true);await app.flush();assert.equal(app.timers.size,0);
  await app.click(app.next);assert.equal(app.caption.children[1].textContent,'Título 1');assert.equal(app.uploads(),0);
  assert.equal(app.caption.getAnimations().length,0);assert.equal(app.pause.textContent,'Reproducir');
});
test('fallo de imagen permite reintentar y no adelanta título',async()=>{
  const app=setup({failImage:'photo1.jpg'});await app.click(app.next);await app.flush();
  assert.match(app.notice.textContent,/No se pudo/);assert.equal(app.next.disabled,false);assert.equal(app.caption.children[1].textContent,'Título 0');
});
test('doble clic durante la transición no salta dos fotos',async()=>{
  const app=setup();await app.click(app.next);await app.click(app.next);await app.finish();assert.equal(app.caption.children[1].textContent,'Título 1');
});

test('solo Fotografía configura desplazamiento por mapa y deja de renderizar al terminar',async()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/data-collection="photography" data-effect="displacement-map"/);
  assert.equal((html.match(/data-effect="displacement-map"/g)||[]).length,1);
  const app=setup({effect:'displacement-map'});
  await app.click(app.next);assert.equal(app.uniforms.effect,2);
  await app.finish();assert.equal(app.caption.children[1].textContent,'Título 1');
  assert.equal(app.frames.size,0);assert.ok(!app.root.classes.has('webgl-ready'));
});
