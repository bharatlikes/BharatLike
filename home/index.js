// Page-specific JavaScript for Home page
console.log('Home page script loaded.');

// Dark mode toggle
function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// Load dark mode preference
window.addEventListener('load', () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
  
  // Smooth scroll behavior for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Add animation to hero stats on page load
  animateHeroStats();
  
  // Setup intersection observer for scroll animations
  setupScrollAnimations();
  
  // Add counter animations to stat badges
  setupStatCounters();
});

// Animate hero stats numbers
function animateHeroStats() {
  const stats = document.querySelectorAll('.stat-number');
  stats.forEach(stat => {
    const finalValue = stat.textContent;
    const isNumber = /^\d+/.test(finalValue);
    
    if (isNumber) {
      let currentValue = 0;
      const target = parseInt(finalValue);
      const increment = target / 30;
      const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= target) {
          stat.textContent = finalValue;
          clearInterval(timer);
        } else {
          stat.textContent = Math.floor(currentValue) + (finalValue.includes('K') ? 'K+' : finalValue.includes('M') ? 'M+' : '+');
        }
      }, 50);
    }
  });
}

// Setup counters for stats
function setupStatCounters() {
  const observed = new Set();
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !observed.has(entry.target)) {
        observed.add(entry.target);
        const number = entry.target.textContent;
        if (/^\d+/.test(number)) {
          animateNumber(entry.target, number);
        }
      }
    });
  }, {
    threshold: 0.5
  });
  
  document.querySelectorAll('.stat-number').forEach(el => {
    observer.observe(el);
  });
}

function animateNumber(element, finalValue) {
  const target = parseInt(finalValue);
  let current = 0;
  const increment = Math.ceil(target / 30);
  
  const interval = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = finalValue;
      clearInterval(interval);
    } else {
      element.textContent = current;
    }
  }, 50);
}

// Intersection Observer for scroll animations
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add animation class or trigger animations
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all cards and sections
  document.querySelectorAll(
    '.process-card, .benefit-card, .service-box, .testimonial-card, .feature-card'
  ).forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// Add hover effects to cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.process-card, .benefit-card, .service-box, .testimonial-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s ease';
    });
  });
});

// Smooth page transitions
window.addEventListener('beforeunload', () => {
  document.body.style.opacity = '0.8';
});

// Add ripple effect to buttons
document.querySelectorAll('.btn-primary, .btn-secondary, .btn-small').forEach(button => {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Lazy load images
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}