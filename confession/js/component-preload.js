(()=>{
'use strict';
if(!('IntersectionObserver' in window)||navigator.connection?.saveData)return;
const groups=[['#letter',[document.querySelector('#tree-frame').dataset.src,'tree/styles.css','tree/config.js?v=copy-image-20261113-v5','tree/js/geometry.js','tree/js/animation.js','tree/js/tree.js','tree/js/ui.js','tree/js/main.js']],['#garden',['botanic/render-worker.js?v=interactive-7','botanic/vendor/nonflowers.js']]];
for(const [selector,files] of groups){const stage=document.querySelector(selector);if(!stage)continue;const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;observer.disconnect();for(const href of files){const link=document.createElement('link');link.rel='prefetch';link.href=href;link.as=href.endsWith('.css')?'style':href.includes('.js')?'script':'document';document.head.append(link)}},{rootMargin:'1200px'});observer.observe(stage)}
})();
