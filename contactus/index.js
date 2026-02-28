// Page-specific JavaScript for Contact Us page
console.log('Contact Us page script loaded.');

// Dark mode toggle
function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// Load dark mode preference and smooth scroll behavior
window.addEventListener('load', () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }

  // Smooth scroll behavior
  document.querySelectorAll('a[href^="/"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.startsWith('/')) {
        // Let default navigation handle it for SPA routing
      }
    });
  });
});

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animation =
        getComputedStyle(entry.target).animation ||
        'fadeInUp 0.8s ease forwards';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe cards on page load
window.addEventListener('load', () => {
  document
    .querySelectorAll('.feature-card, .price-card, .section')
    .forEach((el) => {
      observer.observe(el);
    });
});
