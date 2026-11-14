/* Content and transition wiring for the combined, static personal gift. */
(() => {
  "use strict";

  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const openButton = document.getElementById("letter-open");
  const treeSection = document.getElementById("tree-letter");
  const treeFrame = document.getElementById("tree-frame");
  const treeLoading = document.getElementById("tree-loading");
  const readButton = document.getElementById("read-letter");
  const treeStatus = document.getElementById("tree-status");
  let frameReady = false;
  let readRequested = motionQuery.matches;

  function requestCompleteLetter() {
    readRequested = true;
    if (frameReady) treeFrame.contentWindow.postMessage({ type: "read-letter" }, location.origin);
    if (frameReady) treeFrame.scrollIntoView({ block: "center", behavior: motionQuery.matches ? "instant" : "smooth" });
  }

  openButton.addEventListener("click", () => {
    if (!treeSection.hidden) return;
    treeSection.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
    openButton.hidden = true;
    treeSection.closest(".letter-wrap").classList.add("is-expanded");
    treeLoading.hidden = false;
    treeFrame.hidden = false;
    treeFrame.src = treeFrame.dataset.src;
    document.dispatchEvent(new Event("open-tree-letter"));
    treeSection.scrollIntoView({ behavior: motionQuery.matches ? "instant" : "smooth" });
  });

  treeFrame.addEventListener("load", () => {
    if (!treeFrame.getAttribute("src")) return;
    frameReady = true;
    treeLoading.hidden = true;
    treeFrame.hidden = false;
    requestAnimationFrame(() => {
      treeFrame.scrollIntoView({ block: "center", behavior: motionQuery.matches ? "instant" : "smooth" });
    });
    if (readRequested) requestCompleteLetter();
  });

  readButton.addEventListener("click", requestCompleteLetter);

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== treeFrame.contentWindow) return;
    if (event.data?.type === "tree-letter-visible") {
      treeStatus.textContent = "佳佳，这封信是写给你的";
    }
    if (event.data?.type === "tree-letter-complete") {
      treeStatus.textContent = "还有很多个明天，想和你一起";
      readButton.hidden = true;
      document.getElementById("tree-finale-link").hidden = false;
    }
  });

  const galleryCards = document.querySelectorAll(".polaroid");
  galleryCards.forEach((card) => {
    const frame = card.querySelector(".photo-frame");
    const image = frame.querySelector("img");
    const link = document.createElement("a");
    link.href = image.getAttribute("src");
    link.dataset.lightbox = "";
    link.dataset.caption = card.querySelector(".photo-caption").textContent;
    frame.append(link);
    link.append(image);
  });

  const viewer = document.getElementById("photo-viewer");
  const viewerImage = document.getElementById("viewer-image");
  const viewerCaption = document.getElementById("viewer-caption");

  document.querySelectorAll("[data-lightbox]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !viewer.showModal) return;
      event.preventDefault();
      viewerImage.src = link.href;
      viewerImage.alt = link.querySelector("img")?.alt || link.dataset.caption || "我们的回忆";
      viewerCaption.textContent = link.dataset.caption;
      viewer.showModal();
    });
  });

  document.getElementById("viewer-close").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
})();
