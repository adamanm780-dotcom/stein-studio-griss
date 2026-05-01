/* Stein-Studio Inge Griss — Interaktionen */

(() => {
  'use strict';

  /* ---------- Jahr im Footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Mobile-Menü ---------- */
  const burger = document.querySelector('.topbar__burger');
  const mobile = document.getElementById('mobile-menu');
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      if (open) {
        mobile.setAttribute('hidden', '');
      } else {
        mobile.removeAttribute('hidden');
      }
    });
    mobile.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        mobile.setAttribute('hidden', '');
      });
    });
  }

  /* ---------- Reveal-on-Scroll ---------- */
  // Kandidaten markieren
  const revealTargets = [
    '.hero__title',
    '.hero__lede',
    '.hero__actions',
    '.hero__crystal',
    '.manifest__title',
    '.manifest__cols',
    '.section-head',
    '.welt',
    '.specimen',
    '.atelier__art',
    '.atelier__text',
    '.card',
    '.besuch__map',
    '.finale__title',
    '.finale__actions',
  ];
  revealTargets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      if (i % 4 === 1) el.classList.add('reveal--delay-1');
      if (i % 4 === 2) el.classList.add('reveal--delay-2');
      if (i % 4 === 3) el.classList.add('reveal--delay-3');
    });
  });

  const revealAll = () => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Sofort sichtbar machen, was beim Laden schon im Viewport ist
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
          el.classList.add('is-visible');
        }
      });
    });

    // Sicherheits-Fallback: nach 2.5s zwangsweise alles zeigen
    // (verhindert leere Sektionen bei langsamem Scroll-Verhalten oder Headless-Browsern)
    setTimeout(revealAll, 2500);
  } else {
    revealAll();
  }

  /* ---------- Smooth-Scroll-Offset für Anker (Topbar berücksichtigen) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const topbar = document.querySelector('.topbar');
      const offset = (topbar?.getBoundingClientRect().height || 0) + 12;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- Topbar Schatten beim Scrollen ---------- */
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const onScroll = () => {
      if (window.scrollY > 8) {
        topbar.style.boxShadow = '0 1px 0 rgba(28,24,18,0.08), 0 6px 24px -16px rgba(28,24,18,0.18)';
      } else {
        topbar.style.boxShadow = 'none';
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Hero-Zug · scroll-gesteuerte 50-Frame-Animation ---------- */
  const zug = document.querySelector('.hero__zug');
  const heroSection = document.querySelector('.hero');
  if (zug && heroSection) {
    const total = parseInt(zug.dataset.frames, 10) || 50;
    const path = zug.dataset.framePath || 'assets/hero-zug/frame-';
    const ext = zug.dataset.frameExt || '.webp';
    const canvas = zug.querySelector('.hero__zug-canvas');
    const fallback = zug.querySelector('.hero__zug-fallback');
    const ctx = canvas && canvas.getContext('2d');

    const pad = (n) => String(n).padStart(3, '0');
    const frames = new Array(total);
    let currentFrame = -1;

    const draw = (idx) => {
      if (!ctx) return;
      const img = frames[idx];
      if (!img || !img.complete || !img.naturalWidth) return;
      if (currentFrame === idx) return;
      currentFrame = idx;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (fallback && !fallback.hidden) fallback.hidden = true;
    };

    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = `${path}${pad(i + 1)}${ext}`;
      img.onload = () => { if (i === 0) draw(0); else if (i === currentFrame) draw(i); };
      frames[i] = img;
    }

    let pending = false;
    const updateZug = () => {
      pending = false;
      const rect = heroSection.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Sticky-Pin: Hero ist hoeher als Viewport. Frame-Progress laeuft ueber die
      // ueberschuessige Hoehe (rect.height - vh). Solange rect.top > 0 (Hero noch
      // unterhalb des Viewports) bleibt Frame 1 stehen.
      const stickySpan = Math.max(rect.height - vh, 1);
      const scrolled = Math.max(0, -rect.top);
      let progress = scrolled / stickySpan;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      const idx = Math.min(total - 1, Math.round(progress * (total - 1)));
      draw(idx);
    };
    const onZugScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(updateZug);
    };
    window.addEventListener('scroll', onZugScroll, { passive: true });
    window.addEventListener('resize', onZugScroll, { passive: true });
    updateZug();
  }

})();
