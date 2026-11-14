import RainRenderer from './src/rain-renderer.js';
import Raindrops from './src/raindrops.js';
import loadImages from './src/image-loader.js';
import createCanvas from './src/create-canvas.js';

const root=document.documentElement, canvas=document.querySelector('#rain'), toggle=document.querySelector('#toggle'), status=document.querySelector('#status');
const embedded=new URLSearchParams(location.search).has('embedded');
root.classList.toggle('embedded',embedded);
let drops, renderer, wantsPlay=!matchMedia('(prefers-reduced-motion: reduce)').matches, inView=!embedded, clear=false, ready=false;
function sync(){
  const playing=ready&&wantsPlay&&inView&&!clear&&!document.hidden;
  root.dataset.running=String(playing);
  if(!ready)return;
  for(const item of [drops,renderer]){
    if(playing&&item.paused){item.paused=false;if(item===drops){item.lastRender=null;item.update()}else item.draw()}
    else if(!playing){item.paused=true;cancelAnimationFrame(item.frame)}
  }
}
function texture(image,width,height,blur=0){
  const result=createCanvas(width,height),ctx=result.getContext('2d');
  const scale=Math.max(width/image.width,height/image.height)*1.035;
  const w=image.width*scale,h=image.height*scale;
  ctx.filter=blur?`blur(${blur}px)`:'none';
  ctx.drawImage(image,(width-w)/2,(height-h)*.37,w,h);
  return result;
}
toggle.addEventListener('click',()=>{
  clear=!clear;if(!clear)wantsPlay=true;root.classList.toggle('original',clear);toggle.textContent=clear?'再看一场雨':'看清这一刻';toggle.setAttribute('aria-pressed',String(clear));sync();
});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='gift-rain')return;
  inView=event.data.play===true;sync();
});
document.addEventListener('visibilitychange',sync);
window.addEventListener('pagehide',()=>{inView=false;sync()});
try{
  const images=await loadImages([{name:'alpha',src:'img/drop-alpha.png'},{name:'color',src:'img/drop-color.png'},{name:'shine',src:'img/drop-shine2.png'},{name:'memory',src:'../assets/memories/kiss.webp'}]);
  const ratio=innerWidth/innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
  const texWidth=Math.min(1280,canvas.width),texHeight=Math.round(texWidth/ratio);
  drops=new Raindrops(canvas.width,canvas.height,dpr,images.alpha.img,images.color.img,{minR:12,maxR:28,maxDrops:210,rainChance:.24,rainLimit:2,dropletsRate:8,dropletsSize:[1.5,3],globalTimeScale:.65,trailScaleRange:[.22,.4],collisionRadiusIncrease:.002});
  // The original author's renderer/physics are retained; only the scene's two image textures change.
  renderer=new RainRenderer(canvas,drops.canvas,texture(images.memory.img,texWidth,texHeight),texture(images.memory.img,texWidth,texHeight,1.6),images.shine.img,{renderShadow:false,minRefraction:160,maxRefraction:300,brightness:.91,alphaMultiply:12,alphaSubtract:4,parallaxBg:1,parallaxFg:7});
  ready=true;root.dataset.ready='true';root.classList.add('ready');status.textContent='那个雨夜';
  if(!wantsPlay){clear=true;root.classList.add('original');toggle.textContent='看一场雨'}
  sync();
  parent.postMessage({type:'rain-ready'},location.origin);
  let sizeTimer;
  addEventListener('resize',()=>{clearTimeout(sizeTimer);sizeTimer=setTimeout(()=>location.reload(),200)});
}catch(error){
  for(const item of [drops,renderer]){if(item){item.paused=true;cancelAnimationFrame(item.frame)}}
  root.dataset.ready='fallback';status.textContent='那个雨夜';toggle.hidden=true;console.warn('Rain scene uses the original photo fallback.',error);
}
