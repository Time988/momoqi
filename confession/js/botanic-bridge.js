(()=>{
const frame=document.querySelector('#botanic-frame'),stage=document.querySelector('#botanic-stage'),loading=document.querySelector('#botanic-loading');
let visible=false,ready=false;
const warmObserver=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;if(!frame.getAttribute('src'))frame.src=frame.dataset.src;warmObserver.disconnect()},{rootMargin:'1000px'});warmObserver.observe(stage);
function sync(){if(ready)frame.contentWindow.postMessage({type:'gift-botanic',play:visible&&!document.hidden},location.origin)}
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;document.body.classList.toggle("botanic-scene-active",visible);document.dispatchEvent(new CustomEvent("gift-petal-pause",{detail:visible}));if(visible&&!frame.getAttribute('src'))frame.src=frame.dataset.src;sync()},{threshold:.08}).observe(stage);
addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='botanic-size'&&Number.isFinite(event.data.height)){const height=Math.min(1100,Math.max(550,event.data.height));frame.style.height=height+'px';stage.style.minHeight=height+'px'}if(event.data?.type==='botanic-ready'){ready=true;loading.hidden=true;sync()}});
document.addEventListener('visibilitychange',sync);addEventListener('pagehide',()=>{visible=false;sync()});
})();
