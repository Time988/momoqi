// Local audition tracks remain selectable; Lucky Me is the new default.
(()=>{
const tracks={
 'there-is-romance':{title:'There Is Romance',file:'there-is-romance.m4a'},
 reawakening:{title:'Reawakening',file:'reawakening.m4a'},
 reverie:{title:'Reverie',file:'reverie.m4a'}
};
const choice=new URLSearchParams(location.search).get('music');
if(tracks[choice]){const t=tracks[choice];window.SITE_CONTENT.music={enabled:true,file:'music-research/'+t.file,title:t.title,delayedPlayback:{enabled:false}};return}
window.SITE_CONTENT.music={enabled:false,file:'',title:'Lucky Me'};
window.LUCKY_MUSIC={variant:'vocal',file:'assets/music/lucky-me.m4a'};
})();
