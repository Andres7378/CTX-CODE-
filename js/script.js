/* =================== GAME LOGIC (mobile-friendly) =================== */
(function() {
  const canvas = document.getElementById('arena');
  const wrap = document.getElementById('arena-wrap');
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const restartBtn = document.getElementById('restartBtn');

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let actx = null,
    gain = null,
    noiseSrc = null;
  let soundOn = true;

  let ctx, W, H, DPR = 1;
  let bacteria = [],
    particles = [],
    confetti = [];
  let spraying = false,
    score = 0,
    time = 10,
    raf, started = false,
    won = false,
    shine = 0,
    t = 0;
  let state = 'idle';

  const dirtCanvas = document.createElement('canvas');
  const dirtCtx = dirtCanvas.getContext('2d');

  // Debounced resize for smoother mobile UX
  let _rzTimer = null;

  function resize() {
    clearTimeout(_rzTimer);
    _rzTimer = setTimeout(_doResize, 60);
  }

  function _doResize() {
    const rect = wrap.getBoundingClientRect();
    DPR = Math.min((window.devicePixelRatio || 1), isMobile ? 1.5 : 2);
    W = Math.max(280, Math.floor(rect.width));
    H = Math.max(240, Math.floor(rect.height));
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dirtCanvas.width = W;
    dirtCanvas.height = H;
    drawDirt();
  }

  function rand(a, b) {
    return Math.random() * (b - a) + a;
  }

  function drawGrillBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1b1c20');
    grad.addColorStop(.5, '#0f1013');
    grad.addColorStop(1, '#1b1c20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    for (let x = 20; x < W; x += 80) {
      const g = ctx.createLinearGradient(x - 4, 0, x + 12, 0);
      g.addColorStop(0, '#17181b');
      g.addColorStop(.5, '#c8ccd3');
      g.addColorStop(1, '#1a1b1f');
      ctx.fillStyle = g;
      ctx.fillRect(x - 4, 0, 16, H);
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      for (let y = 20; y < H; y += 80) {
        ctx.fillRect(x + 2, y, 2, 2);
      }
    }
    ctx.globalAlpha = .08;
    ctx.fillStyle = '#fff';
    for (let y = 0; y < H; y += 36) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawDirt() {
    dirtCtx.clearRect(0, 0, W, H);
    dirtCtx.fillStyle = 'rgba(80,50,20,0.58)';
    dirtCtx.fillRect(0, 0, W, H);
    const dots = isMobile ? 420 : 700;
    for (let i = 0; i < dots; i++) {
      dirtCtx.fillStyle = `rgba(120,80,40,${rand(.05, .22)})`;
      dirtCtx.beginPath();
      dirtCtx.arc(rand(0, W), rand(0, H), rand(1, 3.2), 0, Math.PI * 2);
      dirtCtx.fill();
    }
    dirtCtx.globalAlpha = .22;
    dirtCtx.fillStyle = '#000';
    for (let x = 0; x < W; x += 90) {
      dirtCtx.fillRect(x, 0, 3, H);
    }
    dirtCtx.globalAlpha = 1;
  }

  function cleanAt(x, y, r = 56) {
    dirtCtx.globalCompositeOperation = 'destination-out';
    const g = dirtCtx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dirtCtx.fillStyle = g;
    dirtCtx.beginPath();
    dirtCtx.arc(x, y, r, 0, Math.PI * 2);
    dirtCtx.fill();
    dirtCtx.globalCompositeOperation = 'source-over';
  }

  function spawnBacteria(n) {
    bacteria.length = 0;
    const count = n ?? (isMobile ? 7 : 10);
    for (let i = 0; i < count; i++) {
      const r = rand(16, 28);
      bacteria.push({
        x: rand(r, W - r),
        y: rand(r, H - r),
        r,
        vx: rand(-1.2, 1.2),
        vy: rand(-1.2, 1.2),
        life: 1,
        dead: false,
        hue: rand(110, 140),
        face: Math.floor(rand(0, 3)),
        wob: rand(0.06, 0.12),
        phase: rand(0, Math.PI * 2),
        lobes: Math.floor(rand(5, 8)),
        blink: rand(0, 1)
      });
    }
  }

  // ===== Pointer Events (mouse + touch) =====
  let mouse = {
    x: 0,
    y: 0
  }, activePointerId = null;

  function updatePointerXY(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }

  canvas.addEventListener('pointermove', (e) => {
    if (activePointerId === null || e.pointerId === activePointerId) {
      updatePointerXY(e);
    }
  }, {
    passive: true
  });

  canvas.addEventListener('pointerdown', (e) => {
    activePointerId = e.pointerId;
    canvas.setPointerCapture(activePointerId);
    updatePointerXY(e);
    spraying = true;
    startSpray();
    if (navigator.vibrate) navigator.vibrate(10);
    // start on first tap if idle
    if ((state === 'idle' || state === 'won' || state === 'lost')) start();
  }, {
    passive: true
  });

  window.addEventListener('pointerup', (e) => {
    if (e.pointerId === activePointerId) {
      spraying = false;
      stopSpray();
      activePointerId = null;
    }
  }, {
    passive: true
  });

  restartBtn.addEventListener('click', () => start(true));

  function spray() {
    const perFrame = isMobile ? 4 : 8;
    for (let i = 0; i < perFrame; i++) {
      particles.push({
        x: mouse.x,
        y: mouse.y,
        vx: rand(2.2, 4.2) * Math.cos(rand(-.6, .6)),
        vy: rand(2.2, 4.2) * Math.sin(rand(-.6, .6)),
        life: 1
      });
    }
    const maxP = isMobile ? 280 : 480;
    if (particles.length > maxP) particles.splice(0, particles.length - maxP);
  }

  function drawBacteria(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    const k = b.lobes,
      r = b.r,
      amp = r * b.wob;
    ctx.fillStyle = `hsl(${b.hue},80%,${b.dead ? 42 : 55}%)`;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.001; a += Math.PI / 60) {
      const rad = r + Math.sin(a * k + b.phase + t * 1.6) * amp;
      const px = Math.cos(a) * rad,
        py = Math.sin(a) * rad;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `hsla(${b.hue},80%,30%,.6)`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + b.phase;
      const rad = r + Math.sin(a * k + t * 1.4) * amp + 2;
      const sx = Math.cos(a) * rad,
        sy = Math.sin(a) * rad;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + Math.cos(a) * 8, sy + Math.sin(a) * 8, sx + Math.cos(a) * 14, sy + Math.sin(a) * 14);
      ctx.stroke();
    }
    const blinkOpen = (Math.sin(t * 2 + b.blink * 6) > -0.4);
    const eyeR = r * 0.16;
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.15, eyeR, blinkOpen ? eyeR : eyeR * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.35, -r * 0.15, eyeR, blinkOpen ? eyeR : eyeR * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.strokeStyle = '#0b0b0f';
    ctx.beginPath();
    if (b.face === 0) {
      ctx.arc(0, r * 0.2, r * 0.45, 0.1, Math.PI - 0.1, false);
    } else if (b.face === 1) {
      ctx.moveTo(-r * 0.4, r * 0.28);
      ctx.quadraticCurveTo(0, r * (0.05 + 0.05 * Math.sin(t * 2)), r * 0.4, r * 0.28);
    } else {
      const mR = r * (0.22 + 0.03 * Math.sin(t * 2));
      ctx.arc(0, r * 0.1, mR, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawShine() {
    if (!won) return;
    shine += 6;
    const x = (shine % (W + 300)) - 300;
    const grad = ctx.createLinearGradient(x, 0, x + 200, H);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(.5, 'rgba(255,255,255,.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(x - 50, 0, 260, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  function update() {
    t += 1 / 60;
    ctx.clearRect(0, 0, W, H);
    drawGrillBackground();
    ctx.drawImage(dirtCanvas, 0, 0);

    for (const b of bacteria) {
      if (b.dead) {
        b.life -= .05;
        continue;
      }
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < b.r || b.x > W - b.r) b.vx *= -1;
      if (b.y < b.r || b.y > H - b.r) b.vy *= -1;
    }

    if (spraying && !prefersReduced) spray();

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= .04;
    }
    particles = particles.filter(p => p.life > 0);

    for (const b of bacteria) {
      if (b.dead) continue;
      for (const p of particles) {
        const dx = b.x - p.x,
          dy = b.y - p.y;
        if (dx * dx + dy * dy < (b.r * b.r * .8)) {
          b.dead = true;
          score++;
          window.__score = score;
          scoreEl.textContent = (window.__scoreLabel || 'Kills') + ': ' + score;
          cleanAt(b.x, b.y, b.r * 1.8);
          playPop();
          break;
        }
      }
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(p.life, .1);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const b of bacteria) {
      const a = b.dead ? Math.max(b.life, 0) : 1;
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      drawBacteria(b);
      ctx.globalAlpha = 1;
    }

    for (const c of confetti) {
      c.vy += 0.08;
      c.x += c.vx;
      c.y += c.vy;
      c.life -= .01;
      ctx.globalAlpha = Math.max(c.life, 0);
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }
    confetti = confetti.filter(c => c.life > 0);
    ctx.globalAlpha = 1;

    drawShine();

    if (started && !won) {
      time -= 1 / 60;
      if (time < 0) time = 0;
      const alive = bacteria.some(b => !b.dead);
      if (!alive) {
        celebrate();
        return;
      }
      if (time === 0) {
        endGame();
        return;
      }
    }
    timerEl.textContent = '00:' + ('0' + Math.floor(time)).slice(-2);

    raf = requestAnimationFrame(update);
  }

  function spawnConfetti() {
    const count = isMobile ? 90 : 140;
    for (let i = 0; i < count; i++) {
      confetti.push({
        x: rand(0, W),
        y: rand(-40, 20),
        vx: rand(-1, 1),
        vy: rand(0.5, 2),
        w: rand(3, 6),
        h: rand(6, 12),
        color: `hsl(${rand(300, 340)},90%,60%)`,
        life: 1
      });
    }
  }

  function celebrate() {
    state = 'won';
    started = false;
    won = true;
    cancelAnimationFrame(raf);
    dirtCtx.clearRect(0, 0, W, H);
    shine = 0;
    particles = [];
    spraying = false;
    stopSpray();
    spawnConfetti();
    playWin();
    const msg = document.createElement('div');
    msg.className = 'badge';
    Object.assign(msg.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      fontSize: '1.05rem',
      background: 'rgba(0,0,0,.7)',
      pointerEvents: 'auto',
      textAlign: 'center'
    });
    const gs = window.__gameStrings || {};
    msg.innerHTML = (gs.winHtml) ? gs.winHtml : '<strong>¡Misión cumplida!</strong><br/>Bacterias y grasa eliminadas de la parrilla.<br/><a href="#" style="margin-top:6px;display:inline-block" onclick="startAgain(event)">Jugar de nuevo</a>';
    wrap.appendChild(msg);
    window.startAgain = (e) => {
      e.preventDefault();
      msg.remove();
      start(true);
    };
    raf = requestAnimationFrame(update);
  }

  function start() {
    won = false;
    started = true;
    state = 'playing';
    score = 0;
    time = 10;
    window.__score = 0;
    scoreEl.textContent = (window.__scoreLabel || 'Kills') + ': 0';
    timerEl.textContent = '00:10';
    particles = [];
    confetti = [];
    spawnBacteria();
    drawDirt();
    spraying = false;
    stopSpray();
  }

  function endGame() {
    state = 'lost';
    started = false;
    won = false;
    cancelAnimationFrame(raf);
    stopSpray();
    const msg = document.createElement('div');
    msg.className = 'badge';
    Object.assign(msg.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      fontSize: '1.05rem',
      background: 'rgba(0,0,0,.7)',
      pointerEvents: 'auto',
      textAlign: 'center'
    });
    const gs = window.__gameStrings || {};
    if (gs.loseHtml) {
      msg.innerHTML = gs.loseHtml.replace('{{score}}', score);
    } else {
      msg.innerHTML = 'Se acabó el tiempo. <strong>' + score + '</strong> bacterias eliminadas. <a href="#" style="margin-left:6px" onclick="startAgain(event)">Reintentar</a>';
    }
    wrap.appendChild(msg);
    window.startAgain = (e) => {
      e.preventDefault();
      msg.remove();
      start();
    };
    raf = requestAnimationFrame(update);
  }

  function init() {
    _doResize();
    spawnBacteria(8);
    update();
  }

  window.addEventListener('resize', resize);
  window.startGame = () => start();
  init();

  /* === CTX BOTTLE CURSOR (auto-remove white bg) === */
  (function makeCursor() {
    const src = "https://i.imgur.com/ow3h5Kt.png";
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const s = 64;
      const cnv = document.createElement('canvas');
      cnv.width = s;
      cnv.height = s;
      const c = cnv.getContext('2d');
      const scale = Math.min(s / img.width, s / img.height);
      const w = img.width * scale,
        h = img.height * scale;
      c.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      const imgd = c.getImageData(0, 0, s, s);
      const d = imgd.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i],
          g = d[i + 1],
          b = d[i + 2];
        if (r > 245 && g > 245 && b > 245) {
          d[i + 3] = 0;
        }
      }
      c.putImageData(imgd, 0, 0);
      const url = cnv.toDataURL("image/png");
      document.body.style.cursor = `url('${url}') 10 10, auto`;
    };
    img.src = src;
  })();

  /* === Audio (only after interaction) === */
  function ensureAudio() {
    if (actx) return;
    actx = new(window.AudioContext || window.webkitAudioContext)();
    gain = actx.createGain();
    gain.gain.value = 0.22;
    gain.connect(actx.destination);
  }

  function startSpray() {
    if (!soundOn) return;
    try {
      ensureAudio();
      stopSpray();
      const buffer = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noiseSrc = actx.createBufferSource();
      noiseSrc.buffer = buffer;
      const filt = actx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = 1000;
      noiseSrc.connect(filt);
      filt.connect(gain);
      noiseSrc.loop = true;
      noiseSrc.start();
    } catch (e) {}
  }

  function stopSpray() {
    if (!noiseSrc) return;
    try {
      noiseSrc.stop();
    } catch (e) {}
    try {
      noiseSrc.disconnect();
    } catch (e) {}
    noiseSrc = null;
  }

  function playPop() {
    if (!soundOn || !actx) return;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, actx.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, actx.currentTime + 0.12);
    g.gain.setValueAtTime(0.35, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.12);
    o.connect(g);
    g.connect(gain);
    o.start();
    o.stop(actx.currentTime + 0.13);
  }

  function playWin() {
    if (!soundOn || !actx) return;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(440, actx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, actx.currentTime + 0.25);
    g.gain.setValueAtTime(0.5, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.4);
    o.connect(g);
    g.connect(gain);
    o.start();
    o.stop(actx.currentTime + 0.45);
  }
})();

/* =================== FOOTER YEAR =================== */
document.getElementById('year').textContent = new Date().getFullYear();

/* =================== BENEFICIOS TAB JS =================== */
const beneficiosBtn = document.getElementById('beneficiosBtn');
const beneficiosSheet = document.getElementById('beneficiosSheet');
const closeBeneficios = document.getElementById('closeBeneficios');
const beneficiosOpeners = document.querySelectorAll('[data-open-beneficios]');
const beneficiosBackdrop = document.querySelector('.sheet__backdrop');

function openBeneficios() {
  beneficiosSheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  closeBeneficios?.focus();
  beneficiosBtn?.classList.add('active');
}

function closeBeneficiosSheet() {
  beneficiosSheet.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  beneficiosBtn?.classList.remove('active');
}

beneficiosBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  openBeneficios();
});
closeBeneficios?.addEventListener('click', () => closeBeneficiosSheet());
beneficiosBackdrop?.addEventListener('click', () => closeBeneficiosSheet());
beneficiosOpeners.forEach(el => el.addEventListener('click', (e) => {
  e.preventDefault();
  openBeneficios();
}));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && beneficiosSheet.getAttribute('aria-hidden') === 'false') {
    closeBeneficiosSheet();
  }
});

if (location.hash === '#beneficios') {
  try {
    history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {}
  openBeneficios();
}

/* =================== SCROLL REVEAL =================== */
(function() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('in');
    });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.12
  });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* =================== DESKTOP-SAFE TEL/SMS FALLBACK =================== */
(function telSmsFallback() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const phone = "+18329486169";
  const toast = document.getElementById('toast');

  function showToast() {
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function copyPhone() {
    navigator.clipboard?.writeText(phone).then(showToast).catch(showToast);
  }

  document.getElementById('callTile')?.addEventListener('click', (e) => {
    if (!isMobile) {
      e.preventDefault();
      copyPhone();
    }
  });
  document.getElementById('smsTile')?.addEventListener('click', (e) => {
    if (!isMobile) {
      e.preventDefault();
      copyPhone();
    }
  });
})();

/* =================== I18N TOGGLE (ES <-> EN) =================== */
(function() {
  const html = document.documentElement;
  const $ = (sel) => document.querySelector(sel);

  const US_FLAG = `<svg viewBox="0 0 7410 3900" aria-hidden="true"><path fill="#b22234" d="M0 0h7410v3900H0z"/><path stroke="#fff" stroke-width="300" d="M0 450h7410M0 1050h7410M0 1650h7410M0 2250h7410M0 2850h7410M0 3450h7410"/><path fill="#3c3b6e" d="M0 0h2964v2100H0z"/></svg>`;
  const ES_FLAG = `<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="3" height="2" fill="#AA151B"/><rect y="0.5" width="3" height="1" fill="#F1BF00"/></svg>`;

  const map = {
    es: {
      title: 'CTX Grill Degreaser – El mejor desengrasante para tu parrilla',
      navPlay: 'Jugar',
      navDocs: 'Fichas',
      navBuy: 'Comprar',
      btnLang: 'EN',
      kicker: 'El mejor desengrasante para tu parrilla',
      heroTitle: 'Apunta. Spray. <span style="color:var(--primary)">Limpia.</span>',
      lead: '¡Limpieza Profesional para Tu Parrilla, al Alcance de un Spray!<br>El poder cítrico que elimina grasa al instante. Seguro, ecológico y listo para usar.',
      buyNow: 'Cómpralo ahora',
      seeBenefits: 'Ver beneficios',
      startGame: 'Comenzar juego',
      score: 'Kills',
      restart: 'Reiniciar',
      p1t: '🔥 Limpieza Profunda',
      p1b: 'Penetra y emulsifica grasas y aceites para un enjuague sin esfuerzo.',
      p2t: '🍊 Poder Cítrico',
      p2b: 'Fórmula segura y eficiente para uso doméstico o profesional.',
      p3t: '🧽 Fácil de Usar',
      p3b: 'Rocía, espera 5–15 min, cepilla y enjuaga. ¡Listo!',
      benTitle: 'Beneficios de CTX Grill Degreaser',
      ben1: '<strong>Limpieza profunda y potente:</strong> Especialmente formulado para la limpieza intensiva y el mantenimiento diario de parrillas, sartenes y utensilios de cocina.',
      ben2: '<strong>Fórmula ecológica:</strong> A base de agua y libre de COV, plomo y metales pesados.',
      ben3: '<strong>Desengrasado rápido y eficaz:</strong> Penetra en las superficies para eliminar grasa, aceite y residuos de alimentos. El <em>indicador de color</em> incorporado se vuelve blanco al contacto con la grasa para una confirmación visual rápida.',
      ben4: '<strong>Fresco aroma cítrico:</strong> El aroma a toronja mantiene tu cocina limpia y fresca después de cada uso.',
      ben5: '<strong>Uso versátil:</strong> Perfecto para parrillas, herramientas de parrilla, sartenes y otras superficies grasosas. Seguro para ti, tus superficies y el medio ambiente.',
      galeria: 'Galería de contenido',
      galeriaTxt: 'Videos destacados con tips de uso, demostraciones y antes/después. (Sustituye los archivos <code>assets/video*.mp4</code> por tus clips).',
      social: 'Conéctate con nosotros',
      socialTxt: 'Tips de limpieza, recetas y promociones exclusivas.',
      docs: 'Documentos técnicos',
      docsTxt: 'Descarga las fichas con especificaciones, seguridad y recomendaciones de uso.',
      docEs: 'Ficha Técnica español',
      docEn: 'Data Sheet english',
      buyTitle: 'Compra CTX Grill Degreaser',
      buyTxt: 'Disponible en canales oficiales y distribuidores autorizados.',
      buyOnline: 'Comprar en línea',
      contactSales: 'Contactar ventas',
      gameWinTitle: '¡Misión cumplida!',
      gameWinBody: 'Bacterias y grasa eliminadas de la parrilla.',
      gamePlayAgain: 'Jugar de nuevo',
      gameTimeUp: 'Se acabó el tiempo.',
      gameKillsSuffix: 'bacterias eliminadas.',
      gameRetry: 'Reintentar',
      footerDemo: ''
    },
    en: {
      title: 'CTX Grill Degreaser – The best degreaser for your grill',
      navPlay: 'Play',
      navDocs: 'Sheets',
      navBuy: 'Buy',
      btnLang: 'ES',
      kicker: 'The best degreaser for your grill',
      heroTitle: 'Spray. Aim. <span style="color:var(--primary)">Clean.</span>',
      lead: 'Professional cleaning for your grill at the reach of a spray!<br>The citrus power that eliminates grease instantly. Safe, eco-friendly and ready to use.',
      buyNow: 'Buy now',
      seeBenefits: 'See benefits',
      startGame: 'Start game',
      score: 'Kills',
      restart: 'Restart',
      p1t: '🔥 Deep Cleaning',
      p1b: 'Penetrates and emulsifies grease and oils for effortless rinsing.',
      p2t: '🍊 Citrus Power',
      p2b: 'Safe and efficient formula for home or professional use.',
      p3t: '🧽 Easy to Use',
      p3b: 'Spray, wait 5–15 min, scrub and rinse. Done!',
      benTitle: 'Benefits of CTX Grill Degreaser',
      ben1: '<strong>Deep and powerful cleaning:</strong> Specially formulated for intensive cleaning and daily maintenance of grills, pans and kitchen utensils.',
      ben2: '<strong>Eco-friendly formula:</strong> Water-based and free of VOCs, lead and heavy metals.',
      ben3: '<strong>Fast, effective degreasing:</strong> Penetrates surfaces to remove grease, oil and food residues. The built-in <em>color indicator</em> turns white on contact with grease for quick visual confirmation.',
      ben4: '<strong>Fresh citrus scent:</strong> Grapefruit fragrance keeps your kitchen clean and fresh after every use.',
      ben5: '<strong>Versatile use:</strong> Perfect for grills, grill tools, pans and other greasy surfaces. Safe for you, your surfaces and the environment.',
      galeria: 'Content gallery',
      galeriaTxt: 'Featured videos with usage tips, demos and before/after. (Replace files <code>assets/video*.mp4</code> with your clips).',
      social: 'Connect with us',
      socialTxt: 'Cleaning tips, recipes and exclusive promotions.',
      docs: 'Technical documents',
      docsTxt: 'Download spec sheets, safety and usage recommendations.',
      docEs: 'Ficha Técnica español',
      docEn: 'Data Sheet english',
      buyTitle: 'Buy CTX Grill Degreaser',
      buyTxt: 'Available through official channels and authorized distributors.',
      buyOnline: 'Buy online',
      contactSales: 'Contact sales',
      gameWinTitle: 'Mission accomplished!',
      gameWinBody: 'Bacteria and grease removed from the grill.',
      gamePlayAgain: 'Play again',
      gameTimeUp: "Time's up.",
      gameKillsSuffix: 'bacteria eliminated.',
      gameRetry: 'Try again',
      footerDemo: ''
    }
  };

  function setBtnVisual(nextLang) {
    const btn = document.querySelector('#langToggle');
    if (!btn) return;
    const isNextEN = nextLang === 'en';
    btn.innerHTML = `
      <span class="flag" aria-hidden="true">${isNextEN ? US_FLAG : ES_FLAG}</span>
      <span class="label">${isNextEN ? 'EN' : 'ES'}</span>
    `;
    btn.setAttribute('aria-label', isNextEN ? 'Switch to English (United States)' : 'Cambiar a español (España)');
  }

  function apply(lang) {
    const $ = (sel) => document.querySelector(sel);
    const m = map[lang];
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en-US' : 'es-ES');
    document.title = m.title;
    $('#navPlay') && (document.querySelector('#navPlay').textContent = m.navPlay);
    $('#navDocs') && (document.querySelector('#navDocs').textContent = m.navDocs);
    $('#navBuy') && (document.querySelector('#navBuy').textContent = m.navBuy);
    setBtnVisual(lang === 'es' ? 'en' : 'es');
    $('#kicker') && (document.querySelector('#kicker').textContent = m.kicker);
    const h = $('#t1');
    if (h) {
      h.replaceChildren();
      h.innerHTML = m.heroTitle;
    }
    const l = $('#lead');
    if (l) {
      l.replaceChildren();
      l.innerHTML = m.lead;
    }
    $('#btnBuyNow') && (document.querySelector('#btnBuyNow').textContent = m.buyNow);
    $('#btnBenefits') && (document.querySelector('#btnBenefits').textContent = m.seeBenefits);
    $('#btnStart') && (document.querySelector('#btnStart').textContent = m.startGame);
    window.__scoreLabel = m.score;
    const restart = $('#restartBtn');
    if (restart) restart.textContent = m.restart;
    const scoreEl = $('#score');
    if (scoreEl) scoreEl.textContent = (window.__scoreLabel || 'Kills') + ': ' + (window.__score || 0);
    $('#p1t') && (document.querySelector('#p1t').textContent = m.p1t);
    $('#p1b') && (document.querySelector('#p1b').textContent = m.p1b);
    $('#p2t') && (document.querySelector('#p2t').textContent = m.p2t);
    $('#p2b') && (document.querySelector('#p2b').textContent = m.p2b);
    $('#p3t') && (document.querySelector('#p3t').textContent = m.p3t);
    $('#p3b') && (document.querySelector('#p3b').textContent = m.p3b);
    const benTitle = $('#beneficiosTitle');
    if (benTitle) benTitle.textContent = m.benTitle;
    const items = document.querySelectorAll('#beneficiosSheet .benefits li');
    if (items.length >= 5) {
      items[0].innerHTML = m.ben1;
      items[1].innerHTML = m.ben2;
      items[2].innerHTML = m.ben3;
      items[3].innerHTML = m.ben4;
      items[4].innerHTML = m.ben5;
    }
    $('#galeria') && (document.querySelector('#galeria').textContent = m.galeria);
    $('#galeriaTxt') && (document.querySelector('#galeriaTxt').innerHTML = m.galeriaTxt);
    $('#social') && (document.querySelector('#social').textContent = m.social);
    $('#socialTxt') && (document.querySelector('#socialTxt').textContent = m.socialTxt);
    $('#docsH2') && (document.querySelector('#docsH2').textContent = m.docs);
    $('#docsTxt') && (document.querySelector('#docsTxt').textContent = m.docsTxt);
    $('#docEs') && (document.querySelector('#docEs').textContent = m.docEs);
    $('#docEn') && (document.querySelector('#docEn').textContent = m.docEn);
    $('#buy') && (document.querySelector('#buy').textContent = m.buyTitle);
    $('#buyTxt') && (document.querySelector('#buyTxt').textContent = m.buyTxt);
    $('#buyOnline') && (document.querySelector('#buyOnline').textContent = m.buyOnline);
    $('#contactSales') && (document.querySelector('#contactSales').textContent = m.contactSales);
    $('#stickyBuy') && (document.querySelector('#stickyBuy').textContent = m.buyNow);
    $('#stickyBenefits') && (document.querySelector('#stickyBenefits').textContent = m.seeBenefits);
    // setup game localized strings used by the canvas game
    window.__gameStrings = {
      winHtml: `<strong>${m.gameWinTitle}</strong><br/>${m.gameWinBody}<br/><a href="#" style="margin-top:6px;display:inline-block" onclick="startAgain(event)">${m.gamePlayAgain}</a>`,
      loseHtml: `${m.gameTimeUp} <strong>{{score}}</strong> ${m.gameKillsSuffix} <a href="#" style="margin-left:6px" onclick="startAgain(event)">${m.gameRetry}</a>`
    };
    // update contact info text if present
    const contactLine = document.querySelector('#comprar p[style]');
    if (contactLine) {
      contactLine.innerHTML = `Contacto: <a href="mailto:apadilla@blendergroup.com">apadilla@blendergroup.com</a> · Tel/SMS: <a href="tel:+18329486169">+1 (832) 948-6169</a>`;
    }
  }

  // initial
  const params = new URLSearchParams(location.search);
  let current = (params.get('lang') && params.get('lang').startsWith('en')) ? 'en' : 'es';
  apply(current);

  const btn = document.querySelector('#langToggle');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      current = (current === 'es') ? 'en' : 'es';
      apply(current);
      try {
        localStorage.setItem('ctx-lang', current);
      } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set('lang', current);
      history.replaceState(null, '', url.toString());
    });
  }
})();
