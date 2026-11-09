/* Visores WebGL compartidos: ondas de agua, zoom cruzado y desplazamiento por mapa. Sin dependencias. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const PERIOD = 6000;
  const vertex = `attribute vec2 position; varying mediump vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision mediump float;
    varying mediump vec2 uv;
    uniform sampler2D currentImage,nextImage;
    uniform vec2 viewport,currentSize,nextSize,origin;
    uniform float progress,effect;
    vec2 cover(vec2 p,vec2 size){
      float a=viewport.x/viewport.y;float b=size.x/size.y;
      return clamp((p-.5)*vec2(min(a/b,1.),min(b/a,1.))+.5,vec2(.001),vec2(.999));
    }
    float hash(vec2 p){
      return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
    }
    float noise(vec2 p){
      vec2 cell=floor(p),f=fract(p);
      f=f*f*(3.-2.*f);
      return mix(mix(hash(cell),hash(cell+vec2(1.,0.)),f.x),
                 mix(hash(cell+vec2(0.,1.)),hash(cell+vec2(1.,1.)),f.x),f.y);
    }
    void main(){
      float p=progress;
      if(effect>1.5){
        // Mapa de desplazamiento procedural, estable entre fotogramas.
        vec2 grid=uv*vec2(viewport.x/viewport.y,1.)*5.;
        vec2 displacement=vec2(noise(grid),noise(grid+vec2(19.7,8.3)))-.5;
        displacement*=.32;
        float blend=smoothstep(0.,1.,p);
        vec2 fromUV=uv+displacement*blend;
        vec2 toUV=uv-displacement*(1.-blend);
        gl_FragColor=mix(texture2D(currentImage,cover(fromUV,currentSize)),
                        texture2D(nextImage,cover(toUV,nextSize)),blend);
      }else if(effect>0.5){
        // Zoom radial con muestras múltiples y fundido cruzado.
        float strength=sin(p*3.14159265)*.28;
        vec4 color=vec4(0.);
        for(int i=0;i<12;i++){
          float t=float(i)/11.;float weight=1.-abs(t-.5)*1.4;
          vec2 a=(uv-.5)*(1.-strength*t)+.5;
          vec2 b=(uv-.5)*(1.+strength*(1.-t))+.5;
          color+=mix(texture2D(currentImage,cover(a,currentSize)),texture2D(nextImage,cover(b,nextSize)),smoothstep(0.,1.,p))*weight;
        }
        gl_FragColor=color/7.4181818;
      }else{
        vec2 delta=(uv-origin)*vec2(viewport.x/viewport.y,1.);
        float d=length(delta);
        vec2 farthest=max(origin,1.-origin)*vec2(viewport.x/viewport.y,1.);
        float radius=p*(length(farthest)+.2);
        float ring=sin((d-radius)*45.)*exp(-abs(d-radius)*16.)*.045*sin(p*3.14159265);
        vec2 offset=normalize(delta+vec2(.0001))*ring;
        float reveal=smoothstep(d-.09,d+.09,radius);
        reveal=mix(reveal,0.,1.-step(.0001,p));
        reveal=mix(reveal,1.,step(.9999,p));
        gl_FragColor=mix(texture2D(currentImage,cover(uv+offset,currentSize)),texture2D(nextImage,cover(uv-offset,nextSize)),reveal);
      }
    }`;

  function createRenderer(canvas, effect) {
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
    if(!gl) throw new Error('El navegador no pudo crear un contexto WebGL.');
    const program=gl.createProgram();
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);gl.deleteProgram(program);
        throw new Error('No se pudo compilar el shader: '+message);
      }
      gl.attachShader(program,shader);gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
      const message=gl.getProgramInfoLog(program);gl.deleteProgram(program);
      throw new Error('No se pudo enlazar el programa WebGL: '+message);
    }
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const uniforms=Object.fromEntries(['viewport','currentSize','nextSize','origin','progress','effect','currentImage','nextImage'].map(name=>[name,gl.getUniformLocation(program,name)]));
    gl.uniform1i(uniforms.currentImage,0);gl.uniform1i(uniforms.nextImage,1);gl.uniform1f(uniforms.effect,effect);
    const textures=[0,1].map(unit=>{
      gl.activeTexture(gl.TEXTURE0+unit);const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      for(const edge of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,edge,gl.CLAMP_TO_EDGE);
      for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
      return texture;
    });
    const maxSize=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),4096);
    function uploadImage(img,unit){
      let source=img;
      if(Math.max(img.naturalWidth,img.naturalHeight)>maxSize){
        const scale=maxSize/Math.max(img.naturalWidth,img.naturalHeight);
        source=document.createElement('canvas');source.width=Math.round(img.naturalWidth*scale);source.height=Math.round(img.naturalHeight*scale);
        source.getContext('2d').drawImage(img,0,0,source.width,source.height);
      }
      gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,textures[unit]);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      const error=gl.getError();
      if(error!==gl.NO_ERROR) throw new Error('No se pudo cargar la textura WebGL ('+error+').');
      gl.uniform2f(unit?uniforms.nextSize:uniforms.currentSize,img.naturalWidth,img.naturalHeight);
    }
    return {
      upload(images){images.forEach(uploadImage);},
      draw(progress,origin){
        const ratio=Math.min(devicePixelRatio||1,1.5);
        const width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));
        if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
        gl.viewport(0,0,width,height);gl.uniform2f(uniforms.viewport,width,height);
        gl.uniform2f(uniforms.origin,...origin);gl.uniform1f(uniforms.progress,progress);
        gl.drawArrays(gl.TRIANGLES,0,6);
      }
    };
  }

  document.querySelectorAll('[data-collection]').forEach(root=>{
    const items=window.ML_CONTENT[root.dataset.collection]||[];
    if(!items.length) return;
    const zoom=root.dataset.effect==='crosszoom';
    const effect=root.dataset.effect==='displacement-map'?2:zoom?1:0;
    root.setAttribute('role','region');root.setAttribute('aria-roledescription','carrusel');
    const layer=document.createElement('div');layer.className='water-layer';
    const image=document.createElement('img');image.className='water-image';image.src=items[0].src;image.alt=items[0].alt||items[0].title;image.decoding='async';
    const canvas=document.createElement('canvas');canvas.className='water-canvas';canvas.setAttribute('aria-hidden','true');
    layer.append(image,canvas);
    const photoButton=document.createElement('button');photoButton.type='button';photoButton.className='water-photo-button';
    photoButton.setAttribute('aria-label','Ver la siguiente foto');
    const corners=document.createElement('div');corners.className='water-corners';corners.setAttribute('aria-hidden','true');
    for(let i=0;i<4;i++) corners.append(document.createElement('i'));
    const copy=document.createElement('div');copy.className='water-copy';
    const caption=document.createElement('div');caption.className='water-caption';caption.setAttribute('aria-atomic','true');
    const count=document.createElement('span');count.className='water-counter';
    const title=document.createElement('h3');const subtitle=document.createElement('p');subtitle.className='water-subtitle';
    caption.append(count,title,subtitle);
    const controls=document.createElement('div');controls.className='water-controls';controls.setAttribute('aria-label','Controles de la galería');
    function button(label,text,className){const el=document.createElement('button');el.type='button';el.className=className;el.setAttribute('aria-label',label);el.textContent=text;return el;}
    const prev=button('Foto anterior','‹','water-arrow');const next=button('Siguiente foto','›','water-arrow');
    const pause=button('Pausar avance automático','Pausar','water-pause');
    const dots=document.createElement('div');dots.className='water-dots';dots.setAttribute('role','group');dots.setAttribute('aria-label','Elegir foto');
    const dotButtons=items.map((item,i)=>{const dot=button(`Ver foto ${i+1}: ${item.title}`,'','water-dot');dots.append(dot);return dot;});
    controls.append(prev,dots,next,pause);copy.append(caption,controls);
    const notice=document.createElement('span');notice.className='water-notice';notice.setAttribute('role','status');
    root.append(layer,photoButton,corners,copy,notice);

    let index=0,busy=false,renderer=null,initializing=null,visible=false,focusHeld=false;
    let paused=reduced.matches,timer=0,frameId=0;
    let origin=[.5,.5],transition=null,captionChanged=false,cycleStarted=0;
    const cache=new Map();
    const animations=new Set();
    function rendererFailed(error){
      renderer=null;root.dataset.renderer='fallback';
      root.dataset.rendererError=error?.message||String(error);
      console.warn('[MILU galería]',root.dataset.collection,error);
    }
    function animateCaption(frames){
      if(reduced.matches) return;
      const animation=caption.animate(frames,{duration:240,easing:'ease-out',fill:'forwards'});
      animations.add(animation);animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));
    }
    function cancelCaption(){for(const animation of animations) animation.cancel();animations.clear();caption.getAnimations().forEach(animation=>animation.cancel());}
    function updateCaption(target=index){
      title.textContent=items[target].title;subtitle.textContent=items[target].subtitle||'';
      count.textContent=`${String(target+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
      dotButtons.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===target)));
    }
    function updateControls(){
      [prev,next,photoButton,...dotButtons].forEach(el=>el.disabled=busy||items.length<2);
      pause.disabled=items.length<2;pause.textContent=paused?'Reproducir':'Pausar';
      pause.setAttribute('aria-label',paused?'Reproducir avance automático':'Pausar avance automático');
      caption.setAttribute('aria-live',paused?'polite':'off');
    }
    function load(src){
      if(!cache.has(src)) cache.set(src,new Promise((resolve,reject)=>{
        const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Imagen no disponible'));img.src=src;
      }).catch(error=>{cache.delete(src);throw error;}));
      return cache.get(src);
    }
    async function initialize(){
      if(initializing) return initializing;
      initializing=(async()=>{
        if(!reduced.matches){
          try{renderer=createRenderer(canvas,effect);root.dataset.renderer='webgl';delete root.dataset.rendererError;}
          catch(error){rendererFailed(error);}
        }else root.dataset.renderer='reduced-motion';
      })().catch(()=>{initializing=null;});
      return initializing;
    }
    function canPlay(){return visible&&!document.hidden&&!paused&&!focusHeld&&items.length>1;}
    function schedule(){
      clearTimeout(timer);
      if(canPlay()&&!busy) timer=setTimeout(()=>goTo(index+1),Math.max(0,PERIOD-(performance.now()-cycleStarted)));
    }
    function resetCycle(){cycleStarted=performance.now();schedule();}
    function render(now){
      frameId=0;
      if(transition){
        const progress=reduced.matches?1:Math.min((now-transition.start)/transition.duration,1);
        if(progress>=.45&&!captionChanged){
          captionChanged=true;cancelCaption();updateCaption(transition.target);
          animateCaption([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}]);
        }
        renderer?.draw(progress,origin);
        if(progress<1){frameId=requestAnimationFrame(render);return;}
        const resolve=transition.resolve;transition=null;resolve();
        return;
      }

    }
    function wake(){if(!frameId) frameId=requestAnimationFrame(render);}
    async function goTo(target,point=[.5,.5]){
      target=(target%items.length+items.length)%items.length;
      if(busy||target===index) return;
      busy=true;clearTimeout(timer);updateControls();notice.textContent='';cycleStarted=performance.now();
      try{
        await initialize();
        const images=await Promise.all([load(items[index].src),load(items[target].src)]);
        origin=point;captionChanged=false;
        try{renderer?.upload(images);}catch(error){rendererFailed(error);}
        if(!reduced.matches){
          animateCaption([{opacity:1},{opacity:0}]);
          if(renderer){renderer.draw(0,origin);root.classList.add('webgl-ready');}
          else {
            const fade=image.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});
            animations.add(fade);
          }
          await new Promise(resolve=>{transition={start:performance.now(),duration:zoom?1200:1400,target,resolve};wake();});
        }
        image.src=items[target].src;image.alt=items[target].alt||items[target].title;
        await image.decode().catch(()=>{});
        index=target;updateCaption();
        // Keep the canvas visible until the replacement image has decoded.
        root.classList.remove('webgl-ready');
        for(const animation of animations) animation.cancel();animations.clear();
        image.getAnimations().forEach(animation=>animation.cancel());cancelCaption();
        load(items[(index+1)%items.length].src).catch(()=>{});
      }catch{notice.textContent='No se pudo cargar la foto. Intentá de nuevo.';cancelCaption();}
      finally{busy=false;updateControls();schedule();}
    }
    function pointAt(event){const rect=layer.getBoundingClientRect();return [Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),Math.max(0,Math.min(1,1-(event.clientY-rect.top)/rect.height))];}
    photoButton.addEventListener('click',event=>goTo(index+1,event.detail?pointAt(event):[.5,.5]));
    prev.addEventListener('click',()=>goTo(index-1));next.addEventListener('click',()=>goTo(index+1));
    dotButtons.forEach((dot,i)=>dot.addEventListener('click',()=>goTo(i)));
    pause.addEventListener('click',()=>{paused=!paused;if(!paused) focusHeld=false;updateControls();resetCycle();});
    root.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();goTo(index+(event.key==='ArrowRight'?1:-1));}
    });
    root.addEventListener('focusin',event=>{
      focusHeld=event.target?.matches(':focus-visible')??true;
      if(focusHeld) clearTimeout(timer);
    });
    root.addEventListener('focusout',()=>{queueMicrotask(()=>{focusHeld=root.contains(document.activeElement);resetCycle();});});
    document.addEventListener('visibilitychange',()=>{resetCycle();if(!document.hidden) wake();});
    reduced.addEventListener('change',()=>{
      if(reduced.matches){paused=true;root.classList.remove('webgl-ready');}
      else if(!renderer){initializing=null;initialize();}
      updateControls();resetCycle();
    });
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer=null;root.classList.remove('webgl-ready');});
    canvas.addEventListener('webglcontextrestored',()=>{initializing=null;initialize();});
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if(visible){resetCycle();}else clearTimeout(timer);
    },{threshold:.15});
    observer.observe(root);
    updateCaption();updateControls();
  });
})();
