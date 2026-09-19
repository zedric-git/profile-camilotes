// Background: contour-field grid of '+', ':', '.' glyphs
// Ported from refact0r.dev's compiled canvas animation (layered sine waves +
// value-noise domain warp drawn as a monospace character grid).
const canvas = document.getElementById('bg-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (canvas) {
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  const cfg = {
    maxPixelRatio: 2,
    grid: { cellWidth: 14, cellHeight: 18, fontSize: 12 },
    pattern: {
      primary: { xFrequency: 11, yFrequency: 2.4, amplitude: 1, speed: 1 },
      vertical: { frequency: 15, amplitude: 0.62, speed: -0.7 },
      diagonal: { frequency: 24, amplitude: 0.28, speed: 0.45 },
      warp: { scale: 4, strength: 0.4, detailScale: 2.8, detailStrength: 0.16, speed: 0.12 },
      contourFrequency: 2.6,
      threshold: 0.88,
      thresholdVariation: 0.1,
      visibilityOffset: 0.025,
      visibilityRange: 0.05,
    },
    frameInterval: { idle: 50, burst: 10 },
    driftSpeed: 1e-4,
    pointer: { initialX: 0.5, initialY: 0.48, easing: 0.12, radius: 0.3, strength: 0.6 },
    burst: { duration: 3100, width: 0.15, widthGrowth: 0.025, fadeStart: 0.78, fadeDuration: 0.22 },
    color: { hue: 220, saturation: 15, baseLightness: 50, burstLightness: 25, baseAlpha: 0.35, burstAlpha: 0.8 },
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const hash = (x, y) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = smooth(x - xi), yf = smooth(y - yi);
    const a = hash(xi, yi) * (1 - xf) + hash(xi + 1, yi) * xf;
    const b = hash(xi, yi + 1) * (1 - xf) + hash(xi + 1, yi + 1) * xf;
    return a * (1 - yf) + b * yf;
  };

  let dpr = 1;
  let pointer = { x: cfg.pointer.initialX, y: cfg.pointer.initialY };
  let pointerTarget = { ...pointer };
  let burst = null; // { x, y, startedAt }
  let rafId;
  let lastFrame = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, cfg.maxPixelRatio);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function onPointerMove(e) {
    pointerTarget.x = e.clientX / window.innerWidth;
    pointerTarget.y = e.clientY / window.innerHeight;
  }

  function triggerBurst(x = pointer.x, y = pointer.y) {
    if (reduceMotion.matches) return;
    burst = { x, y, startedAt: performance.now() };
  }

  function draw(time = 0) {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;

    const drift = reduceMotion.matches ? 0 : time * cfg.driftSpeed;
    const cellW = cfg.grid.cellWidth * dpr;
    const cellH = cfg.grid.cellHeight * dpr;
    const aspect = w / h;

    let burstRadius = 0, burstWidth = cfg.burst.width, burstFade = 1;
    if (burst) {
      const progress = (time - burst.startedAt) / cfg.burst.duration;
      burstRadius = Math.max(0, progress) * Math.sqrt(aspect * aspect + 1);
      burstWidth = cfg.burst.width + Math.max(0, progress) * cfg.burst.widthGrowth;
      burstFade = clamp01(1 - (progress - cfg.burst.fadeStart) / cfg.burst.fadeDuration);
      if (progress > 1) burst = null;
    }

    pointer.x += (pointerTarget.x - pointer.x) * cfg.pointer.easing;
    pointer.y += (pointerTarget.y - pointer.y) * cfg.pointer.easing;

    ctx.clearRect(0, 0, w, h);
    ctx.font = `${cfg.grid.fontSize * dpr}px "Space Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const { primary, vertical, diagonal, warp } = cfg.pattern;

    for (let py = cellH; py < h; py += cellH) {
      for (let px = cellW; px < w; px += cellW) {
        const col = Math.round(px / cellW);
        const row = Math.round(py / cellH);
        const u = px / w;
        const v = py / h;

        const dx = u - pointer.x;
        const dy = v - pointer.y;
        const pointerFalloff = clamp01(1 - Math.sqrt(dx * dx + dy * dy) / cfg.pointer.radius);
        const pointerBoost = pointerFalloff * pointerFalloff * cfg.pointer.strength;

        const wx = u * warp.scale * aspect + drift * warp.speed;
        const wy = v * warp.scale - drift * warp.speed * 0.7;
        const warpVal =
          (noise(wx, wy) - 0.5) * 2 * warp.strength +
          (noise(wx * warp.detailScale + 17, wy * warp.detailScale + 31) - 0.5) * 2 * warp.detailStrength;

        const n =
          primary.amplitude * Math.sin(u * primary.xFrequency + drift * primary.speed + v * primary.yFrequency) +
          vertical.amplitude * Math.sin(v * vertical.frequency + drift * vertical.speed) +
          diagonal.amplitude * Math.sin((u - v) * diagonal.frequency + drift * diagonal.speed) +
          warpVal + pointerBoost;

        const pat = Math.abs(Math.sin(n * cfg.pattern.contourFrequency));
        const cellHash = hash(col, row);

        let burstIntensity = 0;
        if (burst) {
          const bdx = (u - burst.x) * aspect;
          const bdy = v - burst.y;
          const dist = Math.sqrt(bdx * bdx + bdy * bdy);
          const wobble = n * 0.011 + Math.sin(u * 19 - v * 13) * 0.008;
          const ringDist = (dist + wobble - burstRadius) / burstWidth;
          burstIntensity =
            Math.exp(-ringDist * ringDist * 1.8) * burstFade *
            (0.16 + clamp01((pat - 0.62 - cellHash * 0.14) / 0.24) * 0.84);
        }

        const visibility = clamp01(
          (pat - (cfg.pattern.threshold + cellHash * cfg.pattern.thresholdVariation) + cfg.pattern.visibilityOffset) /
          cfg.pattern.visibilityRange
        );

        if (visibility < 0.01 && burstIntensity < 0.01) continue;

        const alpha =
          (cfg.color.baseAlpha + Math.max(0, pat - 0.9) * 0.8) * visibility + burstIntensity * cfg.color.burstAlpha;
        const burstAmt = clamp01(burstIntensity * 1.8);
        const lightness = cfg.color.baseLightness + burstAmt * cfg.color.burstLightness;

        ctx.fillStyle = `hsla(${cfg.color.hue}, ${cfg.color.saturation}%, ${lightness}%, ${alpha})`;
        ctx.fillText(cellHash > 0.9 ? '+' : cellHash > 0.62 ? ':' : '.', px, py);
      }
    }
  }

  function loop(time) {
    const interval = burst ? cfg.frameInterval.burst : cfg.frameInterval.idle;
    if (time - lastFrame > interval) {
      draw(time);
      lastFrame = time;
    }
    if (!reduceMotion.matches) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function start() {
    cancelAnimationFrame(rafId);
    resize();
    draw(performance.now());
    if (!reduceMotion.matches) {
      rafId = requestAnimationFrame(loop);
    }
  }

  let resizeTimeout;
  function scheduleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(start, 100);
  }

  window.addEventListener('resize', scheduleResize);
  window.addEventListener('orientationchange', scheduleResize);
  window.addEventListener('load', start);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') start();
  });

  // Redundant safety-net redraws: covers slow web-font loading (script
  // execution can be delayed until pending stylesheets finish), or any
  // browser that briefly reports a stale/zero layout size on first paint.
  [0, 50, 300, 1000].forEach((delay) => setTimeout(start, delay));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  }

  // ResizeObserver catches viewport/layout changes the 'resize' event can
  // miss or delay (dynamic mobile toolbars, scrollbar appearing/disappearing),
  // which is what caused the canvas to size itself too small until a scroll
  // happened to trigger a resize.
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleResize);
    ro.observe(document.documentElement);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('click', (e) => {
    triggerBurst(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
  });
  reduceMotion.addEventListener('change', start);

  start();
}

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Subtle reveal-on-scroll for each section
const sections = document.querySelectorAll('.section');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

sections.forEach((section) => observer.observe(section));

// Fallback: if IntersectionObserver isn't supported, just show everything
if (!('IntersectionObserver' in window)) {
  sections.forEach((section) => section.classList.add('is-visible'));
}
