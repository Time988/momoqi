/* Adapted from Zhenyu Qi's Love Letter, MIT license in ../../licenses/.
   Original tree growth and bloom phases are retained. */
window.skipTree = matchMedia("(prefers-reduced-motion: reduce)").matches;

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data?.type !== "read-letter") return;
  window.skipTree = true;
  document.documentElement.classList.add("skip-tree");
});

function notifyParent(type) {
  parent.postMessage({ type }, location.origin);
}

async function showLoveLetter() {
  const letter = document.getElementById("letter");
  document.documentElement.dataset.phase = "letter";
  notifyParent("tree-letter-visible");
  await typewriter(letter);
  document.getElementById("clock-box").classList.add("clock-box--visible");
  document.getElementById("clock-box").removeAttribute("aria-hidden");
  document.documentElement.dataset.phase = "complete";
  notifyParent("tree-letter-complete");
}

async function startApp() {
  initContent(CONFIG);
  const staticCanvas = initCanvas("static-canvas");
  const groundCanvas = initCanvas("ground-canvas");
  const dynamicCanvas = initCanvas("canvas");
  const tree = new Tree(
    staticCanvas, dynamicCanvas, groundCanvas,
    StageConfig.width, StageConfig.height, TreeShape, CONFIG
  );
  const { seed, footer } = tree;
  scaleContent();
  seed.draw();
  document.documentElement.dataset.phase = "seed";

  if (new URLSearchParams(location.search).has("autostart") || window.skipTree) await wait(400);
  else await waitForUserClick(seed, dynamicCanvas);

  document.documentElement.dataset.phase = "growing";
  await animateSeedShrink(seed);
  await animateSeedMove(seed, footer);
  await animateTreeGrow(tree);
  document.documentElement.dataset.phase = "blooming";
  await animateFlowerBloom(tree);
  tree.resetFallingBlooms();
  footer.draw();
  await animateTreeMove(staticCanvas);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) startHeartJumpAnimation(tree);
  await showLoveLetter();
}

document.addEventListener("DOMContentLoaded", startApp);
