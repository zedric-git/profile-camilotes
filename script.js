// ---------------------------------------
// Homepage Scroll-Driven Scratch Engine & Scramble Controller
// Synchronized with radial ripple transition & sticky scroll
// ---------------------------------------
window.__homepageTypewriterStarted = false;
window.__startHomepageTypewriter = function () {
  if (window.__homepageTypewriterStarted) return;
  window.__homepageTypewriterStarted = true;

  initScratchEngine();
};

// ---------------------------------------
// Scratch Card Canvas & Scroll Engine
// ---------------------------------------
function initScratchEngine() {
  const trackEl = document.getElementById('scratch-hero-track');
  const canvas = document.getElementById('scratch-canvas');
  const arrowWrap = document.getElementById('scratch-arrow-wrap');
  const taglineUnit = document.getElementById('tagline-unit');
  const statusText = document.getElementById('scratch-status-text');
  const statusDot = document.getElementById('status-dot');
  const cardFrame = document.querySelector('.scratch-card-frame');
  const cardWrapper = document.getElementById('scratch-card-wrapper');

  const line1El = document.getElementById('line-1');
  const line2El = document.getElementById('line-2');
  const line3El = document.getElementById('line-3');

  if (!canvas || !trackEl) return;

  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cardW = 0, cardH = 0;

  // Offscreen canvas for scratch foil state
  let foilCanvas = document.createElement('canvas');
  let foilCtx = foilCanvas.getContext('2d');

  // Generated organic scratch paths
  let scratchStrokes = [];

  function generateScratchStrokes(w, h) {
    const strokes = [];
    const totalStrokes = 160;

    for (let i = 0; i < totalStrokes; i++) {
      // Threshold starts at 0.02 so NO strokes appear at p = 0 before scrolling
      const threshold = 0.02 + (i / totalStrokes) * 0.90;
      
      const angle = (Math.random() - 0.5) * Math.PI * 0.8;
      const startX = Math.random() * w;
      const startY = Math.random() * h;
      const length = 40 + Math.random() * 120;
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      const r = 18 + Math.random() * 26;

      strokes.push({
        threshold,
        startX,
        startY,
        endX,
        endY,
        r
      });
    }

    for (let i = 0; i < 40; i++) {
      strokes.push({
        threshold: 0.75 + (i / 40) * 0.18,
        startX: Math.random() * w,
        startY: Math.random() * h,
        endX: Math.random() * w,
        endY: Math.random() * h,
        r: 35 + Math.random() * 30
      });
    }

    return strokes.sort((a, b) => a.threshold - b.threshold);
  }

  function renderSilverFoil(w, h) {
    foilCanvas.width = Math.round(w * dpr);
    foilCanvas.height = Math.round(h * dpr);
    foilCtx.scale(dpr, dpr);

    // 1. Brushed Silver Metallic Gradient
    const grad = foilCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.25, '#cbd5e1');
    grad.addColorStop(0.5, '#64748b');
    grad.addColorStop(0.75, '#94a3b8');
    grad.addColorStop(1, '#e2e8f0');

    foilCtx.fillStyle = grad;
    foilCtx.fillRect(0, 0, w, h);

    // 2. Fine Metallic Brushed Noise Lines
    foilCtx.save();
    foilCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    foilCtx.lineWidth = 1;
    for (let i = 0; i < h; i += 2.5) {
      foilCtx.beginPath();
      foilCtx.moveTo(0, i + (Math.random() - 0.5) * 2);
      foilCtx.lineTo(w, i + (Math.random() - 0.5) * 2);
      foilCtx.stroke();
    }
    foilCtx.restore();

    // 3. Foil Border & SCRATCH & WIN Watermark
    foilCtx.save();
    foilCtx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    foilCtx.lineWidth = 3;
    foilCtx.strokeRect(14, 14, w - 28, h - 28);

    foilCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    foilCtx.lineWidth = 1.5;
    foilCtx.strokeRect(18, 18, w - 36, h - 36);

    const centerX = w / 2;
    const centerY = h / 2;

    // Top decorative stars line
    foilCtx.font = `600 ${Math.max(10, Math.round(w * 0.032))}px "JetBrains Mono", monospace`;
    foilCtx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    foilCtx.textAlign = 'center';
    foilCtx.textBaseline = 'middle';
    foilCtx.fillText('✦  ✦  ✦', centerX, centerY - 28);

    // Main SCRATCH & WIN text
    const fontSize = Math.max(22, Math.round(w * 0.076));
    foilCtx.font = `800 ${fontSize}px "JetBrains Mono", monospace`;

    // White foil 3D highlight offset
    foilCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    foilCtx.fillText('SCRATCH & WIN', centerX + 1.5, centerY + 1.5);

    // Dark metallic foil primary text
    foilCtx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    foilCtx.fillText('SCRATCH & WIN', centerX, centerY);

    // Bottom decorative line
    foilCtx.font = `600 ${Math.max(10, Math.round(w * 0.032))}px "JetBrains Mono", monospace`;
    foilCtx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    foilCtx.fillText('✦  ✦  ✦', centerX, centerY + 28);

    foilCtx.restore();
  }

  function resizeCard() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cardW = rect.width;
    cardH = rect.height;

    canvas.width = Math.round(cardW * dpr);
    canvas.height = Math.round(cardH * dpr);

    renderSilverFoil(cardW, cardH);
    scratchStrokes = generateScratchStrokes(cardW, cardH);
    updateFoilDisplay(currentProgress);
  }

  window.addEventListener('resize', resizeCard, { passive: true });
  setTimeout(resizeCard, 50);

  // --- Scroll Progress & Lerp Controller ---
  let rawProgress = 0;
  let currentProgress = 0;

  function updateScrollProgress() {
    const rect = trackEl.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const totalScrollable = rect.height - viewportH;

    if (totalScrollable <= 0) {
      rawProgress = 0;
    } else {
      const scrolled = -rect.top;
      rawProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
    }
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // --- Deterministic & Stable Scramble Engine ---
  const GLYPH_CHARS = '!<>-_/[]{}*^?#~+:%$=';

  function getSeededGlyph(index, progressSeed) {
    const hash = Math.floor(Math.abs(Math.sin(index * 12.9898 + progressSeed * 78.233) * 43758.5453));
    return GLYPH_CHARS[hash % GLYPH_CHARS.length];
  }

  function scrambleString(initialText, finalText, p) {
    if (p <= 0.02) return initialText;
    if (p >= 0.94) return finalText;

    const revealFrac = Math.max(0, Math.min(1, (p - 0.04) / 0.88));
    const revealCount = Math.floor(revealFrac * finalText.length);
    const seed = Math.floor(p * 160);

    let out = '';
    for (let i = 0; i < finalText.length; i++) {
      if (i < revealCount) {
        out += finalText[i];
      } else if (i === revealCount) {
        const ch = finalText[i];
        if (ch === ' ' || ch === '.') out += ch;
        else out += getSeededGlyph(i, seed);
      } else {
        if (i < initialText.length && p < 0.45) {
          out += initialText[i];
        } else {
          const ch = finalText[i];
          if (ch === ' ' || ch === '.') out += ch;
          else out += getSeededGlyph(i, Math.floor(p * 25));
        }
      }
    }
    return out;
  }

  // --- Smooth Glitch & Scroll-Driven Role Engine (Developer -> Designer -> Dreamer) ---
  const W_DEV = { text: 'developer.', cssClass: 'role-developer' };
  const W_DES = { text: 'designer.', cssClass: 'role-designer' };
  const W_DRE = { text: 'dreamer.', cssClass: 'role-dreamer' };

  function smoothGlitchBetweenWords(fromWord, toWord, t, progressSeed) {
    if (t <= 0) return fromWord;
    if (t >= 1) return toWord;

    const seed = Math.floor(t * 140 + progressSeed * 80);

    if (t < 0.5) {
      // Phase 1: Dematerialize fromWord into matrix glyphs from right to left
      const normT = t / 0.5;
      const glitchCount = Math.floor(normT * fromWord.length);
      const intactCount = fromWord.length - glitchCount;

      let out = '';
      for (let i = 0; i < fromWord.length; i++) {
        if (i < intactCount) {
          out += fromWord[i];
        } else {
          const ch = fromWord[i];
          if (ch === ' ' || ch === '.') out += ch;
          else out += getSeededGlyph(i, seed + i);
        }
      }
      return out;
    } else {
      // Phase 2: Rematerialize matrix glyphs into toWord from left to right
      const normT = (t - 0.5) / 0.5;
      const settledCount = Math.floor(normT * toWord.length);

      let out = '';
      for (let i = 0; i < toWord.length; i++) {
        if (i < settledCount) {
          out += toWord[i];
        } else {
          const ch = toWord[i];
          if (ch === ' ' || ch === '.') out += ch;
          else out += getSeededGlyph(i, seed + i * 7);
        }
      }
      return out;
    }
  }

  function getTypewriterRoleState(p) {
    if (p <= 0.40) {
      return { text: W_DEV.text, cssClass: W_DEV.cssClass };
    } else if (p <= 0.62) {
      // Smooth 2-phase glitch transition developer. -> designer.
      const t = (p - 0.40) / (0.62 - 0.40);
      const text = smoothGlitchBetweenWords(W_DEV.text, W_DES.text, t, p);
      const cssClass = t >= 0.5 ? W_DES.cssClass : W_DEV.cssClass;
      return { text, cssClass };
    } else if (p <= 0.76) {
      return { text: W_DES.text, cssClass: W_DES.cssClass };
    } else if (p <= 0.95) {
      // Smooth 2-phase glitch transition designer. -> dreamer.
      const t = (p - 0.76) / (0.95 - 0.76);
      const text = smoothGlitchBetweenWords(W_DES.text, W_DRE.text, t, p);
      const cssClass = t >= 0.5 ? W_DRE.cssClass : W_DES.cssClass;
      return { text, cssClass };
    } else {
      return { text: W_DRE.text, cssClass: W_DRE.cssClass };
    }
  }

  function renderTextScramble(p) {
    if (!line1El || !line2El || !line3El) return;

    const pScratch = Math.min(1, p / 0.20);

    // 1st Line: SCROLL TO -> Hi, I am zedric
    line1El.textContent = scrambleString("SCROLL TO", "Hi, I am zedric", pScratch);

    // 2nd Line: SCRATCH THE -> camilotes. a
    line2El.textContent = scrambleString("SCRATCH THE", "camilotes. a", pScratch);

    // 3rd Line: CARD -> developer. (with JetBrains Mono Dark Blue emphasis styling during scratch reveal)
    if (p < 0.20) {
      const midScratchWord = scrambleString("CARD", "developer.", pScratch);
      line3El.innerHTML = `<span class="role-word role-developer">${midScratchWord}</span>`;
    } else {
      const state = getTypewriterRoleState(p);
      const textToRender = state.text || '&nbsp;';
      line3El.innerHTML = `<span class="role-word ${state.cssClass}">${textToRender}</span>`;
    }
  }

  function updateFoilDisplay(p) {
    if (!cardW || !cardH) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (p >= 0.96) {
      ctx.restore();
      return;
    }

    ctx.drawImage(foilCanvas, 0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < scratchStrokes.length; i++) {
      const s = scratchStrokes[i];
      if (p >= s.threshold) {
        ctx.beginPath();
        ctx.lineWidth = s.r * dpr;
        ctx.moveTo(s.startX * dpr, s.startY * dpr);
        ctx.lineTo(s.endX * dpr, s.endY * dpr);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // --- 3D Physical Card Movement State ---
  let cardTiltX = 0;
  let cardTiltY = 0;
  let cardTiltZ = 0;
  let cardTransY = 0;
  let cardScale = 1;
  let cardDockFactor = 0;

  // --- Animation Loop ---
  function tick() {
    const scrollVelocity = (rawProgress - currentProgress);
    currentProgress += scrollVelocity * 0.12;

    if (Math.abs(rawProgress - currentProgress) < 0.0005) {
      currentProgress = rawProgress;
    }

    const pScratch = Math.min(1, currentProgress / 0.20);

    // 1. Update Scratch Foil (card fully clean by p = 0.20)
    updateFoilDisplay(pScratch);

    // 2. Update Left Text Scramble & Scroll-driven Typewriter
    renderTextScramble(currentProgress);

    // 3. Left-to-Right Arrow Fade Out & Left-to-Right Tagline Fade In
    const pArrow = Math.max(0, Math.min(1, (currentProgress - 0.10) / 0.18));
    if (arrowWrap) {
      if (pArrow >= 1) {
        arrowWrap.style.display = 'none';
      } else {
        arrowWrap.style.display = 'flex';
        const tStart = (pArrow * 130 - 15).toFixed(1);
        const tEnd = (pArrow * 130 + 15).toFixed(1);
        const arrowMask = `linear-gradient(to right, transparent ${tStart}%, #000 ${tEnd}%)`;
        arrowWrap.style.webkitMaskImage = arrowMask;
        arrowWrap.style.maskImage = arrowMask;
        arrowWrap.style.transform = `translateX(${(pArrow * 24).toFixed(1)}px)`;
      }
    }

    const pTagline = Math.max(0, Math.min(1, (currentProgress - 0.20) / 0.15));
    if (taglineUnit) {
      if (pTagline <= 0) {
        taglineUnit.style.display = 'none';
      } else {
        taglineUnit.style.display = 'flex';
        const tStart = (pTagline * 130 - 15).toFixed(1);
        const tEnd = (pTagline * 130 + 15).toFixed(1);
        const taglineMask = `linear-gradient(to right, #000 ${tStart}%, transparent ${tEnd}%)`;
        taglineUnit.style.webkitMaskImage = taglineMask;
        taglineUnit.style.maskImage = taglineMask;
      }
    }

    // 4. Update Status Pill
    if (statusText) {
      const pct = Math.min(100, Math.round(pScratch * 100));
      if (pct >= 95) {
        statusText.textContent = 'CARD FULLY REVEALED';
        if (statusDot) statusDot.classList.add('is-revealed');
      } else {
        statusText.textContent = `CARD ${pct}% SCRATCHED`;
        if (statusDot) statusDot.classList.remove('is-revealed');
      }
    }

    // 5. Dynamic 3D Card Physics & Scroll-Driven Docking into About Me
    const aboutCardDock = document.getElementById('about-card-dock');
    const heroRightCol = document.querySelector('.hero-right-col');
    const rawAboutDockProg = aboutSection ? Math.max(0, Math.min(1, (window.innerHeight - aboutSection.getBoundingClientRect().top) / (window.innerHeight * 0.65))) : 0;
    
    cardDockFactor += (rawAboutDockProg - cardDockFactor) * 0.12;
    if (Math.abs(rawAboutDockProg - cardDockFactor) < 0.0005) {
      cardDockFactor = rawAboutDockProg;
    }

    if (cardWrapper) {
      const targetBaseY = (currentProgress - 0.5) * 16;
      const targetBaseX = Math.sin(currentProgress * Math.PI) * -8;

      const targetVelX = -scrollVelocity * 160;
      const targetVelY = scrollVelocity * 130;
      const targetVelZ = scrollVelocity * 50;
      const targetTransY = scrollVelocity * 80;
      const targetScale = 1 + Math.min(0.06, Math.abs(scrollVelocity) * 1.8);

      cardTiltX += (targetBaseX + targetVelX - cardTiltX) * 0.1;
      cardTiltY += (targetBaseY + targetVelY - cardTiltY) * 0.1;
      cardTiltZ += (targetVelZ - cardTiltZ) * 0.1;
      cardTransY += (targetTransY - cardTransY) * 0.1;
      cardScale += (targetScale - cardScale) * 0.1;

      if (cardDockFactor > 0.001 && aboutCardDock && heroRightCol) {
        const heroRect = heroRightCol.getBoundingClientRect();
        const dockRect = aboutCardDock.getBoundingClientRect();

        const deltaX = dockRect.left + (dockRect.width - heroRect.width) / 2 - heroRect.left;
        const deltaY = dockRect.top + (dockRect.height - heroRect.height) / 2 - heroRect.top;
        const dockScaleTarget = (dockRect.width || 240) / (heroRect.width || 410);

        const currentX = deltaX * cardDockFactor;
        const currentY = cardTransY * (1 - cardDockFactor) + deltaY * cardDockFactor;
        const currentScale = cardScale * (1 - cardDockFactor) + (dockScaleTarget || 0.58) * cardDockFactor;
        const currentTiltX = cardTiltX * (1 - cardDockFactor * 0.5);
        const currentTiltY = cardTiltY * (1 - cardDockFactor * 0.5);
        const currentTiltZ = cardTiltZ * (1 - cardDockFactor * 0.5);

        cardWrapper.style.transform = `perspective(1200px) translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg) rotateZ(${currentTiltZ.toFixed(2)}deg) scale(${currentScale.toFixed(3)})`;
      } else {
        cardWrapper.style.transform = `perspective(1200px) translateY(${cardTransY.toFixed(2)}px) rotateX(${cardTiltX.toFixed(2)}deg) rotateY(${cardTiltY.toFixed(2)}deg) rotateZ(${cardTiltZ.toFixed(2)}deg) scale(${cardScale.toFixed(3)})`;
      }

      const shineOverlay = cardFrame ? cardFrame.querySelector('.scratch-shine-overlay') : null;
      if (shineOverlay) {
        const shineAngle = 135 + cardTiltY * 1.8;
        const opacity = 0.14 + Math.min(0.2, Math.abs(scrollVelocity) * 2.5);
        shineOverlay.style.background = `linear-gradient(${shineAngle}deg, rgba(255, 255, 255, ${opacity}) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.08) 100%)`;
      }

      // Smooth Dynamic Shadow Interpolation (Prominent 3D Elevation Shadow on Light Background)
      if (cardFrame) {
        const darkShadowAlpha = (0.35 * (1 - cardDockFactor)).toFixed(2);
        const lightShadowAlpha = (0.16 * cardDockFactor).toFixed(2);
        const borderAlpha = (0.2 * (1 - cardDockFactor) + 0.45 * cardDockFactor).toFixed(2);

        cardFrame.style.boxShadow = `0 ${Math.round(16 - 2 * cardDockFactor)}px ${Math.round(45 - 10 * cardDockFactor)}px rgba(15, 23, 42, ${darkShadowAlpha}), 0 ${Math.round(8 + 10 * cardDockFactor)}px ${Math.round(20 + 20 * cardDockFactor)}px rgba(15, 23, 42, ${lightShadowAlpha})`;
        cardFrame.style.borderColor = `rgba(148, 163, 184, ${borderAlpha})`;
      }
    }

    // 6. Update About Me Section Scroll & Pastel Wave Reveal
    updateAboutScroll();

    // 7. Update Technical Skills Horizontal Scroll & Floating IDE Parallax
    updateSkillsScroll();

    requestAnimationFrame(tick);
  }

  // --- Technical Skills Horizontal Scroll & Floating IDE Parallax Engine ---
  const skillsTrackEl = document.getElementById('skills-scroll-track');
  const skillsHorizontalTrack = document.getElementById('skills-horizontal-track');
  const ideFloats = document.querySelectorAll('.ide-code-float');
  let currentSkillsProg = 0;

  const TARGET_SKILLS_TITLE = "TECHNICAL SKILLS & TOOLSTACK";
  const skillsTitleEl = document.getElementById('skills-typed-title');

  function updateSkillsScroll() {
    if (!skillsTrackEl || !skillsHorizontalTrack) return;
    const rect = skillsTrackEl.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const totalScrollable = rect.height - viewportH;

    let rawProg = 0;
    if (totalScrollable > 0) {
      const scrolled = -rect.top;
      rawProg = Math.max(0, Math.min(1, scrolled / totalScrollable));
    }

    currentSkillsProg += (rawProg - currentSkillsProg) * 0.12;
    if (Math.abs(rawProg - currentSkillsProg) < 0.0005) {
      currentSkillsProg = rawProg;
    }

    // Scroll-driven Typewriter Transition for Header
    if (skillsTitleEl) {
      const typeProg = Math.max(0, Math.min(1, currentSkillsProg / 0.18));
      const revealCount = Math.floor(typeProg * TARGET_SKILLS_TITLE.length);
      skillsTitleEl.textContent = TARGET_SKILLS_TITLE.substring(0, revealCount);
    }

    const trackWidth = skillsHorizontalTrack.scrollWidth;
    const viewportWidth = window.innerWidth;
    const maxTranslateX = trackWidth - viewportWidth + (viewportWidth * 0.12);

    const currentX = -currentSkillsProg * Math.max(0, maxTranslateX);
    skillsHorizontalTrack.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;

    if (ideFloats.length > 0) {
      ideFloats.forEach((floatEl) => {
        const factor = parseFloat(floatEl.getAttribute('data-parallax') || '0.2');
        const parallaxX = (currentSkillsProg - 0.5) * factor * 140;
        const parallaxY = Math.sin(currentSkillsProg * Math.PI * 2 + factor * 8) * 6;
        floatEl.style.transform = `translate3d(${parallaxX.toFixed(2)}px, ${parallaxY.toFixed(2)}px, 0)`;
      });
    }
  }

  // --- About Me Section Scroll & Pastel Wave Controller ---
  const aboutSection = document.getElementById('about-section');
  const aboutWaveMask = document.getElementById('about-wave-mask');
  let hasTriggeredAboutWave = false;
  let currentPastelFactor = 0;

  function updateAboutScroll() {
    if (!aboutSection) return;
    const rect = aboutSection.getBoundingClientRect();
    const viewportH = window.innerHeight;

    // Calculate how far aboutSection has scrolled into viewport (0 to 1)
    const rawAboutProg = Math.max(0, Math.min(1, (viewportH - rect.top) / (viewportH * 0.75)));

    currentPastelFactor += (rawAboutProg - currentPastelFactor) * 0.12;
    if (Math.abs(rawAboutProg - currentPastelFactor) < 0.001) {
      currentPastelFactor = rawAboutProg;
    }
    window.__pastelFactor = currentPastelFactor;

    if (currentPastelFactor > 0.45) {
      document.body.classList.add('is-pastel-active');
    } else {
      document.body.classList.remove('is-pastel-active');
    }

    // Trigger white wave burst ONCE as crossing into About Me section
    if (rawAboutProg > 0.08 && !hasTriggeredAboutWave) {
      hasTriggeredAboutWave = true;
      if (typeof window.__triggerBgBurst === 'function') {
        window.__triggerBgBurst(0.5, 0.4);
      }
    } else if (rawAboutProg <= 0.02) {
      hasTriggeredAboutWave = false;
    }

    if (aboutWaveMask) {
      const maskVal = Math.max(0, Math.min(1, (viewportH - rect.top - 40) / (viewportH * 0.55)));
      aboutWaveMask.style.setProperty('--wave-progress', maskVal.toFixed(3));
      aboutWaveMask.style.setProperty('--wave-opacity', Math.min(1, maskVal * 2).toFixed(3));
    }
  }

  requestAnimationFrame(tick);
}


// ---------------------------------------
// Intro loader (Preserved exact colors and animations)
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
    if (typeof window.__startHomepageTypewriter === 'function' && !window.__homepageTypewriterStarted) {
      window.__startHomepageTypewriter();
    }
  }

  if (reduceMotion || !canvas) {
    finish();
    if (typeof window.__startHomepageTypewriter === 'function') {
      window.__startHomepageTypewriter();
    }
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

  // --- Left column: smooth scrolling ticker ---
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

        // 3. Exit loader
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
      const p = 1 - Math.pow(1 - t, 3.2);
      const baseR = p * maxR;

      if (t >= 0.05 && !burstTriggered) {
        burstTriggered = true;
        if (typeof window.__triggerBgBurst === 'function') {
          window.__triggerBgBurst(0.5, 0.5);
        }
        if (typeof window.__startHomepageTypewriter === 'function') {
          window.__startHomepageTypewriter();
        }
      }

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

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

      ctx.save();
      ctx.font = `bold ${13 * dpr}px "JetBrains Mono", monospace`;
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

          const angle = Math.atan2(dy, dx);
          const wobble = Math.sin(angle * 7 + now * 0.018) * (3.5 * dpr) +
                         Math.cos(angle * 13 - now * 0.024) * (2 * dpr);
          const effectiveR = baseR + wobble;

          const crestDist = Math.abs(dist - effectiveR);
          if (crestDist < bandWidth) {
            const norm = 1 - (crestDist / bandWidth);
            const alpha = Math.sin(norm * Math.PI * 0.5) * (1 - t * 0.18);
            if (alpha > 0.02) {
              const charCycle = Math.floor(now * 0.035 + row * 7 + col * 13);
              const glyph = GLYPHS[charCycle % GLYPHS.length];

              const rattleAmt = Math.sin(norm * Math.PI) * (2.8 * dpr);
              const jx = Math.sin(now * 0.08 + row * 19 + col * 31) * rattleAmt;
              const jy = Math.cos(now * 0.08 + row * 23 + col * 17) * rattleAmt;

              if (dist >= effectiveR) {
                ctx.fillStyle = `rgba(0, 210, 255, ${alpha * 0.95})`;
              } else {
                ctx.fillStyle = `rgba(13, 15, 18, ${alpha * 0.9})`;
              }
              ctx.fillText(glyph, baseX + jx, baseY + jy);
            }
          }

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
                ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
                ctx.fillText(glyph, baseX + jx, baseY + jy);
              }
            }
          }

          if (echo2Dist > 0) {
            const e2Dist = Math.abs(dist - echo2Dist);
            if (e2Dist < bandWidth * 0.65) {
              const norm = 1 - (e2Dist / (bandWidth * 0.65));
              const alpha = norm * norm * 0.38 * (1 - t * 0.45);
              if (alpha > 0.02) {
                const charCycle = Math.floor(now * 0.02 + row * 3 + col * 7);
                const glyph = GLYPHS[(charCycle + 2) % GLYPHS.length];
                ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
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

// ---------------------------------------
// Background Canvas: contour-field grid (Neutral Slate/Silver)
// ---------------------------------------
const bgCanvas = document.getElementById('bg-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (bgCanvas) {
  const ctx = bgCanvas.getContext('2d', { alpha: true, desynchronized: true });

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
    color: { hue: 215, saturation: 12, baseLightness: 60, burstLightness: 30, baseAlpha: 0.25, burstAlpha: 0.65 },
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
  let burst = null;
  let rafId;
  let lastFrame = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, cfg.maxPixelRatio);
    const w = Math.round(bgCanvas.clientWidth * dpr);
    const h = Math.round(bgCanvas.clientHeight * dpr);
    if (bgCanvas.width !== w || bgCanvas.height !== h) {
      bgCanvas.width = w;
      bgCanvas.height = h;
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
    const w = bgCanvas.width, h = bgCanvas.height;
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

    const pf = Math.max(0, Math.min(1, window.__pastelFactor || 0));

    ctx.clearRect(0, 0, w, h);

    ctx.font = `${cfg.grid.fontSize * dpr}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const { primary, vertical, diagonal, warp } = cfg.pattern;

    for (let py = cellH / 2; py < h + cellH; py += cellH) {
      for (let px = cellW / 2; px < w + cellW; px += cellW) {
        const col = Math.round(px / cellW);
        const row = Math.round(py / cellH);
        const u = px / w;
        const v = py / h;

        // Smooth non-patterned 8-bit micro-pixel threshold calculation
        let whiteAlpha = 0;
        if (pf > 0.001) {
          const organicWarp = (noise(u * 8 + drift * 0.8, v * 8 - drift * 0.6) - 0.5) * 0.18;
          const jitter = (hash(col * 3, row * 5) - 0.5) * 0.12;
          const rawWave = (v - (1.1 - pf * 1.3)) / 0.22 + organicWarp + jitter;
          whiteAlpha = clamp01(rawWave);
        }

        // Draw smooth organic micro-pixel white background block
        if (whiteAlpha > 0.001) {
          ctx.fillStyle = `rgba(248, 250, 252, ${whiteAlpha.toFixed(3)})`;
          ctx.fillRect(px - cellW / 2, py - cellH / 2, cellW + 0.5, cellH + 0.5);
        }

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

        if (whiteAlpha > 0.01) {
          // Smoothly adapt glyph color from silver (on dark) to dark slate (on white) based on whiteAlpha
          const baseL = cfg.color.baseLightness * (1 - whiteAlpha) + 28 * whiteAlpha;
          const burstL = cfg.color.burstLightness * (1 - whiteAlpha) + 85 * whiteAlpha;
          const sat = cfg.color.saturation * (1 - whiteAlpha) + 25 * whiteAlpha;
          const lightness = baseL + burstAmt * (burstL - baseL);
          const cellAlpha = alpha * (1 + whiteAlpha * 0.5);

          if (burstAmt > 0.25) {
            ctx.fillStyle = `hsla(210, 85%, 45%, ${cellAlpha * 1.3})`;
          } else {
            ctx.fillStyle = `hsla(${cfg.color.hue}, ${sat}%, ${lightness}%, ${cellAlpha})`;
          }
        } else {
          // Over Dark Background: silver contour glyphs (+, :, .)
          const lightness = cfg.color.baseLightness + burstAmt * cfg.color.burstLightness;
          ctx.fillStyle = `hsla(${cfg.color.hue}, ${cfg.color.saturation}%, ${lightness}%, ${alpha})`;
        }

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

  [0, 50, 300, 1000].forEach((delay) => setTimeout(start, delay));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  }

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
