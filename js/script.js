/* ==========================================
   CTX Grill Degreaser - Main JavaScript
   Version 2.1 - Full i18n Fix
   ========================================== */

/* ==========================================
   SECTION 1: Loading Screen
   ========================================== */
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 600);
});

/* ==========================================
   SECTION 2: Header Scroll Effect
   ========================================== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ==========================================
   SECTION 3: Scroll Reveal Animations
   ========================================== */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => entry.target.classList.add('visible'), parseInt(delay));
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.scroll-reveal, .what-card, .benefit-item, .use-chip, .gallery-tile').forEach(el => {
    revealObserver.observe(el);
});

/* ==========================================
   SECTION 4: Mobile Menu
   ========================================== */
(function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.getElementById('hamburger');
    const closeMenuBtn = document.getElementById('closeMenu');

    function openMenu() {
        menu.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
    }

    function closeMenu() {
        menu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    }

    hamburger?.addEventListener('click', () => {
        menu.getAttribute('aria-hidden') !== 'false' ? openMenu() : closeMenu();
    });

    closeMenuBtn?.addEventListener('click', closeMenu);
    menu.querySelector('[data-close-menu]')?.addEventListener('click', closeMenu);
    menu.querySelectorAll('[data-menu-link]').forEach(l => {
        l.addEventListener('click', () => setTimeout(closeMenu, 100));
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenu();
    });
})();

/* ==========================================
   SECTION 5: Benefits Sheet
   ========================================== */
(function() {
    const sheet = document.getElementById('beneficiosSheet');
    const closeSheet = document.getElementById('closeBeneficios');

    function openSheet() {
        sheet.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
    }

    function closeSheetFn() {
        sheet.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    }

    document.querySelectorAll('[data-open-beneficios]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            openSheet();
        });
    });

    closeSheet?.addEventListener('click', closeSheetFn);
    sheet.querySelector('[data-close-beneficios]')?.addEventListener('click', closeSheetFn);
})();

/* ==========================================
   SECTION 6: Year in Footer
   ========================================== */
document.getElementById('year').textContent = new Date().getFullYear();

/* ==========================================
   SECTION 7: Toast for Desktop (Phone Copy)
   ========================================== */
(function() {
    const toast = document.getElementById('toast');
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    if (!isMobile) {
        document.getElementById('callBtn')?.addEventListener('click', e => {
            e.preventDefault();
            navigator.clipboard?.writeText('+18329486169').then(showToast);
        });
        document.getElementById('smsBtn')?.addEventListener('click', e => {
            e.preventDefault();
            navigator.clipboard?.writeText('+18329486169').then(showToast);
        });
    }
})();

/* ==========================================
   SECTION 8: Game Logic
   ========================================== */
(function() {
    const canvas = document.getElementById('arena');
    const wrap = document.getElementById('arena-wrap');
    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const restartBtn = document.getElementById('restartBtn');
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    let ctx, W, H, DPR = 1;
    let bacteria = [], particles = [], confetti = [];
    let spraying = false, score = 0, time = 15, raf, started = false, won = false, shine = 0, t = 0;
    let state = 'idle', gameReady = false;

    const dirtCanvas = document.createElement('canvas');
    const dirtCtx = dirtCanvas.getContext('2d');
    let actx = null, gain = null, noiseSrc = null;

    function rand(a, b) {
        return Math.random() * (b - a) + a;
    }

    function resize() {
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
        W = Math.max(280, Math.floor(rect.width));
        H = Math.max(180, Math.floor(rect.height));
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

    function drawGrillBg() {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a1a1f');
        grad.addColorStop(0.5, '#0f0f12');
        grad.addColorStop(1, '#1a1a1f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        for (let x = 25; x < W; x += 55) {
            const g = ctx.createLinearGradient(x - 5, 0, x + 12, 0);
            g.addColorStop(0, '#18181c');
            g.addColorStop(0.5, '#8a8d95');
            g.addColorStop(1, '#1a1a1f');
            ctx.fillStyle = g;
            ctx.fillRect(x - 5, 0, 12, H);
        }
    }

    function drawDirt() {
        dirtCtx.clearRect(0, 0, W, H);
        dirtCtx.fillStyle = 'rgba(60,40,15,0.55)';
        dirtCtx.fillRect(0, 0, W, H);
        const dots = isMobile ? 250 : 400;
        for (let i = 0; i < dots; i++) {
            dirtCtx.fillStyle = `rgba(100,70,30,${rand(0.05, 0.22)})`;
            dirtCtx.beginPath();
            dirtCtx.arc(rand(0, W), rand(0, H), rand(1, 3.5), 0, Math.PI * 2);
            dirtCtx.fill();
        }
    }

    function cleanAt(x, y, r = 45) {
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
        bacteria = [];
        const count = n ?? (isMobile ? 5 : 7);
        for (let i = 0; i < count; i++) {
            const r = rand(16, 26);
            bacteria.push({
                x: rand(r + 15, W - r - 15),
                y: rand(r + 15, H - r - 15),
                r,
                vx: rand(-0.8, 0.8),
                vy: rand(-0.8, 0.8),
                life: 1,
                dead: false,
                hue: rand(100, 140),
                face: Math.floor(rand(0, 3)),
                wob: rand(0.04, 0.08),
                phase: rand(0, Math.PI * 2),
                lobes: Math.floor(rand(5, 7)),
                blink: rand(0, 1)
            });
        }
    }

    let mouse = { x: 0, y: 0 }, activePtr = null;

    function updateXY(e) {
        const r = canvas.getBoundingClientRect();
        mouse.x = (e.clientX || e.touches?.[0]?.clientX || 0) - r.left;
        mouse.y = (e.clientY || e.touches?.[0]?.clientY || 0) - r.top;
    }

    canvas.addEventListener('pointerdown', e => {
        e.preventDefault();
        activePtr = e.pointerId;
        try { canvas.setPointerCapture(activePtr); } catch (err) { }
        updateXY(e);
        spraying = true;
        startSpray();
        if (navigator.vibrate) navigator.vibrate(10);
        if (state === 'idle' || state === 'won' || state === 'lost') startGame();
    });

    canvas.addEventListener('pointermove', e => {
        if (activePtr === null || e.pointerId === activePtr) updateXY(e);
    });

    window.addEventListener('pointerup', e => {
        if (e.pointerId === activePtr) {
            spraying = false;
            stopSpray();
            activePtr = null;
        }
    });

    window.addEventListener('pointercancel', () => {
        spraying = false;
        stopSpray();
        activePtr = null;
    });

    restartBtn?.addEventListener('click', () => startGame(true));

    function spray() {
        const perFrame = isMobile ? 4 : 8;
        for (let i = 0; i < perFrame; i++) {
            const angle = rand(-0.4, 0.4), speed = rand(2.5, 4.5);
            particles.push({
                x: mouse.x,
                y: mouse.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1
            });
        }
        const maxP = isMobile ? 150 : 300;
        if (particles.length > maxP) particles.splice(0, particles.length - maxP);
    }

    function drawBacteria(b) {
        ctx.save();
        ctx.translate(b.x, b.y);
        const k = b.lobes, r = b.r, amp = r * b.wob;
        ctx.fillStyle = `hsl(${b.hue},70%,${b.dead ? 35 : 48}%)`;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 45) {
            const rad = r + Math.sin(a * k + b.phase + t * 1.4) * amp;
            const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        const blinkOpen = Math.sin(t * 2 + b.blink * 6) > -0.3;
        const eyeR = r * 0.14;
        ctx.fillStyle = 'rgba(0,0,0,.65)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.28, -r * 0.1, eyeR, blinkOpen ? eyeR : eyeR * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.28, -r * 0.1, eyeR, blinkOpen ? eyeR : eyeR * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = Math.max(1.5, r * 0.08);
        ctx.strokeStyle = '#0a0a0c';
        ctx.beginPath();
        if (b.face === 0) ctx.arc(0, r * 0.18, r * 0.35, 0.1, Math.PI - 0.1, false);
        else if (b.face === 1) {
            ctx.moveTo(-r * 0.3, r * 0.22);
            ctx.quadraticCurveTo(0, r * 0.08, r * 0.3, r * 0.22);
        } else ctx.arc(0, r * 0.1, r * 0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function update() {
        t += 1 / 60;
        ctx.clearRect(0, 0, W, H);
        drawGrillBg();
        ctx.drawImage(dirtCanvas, 0, 0);

        for (const b of bacteria) {
            if (b.dead) { b.life -= 0.05; continue; }
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < b.r || b.x > W - b.r) b.vx *= -1;
            if (b.y < b.r || b.y > H - b.r) b.vy *= -1;
        }

        if (spraying) spray();

        for (const p of particles) { p.x += p.vx; p.y += p.vy; p.life -= 0.03; }
        particles = particles.filter(p => p.life > 0);

        for (const b of bacteria) {
            if (b.dead) continue;
            for (const p of particles) {
                const dx = b.x - p.x, dy = b.y - p.y;
                if (dx * dx + dy * dy < b.r * b.r * 0.65) {
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
            ctx.globalAlpha = Math.max(p.life, 0.1);
            ctx.fillStyle = 'rgba(255,255,255,.85)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (const b of bacteria) {
            const alpha = b.dead ? Math.max(b.life, 0) : 1;
            if (alpha <= 0) continue;
            ctx.globalAlpha = alpha;
            drawBacteria(b);
            ctx.globalAlpha = 1;
        }

        for (const c of confetti) {
            c.vy += 0.1; c.x += c.vx; c.y += c.vy; c.life -= 0.01;
            ctx.globalAlpha = Math.max(c.life, 0);
            ctx.fillStyle = c.color;
            ctx.fillRect(c.x, c.y, c.w, c.h);
        }
        confetti = confetti.filter(c => c.life > 0);
        ctx.globalAlpha = 1;

        if (won) {
            shine += 5;
            const x = (shine % (W + 250)) - 250;
            const grad = ctx.createLinearGradient(x, 0, x + 180, H);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.5, 'rgba(255,255,255,.18)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.globalCompositeOperation = 'screen';
            ctx.fillRect(x - 40, 0, 220, H);
            ctx.globalCompositeOperation = 'source-over';
        }

        if (started && !won) {
            time -= 1 / 60;
            if (time < 0) time = 0;
            const alive = bacteria.some(b => !b.dead);
            if (!alive) { celebrate(); return; }
            if (time === 0) { endGame(); return; }
        }

        timerEl.textContent = '00:' + ('0' + Math.floor(time)).slice(-2);
        raf = requestAnimationFrame(update);
    }

    function celebrate() {
        state = 'won'; started = false; won = true;
        cancelAnimationFrame(raf);
        dirtCtx.clearRect(0, 0, W, H);
        shine = 0; particles = []; spraying = false; stopSpray();
        const count = isMobile ? 70 : 100;
        for (let i = 0; i < count; i++) {
            confetti.push({
                x: rand(0, W), y: rand(-30, 15),
                vx: rand(-1.2, 1.2), vy: rand(1, 2.5),
                w: rand(4, 7), h: rand(7, 12),
                color: `hsl(${rand(300, 360)},85%,60%)`, life: 1
            });
        }
        playWin();
        showMsg(window.__gameStrings?.winHtml || '<strong>¡Misión cumplida!</strong><br>Bacterias eliminadas.<br><a href="#" style="color:var(--acid)" onclick="window.startAgain(event)">Jugar de nuevo</a>');
        raf = requestAnimationFrame(update);
    }

    function startGame(force) {
        wrap.querySelectorAll('.game-msg').forEach(el => el.remove());
        won = false; started = true; state = 'playing';
        score = 0; time = 15; window.__score = 0;
        scoreEl.textContent = (window.__scoreLabel || 'Kills') + ': 0';
        timerEl.textContent = '00:15';
        particles = []; confetti = [];
        spawnBacteria(); drawDirt(); spraying = false; stopSpray();
        if (!gameReady || force) {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(update);
            gameReady = true;
        }
    }

    function endGame() {
        state = 'lost'; started = false; won = false;
        cancelAnimationFrame(raf); stopSpray();
        const gs = window.__gameStrings || {};
        showMsg(gs.loseHtml?.replace('{{score}}', score) || `¡Tiempo! <strong>${score}</strong> bacterias.<br><a href="#" style="color:var(--acid)" onclick="window.startAgain(event)">Reintentar</a>`);
        raf = requestAnimationFrame(update);
    }

    function showMsg(html) {
        const msg = document.createElement('div');
        msg.className = 'badge game-msg';
        Object.assign(msg.style, {
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)', fontSize: '.95rem',
            background: 'rgba(0,0,0,.85)', pointerEvents: 'auto',
            textAlign: 'center', padding: '14px 22px', borderRadius: '14px'
        });
        msg.innerHTML = html;
        wrap.appendChild(msg);
        window.startAgain = e => { e.preventDefault(); msg.remove(); startGame(); };
    }

    function ensureAudio() {
        if (actx) return;
        actx = new (window.AudioContext || window.webkitAudioContext)();
        gain = actx.createGain();
        gain.gain.value = 0.18;
        gain.connect(actx.destination);
    }

    function startSpray() {
        try {
            ensureAudio();
            if (actx?.state === 'suspended') actx.resume();
            stopSpray();
            const buffer = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            noiseSrc = actx.createBufferSource();
            noiseSrc.buffer = buffer;
            const filt = actx.createBiquadFilter();
            filt.type = 'highpass';
            filt.frequency.value = 1100;
            noiseSrc.connect(filt);
            filt.connect(gain);
            noiseSrc.loop = true;
            noiseSrc.start();
        } catch (e) { }
    }

    function stopSpray() {
        if (!noiseSrc) return;
        try { noiseSrc.stop(); } catch (e) { }
        try { noiseSrc.disconnect(); } catch (e) { }
        noiseSrc = null;
    }

    function playPop() {
        if (!actx) return;
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(450, actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(90, actx.currentTime + 0.1);
        g.gain.setValueAtTime(0.25, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.1);
        o.connect(g); g.connect(gain); o.start(); o.stop(actx.currentTime + 0.11);
    }

    function playWin() {
        if (!actx) return;
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(400, actx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800, actx.currentTime + 0.25);
        g.gain.setValueAtTime(0.35, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.35);
        o.connect(g); g.connect(gain); o.start(); o.stop(actx.currentTime + 0.4);
    }

    (function makeCursor() {
        const src = "https://i.imgur.com/ow3h5Kt.png";
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const s = 44, cnv = document.createElement('canvas');
            cnv.width = s; cnv.height = s;
            const c = cnv.getContext('2d'), scale = Math.min(s / img.width, s / img.height);
            const w = img.width * scale, h = img.height * scale;
            c.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
            const imgd = c.getImageData(0, 0, s, s), d = imgd.data;
            for (let i = 0; i < d.length; i += 4) {
                if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) d[i + 3] = 0;
            }
            c.putImageData(imgd, 0, 0);
            document.body.style.cursor = `url('${cnv.toDataURL("image/png")}') 8 8, auto`;
        };
        img.src = src;
    })();

    function init() {
        resize();
        spawnBacteria(6);
        ctx.clearRect(0, 0, W, H);
        drawGrillBg();
        ctx.drawImage(dirtCanvas, 0, 0);
        for (const b of bacteria) drawBacteria(b);
        showMsg(window.__gameStrings?.startHtml || '👆 <span id="startMsgText">Toca para comenzar</span>');
        canvas.addEventListener('pointerdown', function rmStart() {
            wrap.querySelectorAll('.game-msg').forEach(el => el.remove());
            canvas.removeEventListener('pointerdown', rmStart);
        }, { once: true });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { spraying = false; stopSpray(); }
    });

    let rzTimer;
    window.addEventListener('resize', () => {
        clearTimeout(rzTimer);
        rzTimer = setTimeout(resize, 100);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* ==========================================
   SECTION 9: Internationalization (i18n)
   ========================================== */
(function() {
    const $ = sel => document.querySelector(sel);

    const US_FLAG = `<svg viewBox="0 0 7410 3900"><path fill="#b22234" d="M0 0h7410v3900H0z"/><path stroke="#fff" stroke-width="300" d="M0 450h7410M0 1050h7410M0 1650h7410M0 2250h7410M0 2850h7410M0 3450h7410"/><path fill="#3c3b6e" d="M0 0h2964v2100H0z"/></svg>`;
    const MX_FLAG = `<svg viewBox="0 0 3 2"><rect width="1" height="2" fill="#006847"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ce1126"/></svg>`;

    const i18n = {
        es: {
            /* ---- Loader ---- */
            loaderText: 'CARGANDO...',
            /* ---- Nav ---- */
            navWhat: '¿Qué es?',
            navBenefits: 'Beneficios',
            navPlay: 'Juego',
            navBuy: 'Comprar',
            mNavWhat: '¿Qué es?',
            mNavBenefits: 'Beneficios',
            mNavPlay: 'Juego',
            mNavBuy: 'Comprar',
            closeMenu: 'Cerrar',
            /* ---- Hero ---- */
            heroBadge: 'DESENGRASANTE PROFESIONAL',
            heroTitle: 'El Poder Cítrico Para Tu <span>Parrilla</span>',
            heroDesc: 'CTX Grill Degreaser es el desengrasante biodegradable #1 para parrillas, asadores y cocinas comerciales. Fórmula profesional con aroma a toronja que elimina la grasa al instante.',
            feat1: 'Biodegradable',
            feat2: 'Aroma Cítrico',
            feat3: 'Acción Rápida',
            heroCta1: 'Comprar Ahora',
            heroCta2: 'Conocer Más',
            label1: 'Eco-Friendly',
            label2: 'Poder Toronja',
            label3: 'Grado Profesional',
            /* ---- What Is ---- */
            whatTitle: '¿Qué es CTX Grill Degreaser?',
            whatDesc: 'Un desengrasante de grado profesional diseñado específicamente para eliminar grasa, aceite y residuos de parrillas, asadores y superficies de cocina.',
            card1Title: 'Limpieza Profunda',
            card1Desc: 'Penetra y emulsifica grasas y aceites para un enjuague sin esfuerzo.',
            card2Title: 'Poder Cítrico',
            card2Desc: 'Fórmula a base de toronja, segura para uso doméstico o profesional.',
            card3Title: 'Fácil de Usar',
            card3Desc: 'Rocía, espera 5–15 minutos, cepilla y enjuaga. ¡Así de simple!',
            /* ---- Benefits ---- */
            benefitsTitle: 'Beneficios del Producto',
            benefitsDesc: 'CTX Grill Degreaser ofrece ventajas únicas que lo hacen el mejor desengrasante del mercado.',
            ben1Title: 'Fórmula Ecológica',
            ben1Desc: 'A base de agua, libre de COV, plomo y metales pesados.',
            ben2Title: 'Indicador de Color',
            ben2Desc: 'Se vuelve blanco al contacto con la grasa para confirmación visual.',
            ben3Title: 'Aroma Fresco',
            ben3Desc: 'El aroma a toronja mantiene tu cocina limpia y fresca.',
            ben4Title: 'Uso Versátil',
            ben4Desc: 'Perfecto para parrillas, sartenes, hornos, air fryers y más.',
            /* ---- Uses ---- */
            usesTitle: '¿Dónde Usar CTX Grill Degreaser?',
            usesDesc: 'Diseñado para múltiples superficies y aplicaciones.',
            use1: '🔥 Parrillas',
            use2: '🍳 Planchas',
            use3: '🔥 Estufas',
            use4: '🥘 Hornos',
            use5: '🍟 Air Fryers',
            use6: '🏪 Restaurantes',
            use7: '🚚 Food Trucks',
            use8: '🥩 Asadores',
            /* ---- FAQ ---- */
            faqHeading: 'Preguntas Frecuentes',
            faqDesc: 'Todo lo que necesitas saber sobre CTX Grill Degreaser.',
            faq1Q: '¿Es seguro para superficies de cocina?',
            faq1A: 'Sí. CTX es a base de agua, libre de COV y no tóxico — seguro para superficies en contacto con alimentos después de enjuagar.',
            faq2Q: '¿Cómo se usa?',
            faq2A: 'Rocía, espera 5–15 minutos, cepilla y enjuaga. El indicador de color cambia a blanco al contactar la grasa.',
            faq3Q: '¿Dónde comprarlo?',
            faq3A: 'Disponible en línea en <a href="https://campsite.bio/ctxshop" target="_blank" rel="noopener noreferrer" style="color:var(--acid)">campsite.bio/ctxshop</a>. Para mayoreo contacta al (832) 948-6169.',
            /* ---- Game ---- */
            gameTitle: '🎮 ¡Prueba el Poder de CTX!',
            gameDesc: 'Usa el spray para eliminar las bacterias de la parrilla. ¡Tienes 15 segundos!',
            gameInstructions: '👆 Toca o haz clic y arrastra para rociar',
            restartBtn: 'Reiniciar',
            scoreLabel: 'Kills',
            gameWin: '<strong>¡Misión cumplida!</strong><br>Bacterias eliminadas.<br><a href="#" style="color:var(--acid)" onclick="window.startAgain(event)">Jugar de nuevo</a>',
            gameLose: '¡Tiempo! <strong>{{score}}</strong> bacterias.<br><a href="#" style="color:var(--acid)" onclick="window.startAgain(event)">Reintentar</a>',
            gameStart: '👆 Toca para comenzar',
            /* ---- Gallery ---- */
            galleryTitle: 'Galería de Contenido',
            galleryDesc: 'Videos con tips de uso, demostraciones y resultados.',
            /* ---- Contact ---- */
            contactTitle: '📞 ¿Preguntas? ¡Contáctanos!',
            contactDesc: 'Estamos disponibles para pedidos, distribución y soporte técnico.',
            callLabel: 'Llamar',
            smsLabel: 'SMS',
            /* ---- Docs ---- */
            docsTitle: 'Documentos Técnicos',
            docsDesc: 'Descarga las fichas con especificaciones y recomendaciones.',
            /* ---- Buy ---- */
            buyTitle: '¿Listo para una Parrilla Limpia?',
            buyDesc: 'Compra CTX Grill Degreaser hoy y descubre el poder de la limpieza profesional.',
            buyCta1: 'Comprar en Línea',
            buyCta2: 'Contactar Ventas',
            contactInfo: 'Contacto:',
            /* ---- Sticky / Footer ---- */
            stickyCta1: 'Comprar',
            stickyCta2: 'Beneficios',
            footerTagline: 'El poder cítrico para tu parrilla',
            /* ---- Benefits Sheet ---- */
            sheetTitle: 'Beneficios de CTX',
            closeBeneficios: 'Cerrar',
            sheetBen1: '<strong>Limpieza profunda:</strong> Formulado para limpieza intensiva de parrillas y utensilios.',
            sheetBen2: '<strong>Fórmula ecológica:</strong> A base de agua, libre de COV y metales pesados.',
            sheetBen3: '<strong>Indicador de color:</strong> Se vuelve blanco al contacto con la grasa.',
            sheetBen4: '<strong>Aroma cítrico:</strong> El aroma a toronja mantiene tu cocina fresca.',
            sheetBen5: '<strong>Uso versátil:</strong> Seguro para ti, tus superficies y el medio ambiente.',
        },
        en: {
            /* ---- Loader ---- */
            loaderText: 'LOADING...',
            /* ---- Nav ---- */
            navWhat: 'What is it?',
            navBenefits: 'Benefits',
            navPlay: 'Game',
            navBuy: 'Buy',
            mNavWhat: 'What is it?',
            mNavBenefits: 'Benefits',
            mNavPlay: 'Game',
            mNavBuy: 'Buy',
            closeMenu: 'Close',
            /* ---- Hero ---- */
            heroBadge: 'PROFESSIONAL DEGREASER',
            heroTitle: 'The Citrus Power For Your <span>Grill</span>',
            heroDesc: 'CTX Grill Degreaser is the #1 biodegradable degreaser for grills, smokers, and commercial kitchens. Professional formula with grapefruit scent that removes grease instantly.',
            feat1: 'Biodegradable',
            feat2: 'Citrus Scent',
            feat3: 'Fast Action',
            heroCta1: 'Buy Now',
            heroCta2: 'Learn More',
            label1: 'Eco-Friendly',
            label2: 'Grapefruit Power',
            label3: 'Professional Grade',
            /* ---- What Is ---- */
            whatTitle: 'What is CTX Grill Degreaser?',
            whatDesc: 'A professional-grade degreaser specifically designed to remove grease, oil, and food residue from grills, smokers, and kitchen surfaces.',
            card1Title: 'Deep Cleaning',
            card1Desc: 'Penetrates and emulsifies grease and oils for effortless rinsing.',
            card2Title: 'Citrus Power',
            card2Desc: 'Grapefruit-based formula, safe for home or professional use.',
            card3Title: 'Easy to Use',
            card3Desc: 'Spray, wait 5–15 minutes, scrub and rinse. That simple!',
            /* ---- Benefits ---- */
            benefitsTitle: 'Product Benefits',
            benefitsDesc: 'CTX Grill Degreaser offers unique advantages that make it the best degreaser on the market.',
            ben1Title: 'Eco-Friendly Formula',
            ben1Desc: 'Water-based, free of VOCs, lead and heavy metals.',
            ben2Title: 'Color Indicator',
            ben2Desc: 'Turns white on contact with grease for visual confirmation.',
            ben3Title: 'Fresh Scent',
            ben3Desc: 'Grapefruit aroma keeps your kitchen clean and fresh.',
            ben4Title: 'Versatile Use',
            ben4Desc: 'Perfect for grills, pans, ovens, air fryers and more.',
            /* ---- Uses ---- */
            usesTitle: 'Where to Use CTX Grill Degreaser?',
            usesDesc: 'Designed for multiple surfaces and applications.',
            use1: '🔥 Grills',
            use2: '🍳 Griddles',
            use3: '🔥 Stoves',
            use4: '🥘 Ovens',
            use5: '🍟 Air Fryers',
            use6: '🏪 Commercial',
            use7: '🚚 Food Trucks',
            use8: '🥩 Smokers',
            /* ---- FAQ ---- */
            faqHeading: 'Frequently Asked Questions',
            faqDesc: 'Everything you need to know about CTX Grill Degreaser.',
            faq1Q: 'Is it safe for kitchen surfaces?',
            faq1A: 'Yes. CTX is water-based, VOC-free, and non-toxic — safe for food-contact surfaces after thorough rinsing.',
            faq2Q: 'How do you use it?',
            faq2A: 'Spray, wait 5–15 minutes, scrub and rinse. The color-change indicator turns white on contact with grease.',
            faq3Q: 'Where can I buy it?',
            faq3A: 'Available online at <a href="https://campsite.bio/ctxshop" target="_blank" rel="noopener noreferrer" style="color:var(--acid)">campsite.bio/ctxshop</a>. For wholesale orders call (832) 948-6169.',
            /* ---- Game ---- */
            gameTitle: '🎮 Try the Power of CTX!',
            gameDesc: 'Use the spray to eliminate bacteria from the grill. You have 15 seconds!',
            gameInstructions: '👆 Tap or click and drag to spray',
            restartBtn: 'Restart',
            scoreLabel: 'Kills',
            gameWin: '<strong>Mission accomplished!</strong><br>Bacteria eliminated.<br><a href="#" style="color:var(--acid)" onclick="window.startAgain(event)">Play again</a>',
            gameLose: "Time's up! <strong>{{score}}</strong> bacteria.<br><a href=\"#\" style=\"color:var(--acid)\" onclick=\"window.startAgain(event)\">Try again</a>",
            gameStart: '👆 Tap to start',
            /* ---- Gallery ---- */
            galleryTitle: 'Content Gallery',
            galleryDesc: 'Videos with usage tips, demos and results.',
            /* ---- Contact ---- */
            contactTitle: '📞 Questions? Contact Us!',
            contactDesc: "We're available for orders, distribution and technical support.",
            callLabel: 'Call',
            smsLabel: 'SMS',
            /* ---- Docs ---- */
            docsTitle: 'Technical Documents',
            docsDesc: 'Download spec sheets with specifications and recommendations.',
            /* ---- Buy ---- */
            buyTitle: 'Ready for a Clean Grill?',
            buyDesc: 'Buy CTX Grill Degreaser today and discover the power of professional cleaning.',
            buyCta1: 'Buy Online',
            buyCta2: 'Contact Sales',
            contactInfo: 'Contact:',
            /* ---- Sticky / Footer ---- */
            stickyCta1: 'Buy',
            stickyCta2: 'Benefits',
            footerTagline: 'The citrus power for your grill',
            /* ---- Benefits Sheet ---- */
            sheetTitle: 'CTX Benefits',
            closeBeneficios: 'Close',
            sheetBen1: '<strong>Deep cleaning:</strong> Formulated for intensive cleaning of grills and utensils.',
            sheetBen2: '<strong>Eco-friendly formula:</strong> Water-based, free of VOCs and heavy metals.',
            sheetBen3: '<strong>Color indicator:</strong> Turns white on contact with grease.',
            sheetBen4: '<strong>Citrus scent:</strong> Grapefruit aroma keeps your kitchen fresh.',
            sheetBen5: '<strong>Versatile use:</strong> Safe for you, your surfaces and the environment.',
        }
    };

    /* Keys that contain HTML (use innerHTML) */
    const HTML_KEYS = new Set([
        'heroTitle','sheetBen1','sheetBen2','sheetBen3','sheetBen4','sheetBen5',
        'faq1A','faq2A','faq3A',
        'gameWin','gameLose',
        'ben1Title','ben2Title','ben3Title','ben4Title',
        'ben1Desc','ben2Desc','ben3Desc','ben4Desc',
        'whatTitle','whatDesc','benefitsTitle','benefitsDesc',
        'card1Title','card1Desc','card2Title','card2Desc','card3Title','card3Desc',
        'contactTitle','contactDesc','galleryTitle','galleryDesc',
        'docsTitle','docsDesc','buyTitle','buyDesc','usesTitle','usesDesc',
        'faqHeading','faqDesc','faq1Q','faq2Q','faq3Q','sheetTitle'
    ]);

    function setBtn(btn, nextLang) {
        if (!btn) return;
        const isEN = nextLang === 'en';
        btn.innerHTML = `<span class="flag">${isEN ? US_FLAG : MX_FLAG}</span><span>${isEN ? 'EN' : 'ES'}</span>`;
        btn.setAttribute('aria-label', isEN ? 'Switch to English' : 'Cambiar a español');
    }

    function apply(lang) {
        const m = i18n[lang];
        document.documentElement.lang = lang === 'en' ? 'en-US' : 'es-ES';

        Object.keys(m).forEach(id => {
            const el = $('#' + id);
            if (!el) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = m[id];
            } else if (HTML_KEYS.has(id)) {
                el.innerHTML = m[id];
            } else {
                el.textContent = m[id];
            }
        });

        setBtn($('#langToggle'), lang === 'es' ? 'en' : 'es');
        setBtn($('#mLangToggle'), lang === 'es' ? 'en' : 'es');
        window.__scoreLabel = m.scoreLabel;
        window.__gameStrings = {
            winHtml:   m.gameWin,
            loseHtml:  m.gameLose,
            startHtml: '👆 ' + m.gameStart
        };
        const scoreEl = $('#score');
        if (scoreEl) scoreEl.textContent = m.scoreLabel + ': ' + (window.__score || 0);
    }

    /* Determine initial language */
    const params = new URLSearchParams(location.search);
    let current = params.get('lang')?.startsWith('en') ? 'en' : 'es';
    try {
        const saved = localStorage.getItem('ctx-lang');
        if (saved === 'en' || saved === 'es') current = saved;
    } catch (e) { }

    /* IP-based detection for first-time visitors */
    async function detectByIP() {
        try {
            const saved = localStorage.getItem('ctx-lang');
            if (saved) return;
            const resp = await fetch('https://ipapi.co/json/');
            const data = await resp.json();
            const spanishCountries = ['MX','ES','AR','CO','PE','VE','CL','EC','GT','CU','BO','DO','HN','PY','SV','NI','CR','PA','UY','PR'];
            current = spanishCountries.includes(data.country_code) ? 'es' : 'en';
            apply(current);
        } catch (e) {
            const browserLang = navigator.language || 'en';
            current = browserLang.startsWith('es') ? 'es' : 'en';
            apply(current);
        }
    }

    apply(current);
    detectByIP();

    function toggle() {
        current = current === 'es' ? 'en' : 'es';
        apply(current);
        try { localStorage.setItem('ctx-lang', current); } catch (e) { }
        const url = new URL(location.href);
        url.searchParams.set('lang', current);
        history.replaceState(null, '', url.toString());
    }

    $('#langToggle')?.addEventListener('click', e => { e.preventDefault(); toggle(); });
    $('#mLangToggle')?.addEventListener('click', e => { e.preventDefault(); toggle(); });
})();
