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

// Official SoundCloud widget: READY starts playback, FINISH restarts this song.
const panel=document.createElement('section');panel.id='lucky-panel';panel.className='lucky-panel';panel.hidden=true;panel.setAttribute('aria-label','Lucky Me 音乐设置');
panel.innerHTML='<div class="lucky-heading"><span>Jake Miller · Lucky Me</span><button id="lucky-close" aria-label="收起面板，继续播放">×</button></div><div id="lucky-video"></div><p>这首歌会一直循环。若尚未响起，点一下播放。</p><div class="lucky-actions"><button id="lucky-fallback">备用原唱播放器</button><a href="https://soundcloud.com/jake-miller-music/lucky-me" target="_blank" rel="noopener">歌曲原页 ↗</a></div>';
document.body.append(panel);
const details=document.createElement('button');details.className='lucky-details';details.type='button';details.textContent='⋯';details.setAttribute('aria-label','打开音乐设置');details.setAttribute('aria-controls','lucky-panel');details.setAttribute('aria-expanded','false');shell.append(details);
const host=panel.querySelector('#lucky-video');
let frame=null,widget=null,ready=false,playing=false,manualPause=false,everPlayed=false,fallback=false,disposed=false;
shell.hidden=false;title.textContent='Lucky Me · 原唱';button.removeAttribute('aria-expanded');button.removeAttribute('aria-controls');
function update(){button.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');button.setAttribute('aria-pressed',String(playing));button.querySelector('.music-icon').textContent=playing?'Ⅱ':'♪';bars.classList.toggle('is-playing',playing)}
function show(open){panel.hidden=!open;details.setAttribute('aria-expanded',String(open))}
function requestPlay(){if(disposed||manualPause)return;if(ready&&widget)widget.play();else if(fallback)show(true)}
function connect(){
 if(disposed||fallback||!window.SC?.Widget)return;
 widget=window.SC.Widget(frame);const events=window.SC.Widget.Events;
 widget.bind(events.READY,()=>{ready=true;widget.setVolume(38);status.textContent='点一下页面，听这首写给你的歌。';requestPlay()});
 widget.bind(events.PLAY,()=>{playing=true;everPlayed=true;manualPause=false;status.textContent='Lucky Me 正在循环播放。';update()});
 widget.bind(events.PAUSE,()=>{playing=false;update()});
 widget.bind(events.FINISH,()=>{if(!manualPause&&!disposed){widget.seekTo(0);widget.play()}});
 widget.bind(events.ERROR,()=>{playing=false;status.textContent='音乐暂时未能载入，可以打开音乐设置重试。';update()});
}
function load(){
 disposed=false;ready=false;fallback=false;
 frame=document.createElement('iframe');frame.id='lucky-stream';frame.title='Jake Miller - Lucky Me 原唱播放器';frame.allow='autoplay';frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.src='https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F1398164557&auto_play=true&color=%238d4d60&show_artwork=true&show_comments=false&show_reposts=false&sharing=false&buying=false&download=false';host.replaceChildren(frame);
 if(window.SC?.Widget)connect();else{let script=document.createElement('script');script.src='vendor/soundcloud/widget-api.js';script.async=true;script.onload=connect;script.onerror=()=>{status.textContent='音乐未能连接，打开音乐设置可以重试。'};document.head.append(script)}
}
button.addEventListener('click',()=>{if(fallback){show(true);return}if(playing){manualPause=true;widget.pause()}else{manualPause=false;requestPlay();if(!ready)show(true)}});
details.addEventListener('click',()=>show(panel.hidden));
panel.querySelector('#lucky-close').addEventListener('click',()=>{show(false);details.focus()});
panel.querySelector('#lucky-fallback').addEventListener('click',()=>{if(widget&&ready)widget.pause();fallback=true;ready=false;widget=null;playing=false;manualPause=true;frame.src='https://audiomack.com/embed/jake-miller/song/lucky-me?autoplay=1';status.textContent='备用播放器需要点击播放，不支持自动循环。';update()});
function gesture(event){if(event.target.closest?.('#music-player,#lucky-panel'))return;if(!everPlayed&&!manualPause)requestPlay()}
document.addEventListener('pointerdown',gesture,{capture:true});document.addEventListener('keydown',gesture,{capture:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape')show(false)});
addEventListener('pagehide',()=>{disposed=true;if(ready&&widget)widget.pause();host.replaceChildren();frame=null;widget=null;ready=false;playing=false;update()});
addEventListener('pageshow',event=>{if(event.persisted&&!frame)load()});
update();load();
})();
