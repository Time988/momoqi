// Load the original WebGL effect only when its last-page section approaches.
const stage = document.getElementById('flower-typer');
const observer = new IntersectionObserver(async ([entry]) => {
  if (!entry.isIntersecting) return;
  observer.disconnect();
  try { await import('./flower-typer.js'); }
  catch (error) {
    console.error('Flower Typer could not start', error);
    document.getElementById('flower-fallback').hidden = false;
    document.getElementById('flower-question').classList.add('is-visible');
    document.getElementById('replay-flowers').hidden = true;
  }
}, {rootMargin: '1200px'});
observer.observe(stage);
