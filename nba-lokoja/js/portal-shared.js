/* Shared Portal Sidebar & Layout */

const PORTAL_SIDEBAR = (active = '') => `
<aside class="sidebar" id="sidebar">
  <a href="../index.html" class="sidebar-logo">
    <div class="logo-mark"><img src="../assets/nba-logo.png" alt="Nigerian Bar Association logo"></div>
    <div class="logo-text">
      <div class="top">NBA Lokoja</div>
      <div class="bottom">Member Portal</div>
    </div>
  </a>
  <div class="sidebar-section">Main</div>
  <ul class="sidebar-nav">
    <li><a href="dashboard.html" class="${active==='dashboard'?'active':''}"><span class="ico"><i class="fa-solid fa-house" aria-hidden="true"></i></span> Dashboard</a></li>
    <li><a href="profile.html" class="${active==='profile'?'active':''}"><span class="ico"><i class="fa-solid fa-user" aria-hidden="true"></i></span> My Profile</a></li>
    <li><a href="id-card.html" class="${active==='id-card'?'active':''}"><span class="ico"><i class="fa-solid fa-id-card" aria-hidden="true"></i></span> Digital ID Card</a></li>
    <li><a href="dues.html" class="${active==='dues'?'active':''}"><span class="ico"><i class="fa-solid fa-credit-card" aria-hidden="true"></i></span> Dues & Payments</a></li>
  </ul>
  <div class="sidebar-section">Engagement</div>
  <ul class="sidebar-nav">
    <li><a href="events.html" class="${active==='events'?'active':''}"><span class="ico"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i></span> Events</a></li>
    <li><a href="cle.html" class="${active==='cle'?'active':''}"><span class="ico"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i></span> CLE Courses</a></li>
    <li><a href="resources.html" class="${active==='resources'?'active':''}"><span class="ico"><i class="fa-solid fa-book" aria-hidden="true"></i></span> Resources</a></li>
    <li><a href="directory.html" class="${active==='directory'?'active':''}"><span class="ico"><i class="fa-solid fa-users" aria-hidden="true"></i></span> Member Directory</a></li>
  </ul>
  <div class="sidebar-section">Communication</div>
  <ul class="sidebar-nav">
    <li><a href="messages.html" class="${active==='messages'?'active':''}"><span class="ico"><i class="fa-solid fa-comments" aria-hidden="true"></i></span> Messages</a></li>
    <li><a href="notices.html" class="${active==='notices'?'active':''}"><span class="ico"><i class="fa-solid fa-bullhorn" aria-hidden="true"></i></span> Notices</a></li>
    <li><a href="support.html" class="${active==='support'?'active':''}"><span class="ico"><i class="fa-solid fa-life-ring" aria-hidden="true"></i></span> Help & Support</a></li>
  </ul>
  <div class="sidebar-user">
    <div class="user-avatar" id="sbAvatar">AA</div>
    <div class="user-info"><span class="name" id="sbName">Loading...</span><span class="role" id="sbRole">Member</span></div>
    <button class="icon-btn" id="logoutBtn" title="Sign out" style="width:32px;height:32px;border:none;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i></button>
  </div>
</aside>
`;

const PORTAL_TOPBAR = (title) => `
<header class="portal-topbar">
  <div style="display:flex;align-items:center;gap:0.85rem;">
    <button class="sidebar-toggle" aria-label="Toggle sidebar"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>
    <h1 class="page-title">${title}</h1>
  </div>
  <div class="topbar-actions">
    <div class="topbar-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" placeholder="Search..."></div>
    <button class="icon-btn" title="Notifications"><i class="fa-regular fa-bell" aria-hidden="true"></i><span class="dot"></span></button>
    <button class="icon-btn" title="Help"><i class="fa-regular fa-circle-question" aria-hidden="true"></i></button>
  </div>
</header>
`;

window.renderPortal = function(activeKey, pageTitle) {
  const sb = document.querySelector('[data-include="sidebar"]');
  const tb = document.querySelector('[data-include="topbar"]');
  if (sb) sb.outerHTML = PORTAL_SIDEBAR(activeKey);
  if (tb) tb.outerHTML = PORTAL_TOPBAR(pageTitle);

  // Load member identity
  setTimeout(async () => {
    const session = await NBAAuth.getSession();
    const user = session?.data?.session?.user;
    if (!user?.id) {
      location.href = 'login.html';
      return;
    }
    const { data, error } = await NBADB.getMember(user.id);
    if (error || !data) {
      await NBAAuth.signOut();
      location.href = 'login.html';
      return;
    }
    if (data) {
      const name = data.full_name || 'Member';
      const initials = name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
      const nameEl = document.getElementById('sbName');
      const avEl = document.getElementById('sbAvatar');
      const roleEl = document.getElementById('sbRole');
      if (nameEl) nameEl.textContent = name;
      if (avEl) avEl.textContent = initials;
      if (roleEl) roleEl.textContent = (data.role || 'Member').replace('_',' ');
    }
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await NBAAuth.signOut();
      location.href = 'login.html';
    });
  }, 50);
};
