/* ═══════════════════════════════════════════════════════════
   WK-Hub Marketing — Animation Engine
   Premium motion system with scroll reveals, ambient canvas,
   counter animations, and micro-interactions
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Reduced Motion Check ───
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ═══════════════════════════════════════════
  // 1. AMBIENT BACKGROUND CANVAS
  // ═══════════════════════════════════════════
  function initAmbientCanvas() {
    if (prefersReducedMotion) return;

    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let animationId;
    let time = 0;

    // Organic blobs
    const blobs = [
      { x: 0.2, y: 0.3, radius: 0.15, speed: 0.0003, phase: 0, color: 'rgba(212,168,83,0.025)' },
      { x: 0.7, y: 0.6, radius: 0.2,  speed: 0.0002, phase: 2, color: 'rgba(79,124,255,0.018)' },
      { x: 0.5, y: 0.2, radius: 0.12, speed: 0.00035, phase: 4, color: 'rgba(212,168,83,0.02)' },
      { x: 0.8, y: 0.8, radius: 0.18, speed: 0.00025, phase: 1, color: 'rgba(150,130,200,0.015)' },
    ];

    // Expose blobs so theme toggle can re-tint them
    canvas._blobs = blobs;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);
    }

    function draw() {
      time++;
      ctx.clearRect(0, 0, width, height);

      blobs.forEach(blob => {
        const cx = width * (blob.x + Math.sin(time * blob.speed + blob.phase) * 0.08);
        const cy = height * (blob.y + Math.cos(time * blob.speed * 0.7 + blob.phase) * 0.06);
        const r = Math.min(width, height) * blob.radius;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 200);
    });

    // Pause when tab not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        draw();
      }
    });
  }

  // ═══════════════════════════════════════════
  // 2. SCROLL REVEAL SYSTEM
  // ═══════════════════════════════════════════
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if (prefersReducedMotion) {
      reveals.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay || '0', 10);
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    reveals.forEach(el => observer.observe(el));
  }

  // ═══════════════════════════════════════════
  // 3. NAVIGATION
  // ═══════════════════════════════════════════
  function initNavigation() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!nav || !toggle || !menu) return;
    const links = menu.querySelectorAll('.nav__link');

    // Scroll detection
    let lastScroll = 0;
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          nav.classList.toggle('scrolled', scrollY > 50);
          lastScroll = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = nav.offsetHeight + 20;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ═══════════════════════════════════════════
  // 4. NUMBER COUNTER ANIMATION
  // ═══════════════════════════════════════════
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => observer.observe(el));

    function animateCounter(el) {
      const target = parseInt(el.dataset.count, 10);
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      if (prefersReducedMotion) {
        el.textContent = target;
      } else {
        requestAnimationFrame(update);
      }
    }
  }

  // ═══════════════════════════════════════════
  // 5. SCREEN MOCKUP PARALLAX
  // ═══════════════════════════════════════════
  function initScreenParallax() {
    if (prefersReducedMotion) return;

    const screens = document.querySelector('.experience__screens');
    if (!screens) return;

    const front = screens.querySelector('.experience__screen--front');
    const mid = screens.querySelector('.experience__screen--mid');
    const back = screens.querySelector('.experience__screen--back');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            window.addEventListener('scroll', onScroll, { passive: true });
          } else {
            window.removeEventListener('scroll', onScroll);
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(screens);

    function onScroll() {
      requestAnimationFrame(() => {
        const rect = screens.getBoundingClientRect();
        const viewH = window.innerHeight;
        const progress = 1 - (rect.top + rect.height) / (viewH + rect.height);
        const p = Math.max(0, Math.min(1, progress));

        if (front) {
          front.style.transform = `rotateY(${2 - p * 4}deg) translateY(${p * -8}px)`;
        }
        if (mid) {
          mid.style.transform = `rotateY(${5 - p * 6}deg) rotateX(${1 - p}deg) translateZ(${-30 + p * 15}px) translateY(${p * -12}px)`;
        }
        if (back) {
          back.style.transform = `rotateY(${8 - p * 8}deg) rotateX(${2 - p * 2}deg) translateZ(${-60 + p * 20}px) translateY(${p * -16}px)`;
          back.style.opacity = 0.5 + p * 0.3;
        }
      });
    }
  }

  // ═══════════════════════════════════════════
  // 6. CARD TILT MICRO-INTERACTION
  // ═══════════════════════════════════════════
  function initCardTilt() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.feature-card, .service-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = `translateY(-4px) perspective(600px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ═══════════════════════════════════════════
  // 7. MAGNETIC BUTTON EFFECT
  // ═══════════════════════════════════════════
  function initMagneticButtons() {
    if (prefersReducedMotion) return;

    const buttons = document.querySelectorAll('.btn--primary');

    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `scale(1.05) translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ═══════════════════════════════════════════
  // 8. ACTIVE SECTION TRACKING
  // ═══════════════════════════════════════════
  function initSectionTracking() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
              link.style.color = link.getAttribute('href') === `#${id}`
                ? 'var(--text-primary)'
                : '';
            });
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-72px 0px -40% 0px'
      }
    );

    sections.forEach(section => observer.observe(section));
  }

  // ═══════════════════════════════════════════
  // 9. SMOOTH PIXEL NOISE (very subtle)
  // ═══════════════════════════════════════════
  function initNoiseOverlay() {
    if (prefersReducedMotion) return;

    const style = document.createElement('style');
    style.textContent = `
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: none;
        opacity: 0.015;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        background-repeat: repeat;
        background-size: 128px 128px;
      }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════
  // 10. PRODUCT FLOW HORIZONTAL SCROLL HINT
  // ═══════════════════════════════════════════
  function initFlowScroll() {
    const flow = document.querySelector('.product__flow');
    if (!flow) return;

    // Add fade edges if scrollable
    function checkScroll() {
      const { scrollLeft, scrollWidth, clientWidth } = flow;
      const isScrollable = scrollWidth > clientWidth;

      if (isScrollable) {
        flow.style.maskImage = scrollLeft <= 10
          ? 'linear-gradient(to right, black 90%, transparent)'
          : scrollLeft >= scrollWidth - clientWidth - 10
            ? 'linear-gradient(to left, black 90%, transparent)'
            : 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)';
        flow.style.webkitMaskImage = flow.style.maskImage;
      } else {
        flow.style.maskImage = 'none';
        flow.style.webkitMaskImage = 'none';
      }
    }

    flow.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    checkScroll();
  }

  // ═══════════════════════════════════════════
  // 11. CURSOR GLOW EFFECT (desktop only)
  // ═══════════════════════════════════════════
  function initCursorGlow() {
    if (prefersReducedMotion) return;
    if (window.innerWidth < 768) return;
    if ('ontouchstart' in window) return;

    const glow = document.createElement('div');
    glow.setAttribute('aria-hidden', 'true');
    Object.assign(glow.style, {
      position: 'fixed',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(212,168,83,0.04) 0%, transparent 60%)',
      pointerEvents: 'none',
      zIndex: '0',
      transform: 'translate(-50%, -50%)',
      transition: 'opacity 0.3s',
      opacity: '0'
    });
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });

    function updateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      requestAnimationFrame(updateGlow);
    }

    requestAnimationFrame(updateGlow);
  }

  // ═══════════════════════════════════════════
  // 12. THEME TOGGLE (Light / Dark)
  // ═══════════════════════════════════════════
  function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const STORAGE_KEY = 'wk-theme';
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');

    // Light-mode blob colours for the ambient canvas
    const lightBlobs = [
      'rgba(212,168,83,0.06)',
      'rgba(79,124,255,0.05)',
      'rgba(212,168,83,0.04)',
      'rgba(150,130,200,0.04)',
    ];
    const darkBlobs = [
      'rgba(212,168,83,0.025)',
      'rgba(79,124,255,0.018)',
      'rgba(212,168,83,0.02)',
      'rgba(150,130,200,0.015)',
    ];

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f5f0' : '#0a0a12');

      // Re-tint ambient blobs
      const canvas = document.getElementById('ambient-canvas');
      if (canvas && canvas._blobs) {
        const palette = theme === 'light' ? lightBlobs : darkBlobs;
        canvas._blobs.forEach((b, i) => { b.color = palette[i] || b.color; });
      }
    }

    // Restore saved preference (default: dark)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) applyTheme(saved);

    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  // ═══════════════════════════════════════════
  // INITIALIZE
  // ═══════════════════════════════════════════
  function init() {
    initThemeToggle();
    initAmbientCanvas();
    initScrollReveal();
    initNavigation();
    initCounters();
    initScreenParallax();
    initCardTilt();
    initMagneticButtons();
    initSectionTracking();
    initNoiseOverlay();
    initFlowScroll();
    initCursorGlow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
