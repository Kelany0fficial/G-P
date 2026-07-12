// ============================================================
// shared.js — Ather Platform Core Utilities
// Include in every page: <script src="../assets/js/shared.js"></script>
// ============================================================

// ──────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5008';

// ──────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────
const Auth = {
  TOKEN_KEY: 'ather_token',
  USER_KEY:  'ather_user',

  /* Call after successful login with result.data from API */
  setSession(loginData) {
    localStorage.setItem(this.TOKEN_KEY, loginData.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      userId:          loginData.userId,
      userName:        loginData.userName,
      email:           loginData.email,
      role:            loginData.role,
      profileImageUrl: loginData.profileImageUrl || null
    }));
    // keep legacy keys so old page code still works
    localStorage.setItem('jwtToken',  loginData.token);
    localStorage.setItem('userRole',  loginData.role);
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY) || localStorage.getItem('jwtToken');
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    if (raw) { try { return JSON.parse(raw); } catch {} }

    // Fall back: decode JWT claims
    const t = this.getToken();
    if (!t) return null;
    try {
      const p = JSON.parse(atob(t.split('.')[1]));
      const roleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
      const idKey   = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
      return {
        userId:          p[idKey] || p.sub,
        userName:        p.unique_name || p.name || (p.email || '').split('@')[0],
        email:           p.email,
        role:            Array.isArray(p[roleKey]) ? p[roleKey][0] : (p[roleKey] || p.role),
        profileImageUrl: null
      };
    } catch { return null; }
  },

  getRole()           { return this.getUser()?.role; },
  isLoggedIn()        { return !!this.getToken(); },
  isTourist()         { return this.getRole() === 'Tourist'; },
  isGuide()           { return this.getRole() === 'Guide'; },
  isAdmin()           { return this.getRole() === 'Admin'; },

  logout() {
    [this.TOKEN_KEY, this.USER_KEY, 'jwtToken', 'userRole'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/Account/login.html';
  },

  /* Redirect to login if not authenticated; optionally enforce a role */
  requireAuth(role) {
    if (!this.isLoggedIn()) { window.location.href = '/Account/login.html'; return false; }
    if (role && this.getRole() !== role) { window.location.href = '/Common/index.html'; return false; }
    return true;
  },

  /* For login/register pages — redirect away if already logged in */
  redirectIfAuthed() {
    if (!this.isLoggedIn()) return false;
    const role = this.getRole();
    if (role === 'Admin') window.location.href = '/admin/dashboard.html';
    else                  window.location.href = '/Common/index.html';
    return true;
  }
};

// ──────────────────────────────────────────────────────────
// HTTP FETCH WRAPPER
// ──────────────────────────────────────────────────────────
const Http = {
  async req(method, path, body, isFormData) {
    const token = Auth.getToken();
    const hdrs  = {};
    if (token)                 hdrs['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body)   hdrs['Content-Type']  = 'application/json';

    const opts = { method, headers: hdrs };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res  = await fetch(API_BASE + path, opts);

    if (res.status === 401) { Auth.logout(); return; }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.Message || `Error ${res.status}`);
    return data;
  },

  get:       (path)      => Http.req('GET',    path),
  post:      (path, b)   => Http.req('POST',   path, b),
  put:       (path, b)   => Http.req('PUT',    path, b),
  patch:     (path, b)   => Http.req('PATCH',  path, b),
  del:       (path)      => Http.req('DELETE', path),
  upload:    (path, fd)  => Http.req('POST',   path, fd, true),
  uploadPut: (path, fd)  => Http.req('PUT',    path, fd, true),
};

// ──────────────────────────────────────────────────────────
// API FUNCTIONS
// ──────────────────────────────────────────────────────────
const API = {
  // Auth
  login:               (b)    => Http.post('/api/Account/login', b),
  registerTourist:     (fd)   => Http.upload('/api/Account/register-tourist', fd),
  registerGuide:       (fd)   => Http.upload('/api/Account/register-guide', fd),
  verifyEmail:         (b)    => Http.post('/api/Account/verify-email', b),
  resendOtp:           (b)    => Http.post('/api/Account/resend-activation-otp', b),
  forgotPassword:      (b)    => Http.post('/api/Account/forget-password', b),
  resetPassword:       (b)    => Http.post('/api/Account/reset-password', b),

  // Places
  getPlaces:           ()     => Http.get('/api/Places'),
  getPlaceById:        (id, aiId) => Http.get(`/api/Places/${id}/${aiId || 0}`),
  getPlaceByAiId:      (id)   => Http.get(`/api/Places/ai/${id}`),
  filterPlaces:        (type) => Http.get(`/api/Places/filter?type=${encodeURIComponent(type)}`),
  addPlacePhoto:       (id, fd)    => Http.upload(`/api/Places/${id}/add-photo`, fd),
  deletePlacePhoto:    (pid, phid) => Http.del(`/api/Places/${pid}/photos/${phid}`),
  createPlace:         (fd)   => Http.upload('/api/Places', fd),
  updatePlace:         (id, fd)   => Http.uploadPut(`/api/Places/${id}`, fd),
  deletePlace:         (id)   => Http.del(`/api/Places/${id}`),

  // Guides
  getGuides:           ()     => Http.get('/api/Guides/active'),
  getGuideById:        (id)   => Http.get(`/api/Guides/${id}`),
  getMyGuideProfile:   ()     => Http.get('/api/Guides/my-profile'),
  updateGuideProfile:  (b)    => Http.put('/api/Guides/Update-my-profile', b),
  updateGuideImage:    (fd)   => Http.uploadPut('/api/Guides/profile-image', fd),
  getGuideWallet:      ()     => Http.get('/api/Guides/my-wallet'),
  payDues:             (b)    => Http.post('/api/Guides/pay-dues', b),

  // Tourists
  getTouristProfile:   ()     => Http.get('/api/Tourists/my-profile'),
  updateTouristProfile:(b)    => Http.put('/api/Tourists/Update-my-profile', b),
  updateTouristImage:  (fd)   => Http.uploadPut('/api/Tourists/update-profile-image', fd),
  getMyAiPlans:        ()     => Http.get('/api/Tourists/my-ai-plans'),
  getMyManualPlans:    ()     => Http.get('/api/Tourists/my-manual-plans'),

  // Plans
  generateAiPlan:      (b)    => Http.post('/api/Plans/generate', b),
  getAiPlanDetail:     (id)   => Http.get(`/api/Plans/ai-plan-details/${id}`),
  createManualPlan:    (b)    => Http.post('/api/Plans/manual-generate', b),

  // Bookings
  createBooking:       (b)    => Http.post('/api/Bookings/request', b),
  getMyBookings:       ()     => Http.get('/api/Bookings/my-bookings'),
  cancelBooking:       (id)   => Http.put(`/api/Bookings/${id}/cancel`),
  getBookingItinerary: (id)   => Http.get(`/api/Bookings/${id}/itinerary`),
  getGuidePending:     ()     => Http.get('/api/Bookings/guide/pending'),
  getGuideHistory:     ()     => Http.get('/api/Bookings/guide/history'),
  acceptBooking:       (id)   => Http.put(`/api/Bookings/guide/${id}/accept`),
  rejectBooking:       (id)   => Http.put(`/api/Bookings/guide/${id}/reject`),
  completeBooking:     (id)   => Http.put(`/api/Bookings/guide/${id}/complete`),

  // Reviews
  reviewBooking:       (b)    => Http.post('/api/Reviews/booking', b),
  reviewPlace:         (b)    => Http.post('/api/Reviews/place', b),
  getGuideReviews:     (id)   => Http.get(`/api/Reviews/guide/${id}`),

  // Chat
  getChatHistory:      (id)   => Http.get(`/api/Chat/${id}/history`),
  sendMessage:         (id, msg) => Http.post(`/api/Chat/${id}/send`, msg),

  // Stories
  getActiveStories:    ()     => Http.get('/api/Stories/active'),
  createStory:         (fd)   => Http.upload('/api/Stories/create', fd),
  viewStory:           (id)   => Http.post(`/api/Stories/${id}/view`),
  loveStory:           (id)   => Http.post(`/api/Stories/${id}/love`),
  deleteStory:         (id)   => Http.del(`/api/Stories/${id}`),

  // Notifications
  getNotifications:    ()     => Http.get('/api/AdminNotifications/my-notifications'),
  markRead:            (id)   => Http.patch(`/api/AdminNotifications/${id}/mark-as-read`),
  markAllRead:         ()     => Http.patch('/api/AdminNotifications/mark-all-as-read'),
  sendAdminNotif:      (b)    => Http.post('/api/AdminNotifications/send', b),

  // Admin
  getDashboard:        ()     => Http.get('/api/Admin/dashboard-stats'),
  getPendingGuides:    ()     => Http.get('/api/Admin/pending-guides'),
  approveGuide:        (id)   => Http.put(`/api/Admin/guides/${id}/approve`),
  rejectGuide:         (id)   => Http.del(`/api/Admin/guides/${id}/reject`),
  getAllReviews:        ()     => Http.get('/api/Admin/reviews'),
  deleteReview:        (id)   => Http.del(`/api/Admin/reviews/${id}`),
  getAllStories:        ()     => Http.get('/api/Admin/stories'),
  deleteStoryAdmin:    (id)   => Http.del(`/api/Admin/stories/${id}`),
  getAllUsers:          ()     => Http.get('/api/Admin/users'),
  toggleBan:           (id)   => Http.patch(`/api/Admin/users/${id}/toggle-ban`),
  deleteUser:          (id)   => Http.del(`/api/Admin/users/${id}/delete`),
};

// ──────────────────────────────────────────────────────────
// THEME
// ──────────────────────────────────────────────────────────
const Theme = {
  init() {
    const saved  = localStorage.getItem('theme');
    const dark   = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && dark)) document.documentElement.classList.add('dark');
  },

  toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // update any theme icon on the page
    document.querySelectorAll('.ather-theme-icon').forEach(el => {
      el.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
  }
};

// ──────────────────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────────────────
const Toast = {
  show(msg, type = 'info') {
    const old = document.getElementById('ather-toast');
    if (old) old.remove();

    const clr = { success:'#10b981', error:'#ef4444', info:'#0e7490', warning:'#d97706' };
    const el  = document.createElement('div');
    el.id     = 'ather-toast';
    Object.assign(el.style, {
      position:'fixed', bottom:'90px', left:'50%',
      transform:'translateX(-50%) translateY(20px)',
      background:'var(--bg-card)', color:'var(--text-main)',
      padding:'12px 24px', borderRadius:'50px',
      fontFamily:"'Plus Jakarta Sans',sans-serif",
      fontSize:'0.875rem', fontWeight:'600',
      zIndex:'9999', opacity:'0',
      boxShadow:'0 10px 30px rgba(0,0,0,0.15)',
      border:`1px solid var(--border-color)`,
      borderLeft:`4px solid ${clr[type]||clr.info}`,
      backdropFilter:'blur(8px)',
      transition:'all 0.3s ease',
      pointerEvents:'none',
      whiteSpace:'nowrap',
    });
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      el.style.opacity='0';
      el.style.transform='translateX(-50%) translateY(20px)';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  },
  success: m => Toast.show(m,'success'),
  error:   m => Toast.show(m,'error'),
  info:    m => Toast.show(m,'info'),
  warning: m => Toast.show(m,'warning'),
};

// ──────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────
const Utils = {
  timeAgo(d) {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60)    return 'Just now';
    if (s < 3600)  return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  },

  formatCurrency(n) {
    return new Intl.NumberFormat('en-EG',{style:'currency',currency:'EGP',minimumFractionDigits:0}).format(n);
  },

  stars(rating, max=5) {
    let h = '';
    for (let i=1;i<=max;i++) {
      const filled = i <= Math.round(rating);
      h += `<span class="material-symbols-rounded" style="color:${filled?'#fbbf24':'#cbd5e1'};font-size:16px;${filled?"font-variation-settings:'FILL' 1":''}"">star</span>`;
    }
    return h;
  },

  param: n => new URLSearchParams(window.location.search).get(n),

  statusBadge(state) {
    const map = {
      Pending:   'background:#fef3c7;color:#d97706',
      Accepted:  'background:#dbeafe;color:#2563eb',
      Completed: 'background:#d1fae5;color:#059669',
      Cancelled: 'background:#fee2e2;color:#dc2626',
      Rejected:  'background:#fee2e2;color:#dc2626',
    };
    const style = map[state] || 'background:#f1f5f9;color:#64748b';
    return `<span style="${style};padding:3px 12px;border-radius:50px;font-size:0.75rem;font-weight:700;">${state}</span>`;
  }
};

// ──────────────────────────────────────────────────────────
// NAVBAR RENDERER  (injects into <div id="navbar-placeholder">)
// ──────────────────────────────────────────────────────────
const Navbar = {
  render(activePage = '') {
    const el = document.getElementById('navbar-placeholder');
    if (!el) return;

    const user    = Auth.getUser();
    const authed  = Auth.isLoggedIn();
    const role    = Auth.getRole();
    const avatar  = user?.profileImageUrl
      ? `${API_BASE}/${user.profileImageUrl}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.userName||'U')}&background=0e7490&color=fff`;

    const a = (href, label, key) =>
      `<a href="${href}" class="nav-item${activePage===key?' active':''}">${label}</a>`;

    let links = a('/Common/index.html','Home','home')
              + a('/Common/explore-places.html','Explore','explore')
              + a('/Common/guides.html','Guides','guides');

    if (authed) {
      if (role==='Tourist')
        links += a('/tourist/create-plan.html','Planner','planner')
               + a('/tourist/my-bookings.html','Bookings','bookings');
      else if (role==='Guide')
        links += a('/guide/guide-bookings.html','Bookings','bookings')
               + a('/guide/guide-wallet.html','Wallet','wallet');
      else if (role==='Admin')
        links += a('/admin/dashboard.html','Dashboard','admin');
    }

    const right = authed ? `
      <div style="display:flex;gap:16px;align-items:center;">
        <button onclick="Theme.toggle()" style="border:none;background:none;cursor:pointer;color:var(--text-muted);">
          <span class="material-symbols-rounded ather-theme-icon">${document.documentElement.classList.contains('dark')?'light_mode':'dark_mode'}</span>
        </button>
        <a href="/Common/notifications.html" class="nav-item" style="position:relative;">
          <span class="material-symbols-rounded">notifications</span>
        </a>
        <a href="/chat/chat.html" class="nav-item">
          <span class="material-symbols-rounded">chat_bubble</span>
        </a>
        <a href="/Common/Profile.html">
          <div class="profile-ring">
            <img src="${avatar}" class="profile-img" onerror="this.src='https://ui-avatars.com/api/?name=U&background=0e7490&color=fff'">
          </div>
        </a>
        <button onclick="Auth.logout()" class="btn-outline" style="padding:6px 16px;font-size:0.85rem;">Logout</button>
      </div>` : `
      <div style="display:flex;gap:12px;align-items:center;">
        <button onclick="Theme.toggle()" style="border:none;background:none;cursor:pointer;color:var(--text-muted);">
          <span class="material-symbols-rounded ather-theme-icon">${document.documentElement.classList.contains('dark')?'light_mode':'dark_mode'}</span>
        </button>
        <a href="/Account/login.html" class="btn-outline">Log in</a>
        <a href="/Account/register.html" class="btn-primary">Sign up</a>
      </div>`;

    el.innerHTML = `
      <nav class="nav-desktop glass">
        <div class="nav-container">
          <a href="/Common/index.html" class="brand" style="color:var(--text-main);text-decoration:none;">
            <span class="material-symbols-rounded" style="color:var(--primary);">pyramid</span>
            Ather <span class="text-gradient" style="font-size:1rem;margin-left:4px;">أثر</span>
          </a>
          <div class="nav-menu">${links}</div>
          <div class="auth-actions">${right}</div>
        </div>
      </nav>`;
  }
};

// ──────────────────────────────────────────────────────────
// MOBILE NAV RENDERER (injects into <div id="mobile-nav-placeholder">)
// ──────────────────────────────────────────────────────────
const MobileNav = {
  render(activePage = '') {
    const el = document.getElementById('mobile-nav-placeholder');
    if (!el) return;

    const role   = Auth.getRole();
    const authed = Auth.isLoggedIn();

    const item = (href, icon, label, key) =>
      `<a href="${href}" class="nav-icon${activePage===key?' active':''}" style="text-decoration:none;">
        <span class="material-symbols-rounded${activePage===key?" style='font-variation-settings:\"FILL\" 1'":''}">${icon}</span>
        <span>${label}</span>
      </a>`;

    let items = item('/Common/index.html','home','Home','home')
              + item('/Common/explore-places.html','explore','Explore','explore');

    if (authed && role === 'Tourist')
      items += item('/tourist/create-plan.html','map','Planner','planner')
             + item('/tourist/my-bookings.html','event_note','Bookings','bookings');
    else if (authed && role === 'Guide')
      items += item('/guide/guide-bookings.html','event_note','Bookings','bookings')
             + item('/guide/guide-wallet.html','account_balance_wallet','Wallet','wallet');
    else if (authed && role === 'Admin')
      items += item('/admin/dashboard.html','dashboard','Dashboard','admin');

    items += item(authed ? '/Common/Profile.html' : '/Account/login.html','person','Profile','profile');

    el.innerHTML = `<div class="mobile-nav">${items}</div>`;
  }
};

// Global CSS animations needed by pages
(function injectGlobalStyles() {
    const s = document.createElement('style');
    s.textContent = `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinning, [style*="animation:spin"] { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(s);
})();

// Auto-init theme on load
Theme.init();

// ──────────────────────────────────────────────────────────
// BACKWARD COMPATIBILITY — pages that still call showToast()
// ──────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    if (type === 'success') Toast.success(message);
    else if (type === 'error') Toast.error(message);
    else if (type === 'warning') Toast.warning(message);
    else Toast.info(message);
}

// Expose decodeToken for legacy pages
function decodeToken() { return Auth.getUser(); }
