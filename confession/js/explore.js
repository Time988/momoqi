(()=>{
const audios=[...document.querySelectorAll('audio')];
const silentCheck=new URLSearchParams(location.search).has('silent-check');
audios.forEach(audio=>{audio.volume=silentCheck?0:.4;audio.muted=silentCheck;audio.dataset.silentCheck=String(silentCheck);audio.dataset.playing='false';audio.addEventListener('play',()=>{audio.dataset.playing='true';audios.forEach(other=>{if(other!==audio)other.pause()})});audio.addEventListener('pause',()=>{audio.dataset.playing='false'})});
const dialog=document.querySelector('#preview-dialog'),host=document.querySelector('#preview-host');
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
  audios.forEach(audio=>audio.pause());
  host.replaceChildren();const frame=document.createElement('iframe');frame.title=button.dataset.title;frame.src=button.dataset.preview;host.append(frame);document.querySelector('#preview-name').textContent=button.dataset.title;dialog.showModal();
}));
document.querySelector('#preview-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>host.replaceChildren());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){audios.forEach(audio=>audio.pause());if(dialog.open)dialog.close()}});
addEventListener('pagehide',()=>{audios.forEach(audio=>audio.pause());host.replaceChildren()});
})();
