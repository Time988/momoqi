(()=>{
'use strict';
if(!window.LUCKY_MUSIC?.file)return;
const audio=document.querySelector('#background-music'),shell=document.querySelector('#music-player'),button=document.querySelector('#music-button'),title=document.querySelector('#music-title'),bars=document.querySelector('#music-bars'),status=document.querySelector('#music-status'),hint=shell.querySelector('.music-kicker');
let manualPause=false,pending=false,resumeOnReturn=false;
const file=window.LUCKY_MUSIC.file;
if(audio.getAttribute('src')!==file)audio.src=file;
audio.autoplay=true;audio.loop=true;audio.preload='auto';audio.volume=.38;
shell.hidden=false;title.textContent='Lucky Me · 原唱';
function update(){const playing=!audio.paused&&!audio.ended;button.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');button.setAttribute('aria-pressed',String(playing));button.querySelector('.music-icon').textContent=playing?'Ⅱ':'♪';bars.classList.toggle('is-playing',playing)}
function say(text){hint.textContent=text;status.textContent=text}
async function play(){
 if(manualPause||pending)return;
 pending=true;
 try{await audio.play()}catch(error){say(error.name==='NotAllowedError'?'轻点播放音乐':'音乐正在连接，轻点可重试');update()}finally{pending=false}
}
button.addEventListener('click',()=>{if(audio.paused){manualPause=false;if(audio.error)audio.load();play()}else{manualPause=true;audio.pause()}});
audio.addEventListener('playing',()=>{say('正在循环播放');update()});
audio.addEventListener('pause',()=>{say(manualPause?'音乐已暂停':'轻点播放音乐');update()});
audio.addEventListener('waiting',()=>say('音乐正在缓冲…'));
audio.addEventListener('error',()=>{say('音乐连接未成功，轻点重试');update()});
audio.addEventListener('canplay',()=>{if(audio.paused&&!manualPause)play()});
audio.addEventListener('ended',()=>{if(!manualPause){audio.currentTime=0;play()}});
function gesture(event){if(event.target.closest?.('#music-button')||event.repeat||['Shift','Control','Alt','Meta'].includes(event.key))return;if(audio.paused&&!manualPause)play()}
for(const type of ['pointerdown','touchend','click','keydown'])document.addEventListener(type,gesture,{capture:true,passive:true});
addEventListener('pagehide',()=>{resumeOnReturn=!audio.paused&&!manualPause;audio.pause()});
addEventListener('pageshow',event=>{if(event.persisted&&resumeOnReturn)play()});
say('音乐正在连接…');update();play();
})();
