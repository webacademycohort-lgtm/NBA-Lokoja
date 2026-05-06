/* Shared Admin Sidebar & Layout */

const ADMIN_SIDEBAR = (active = '') => `
<aside class="sidebar" id="sidebar" style="background:linear-gradient(180deg,var(--charcoal),var(--navy-dark));">
  <a href="../index.html" class="sidebar-logo">
    <div class="logo-mark"><img src="../assets/nba-logo.png" alt="Nigerian Bar Association logo"></div>
    <div class="logo-text">
      <div class="top">NBA Lokoja</div>
      <div class="bottom" style="color:var(--gold);">Admin Console</div>
    </div>
  </a>
  <div class="sidebar-section">Overview</div>
  <ul class="sidebar-nav">
    <li><a href="dashboard.html" class="${active==='dashboard'?'active':''}"><span class="ico"><i class="fa-solid fa-chart-column" aria-hidden="true"></i></span> Dashboard</a></li>
    <li><a href="analytics.html" class="${active==='analytics'?'active':''}"><span class="ico"><i class="fa-solid fa-chart-line" aria-hidden="true"></i></span> Analytics</a></li>
  </ul>
  <div class="sidebar-section">Management</div>
  <ul class="sidebar-nav">
    <li><a href="members.html" class="${active==='members'?'active':''}"><span class="ico"><i class="fa-solid fa-users" aria-hidden="true"></i></span> Members</a></li>
    <li><a href="approvals.html" class="${active==='approvals'?'active':''}"><span class="ico"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></span> Applications</a></li>
    <li><a href="payments.html" class="${active==='payments'?'active':''}"><span class="ico"><i class="fa-solid fa-credit-card" aria-hidden="true"></i></span> Payments</a></li>
    <li><a href="events.html" class="${active==='events'?'active':''}"><span class="ico"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i></span> Events</a></li>
    <li><a href="news.html" class="${active==='news'?'active':''}"><span class="ico"><i class="fa-regular fa-newspaper" aria-hidden="true"></i></span> News & Blog</a></li>
    <li><a href="documents.html" class="${active==='documents'?'active':''}"><span class="ico"><i class="fa-solid fa-folder-open" aria-hidden="true"></i></span> Documents</a></li>
    <li><a href="cle.html" class="${active==='cle'?'active':''}"><span class="ico"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i></span> CLE Courses</a></li>
  </ul>
  <div class="sidebar-section">System</div>
  <ul class="sidebar-nav">
    <li><a href="communications.html" class="${active==='comms'?'active':''}"><span class="ico"><i class="fa-solid fa-envelope" aria-hidden="true"></i></span> Bulk Email</a></li>
    <li><a href="support.html" class="${active==='support'?'active':''}"><span class="ico"><i class="fa-solid fa-life-ring" aria-hidden="true"></i></span> Support Inbox</a></li>
    <li><a href="reports.html" class="${active==='reports'?'active':''}"><span class="ico"><i class="fa-solid fa-file-lines" aria-hidden="true"></i></span> Reports</a></li>
    <li><a href="audit.html" class="${active==='audit'?'active':''}"><span class="ico"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span> Audit Logs</a></li>
    <li><a href="roles.html" class="${active==='roles'?'active':''}"><span class="ico"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i></span> Roles & Access</a></li>
  </ul>
  <div class="sidebar-user">
    <div class="user-avatar" style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;">SA</div>
    <div class="user-info"><span class="name">S. A. Abbas</span><span class="role" style="color:var(--gold-light);">Administrator</span></div>
    <button class="icon-btn" id="adLogoutBtn" title="Sign out" style="width:32px;height:32px;border:none;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i></button>
  </div>
</aside>
`;

const ADMIN_TOPBAR = (title) => `
<header class="portal-topbar">
  <div style="display:flex;align-items:center;gap:0.85rem;">
    <button class="sidebar-toggle" aria-label="Toggle sidebar"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>
    <h1 class="page-title">${title}</h1>
    <span class="badge" style="background:rgba(185,28,28,0.13);color:#dc2626;">ADMIN</span>
  </div>
  <div class="topbar-actions">
    <div class="topbar-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" placeholder="Search admin..."></div>
    <button class="icon-btn" title="Notifications"><i class="fa-regular fa-bell" aria-hidden="true"></i><span class="dot"></span></button>
    <button class="icon-btn" title="Settings"><i class="fa-solid fa-gear" aria-hidden="true"></i></button>
  </div>
</header>
`;

window.renderAdmin = function(activeKey, pageTitle) {
  const allowedRoles = ['admin', 'super_admin', 'secretary', 'treasurer', 'editor'];

  async function requireAdminSession() {
    if (!window.NBAAuth || !window.NBADB) {
      location.href = 'login.html';
      return false;
    }
    const sessionResult = await NBAAuth.getSession();
    const user = sessionResult?.data?.session?.user;
    if (!user?.id) {
      location.href = 'login.html';
      return false;
    }
    const memberResult = await NBADB.getMember(user.id);
    const role = memberResult?.data?.role;
    const status = memberResult?.data?.status;
    if (!memberResult?.data || !allowedRoles.includes(role) || status !== 'active') {
      await NBAAuth.signOut();
      location.href = 'login.html';
      return false;
    }
    return true;
  }

  requireAdminSession().then((ok) => {
    if (!ok) return;
  });

  const sb = document.querySelector('[data-include="sidebar"]');
  const tb = document.querySelector('[data-include="topbar"]');
  if (sb) sb.outerHTML = ADMIN_SIDEBAR(activeKey);
  if (tb) tb.outerHTML = ADMIN_TOPBAR(pageTitle);
  setTimeout(() => {
    document.getElementById('adLogoutBtn')?.addEventListener('click', async () => {
      if (window.NBAAuth) await NBAAuth.signOut();
      location.href = 'login.html';
    });
  }, 50);
};
