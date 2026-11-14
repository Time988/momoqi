(()=>{
  'use strict';
  const root=document.documentElement,canvas=document.querySelector('#garden'),ctx=canvas.getContext('2d'),note=document.querySelector('#garden-note'),status=document.querySelector('#garden-status');
  const embedded=new URLSearchParams(location.search).has('embedded');root.classList.toggle('embedded',embedded);root.classList.toggle('preview',new URLSearchParams(location.search).has('preview'));
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey='jiajia_nonflowers_garden_v2',assets=new Map(),sent=new Set();
  const specs=[['rose',0,71234,true],['rose',1,87391,false],['lilac',0,62345,true],['lilac',1,92249,false],['ivory',0,96833,false],['ivory',1,96970,false]].map(([palette,variant,seed,woody])=>({type:'render',palette,variant,seed,woody,key:palette+variant}));
  let width=1000,height=520,ratio=1,palette='rose',visible=!embedded,raf=0,ready=false,worker=null,paper=null,cacheReady=false,hydrating=false;
  const initial=[{key:'rose0',x:.28,y:.90,size:.66,angle:-.07,born:-10000},{key:'ivory0',x:.50,y:.92,size:.57,angle:.03,born:-10000},{key:'lilac0',x:.74,y:.91,size:.68,angle:.08,born:-10000}];
  let plants=initial;
  try{const stored=JSON.parse(localStorage.getItem(storageKey));if(Array.isArray(stored))plants=stored.filter(p=>specs.some(s=>s.key===p.key)&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(-18).map(p=>({...p,born:-10000}))}catch{}

  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(plants.map(({born,...plant})=>plant)))}catch{}}
  function communicate(type,extra={}){if(embedded)parent.postMessage({type,...extra},location.origin)}
  function alive(){return visible&&!document.hidden}
  const cacheStore='caches' in window?caches.open('jiajia-nonflowers-original-v5').catch(()=>null):Promise.resolve(null);
  const cacheUrl=name=>new URL('__botanic-cache__/'+name,location.href).href;
  async function remember(name,blob){if(!blob)return;try{const cache=await cacheStore;if(cache)await cache.put(cacheUrl(name),new Response(blob,{headers:{'Content-Type':'image/png'}}))}catch{}}
  async function readBitmap(name){const cache=await cacheStore;if(!cache)return null;const response=await cache.match(cacheUrl(name));return response?createImageBitmap(await response.blob()):null}
  async function hydrate(){
    try{
      paper=await readBitmap('paper');
      await Promise.all(specs.map(async({key})=>{const [stems,petals]=await Promise.all([readBitmap(key+'-stems'),readBitmap(key+'-petals')]);if(stems&&petals)assets.set(key,{stems,petals,width:stems.width,height:stems.height})}));
      root.dataset.cache=String(assets.size);root.dataset.prepared=String(assets.size);
      if(assets.size){ready=true;root.dataset.ready='true';note.classList.add('ready');status.textContent='选一个喜欢的颜色，轻点纸面，花便开在这里。';for(const plant of plants)if(assets.has(plant.key)&&plant.born===null)plant.born=-10000;draw()}
    }catch{}
  }
  function stopWorker(){if(worker){worker.terminate();worker=null;sent.clear()}}
  function startLoading(){
    if(!alive())return;
    if(!cacheReady){if(!hydrating){hydrating=true;hydrate().finally(()=>{cacheReady=true;hydrating=false;sync()})}return}
    if(worker||(paper&&assets.size===specs.length))return;
    if(!('OffscreenCanvas' in window)||!('Worker' in window))return fallback();
    worker=new Worker('render-worker.js?v=interactive-7');
    worker.onmessage=({data})=>{
      if(data.type==='error'){fallback();return}
      if(data.type==='paper'){paper=data.bitmap;remember('paper',data.blob);draw();return}
      if(data.type!=='plant')return;
      assets.set(data.key,data);root.dataset.prepared=String(assets.size);remember(data.key+'-stems',data.stemsBlob);remember(data.key+'-petals',data.petalsBlob);
      for(const plant of plants)if(plant.key===data.key&&plant.born===null)plant.born=reduceMotion.matches?-10000:performance.now();
      if(!ready){ready=true;root.dataset.ready='true';note.classList.add('ready');status.textContent='选一个喜欢的颜色，轻点纸面，花便开在这里。'}
      draw();
      if(assets.size===specs.length)stopWorker();
    };
    worker.onerror=fallback;
    if(!paper)worker.postMessage({type:'paper',seed:87431,cache:true});
    const required=[...new Set(plants.map(p=>p.key))];
    for(const key of [...required,...specs.map(s=>s.key)]){if(assets.has(key)||sent.has(key))continue;const spec=specs.find(s=>s.key===key);if(spec){sent.add(key);worker.postMessage({...spec,cache:true})}}
  }
  function fallback(){stopWorker();root.classList.add('fallback');note.classList.remove('ready');note.textContent='这一页花笺暂时无法展开，请换个浏览器再试。';status.textContent=''}
  function render(time=performance.now(),exporting=false){
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#faf5e9';ctx.fillRect(0,0,width,height);
    if(paper){ctx.fillStyle=ctx.createPattern(paper,'repeat');ctx.fillRect(0,0,width,height)}

    let moving=false;
    for(const plant of plants){
      const asset=assets.get(plant.key);if(!asset)continue;
      const progress=exporting||reduceMotion.matches||plant.born<0?1:plant.born===null?0:Math.min(1,Math.max(0,(time-plant.born)/1600));
      if(progress<1)moving=true;
      const h=height*plant.size,w=h*asset.width/asset.height,x=Math.min(width-w*.53-24,Math.max(w*.53+24,plant.x*width)),y=plant.y*height;
      ctx.save();ctx.translate(x,y);ctx.rotate(plant.angle||0);
      const stemProgress=1-Math.pow(1-Math.min(1,progress*1.4),2);
      ctx.save();ctx.beginPath();ctx.rect(-w*.56,-h*stemProgress,w*1.12,h*stemProgress+4);ctx.clip();ctx.globalCompositeOperation='multiply';ctx.drawImage(asset.stems,-w/2,-h,w,h);ctx.restore();
      const bloomProgress=Math.max(0,Math.min(1,(progress-.30)/.70));
      if(bloomProgress){ctx.save();ctx.globalAlpha=bloomProgress;ctx.beginPath();ctx.rect(-w*.58,-h*Math.min(1,bloomProgress*1.25),w*1.16,h*Math.min(1,bloomProgress*1.25)+4);ctx.clip();ctx.drawImage(asset.petals,-w/2,-h,w,h);ctx.restore()}
      ctx.restore();
    }
    if(exporting){
      ctx.strokeStyle='#c5ad8e66';ctx.lineWidth=1;ctx.strokeRect(17,17,width-34,height-34);
      ctx.fillStyle='#826b66';ctx.font='18px "Garden Letter Hand","WenKai",serif';ctx.fillText('给佳佳的一页花笺',37,47);
      ctx.fillStyle='#a46462';ctx.font='14px "Garden Letter Hand","WenKai",serif';ctx.fillText('心意',width-65,height-34);
    }
    canvas.setAttribute('aria-label',`工笔花笺上已有${plants.length}丛花。轻点留白可以继续种花，也可使用添一丛花按钮。`);
    root.dataset.plants=String(plants.length);root.dataset.animating=String(moving&&alive()&&!exporting);
    return moving;
  }
  function draw(){
    cancelAnimationFrame(raf);raf=0;
    const moving=render();
    if(moving&&alive())raf=requestAnimationFrame(frame);
  }
  function frame(time){raf=0;if(!alive()){root.dataset.animating='false';return}if(render(time))raf=requestAnimationFrame(frame)}
  function sync(){
    if(alive()){startLoading();draw()}
    else{cancelAnimationFrame(raf);raf=0;root.dataset.animating='false';stopWorker()}
  }
  function plantAt(x,y){
    root.classList.remove('fallback');
    const variant=Math.floor(Math.random()*2),key=palette+variant;
    plants.push({key,x:Math.min(.84,Math.max(.16,x)),y:Math.min(.94,Math.max(.46,y)),size:.53+Math.random()*.19,angle:(Math.random()-.5)*.18,born:assets.has(key)?(reduceMotion.matches?-10000:performance.now()):null});
    if(plants.length>18)plants.shift();
    note.classList.add('ready');status.textContent=assets.has(key)?'又添了一丛。愿你喜欢的，都能在这里开花。':'花正在落笔，请稍候片刻。';
    persist();sync();
  }
  canvas.addEventListener('click',event=>{const rect=canvas.getBoundingClientRect();plantAt((event.clientX-rect.left)/rect.width,(event.clientY-rect.top)/rect.height)});
  canvas.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();plantAt(.22+Math.random()*.56,.77+Math.random()*.14)}});
  document.querySelector('#add-plant').addEventListener('click',()=>plantAt(.22+Math.random()*.56,.77+Math.random()*.14));
  document.querySelectorAll('[data-palette]').forEach(button=>button.addEventListener('click',()=>{palette=button.dataset.palette;document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));status.textContent='选好了'+button.textContent.trim()+'，轻点纸面，就添在这里。'}));
  document.querySelector('#undo-plant').addEventListener('click',()=>{plants.pop();persist();draw();status.textContent='留一点白，也很好看。'});
  document.querySelector('#clear-garden').addEventListener('click',()=>{plants=[];persist();draw();note.classList.remove('ready');note.textContent='轻点留白，种下你喜欢的颜色。';status.textContent='这一页重新留白，等你慢慢种满。'});
  document.querySelector('#save-garden').addEventListener('click',async()=>{
    if(!ready||plants.some(p=>!assets.has(p.key))){status.textContent='还有花正在落笔，等它舒展后再留住这一页。';return}
    if(document.fonts)await document.fonts.ready;
    render(performance.now(),true);
    canvas.toBlob(blob=>{if(!blob){status.textContent='暂时没能留住花笺，可以再试一次。';draw();return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='给佳佳的一页花笺.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='这一页的花，已为你留好。';draw()},'image/png');
  });
  function resize(){const box=canvas.closest('.paper').getBoundingClientRect();width=box.width;height=box.height;ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw()}
  new ResizeObserver(resize).observe(canvas.closest('.paper'));
  document.addEventListener('visibilitychange',sync);
  addEventListener('pagehide',()=>{visible=false;sync()});
  addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='gift-botanic')return;visible=event.data.play===true;sync()});
  reduceMotion.addEventListener('change',draw);
  new ResizeObserver(()=>communicate('botanic-size',{height:Math.ceil(document.querySelector('.studio').getBoundingClientRect().height)+8})).observe(document.querySelector('.studio'));
  communicate('botanic-ready');resize();sync();
})();
