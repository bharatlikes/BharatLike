// ── Dark Mode ──────────────────────────────────────────────
function toggleDark() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark);
  const btn = document.getElementById('darkToggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// ── Mobile Nav ─────────────────────────────────────────────
function toggleNav() {
  const nav = document.getElementById('main-nav');
  const hamburger = document.getElementById('hamburger');
  if (!nav) return;
  nav.classList.toggle('open');
  hamburger.classList.toggle('open');
}

function closeMobileNav() {
  const nav = document.getElementById('main-nav');
  const hamburger = document.getElementById('hamburger');
  if (nav) nav.classList.remove('open');
  if (hamburger) hamburger.classList.remove('open');
}

// ── Ripple Effect ───────────────────────────────────────────
function addRipple(e) {
  const btn = e.currentTarget;
  const ripple = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;`;
  ripple.classList.add('ripple');
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ── Counter Animation ───────────────────────────────────────
function animateCounter(el, finalText) {
  const num = parseInt(finalText);
  if (isNaN(num)) return;
  const suffix = finalText.replace(/\d/g, '');
  let current = 0;
  const increment = Math.ceil(num / 40);
  const interval = setInterval(() => {
    current = Math.min(current + increment, num);
    el.textContent = current + suffix;
    if (current >= num) {
      el.textContent = finalText;
      clearInterval(interval);
    }
  }, 40);
}

// ── Scroll Animations ───────────────────────────────────────
function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );
  document
    .querySelectorAll(
      '.process-card,.benefit-card,.service-box,.testimonial-card,.feature-card,.price-card'
    )
    .forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });
}

function setupCounters() {
  const seen = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          animateCounter(entry.target, entry.target.dataset.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('.stat-number').forEach((el) => {
    el.dataset.target = el.textContent.trim();
    observer.observe(el);
  });
}

// ── Smooth Scroll ───────────────────────────────────────────
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // Ignore plain "#" links
      if (!href || href === '#' || href.length <= 1) {
        return;
      }

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMobileNav();
      }
    });
  });
}
function setupNavLinkClose() {
  document.querySelectorAll('#main-nav a:not([href^="#"])').forEach((a) => {
    a.addEventListener('click', closeMobileNav);
  });
}

// ── Lazy Images ─────────────────────────────────────────────
function setupLazyImages() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        obs.unobserve(img);
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach((img) => obs.observe(img));
}

// ── Init ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    const btn = document.getElementById('darkToggle');
    if (btn) btn.textContent = '☀️';
  }
  setupSmoothScroll();
  setupNavLinkClose();
  setupScrollAnimations();
  setupCounters();
  setupLazyImages();
  document
    .querySelectorAll('.btn-primary,.btn-secondary,.btn-small')
    .forEach((btn) => {
      btn.addEventListener('click', addRipple);
    });
});

window.addEventListener('beforeunload', () => {
  document.body.style.opacity = '0.8';
});
