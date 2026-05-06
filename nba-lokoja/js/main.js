/* ============================================
   NBA LOKOJA — MAIN JAVASCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ===== Icon Library (Font Awesome) =====
  if (!document.querySelector('link[data-fa]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    fa.referrerPolicy = 'no-referrer';
    fa.setAttribute('data-fa', '1');
    document.head.appendChild(fa);
  }

  // ===== Favicon (NBA Logo) =====
  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/png';
    icon.href = (window.BASE || '') + 'assets/nba-logo.png';
    document.head.appendChild(icon);
  }

  // ===== Mobile Menu Toggle =====
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }

  // ===== Mobile Dropdown =====
  document.querySelectorAll('.has-dropdown > a').forEach(a => {
    a.addEventListener('click', (e) => {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        a.parentElement.classList.toggle('open');
      }
    });
  });

  // ===== Sticky Header on Scroll =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ===== Highlight Active Nav Link =====
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.split('/').pop() === path) a.classList.add('active');
  });

  // ===== Fade-in Animation Observer =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ===== Counter Animation =====
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let current = 0;
          const step = Math.max(1, Math.ceil(target / 60));
          const interval = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(interval); }
            el.textContent = current.toLocaleString();
          }, 25);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counterObserver.observe(el);
  });

  // ===== Form Validation Helper =====
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      let valid = true;
      form.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = 'var(--red)';
          valid = false;
        } else { input.style.borderColor = ''; }
      });
      if (!valid) {
        e.preventDefault();
        showToast('Please fill in all required fields', 'error');
      }
    });
  });

  // ===== FAQ Accordion =====
  document.querySelectorAll('.faq-item .faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ===== Newsletter Stub =====
  document.querySelectorAll('form.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      if (email) {
        showToast('Thank you! You have been subscribed.', 'success');
        form.reset();
      }
    });
  });
});

// ===== Toast Notification =====
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colors = {
    success: 'var(--green)',
    error: 'var(--red)',
    info: 'var(--navy)'
  };
  toast.style.cssText = `background:${colors[type]||colors.info};color:white;padding:14px 20px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-size:0.9rem;font-weight:500;min-width:280px;animation:slideIn 0.3s ease;`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Inject toast keyframe
if (!document.querySelector('#toast-style')) {
  const style = document.createElement('style');
  style.id = 'toast-style';
  style.textContent = '@keyframes slideIn{from{transform:translateX(120%);opacity:0;}to{transform:translateX(0);opacity:1;}}';
  document.head.appendChild(style);
}

// Sidebar toggle for portal
document.addEventListener('click', (e) => {
  if (e.target.closest('.sidebar-toggle')) {
    document.querySelector('.sidebar')?.classList.toggle('open');
  }
});
