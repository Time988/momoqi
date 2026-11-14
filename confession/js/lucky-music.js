(()=>{
'use strict';
if(!window.LUCKY_MUSIC)return;
const shell=document.querySelector('#music-player'),button=document.querySelector('#music-button'),title=document.querySelector('#music-title'),bars=document.querySelector('#music-bars'),status=document.querySelector('#music-status');

if(window.LUCKY_MUSIC.file){
 const audio=document.querySelector('#background-music');let manualPause=false;
 audio.src=window.LUCKY_MUSIC.file;audio.loop=true;audio.preload='metadata';audio.volume=.38;
 shell.hidden=false;title.textContent='Lucky Me · 原唱';button.removeAttribute('aria-controls');button.removeAttribute('aria-expanded');
 function update(){const playing=!audio.paused;button.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');button.setAttribute('aria-pressed',String(playing));button.querySelector('.music-icon').textContent=playing?'Ⅱ':'♪';bars.classList.toggle('is-playing',playing)}
 function play(){if(manualPause)return;const result=audio.play();if(result)result.catch(()=>{status.textContent='点一下页面，听这首写给你的歌。';update()})}
 button.addEventListener('click',()=>{if(audio.paused){manualPause=false;play()}else{manualPause=true;audio.pause()}});
 audio.addEventListener('play',()=>{status.textContent='音乐正在循环播放。';update()});audio.addEventListener('pause',update);
 audio.addEventListener('error',()=>{status.textContent='音乐暂时未能载入，请稍后重试。';update()});
 function gesture(event){if(event.target.closest?.('#music-button'))return;if(audio.paused&&!manualPause)play()}
 document.addEventListener('pointerdown',gesture,{once:true,capture:true});document.addEventListener('keydown',gesture,{once:true,capture:true});
 addEventListener('pagehide',()=>audio.pause());update();play();return;
}

const panel=document.createElement('section');panel.id='lucky-panel';panel.className='lucky-panel';panel.hidden=true;panel.setAttribute('aria-label','Lucky Me 音乐设置');
panel.innerHTML='<div class="lucky-heading"><span>Jake Miller · Lucky Me</span><button id="lucky-close" aria-label="收起面板，继续播放">×</button></div><div id="lucky-video"></div><p>收起这里，音乐也会继续。<br>如果尚未响起，点一下播放器中的播放键。</p><div class="lucky-actions"><button id="lucky-stop">停止音乐</button><a href="https://audiomack.com/jake-miller/song/lucky-me" target="_blank" rel="noopener">歌曲原页 ↗</a></div>';
document.body.append(panel);
const host=panel.querySelector('#lucky-video');let frame=null;
shell.hidden=false;title.textContent='Lucky Me · 原唱';button.removeAttribute('aria-pressed');button.setAttribute('aria-controls','lucky-panel');bars.classList.remove('is-playing');
function load(){
 if(frame)return;
 frame=document.createElement('iframe');frame.id='lucky-stream';frame.src='https://audiomack.com/embed/jake-miller/song/lucky-me?autoplay=1';frame.title='Jake Miller - Lucky Me 原唱播放器';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';host.append(frame);
 panel.dataset.state='loaded';status.textContent='已请求自动播放；如果没有响起，打开音乐设置，点一下播放器中的播放键。';
}
function show(open){panel.hidden=!open;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'收起音乐设置，继续播放':'打开音乐设置');if(open)load()}
function stop(){if(frame)frame.remove();frame=null;panel.dataset.state='stopped';status.textContent='音乐已停止。';show(false)}
button.addEventListener('click',()=>show(panel.hidden));
panel.querySelector('#lucky-close').addEventListener('click',()=>{show(false);status.textContent='音乐设置已收起，播放不会中断。';button.focus()});
panel.querySelector('#lucky-stop').addEventListener('click',()=>{stop();button.focus()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){show(false);button.focus()}});
// Keep one iframe alive when folded or when the document becomes hidden.
// Destroy only on explicit Stop or when this page is actually left.
addEventListener('pagehide',()=>{if(frame)frame.remove();frame=null});
addEventListener('pageshow',event=>{if(event.persisted&&panel.dataset.state!=='stopped')load()});
show(false);load();
})();
