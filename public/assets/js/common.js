/* Common JavaScript helper file for Kiki Traiteur */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const toggleBtn = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('nav');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const isExpanded = navMenu.classList.contains('active');
      toggleBtn.setAttribute('aria-expanded', isExpanded);
    });
  }

  // Active Navigation link highlighter
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Setup generic animations (Intersection Observer)
  const animElements = document.querySelectorAll('.animate-fade');
  if ('IntersectionObserver' in window && animElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animElements.forEach(el => observer.observe(el));
  }

  // Also observe generic reveal elements (useful for sections and images)
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length > 0) {
    const revObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade', 'visible');
          revObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revObserver.observe(el));
  }

  // Initial page load fade for main container (if present)
  const mainCont = document.querySelector('.container');
  if (mainCont) {
    mainCont.classList.add('animate-fade');
    // small timeout so transition feels natural
    setTimeout(() => mainCont.classList.add('visible'), 80);
  }
});

// Toast notification helper
function showToast(message, isError = false) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-msg show ${isError ? 'error' : ''}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}
