/* Uses the MIT-licensed fireworks-js renderer by crashmax. */
(() => {
  const stage = document.getElementById('garden-stage');
  const container = document.getElementById('garden-fireworks');
  const button = document.getElementById('show-fireworks');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let show, timer;
  function stop() {
    clearTimeout(timer);
    show?.stop(true);
    container.classList.remove('is-playing');
    button.textContent = '放一场烟花';
    button.setAttribute('aria-pressed', 'false');
  }
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    if (show?.isRunning) { stop(); return; }
    if (!window.Fireworks?.default) return;
    show ||= new Fireworks.default(container, {
      autoresize: true, opacity: .32, acceleration: 1.035, friction: .965,
      gravity: 1.15, particles: 100, traceLength: 3, traceSpeed: 7,
      explosion: 3, intensity: motion.matches ? 3 : 12, flickering: 45,
      hue: {min: 5, max: 55}, rocketsPoint: {min: 15, max: 85},
      brightness: {min: 75, max: 95}, decay: {min: .012, max: .022},
      lineWidth: {explosion: {min: 1.1, max: 2.0}, trace: {min: 1, max: 1.5}},
      mouse: {click: false, move: false, max: 1}, sound: {enabled: false}
    });
    container.classList.add('is-playing');
    show.start();
    button.textContent = '让烟花歇一会';
    button.setAttribute('aria-pressed', 'true');
    timer = setTimeout(stop, motion.matches ? 5000 : 14000);
  });
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); }, {threshold: .05}).observe(stage);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})();
