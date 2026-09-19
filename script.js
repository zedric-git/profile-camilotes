// ---------------------------------------
// Intro loader: white screen with a scrolling status
// ticker (left), an organic stuttering percent counter (middle),
// and a scramble-typing message (right). At 100% it exits
// with a smooth feathered radial glyph ripple that reveals
// the dark page and seamlessly triggers the background canvas.
// ---------------------------------------
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const canvas = document.getElementById('loader-canvas');
  const percentEl = document.getElementById('loader-percent-num');
  const scrollListEl = document.getElementById('loader-scroll-list');
  const typeEl = document.getElementById('loader-type');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let loaderActive = true;

  function finish() {
    loaderActive = false;
    document.body.classList.remove('is-loading');
    if (loader.parentNode) {
      loader.remove();
    }
  }

  if (reduceMotion || !canvas) {
    finish();
    return;
  }

  const BG_COLOR = '#ffffff';
  const GLYPHS = ['+', ':', '.'];

  const LOAD_MS = 2200;
  const PAUSE_AT_100_MS = 450;
  const POST_DONE_SCROLL_MS = 850;
  const WAVE_MS = 1850;

  const SCROLL_LINES = [
    '// INITIALIZING PROFILE...',
    '// LOADING SKILLS.JSON...',
    '// COMPILING EXPERIENCE...',
    '// FETCHING PROJECTS...',
    '// PARSING RESUME.MD...',
    '// CONNECTING TO GITHUB...',
    '// RENDERING INTERFACE...',
    '// WARMING UP CACHE...',
    '// SYNCING TIMELINE...',
    '// BUILDING LAYOUT...',
    '// PREPARING CONTENT...',
    '// ALMOST THERE...',
  ];

  const TYPE_TEXT =
    '// HANG TIGHT \u2014 THE PROFILE IS COMPILING. IT MIGHT TAKE A MOMENT, BUT THE PAYLOAD IS WORTH THE WAIT.';
  const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#~%&';
  const SCRAMBLE_WINDOW = 12;

  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // --- Left column: smooth scrolling ticker with continuous optical highlight ---
  const repeatedLines = SCROLL_LINES.concat(SCROLL_LINES).concat(SCROLL_LINES);
  repeatedLines.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    scrollListEl.appendChild(li);
  });

  const scrollContainer = scrollListEl.parentElement;
  let singleSetHeight = 0;
  let scrollOffset = 0;
  let lastScrollTime = null;
  let activeLi = null;
  const SCROLL_SPEED = 28; // px/sec

  function updateTickerHeight() {
    singleSetHeight = scrollListEl.scrollHeight / 3;
  }
  updateTickerHeight();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateTickerHeight);
  }
  window.addEventListener('resize', updateTickerHeight, { passive: true });

  function updateActiveLine() {
    const containerRect = scrollContainer.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;
    let closest = null;
    let closestDist = Infinity;
    const lis = scrollListEl.children;
    for (let i = 0; i < lis.length; i++) {
      const li = lis[i];
      const r = li.getBoundingClientRect();
      if (r.bottom < containerRect.top - 20 || r.top > containerRect.bottom + 20) continue;
      const mid = r.top + r.height / 2;
      const d = Math.abs(mid - centerY);
      if (d < closestDist) {
        closestDist = d;
        closest = li;
      }
    }
    if (closest && closest !== activeLi) {
      if (activeLi) activeLi.classList.remove('is-active');
      closest.classList.add('is-active');
      activeLi = closest;
    }
  }

  function scrollFrame(now) {
    if (!loaderActive) return;
    if (lastScrollTime == null) lastScrollTime = now;
    const dt = (now - lastScrollTime) / 1000;
    lastScrollTime = now;
    scrollOffset += SCROLL_SPEED * dt;
    if (singleSetHeight && scrollOffset >= singleSetHeight) {
      scrollOffset -= singleSetHeight;
    }
    scrollListEl.style.transform = `translateY(${-scrollOffset}px)`;
    updateActiveLine();
    requestAnimationFrame(scrollFrame);
  }
  requestAnimationFrame(scrollFrame);

  // --- Middle: organic stuttering percent counter ---
  function buildStutterSteps() {
    const steps = [];
    let tAcc = 0;
    let pctAcc = 0;
    while (pctAcc < 100) {
      const remaining = 100 - pctAcc;
      const jump = Math.min(remaining, Math.max(1, Math.floor(Math.random() * 6) + 1));
      pctAcc += jump;
      const isHold = Math.random() < 0.2 && pctAcc < 95;
      const dt = isHold ? (0.04 + Math.random() * 0.07) : (0.015 + Math.random() * 0.035);
      tAcc += dt;
      steps.push({ t: tAcc, pct: pctAcc });
    }
    const maxT = steps[steps.length - 1].t;
    steps.forEach((s) => { s.t = s.t / maxT; });
    steps[steps.length - 1].t = 1;
    return steps;
  }
  const stutterSteps = buildStutterSteps();

  function tickType(p) {
    const total = TYPE_TEXT.length;
    const revealed = Math.floor(p * total);
    let out = '';
    for (let i = 0; i < total; i++) {
      if (i < revealed) {
        out += TYPE_TEXT[i];
      } else if (i < revealed + SCRAMBLE_WINDOW) {
        const ch = TYPE_TEXT[i];
        if (ch === ' ' || ch === '\u2014' || ch === '-' || ch === '.') {
          out += ch;
        } else {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      } else {
        break;
      }
    }
    typeEl.textContent = out;
  }

  const loadStart = performance.now();
  function loadFrame(now) {
    const p = Math.min(1, (now - loadStart) / LOAD_MS);

    let pct = 0;
    for (const s of stutterSteps) {
      if (p >= s.t) pct = s.pct; else break;
    }
    percentEl.textContent = pct < 100 ? String(pct).padStart(2, '0') : '100';

    tickType(p);

    if (p < 1) {
      requestAnimationFrame(loadFrame);
    } else {
      percentEl.textContent = '100';
      percentEl.parentElement.classList.add('is-complete');
      typeEl.textContent = TYPE_TEXT;

      // 1. Pause at 100%
      setTimeout(() => {
        // 2. Change 100% to (done)
        const signEl = percentEl.parentElement.querySelector('.loader-percent-sign');
        if (signEl) signEl.style.display = 'none';
        percentEl.textContent = 'done';
        percentEl.parentElement.classList.remove('is-complete');
        percentEl.parentElement.classList.add('is-done');

        // 3. Keep the left ticker scrolling smoothly for a bit more before exit
        setTimeout(startExit, POST_DONE_SCROLL_MS);
      }, PAUSE_AT_100_MS);
    }
  }
  requestAnimationFrame(loadFrame);

  // --- Exit: initiate the feathered glyph shockwave ripple ---
  function startExit() {
    loader.classList.add('is-exiting');
    runRipple();
  }

  function runRipple() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);
    loader.style.background = 'transparent';

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.hypot(cx, cy) * 1.08 + 36 * dpr;
    const cellW = 14 * dpr;
    const cellH = 18 * dpr;
    const bandWidth = cellW * 4.2;

    const waveStart = performance.now();
    let burstTriggered = false;

    function frame(now) {
      const t = Math.min(1, (now - waveStart) / WAVE_MS);
      // Smooth physical ease-out expansion
      const p = 1 - Math.pow(1 - t, 3.2);
      const baseR = p * maxR;

      if (t >= 0.05 && !burstTriggered) {
        burstTriggered = true;
        if (typeof window.__triggerBgBurst === 'function') {
          window.__triggerBgBurst(0.5, 0.5);
        }
      }

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // 1. Draw solid background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

      // 2. Feathered radial erase (anti-aliased circular aperture)
      ctx.globalCompositeOperation = 'destination-out';
      const feather = Math.max(24 * dpr, cellW * 3);
      const innerR = Math.max(0, baseR - feather);
      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, baseR);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();

      // 3. Render high-contrast rattling glyph shockwave along aperture
      ctx.save();
      ctx.font = `bold ${13 * dpr}px "Space Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const echo1Dist = baseR - bandWidth * 1.8;
      const echo2Dist = baseR - bandWidth * 3.6;

      const minCol = Math.max(0, Math.floor((cx - baseR - bandWidth * 2.5) / cellW));
      const maxCol = Math.min(Math.ceil(w / cellW), Math.ceil((cx + baseR + bandWidth * 2.5) / cellW));
      const minRow = Math.max(0, Math.floor((cy - baseR - bandWidth * 2.5) / cellH));
      const maxRow = Math.min(Math.ceil(h / cellH), Math.ceil((cy + baseR + bandWidth * 2.5) / cellH));

      for (let row = minRow; row <= maxRow; row++) {
        const baseY = row * cellH + cellH / 2;
        for (let col = minCol; col <= maxCol; col++) {
          const baseX = col * cellW + cellW / 2;
          const dx = baseX - cx;
          const dy = baseY - cy;
          const dist = Math.hypot(dx, dy);

          // Radial boundary wobble / organic ripple rattle
          const angle = Math.atan2(dy, dx);
          const wobble = Math.sin(angle * 7 + now * 0.018) * (3.5 * dpr) +
                         Math.cos(angle * 13 - now * 0.024) * (2 * dpr);
          const effectiveR = baseR + wobble;

          // Primary shockwave ring
          const crestDist = Math.abs(dist - effectiveR);
          if (crestDist < bandWidth) {
            const norm = 1 - (crestDist / bandWidth);
            const alpha = Math.sin(norm * Math.PI * 0.5) * (1 - t * 0.18);
            if (alpha > 0.02) {
              // High-frequency character cycling for matrix rattle effect
              const charCycle = Math.floor(now * 0.035 + row * 7 + col * 13);
              const glyph = GLYPHS[charCycle % GLYPHS.length];

              // Positional jitter / rattle vibration
              const rattleAmt = Math.sin(norm * Math.PI) * (2.8 * dpr);
              const jx = Math.sin(now * 0.08 + row * 19 + col * 31) * rattleAmt;
              const jy = Math.cos(now * 0.08 + row * 23 + col * 17) * rattleAmt;

              if (dist >= effectiveR) {
                // Leading shockwave front - vivid contrast with cyber cyan / deep ink
                ctx.fillStyle = `rgba(14, 184, 217, ${alpha * 0.95})`;
              } else {
                ctx.fillStyle = `rgba(18, 20, 22, ${alpha * 0.9})`;
              }
              ctx.fillText(glyph, baseX + jx, baseY + jy);
            }
          }

          // Echo ring 1
          if (echo1Dist > 0) {
            const e1Dist = Math.abs(dist - echo1Dist);
            if (e1Dist < bandWidth * 0.85) {
              const norm = 1 - (e1Dist / (bandWidth * 0.85));
              const alpha = norm * norm * 0.55 * (1 - t * 0.28);
              if (alpha > 0.02) {
                const charCycle = Math.floor(now * 0.025 + row * 5 + col * 11);
                const glyph = GLYPHS[(charCycle + 1) % GLYPHS.length];
                const jx = Math.sin(now * 0.06 + row * 11) * (1.5 * dpr) * norm;
                const jy = Math.cos(now * 0.06 + col * 13) * (1.5 * dpr) * norm;
                ctx.fillStyle = `rgba(99, 99, 238, ${alpha})`;
                ctx.fillText(glyph, baseX + jx, baseY + jy);
              }
            }
          }

          // Echo ring 2
          if (echo2Dist > 0) {
            const e2Dist = Math.abs(dist - echo2Dist);
            if (e2Dist < bandWidth * 0.65) {
              const norm = 1 - (e2Dist / (bandWidth * 0.65));
              const alpha = norm * norm * 0.38 * (1 - t * 0.45);
              if (alpha > 0.02) {
                const charCycle = Math.floor(now * 0.02 + row * 3 + col * 7);
                const glyph = GLYPHS[(charCycle + 2) % GLYPHS.length];
                ctx.fillStyle = `rgba(189, 99, 238, ${alpha})`;
                ctx.fillText(glyph, baseX, baseY);
              }
            }
          }
        }
      }
      ctx.restore();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        finish();
      }
    }
    requestAnimationFrame(frame);
  }
})();

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
  window.__triggerBgBurst = triggerBurst;

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
