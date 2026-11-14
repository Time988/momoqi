(()=>{
const frame=document.querySelector('#rain-frame'),stage=document.querySelector('#rain-memory');
let visible=false,ready=false;
function sync(){if(ready)frame.contentWindow.postMessage({type:'gift-rain',play:visible&&!document.hidden},location.origin)}
new IntersectionObserver(([entry])=>{
  visible=entry.isIntersecting;
  if(visible&&!frame.getAttribute('src'))frame.src=frame.dataset.src;
  sync();
},{threshold:.12}).observe(stage);
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='rain-ready')return;
  ready=true;frame.classList.add('loaded');sync();
});
document.addEventListener('visibilitychange',sync);
window.addEventListener('pagehide',()=>{visible=false;sync()});
})();
