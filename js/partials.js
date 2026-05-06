/* ============================================
   SHARED HEADER & FOOTER PARTIALS
   Auto-injected into pages with [data-include] tags
   ============================================ */

const HEADER_HTML = `
<div class="topbar">
  <div class="container">
    <div class="topbar-left">
      <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> No. 1 Bar Centre Avenue, GRA, Lokoja, Kogi State</span>
      <span><i class="fa-solid fa-phone" aria-hidden="true"></i> +234 803 000 0000</span>
    </div>
    <div class="topbar-right">
      <a href="mailto:secretariat@nbalokoja.org"><i class="fa-solid fa-envelope" aria-hidden="true"></i> secretariat@nbalokoja.org</a>
      <a href="${BASE}portal/login.html">Member Login</a>
    </div>
  </div>
</div>
<header class="header">
  <div class="container">
    <nav class="nav" aria-label="Primary">
      <a href="${BASE}index.html" class="logo">
        <div class="logo-mark"><img src="${BASE}assets/nba-logo.png" alt="Nigerian Bar Association logo"></div>
        <div class="logo-text">
          <div class="top">NBA Lokoja</div>
          <div class="bottom">Nigerian Bar Association</div>
        </div>
      </a>
      <ul class="nav-menu" id="navMenu">
        <li><a href="${BASE}index.html">Home</a></li>
        <li class="has-dropdown">
          <a href="${BASE}pages/about.html">About Us</a>
          <ul class="dropdown">
            <li><a href="${BASE}pages/about.html">About the Branch</a></li>
            <li><a href="${BASE}pages/leadership.html">Branch Leadership</a></li>
            <li><a href="${BASE}pages/executive.html">Executive Committee</a></li>
            <li><a href="${BASE}pages/practice-areas.html">Practice Areas</a></li>
          </ul>
        </li>
        <li><a href="${BASE}pages/membership.html">Membership</a></li>
        <li class="has-dropdown">
          <a href="${BASE}pages/events.html">Events</a>
          <ul class="dropdown">
            <li><a href="${BASE}pages/events.html">Upcoming Events</a></li>
            <li><a href="${BASE}pages/cle.html">CLE Programs</a></li>
            <li><a href="${BASE}pages/gallery.html">Gallery</a></li>
          </ul>
        </li>
        <li><a href="${BASE}pages/news.html">News</a></li>
        <li><a href="${BASE}pages/publications.html">Publications</a></li>
        <li class="has-dropdown">
          <a href="${BASE}pages/contact.html">Contact</a>
          <ul class="dropdown">
            <li><a href="${BASE}pages/contact.html">Contact Us</a></li>
            <li><a href="${BASE}pages/faq.html">FAQ</a></li>
          </ul>
        </li>
      </ul>
      <div class="nav-cta">
        <a href="${BASE}portal/login.html" class="btn btn-outline btn-sm">Login</a>
        <a href="${BASE}portal/register.html" class="btn btn-primary btn-sm">Join NBA</a>
      </div>
      <button class="menu-toggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </div>
</header>
`;

const FOOTER_HTML = `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-about">
        <div class="footer-logo">
          <div class="logo-mark"><img src="${BASE}assets/nba-logo.png" alt="Nigerian Bar Association logo"></div>
          <div class="logo-text">
            <div class="top">NBA Lokoja</div>
            <div class="bottom">Nigerian Bar Association</div>
          </div>
        </div>
        <p>The Lokoja Branch of the Nigerian Bar Association — advancing the legal profession, the rule of law, and the cause of justice on the confluence of the Niger and Benue rivers.</p>
        <div class="footer-social">
          <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i></a>
          <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></a>
          <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa-brands fa-instagram" aria-hidden="true"></i></a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in" aria-hidden="true"></i></a>
        </div>
      </div>
      <div>
        <h5>Quick Links</h5>
        <ul>
          <li><a href="${BASE}pages/about.html">About the Branch</a></li>
          <li><a href="${BASE}pages/executive.html">Executive Committee</a></li>
          <li><a href="${BASE}pages/membership.html">Membership</a></li>
          <li><a href="${BASE}pages/cle.html">Legal Education</a></li>
          <li><a href="${BASE}pages/publications.html">Publications</a></li>
        </ul>
      </div>
      <div>
        <h5>Resources</h5>
        <ul>
          <li><a href="${BASE}pages/news.html">News & Announcements</a></li>
          <li><a href="${BASE}pages/events.html">Events</a></li>
          <li><a href="${BASE}pages/gallery.html">Gallery</a></li>
          <li><a href="${BASE}pages/faq.html">FAQ</a></li>
          <li><a href="${BASE}portal/login.html">Member Portal</a></li>
        </ul>
      </div>
      <div>
        <h5>Get in Touch</h5>
        <div class="footer-contact-item">
          <span class="ico"><i class="fa-solid fa-location-dot" aria-hidden="true"></i></span>
          <span>NBA Lokoja Branch Secretariat<br>No. 1 Bar Centre Avenue, GRA<br>Lokoja, Kogi State, Nigeria</span>
        </div>
        <div class="footer-contact-item">
          <span class="ico"><i class="fa-solid fa-phone" aria-hidden="true"></i></span>
          <span>+234 803 000 0000<br>+234 706 000 0000</span>
        </div>
        <div class="footer-contact-item">
          <span class="ico"><i class="fa-solid fa-envelope" aria-hidden="true"></i></span>
          <span>secretariat@nbalokoja.org</span>
        </div>
        <form class="newsletter-form" style="margin-top:1rem;display:flex;gap:0.5rem;">
          <input type="email" placeholder="Your email" required style="flex:1;padding:0.55rem 0.85rem;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:white;font-size:0.85rem;">
          <button type="submit" class="btn btn-primary btn-sm">Subscribe</button>
        </form>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} Nigerian Bar Association, Lokoja Branch. All rights reserved.</p>
      <div class="footer-bottom-links">
        <a href="${BASE}pages/privacy.html">Privacy Policy</a>
        <a href="${BASE}pages/terms.html">Terms of Service</a>
        <a href="${BASE}pages/conduct.html">Code of Conduct</a>
      </div>
    </div>
  </div>
</footer>
`;

// Auto-inject
document.addEventListener('DOMContentLoaded', () => {
  const headerSlot = document.querySelector('[data-include="header"]');
  const footerSlot = document.querySelector('[data-include="footer"]');
  if (headerSlot) headerSlot.outerHTML = HEADER_HTML;
  if (footerSlot) footerSlot.outerHTML = FOOTER_HTML;
});
