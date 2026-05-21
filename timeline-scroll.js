/**
 * 飞行时序 · 滚动驱动横向展开动画
 */
(function () {
  const stage = document.getElementById("timeline-scroll-stage");
  const expand = document.getElementById("timeline-expand");
  const scrollBar = document.getElementById("axis-scroll-progress");
  const hint = document.getElementById("timeline-scroll-hint");

  if (!stage || !expand) return;

  let scrollProgress = 0;
  let rafPending = false;

  function getOrderedNodes() {
    return [...document.querySelectorAll(".event-node")].sort(
      (a, b) => Number(a.dataset.scrollIndex || 0) - Number(b.dataset.scrollIndex || 0)
    );
  }

  function calcScrollProgress() {
    const rect = stage.getBoundingClientRect();
    const vh = window.innerHeight;
    const stageH = stage.offsetHeight;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    const phone = window.matchMedia("(max-width: 480px)").matches;
    const startOffset = vh * (phone ? 0.06 : narrow ? 0.08 : 0.12);
    const viewportFactor = phone ? 0.58 : narrow ? 0.52 : 0.45;
    const scrollable = Math.max(stageH - vh * viewportFactor, 1);
    const traveled = startOffset - rect.top;
    return Math.min(1, Math.max(0, traveled / scrollable));
  }

  function applyScrollAnimation(p) {
    scrollProgress = p;
    stage.dataset.progress = p.toFixed(3);

    const expandScale = 0.03 + p * 0.97;
    expand.style.transform = `scaleX(${expandScale})`;

    if (scrollBar) {
      const revealDone = p >= 0.98;
      if (revealDone) {
        scrollBar.style.width = "0%";
        scrollBar.style.opacity = "0";
      } else {
        scrollBar.style.width = `${p * 100}%`;
        scrollBar.style.opacity = String(Math.min(1, 0.35 + p * 0.65));
      }
    }

    if (hint) {
      hint.style.opacity = String(Math.max(0, 1 - p * 2.5));
    }

    const nodes = getOrderedNodes();
    const count = nodes.length || 1;

    nodes.forEach((node, i) => {
      const threshold = ((i + 1) / count) * 0.88;
      const revealed = p >= threshold - 0.02;
      node.classList.toggle("node-revealed", revealed);
      const slide = revealed ? 0 : -32;
      const op = revealed ? 1 : 0;
      node.style.opacity = String(op);
      node.style.transform = `translate(calc(-50% + ${slide}px), 0)`;
    });

    const liftoff = document.querySelector(".liftoff-marker");
    if (liftoff) {
      const liftoffPct = 43.26;
      const show = p > liftoffPct / 100 - 0.05;
      liftoff.style.opacity = show ? "1" : String(Math.max(0, (p - 0.35) * 2));
    }

    stage.classList.toggle("timeline-revealed", p >= 0.98);
  }

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      applyScrollAnimation(calcScrollProgress());
      rafPending = false;
    });
  }

  window.getTimelineScrollProgress = () => scrollProgress;

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  applyScrollAnimation(calcScrollProgress());

  window.refreshTimelineScroll = () => {
    applyScrollAnimation(scrollProgress);
  };
})();
