// ─────────────────────────────────────────
//  SUPABASE - Already initialized in supabaseClient.js
// ─────────────────────────────────────────
// Use the globally available supabaseClient
const sb = window.supabaseClient;

if (!sb) {
  console.error('✗ Supabase client not available. Make sure supabaseClient.js is loaded first.');
}

// ─────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────
let currentUser     = null;
let currentProfile  = null;  // from users table
let currentView     = 'overview';
let reviewingId     = null;
let sidebarOpen     = true;
let contentFilter   = 'all';
let leadersFilter   = 'all';

// ─────────────────────────────────────────
//  ROLE CONFIGS - GROUPED NAVIGATION
//  Organizes nav items into collapsible groups
// ─────────────────────────────────────────
const ROLE_NAV = {
  super_admin: {
    main: [
      { id:'overview',     label:'Dashboard', icon:'📊' },
      { id:'content',      label:'All Content', icon:'📝' },
      { id:'opportunities',label:'Opportunities', icon:'🌟' },
    ],
    admin: [
      { id:'approvals',    label:'Pending Approvals', icon:'⏳', badge:true },
      { id:'leaders',      label:'Leaders', icon:'👥' },
      { id:'users',        label:'All Users', icon:'👤' },
      { id:'counties',     label:'All Counties', icon:'🗺️' },
    ],
    system: [
      { id:'settings',     label:'Settings', icon:'⚙️' },
    ],
  },
  county_admin: {
    main: [
      { id:'overview',      label:'Dashboard', icon:'📊' },
      { id:'content',       label:'County Content', icon:'📝' },
      { id:'opportunities', label:'Opportunities', icon:'🌟' },
      { id:'leaders',       label:'Leaders', icon:'👥' },
    ],
    admin: [
      { id:'approvals',     label:'Pending Approvals', icon:'⏳', badge:true },
      { id:'users',         label:'Contributors', icon:'👤' },
      { id:'county-info',   label:'County Info', icon:'🏛️' },
    ],
    account: [],
    system: [],
  },
  contributor: {
    main: [
      { id:'overview', label:'My Dashboard', icon:'📊' },
      { id:'content',  label:'My Submissions', icon:'📝' },
      { id:'submit',   label:'Submit Content', icon:'➕' },
    ],
    account: [],
    system: [],
  },
};

// ─────────────────────────────────────────
//  COUNTY COLOR THEMES
// ─────────────────────────────────────────
const COUNTY_COLORS = {
  bong:          { primary: '#EA580C', light: '#FF7A2E', glow: 'rgba(234,88,12,0.25)', theme: 'light', bg: '#FFFFFF', surface: '#F5F5F5', text: '#1A1A1A', border: '#E0E0E0' },
  montserrado:   { primary: '#1B5E35', light: '#2E8B57', glow: 'rgba(27,94,53,0.25)' },
  nimba:         { primary: '#8B4513', light: '#A0522D', glow: 'rgba(139,69,19,0.25)' },
  bassa:         { primary: '#4B7DC4', light: '#6BA3D9', glow: 'rgba(75,125,196,0.25)' },
  'grand-bassa': { primary: '#1E5A96', light: '#2E7CB5', glow: 'rgba(30,90,150,0.25)' },
  margibi:       { primary: '#9C27B0', light: '#BA68C8', glow: 'rgba(156,39,176,0.25)' },
  lofa:          { primary: '#D32F2F', light: '#F44336', glow: 'rgba(211,47,47,0.25)' },
  gbarpolu:      { primary: '#FF9800', light: '#FFB74D', glow: 'rgba(255,152,0,0.25)' },
  sinoe:         { primary: '#0097A7', light: '#00BCD4', glow: 'rgba(0,151,167,0.25)' },
  'grand-gedeh': { primary: '#6D4C41', light: '#8D6E63', glow: 'rgba(109,76,65,0.25)' },
  rivercess:     { primary: '#00838F', light: '#0097A7', glow: 'rgba(0,131,143,0.25)' },
  maryland:      { primary: '#2196F3', light: '#42A5F5', glow: 'rgba(33,150,243,0.25)' },
  'grand-kru':   { primary: '#00695C', light: '#00897B', glow: 'rgba(0,105,92,0.25)' },
  'river-gee':   { primary: '#388E3C', light: '#43A047', glow: 'rgba(56,142,60,0.25)' },
  todee:         { primary: '#7B1FA2', light: '#9C27B0', glow: 'rgba(123,31,162,0.25)' },
};

function applyCountyTheme(countySlug) {
  if (!countySlug) return;
  
  const colors = COUNTY_COLORS[countySlug.toLowerCase()];
  if (!colors) return;

  const root = document.documentElement.style;
  
  // Apply accent colors
  root.setProperty('--green', colors.primary);
  root.setProperty('--green-lt', colors.light);
  root.setProperty('--green-glow', colors.glow);
  
  // Apply light theme if specified (e.g., for Bong County)
  if (colors.theme === 'light') {
    root.setProperty('--bg', colors.bg);           // White background
    root.setProperty('--surface', colors.surface); // Light gray surfaces
    root.setProperty('--surface2', '#F0F0F0');     // Lighter gray
    root.setProperty('--text', colors.text);       // Black text
    root.setProperty('--muted', '#666666');        // Dark gray for muted
    root.setProperty('--border', '#DCDCDC');       // Light borders
    root.setProperty('--border2', '#BDBDBD');      // Darker borders
  }
}

const ROLE_LABELS = {
  super_admin:  'Super Admin',
  county_admin: 'County Admin',
  contributor:  'Contributor',
  visitor:      'Visitor',
};

// ─────────────────────────────────────────
//  INIT DASHBOARD
// ─────────────────────────────────────────
async function initDashboard() {
  try {
    console.log('ℹ initDashboard() starting...');
    
    const { data: { session }, error: sessionError } = await sb.auth.getSession();

    if (sessionError) {
      console.error('✗ Error getting session:', sessionError);
      window.location.href = '../auth-page/auth.html?error=session-error';
      return;
    }

    if (!session) {
      console.warn('⚠ No active session found, redirecting to login');
      window.location.href = '../auth-page/auth.html';
      return;
    }

    console.log('✓ Session valid for user:', session.user.email);
    currentUser = session.user;

    // Load profile from users table
    console.log('ℹ Loading user profile from database...');
    const { data: profile, error: profileError } = await sb
      .from('users')
      .select('id, email, full_name, role, county_id, avatar_url, counties(name, slug, capital)')
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      console.warn('⚠ Error loading profile:', profileError.message);
      // Profile doesn't exist yet — create it and reload
      console.log('ℹ Creating new user profile...');
      const { error: createError } = await sb.from('users').upsert({
        id:        currentUser.id,
        email:     currentUser.email,
        full_name: currentUser.user_metadata?.full_name || 'New User',
        role:      'contributor',
      });
      if (createError) {
        console.error('✗ Error creating profile:', createError);
      } else {
        console.log('✓ Profile created, reloading...');
      }
      window.location.reload();
      return;
    }

    if (!profile) {
      console.warn('⚠ Profile query returned no data');
      window.location.reload();
      return;
    }

    console.log('✓ User profile loaded:', profile.full_name || profile.email);
    currentProfile = profile;

    // Redirect super_admin to superadmin.html
    if (currentProfile.role === 'super_admin') {
      console.log('ℹ User is super_admin, redirecting to superadmin.html');
      window.location.href = '../superadmin/superadmin.html';
      return;
    }

    // If county_id is missing but we have county data, fetch it
    if (!currentProfile.county_id && currentProfile.counties?.name) {
      console.log('ℹ county_id missing, looking up from county name:', currentProfile.counties.name);
      const { data: county, error: countyError } = await sb
        .from('counties')
        .select('id')
        .eq('name', currentProfile.counties.name)
        .single();
      
      if (countyError) {
        console.warn('⚠ Error looking up county:', countyError.message);
      } else if (county) {
        currentProfile.county_id = county.id;
        console.log('✓ Found county_id:', county.id);
        // Update user record with county_id
        const { error: updateError } = await sb.from('users')
          .update({ county_id: county.id })
          .eq('id', currentUser.id);
        if (updateError) console.error('✗ Error updating county_id:', updateError);
      }
    }

    // Apply county-specific color theme
    if (currentProfile.counties?.slug) {
      console.log('ℹ Applying county theme:', currentProfile.counties.slug);
      applyCountyTheme(currentProfile.counties.slug);
    }

    // Build UI
    console.log('ℹ Building dashboard UI...');
    setupSidebar();
    setupSidebarOverlay();
    setupTopbar();
    navigate('overview');
    console.log('✓ Dashboard UI ready');
    
  } catch (error) {
    console.error('✗ Unexpected error in initDashboard:', error);
    window.location.href = '../index-page/index.html?error=init-failed';
  }
}

// ─────────────────────────────────────────
//  START INITIALIZATION
// ─────────────────────────────────────────
// Wait for auth protection to complete, then initialize dashboard
(async function startInit() {
  console.log('ℹ startInit() waiting for auth protection to complete...');
  let attempts = 0;
  const maxAttempts = 100;  // 10 seconds timeout
  
  while (!window.authProtectionComplete && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.authProtectionComplete) {
    console.log('✓ Auth protection complete (after', attempts * 100, 'ms), initializing dashboard');
    try {
      // Dashboard initialization is called from page-protection.js
      console.log('✓ Dashboard will be initialized by page-protection script');
    } catch (error) {
      console.error('✗ Error initializing dashboard:', error);
      window.location.href = '../index-page/index.html?error=init-failed';
    }
  } else {
    console.error('✗ Timeout waiting for auth protection to complete after', maxAttempts * 100, 'ms');
    // Show error message instead of redirecting, so user can refresh
    const loadingScreen = document.getElementById('view-loading');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #ef4444; margin-bottom: 1rem;">Failed to initialize dashboard. Please refresh the page.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: #2563EB; color: white; border: none; border-radius: 6px; cursor: pointer;">Refresh</button>
        </div>
      `;
    }
  }
})();


// ─────────────────────────────────────────
//  SIDEBAR SETUP - WITH COLLAPSIBLE GROUPS
// ─────────────────────────────────────────
function setupSidebar() {
  const role = currentProfile.role;
  const navGroups = ROLE_NAV[role] || ROLE_NAV.contributor;
  const countyName = currentProfile.counties?.name || 'C.S. Liberia';

  // County name in logo
  document.getElementById('sidebar-logo-text').textContent = countyName;
  document.getElementById('sidebar-role-label').textContent = 'County Dashboard';

  // Build grouped navigation with collapsible sections
  const navEl = document.getElementById('sidebar-nav');
  let html = '';

  const groupLabels = {
    main: 'MAIN',
    admin: 'ADMIN',
    account: 'ACCOUNT',
    system: 'SYSTEM',
  };

  // On mobile, automatically expand the group that contains the active page
  const isMobile = window.innerWidth < 768;

  for (const [groupKey, items] of Object.entries(navGroups)) {
    if (!items || items.length === 0) continue;

    const groupLabel = groupLabels[groupKey] || groupKey.toUpperCase();
    const groupId = `nav-group-${groupKey}`;
    
    // Check if this group contains any active items (for auto-expand on mobile)
    const hasActive = items.some(item => item.id === currentView);
    const startExpanded = !isMobile || hasActive || groupKey === 'main';

    html += `
      <div class="nav-group" data-group="${groupKey}">
        <button class="nav-group-header ${startExpanded ? 'expanded' : ''}" onclick="toggleNavGroup('${groupKey}')">
          <span class="nav-group-chevron">${startExpanded ? '▼' : '▶'}</span>
          <span class="nav-group-label">${groupLabel}</span>
        </button>
        <div class="nav-group-items ${startExpanded ? 'expanded' : ''}" id="${groupId}">
          ${items.map(item => `
            <div class="nav-item" id="nav-${item.id}" onclick="navigate('${item.id}');closeSidebarOnMobile()">
              <span class="nav-item-icon">${item.icon || '•'}</span>
              <span class="nav-item-label">${item.label}</span>
              ${item.badge ? `<span class="nav-badge" id="badge-${item.id}">0</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  navEl.innerHTML = html;

  // User info
  const name    = currentProfile.full_name || currentUser.email;
  const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  
  if (currentProfile.avatar_url) {
    document.getElementById('user-avatar-img').src = currentProfile.avatar_url;
    document.getElementById('user-avatar-img').style.display = 'block';
    document.getElementById('user-avatar').style.display = 'none';
  } else {
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-avatar').style.display = 'block';
  }
  
  document.getElementById('user-name').textContent      = name;
  document.getElementById('user-role-badge').textContent = ROLE_LABELS[role] || role;

  // Primary action button
  if (role !== 'visitor') {
    const btn = document.getElementById('topbar-primary-btn');
    btn.style.display = 'flex';
    btn.textContent = role === 'contributor' ? '+ Submit Content' : '+ New Content';
  }

  // Set active nav item
  const activeNav = document.getElementById('nav-' + currentView);
  if (activeNav) activeNav.classList.add('active');
}

// ─────────────────────────────────────────
//  TOPBAR SETUP
// ─────────────────────────────────────────
function setupTopbar() {
  const role = currentProfile.role;
  const county = currentProfile.counties?.name || '';
  document.getElementById('topbar-title').textContent = 'Dashboard';
  document.getElementById('topbar-sub').textContent =
    role === 'county_admin' ? county + ' Administration' :
    county + ' Contributor';
}

// ─────────────────────────────────────────
//  NAV GROUP TOGGLE - COLLAPSIBLE MENU
// ─────────────────────────────────────────
function toggleNavGroup(groupKey) {
  const groupEl = document.querySelector(`[data-group="${groupKey}"]`);
  if (!groupEl) return;

  const header = groupEl.querySelector('.nav-group-header');
  const items = groupEl.querySelector('.nav-group-items');
  const chevron = header.querySelector('.nav-group-chevron');

  const isExpanded = items.classList.contains('expanded');
  
  if (isExpanded) {
    items.classList.remove('expanded');
    header.classList.remove('expanded');
    chevron.textContent = '▶';
  } else {
    items.classList.add('expanded');
    header.classList.add('expanded');
    chevron.textContent = '▼';
  }

  // Save state to localStorage for persistence
  const groupStates = JSON.parse(localStorage.getItem('navGroupStates') || '{}');
  groupStates[groupKey] = !isExpanded;
  localStorage.setItem('navGroupStates', JSON.stringify(groupStates));
}

// ─────────────────────────────────────────
//  CLOSE SIDEBAR ON MOBILE AFTER NAV
// ─────────────────────────────────────────
function closeSidebarOnMobile() {
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    sidebarOpen = false;
  }
}

// ─────────────────────────────────────────
//  NAVIGATE
// ─────────────────────────────────────────
function navigate(viewId) {
  // Update nav highlight
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById('nav-' + viewId);
  if (navItem) navItem.classList.add('active');

  // Update topbar title from the nav config
  const role = currentProfile.role;
  const navGroups = ROLE_NAV[role] || ROLE_NAV.contributor;
  let navConfig = null;
  
  for (const groupItems of Object.values(navGroups)) {
    if (Array.isArray(groupItems)) {
      navConfig = groupItems.find(n => n.id === viewId);
      if (navConfig) break;
    }
  }

  document.getElementById('topbar-title').textContent = navConfig?.label || 'Dashboard';

  // Hide all views, show target
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById('view-' + viewId);
  if (viewEl) viewEl.classList.add('active');

  currentView = viewId;

  // Load data for the view
  switch(viewId) {
    case 'overview':      loadOverview();      break;
    case 'content':       loadContent();       break;
    case 'approvals':     loadApprovals();     break;
    case 'leaders':       loadLeaders();       break;
    case 'opportunities': loadOpportunities(); break;
    case 'users':         loadUsers();         break;
    case 'counties':      loadCountiesAdmin(); break;
    case 'county-info':   loadCountyInfo();    break;
    case 'submit':        loadMySubmissions(); break;
  }
}

function handlePrimaryAction() {
  const role = currentProfile.role;
  if (role === 'contributor') navigate('submit');
  else openContentModal();
}

// ─────────────────────────────────────────
//  OVERVIEW
// ─────────────────────────────────────────
async function loadOverview() {
  const role     = currentProfile.role;
  const countyId = currentProfile.county_id;

  // Build stats
  const statsEl = document.getElementById('overview-stats');
  statsEl.innerHTML = '<div class="skel" style="height:100px;border-radius:14px"></div>'.repeat(4);

  // Fetch counts
  let contentQuery = sb.from('content').select('id, status', { count:'exact' });
  let pendingQuery = sb.from('content').select('id', { count:'exact' }).eq('status','pending_review');

  if (role === 'county_admin' && countyId) {
    contentQuery = contentQuery.eq('county_id', countyId);
    pendingQuery = pendingQuery.eq('county_id', countyId);
  } else if (role === 'contributor') {
    contentQuery = contentQuery.eq('author_id', currentUser.id);
    pendingQuery = pendingQuery.eq('author_id', currentUser.id);
  }

  const [
    { count: totalContent },
    { count: pendingCount },
    { count: totalUsers },
    { count: totalLeaders },
  ] = await Promise.all([
    contentQuery,
    pendingQuery,
    role !== 'contributor'
      ? sb.from('users').select('id', { count:'exact' })
          .eq(countyId ? 'county_id' : 'role', countyId || 'contributor')
      : { count: 0 },
    role !== 'contributor'
      ? sb.from('leaders').select('id', { count:'exact' })
          .eq(countyId ? 'county_id' : 'is_published', countyId || true)
      : { count: 0 },
  ]);

  // Update pending badge
  const badge = document.getElementById('badge-approvals');
  if (badge) badge.textContent = pendingCount || 0;

  // Render stats
  const stats = role === 'contributor'
    ? [
        { label:'My Submissions', value: totalContent || 0,  color:'#2E8B57', change:'↑ Keep writing!' },
        { label:'Pending Review', value: pendingCount || 0,  color:'#F0B429', change:'Awaiting approval' },
        { label:'Published',      value: 0,                  color:'#4ade80', change:'Live on the site' },
        { label:'Drafts',         value: 0,                  color:'#93c5fd', change:'In progress' },
      ]
    : [
        { label:'Total Content',  value: totalContent || 0,  color:'#2E8B57', change:'↑ This month' },
        { label:'Pending Review', value: pendingCount || 0,  color:'#F0B429', change:'Need your attention' },
        { label:'Contributors',   value: totalUsers   || 0,  color:'#93c5fd', change:'Active writers' },
        { label:'Leaders Listed', value: totalLeaders || 0,  color:'#c4b5fd', change:'Profiles on site' },
      ];

  statsEl.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-card-glow" style="background:${s.color}"></div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" style="color:${s.color}">${s.value}</div>
      <div class="stat-change neutral">${s.change}</div>
    </div>
  `).join('');

  // Show pending section for admins
  if (role !== 'contributor') {
    document.getElementById('pending-section').style.display = 'block';
    loadPendingPreview();
  }

  // Mini chart (random demo data for now)
  const bars = Array.from({length:7}, () => Math.floor(Math.random()*80)+10);
  const max  = Math.max(...bars);
  document.getElementById('mini-chart').innerHTML = bars.map(b => `
    <div class="mini-bar" style="height:${(b/max)*100}%" title="${b} views"></div>
  `).join('');

  // Recent submissions
  loadRecentSubmissions();

  // Top content
  loadTopContent();
}

// ─────────────────────────────────────────
//  RECENT SUBMISSIONS (overview)
// ─────────────────────────────────────────
async function loadRecentSubmissions() {
  const el = document.getElementById('recent-submissions');
  let q = sb.from('content')
    .select('id, title, status, type, created_at')
    .order('created_at', { ascending:false })
    .limit(5);

  if (currentProfile.role === 'contributor')
    q = q.eq('author_id', currentUser.id);
  else if (currentProfile.county_id)
    q = q.eq('county_id', currentProfile.county_id);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-desc">No submissions yet</div></div>`;
    return;
  }

  el.innerHTML = data.map(c => `
    <div class="table-row" style="display:flex;align-items:center;justify-content:space-between;gap:1rem">
      <div>
        <div class="cell-title" style="font-size:0.82rem">${c.title}</div>
        <div class="cell-meta">${formatDate(c.created_at)} · ${c.type}</div>
      </div>
      <span class="badge badge-${c.status}">${c.status.replace('_',' ')}</span>
    </div>
  `).join('');
}

async function loadTopContent() {
  const el = document.getElementById('top-content');
  let q = sb.from('content')
    .select('title, view_count')
    .eq('status', 'published')
    .order('view_count', { ascending:false })
    .limit(3);

  if (currentProfile.county_id) q = q.eq('county_id', currentProfile.county_id);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div style="font-size:0.78rem;color:var(--muted)">No published content yet</div>`;
    return;
  }

  el.innerHTML = data.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:0.78rem;color:var(--text);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.title}</div>
      <div style="font-size:0.72rem;color:var(--muted)">${c.view_count || 0} views</div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────
//  PENDING APPROVALS PREVIEW
// ─────────────────────────────────────────
async function loadPendingPreview() {
  const el = document.getElementById('pending-list');
  let q = sb.from('content')
    .select('id, title, type, created_at, users(full_name)')
    .eq('status', 'pending_review')
    .order('created_at', { ascending:true })
    .limit(5);

  if (currentProfile.county_id) q = q.eq('county_id', currentProfile.county_id);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-title">All caught up! ✅</div><div class="empty-desc">No pending submissions</div></div>`;
    return;
  }

  el.innerHTML = data.map(c => `
    <div class="table-row" style="display:flex;align-items:center;gap:1rem">
      <div style="flex:1">
        <div class="cell-title" style="font-size:0.82rem">${c.title}</div>
        <div class="cell-meta">By ${c.users?.full_name || 'Unknown'} · ${formatDate(c.created_at)}</div>
      </div>
      <span class="badge badge-${c.type}">${c.type}</span>
      <div class="row-actions">
        <button class="action-btn approve" onclick="openReviewModal('${c.id}','${escHtml(c.title)}','${escHtml(c.excerpt||'')}')">Approve</button>
        <button class="action-btn reject"  onclick="openReviewModal('${c.id}','${escHtml(c.title)}','${escHtml(c.excerpt||'')}',true)">Reject</button>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────
//  CONTENT LIST
// ─────────────────────────────────────────
async function loadContent() {
  const el = document.getElementById('content-list');
  el.innerHTML = `<div class="empty-state"><div class="skel" style="height:50px;margin:8px 1.25rem;border-radius:8px"></div><div class="skel" style="height:50px;margin:8px 1.25rem;border-radius:8px"></div><div class="skel" style="height:50px;margin:8px 1.25rem;border-radius:8px"></div></div>`;

  let q = sb.from('content')
    .select('id, title, type, status, view_count, created_at, users(full_name)')
    .order('created_at', { ascending:false });

  if (currentProfile.role === 'contributor') q = q.eq('author_id', currentUser.id);
  else if (currentProfile.county_id)         q = q.eq('county_id', currentProfile.county_id);
  if (contentFilter !== 'all')               q = q.eq('status', contentFilter);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">No content found</div><div class="empty-desc">Try a different filter or submit new content</div></div>`;
    return;
  }

  const isAdmin = currentProfile.role !== 'contributor';

  el.innerHTML = data.map(c => `
    <div class="table-row col-content">
      <div>
        <div class="cell-title">${c.title}</div>
        <div class="cell-meta">${formatDate(c.created_at)}${isAdmin ? ' · ' + (c.users?.full_name || 'Unknown') : ''}</div>
      </div>
      <span class="cell-text">${c.type}</span>
      <span class="badge badge-${c.status}">${c.status.replace('_',' ')}</span>
      <span class="cell-text">${c.view_count || 0} views</span>
      <div class="row-actions">
        ${isAdmin && c.status === 'pending_review'
          ? `<button class="action-btn approve" onclick="openReviewModal('${c.id}','${escHtml(c.title)}','',false)">Approve</button>
             <button class="action-btn reject"  onclick="openReviewModal('${c.id}','${escHtml(c.title)}','',true)">Reject</button>`
          : `<button class="action-btn edit">Edit</button>`
        }
        <button class="action-btn delete" onclick="deleteContent('${c.id}')">Del</button>
      </div>
    </div>
  `).join('');
}

function filterContent(filter, btn) {
  contentFilter = filter;
  document.querySelectorAll('#content-tabs .pill-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadContent();
}

// ─────────────────────────────────────────
//  APPROVALS
// ─────────────────────────────────────────
async function loadApprovals() {
  const el = document.getElementById('approvals-list');
  el.innerHTML = '<div class="empty-state"><div class="empty-desc">Loading...</div></div>';

  let q = sb.from('content')
    .select('id, title, type, created_at, excerpt, users(full_name), counties(name)')
    .eq('status', 'pending_review')
    .order('created_at', { ascending:true });

  if (currentProfile.county_id) q = q.eq('county_id', currentProfile.county_id);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">All caught up!</div><div class="empty-desc">No pending submissions to review</div></div>`;
    const badge = document.getElementById('badge-approvals');
    if (badge) badge.textContent = '0';
    return;
  }

  const badge = document.getElementById('badge-approvals');
  if (badge) badge.textContent = data.length;

  el.innerHTML = data.map(c => `
    <div class="table-row col-content">
      <div>
        <div class="cell-title">${c.title}</div>
        <div class="cell-meta">By ${c.users?.full_name || 'Unknown'} · ${c.excerpt ? c.excerpt.slice(0,60)+'…' : 'No excerpt'}</div>
      </div>
      <span class="cell-text">${c.type}</span>
      <span class="cell-text">${c.counties?.name || '—'}</span>
      <span class="cell-text">${formatDate(c.created_at)}</span>
      <div class="row-actions">
        <button class="action-btn approve" onclick="openReviewModal('${c.id}','${escHtml(c.title)}','${escHtml(c.excerpt||'')}',false)">✓ Approve</button>
        <button class="action-btn reject"  onclick="openReviewModal('${c.id}','${escHtml(c.title)}','${escHtml(c.excerpt||'')}',true)">✗ Reject</button>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────
//  REVIEW MODAL
// ─────────────────────────────────────────
function openReviewModal(id, title, excerpt, showRejection = false) {
  reviewingId = id;
  document.getElementById('modal-content-title').textContent  = title;
  document.getElementById('modal-content-excerpt').textContent = excerpt || 'No excerpt provided.';
  document.getElementById('rejection-note-wrap').style.display = showRejection ? 'flex' : 'none';
  document.getElementById('modal-title').textContent = showRejection ? 'Reject Submission' : 'Approve Submission';
  document.getElementById('modal-desc').textContent  = showRejection
    ? 'This will notify the contributor and remove the submission from the review queue.'
    : 'This will publish the content immediately on the county page.';
  openModal('review-modal');
}

async function reviewContent(newStatus) {
  if (!reviewingId) return;

  const note = document.getElementById('rejection-note').value.trim();

  const { error } = await sb.from('content')
    .update({
      status:         newStatus,
      reviewed_by:    currentUser.id,
      rejection_note: newStatus === 'rejected' ? note : null,
      published_at:   newStatus === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', reviewingId);

  closeModal('review-modal');

  if (error) { toast('❌', 'Error: ' + error.message); return; }

  toast(newStatus === 'published' ? '✅' : '🚫',
        newStatus === 'published' ? 'Content published!' : 'Submission rejected',
        newStatus === 'published' ? 'It\'s now live on the county page.' : 'Contributor will be notified.');

  reviewingId = null;
  document.getElementById('rejection-note').value = '';

  // Reload current view
  if (currentView === 'approvals') loadApprovals();
  if (currentView === 'content')   loadContent();
  if (currentView === 'overview')  loadOverview();
}

// ─────────────────────────────────────────
//  LEADERS
// ─────────────────────────────────────────
async function loadLeaders() {
  const el = document.getElementById('leaders-list');
  el.innerHTML = '<div class="empty-state"><div class="empty-desc">Loading...</div></div>';

  let q = sb.from('leaders')
    .select('id, name, role, era, category, is_published')
    .order('display_order');

  if (currentProfile.county_id) q = q.eq('county_id', currentProfile.county_id);
  if (leadersFilter !== 'all')   q = q.eq('category', leadersFilter);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No leaders added yet</div><div class="empty-desc">Click '+ Add Leader' to get started</div></div>`;
    return;
  }

  el.innerHTML = data.map(l => `
    <div class="table-row" style="display:grid;grid-template-columns:1fr 150px 100px 80px;gap:1rem;align-items:center">
      <div>
        <div class="cell-title">${l.name}</div>
        <div class="cell-meta">${l.role} · ${l.era || '—'}</div>
      </div>
      <span class="badge badge-${l.category}">${l.category}</span>
      <span class="badge badge-${l.is_published ? 'published' : 'draft'}">${l.is_published ? 'Visible' : 'Hidden'}</span>
      <div class="row-actions">
        <button class="action-btn edit" onclick="toggleLeaderVisibility('${l.id}',${l.is_published})">${l.is_published ? 'Hide' : 'Show'}</button>
        <button class="action-btn delete" onclick="deleteLeader('${l.id}')">Del</button>
      </div>
    </div>
  `).join('');
}

function filterLeaders(filter, btn) {
  leadersFilter = filter;
  document.querySelectorAll('#view-leaders .pill-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadLeaders();
}

function openLeaderModal() { openModal('leader-modal'); }

async function saveLeader() {
  const name = document.getElementById('ldr-name').value.trim();
  const role = document.getElementById('ldr-role').value.trim();
  if (!name || !role) { toast('⚠️','Fill in Name and Role first'); return; }

  const { error } = await sb.from('leaders').insert({
    county_id:    currentProfile.county_id,
    name,
    role,
    era:          document.getElementById('ldr-era').value.trim() || null,
    category:     document.getElementById('ldr-cat').value,
    bio:          document.getElementById('ldr-bio').value.trim() || null,
    is_published: true,
  });

  closeModal('leader-modal');
  if (error) { toast('❌', error.message); return; }

  toast('✅','Leader added!','Profile is now live on the county page.');
  ['ldr-name','ldr-role','ldr-era','ldr-bio'].forEach(id => document.getElementById(id).value = '');
  loadLeaders();
}

async function toggleLeaderVisibility(id, current) {
  await sb.from('leaders').update({ is_published: !current }).eq('id', id);
  toast('✅', !current ? 'Leader visible' : 'Leader hidden');
  loadLeaders();
}

async function deleteLeader(id) {
  if (!confirm('Delete this leader profile?')) return;
  await sb.from('leaders').delete().eq('id', id);
  toast('🗑️','Leader deleted');
  loadLeaders();
}

// ─────────────────────────────────────────
//  OPPORTUNITIES
// ─────────────────────────────────────────
async function loadOpportunities() {
  const el = document.getElementById('opp-list');
  el.innerHTML = '<div class="empty-state"><div class="empty-desc">Loading...</div></div>';

  let q = sb.from('opportunities')
    .select('id, title, type, deadline, status, is_published')
    .order('deadline', { ascending:true, nullsFirst:false });

  if (currentProfile.county_id) q = q.eq('county_id', currentProfile.county_id);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🌟</div><div class="empty-title">No opportunities yet</div><div class="empty-desc">Click '+ Add Opportunity' to get started</div></div>`;
    return;
  }

  el.innerHTML = data.map(o => `
    <div class="table-row" style="display:grid;grid-template-columns:1fr 120px 120px 80px;gap:1rem;align-items:center">
      <div>
        <div class="cell-title">${o.title}</div>
        <div class="cell-meta">${o.is_published ? 'Published' : 'Draft'}</div>
      </div>
      <span class="badge badge-${o.type}">${o.type}</span>
      <span class="cell-text">${o.deadline ? formatDate(o.deadline) : 'Open-ended'}</span>
      <div class="row-actions">
        <button class="action-btn edit" onclick="toggleOpp('${o.id}',${o.is_published})">${o.is_published ? 'Hide' : 'Publish'}</button>
        <button class="action-btn delete" onclick="deleteOpp('${o.id}')">Del</button>
      </div>
    </div>
  `).join('');
}

function openOppModal() { openModal('opp-modal'); }

async function saveOpportunity() {
  const title = document.getElementById('opp-title').value.trim();
  const desc  = document.getElementById('opp-desc').value.trim();
  if (!title || !desc) { toast('⚠️','Fill in Title and Description'); return; }

  const deadline = document.getElementById('opp-deadline').value;

  const { error } = await sb.from('opportunities').insert({
    county_id:    currentProfile.county_id,
    author_id:    currentUser.id,
    title,
    description:  desc,
    type:         document.getElementById('opp-type').value,
    deadline:     deadline || null,
    apply_url:    document.getElementById('opp-link').value.trim() || null,
    is_published: true,
    status:       'open',
  });

  closeModal('opp-modal');
  if (error) { toast('❌', error.message); return; }

  toast('✅','Opportunity published!','It\'s now live on the county page.');
  ['opp-title','opp-desc','opp-link','opp-deadline'].forEach(id => document.getElementById(id).value='');
  loadOpportunities();
}

async function toggleOpp(id, current) {
  await sb.from('opportunities').update({ is_published: !current }).eq('id', id);
  toast('✅', !current ? 'Opportunity published' : 'Opportunity hidden');
  loadOpportunities();
}

async function deleteOpp(id) {
  if (!confirm('Delete this opportunity?')) return;
  await sb.from('opportunities').delete().eq('id', id);
  toast('🗑️','Opportunity deleted');
  loadOpportunities();
}

// ─────────────────────────────────────────
//  USERS LIST (admin)
// ─────────────────────────────────────────
async function loadUsers() {
  const el = document.getElementById('users-list');
  el.innerHTML = '<div class="empty-state"><div class="empty-desc">Loading...</div></div>';

  let q = sb.from('users')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending:false });

  if (currentProfile.role === 'county_admin' && currentProfile.county_id)
    q = q.eq('county_id', currentProfile.county_id);

  const { data } = await q;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-desc">No users found</div></div>`;
    return;
  }

  el.innerHTML = data.map(u => `
    <div class="table-row col-users">
      <div>
        <div class="cell-title">${u.full_name || 'Unnamed'}</div>
        <div class="cell-meta">${u.email}</div>
      </div>
      <span class="badge badge-${u.role}">${ROLE_LABELS[u.role] || u.role}</span>
      <span class="cell-text">${formatDate(u.created_at)}</span>
      <div class="row-actions">
        ${currentProfile.role === 'super_admin'
          ? `<select class="action-btn" onchange="changeUserRole('${u.id}',this.value)"
               style="padding:4px 6px;font-size:0.72rem;cursor:pointer;color:var(--muted)">
               <option value="" disabled selected>Role</option>
               <option value="contributor">Contributor</option>
               <option value="county_admin">County Admin</option>
               <option value="super_admin">Super Admin</option>
             </select>`
          : ''}
      </div>
    </div>
  `).join('');
}

async function changeUserRole(userId, newRole) {
  const { error } = await sb.from('users').update({ role: newRole }).eq('id', userId);
  if (error) { toast('❌', error.message); return; }
  toast('✅', 'Role updated to ' + ROLE_LABELS[newRole]);
  loadUsers();
}

// ─────────────────────────────────────────
//  ALL COUNTIES (super admin)
// ─────────────────────────────────────────
async function loadCountiesAdmin() {
  const el = document.getElementById('counties-admin-grid');
  el.innerHTML = '<div class="skel" style="height:120px;border-radius:14px"></div>'.repeat(6);

  const { data } = await sb.from('counties')
    .select('id, name, capital, status')
    .order('name');

  if (!data) return;

  el.innerHTML = data.map(c => `
    <div class="county-admin-card ${c.status}" onclick="editCounty('${c.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div class="county-card-name">${c.name}</div>
        <span class="badge badge-${c.status === 'live' ? 'live' : 'coming'}">${c.status === 'live' ? 'Live' : 'Coming Soon'}</span>
      </div>
      <div class="county-card-capital">Capital: ${c.capital || '—'}</div>
      <button class="action-btn edit" style="margin-top:8px;width:100%;justify-content:center">
        ${c.status === 'live' ? '✏️ Manage' : '🚀 Activate'}
      </button>
    </div>
  `).join('');
}

// ─────────────────────────────────────────
//  COUNTY INFO EDITOR
// ─────────────────────────────────────────
async function loadCountyInfo() {
  if (!currentProfile.county_id) return;

  const { data } = await sb.from('counties')
    .select('*')
    .eq('id', currentProfile.county_id)
    .single();

  if (!data) return;

  document.getElementById('ci-name').value      = data.name      || '';
  document.getElementById('ci-capital').value   = data.capital   || '';
  document.getElementById('ci-region').value    = data.region    || '';
  document.getElementById('ci-estab').value     = data.established || '';
  document.getElementById('ci-pop').value       = data.population || '';
  document.getElementById('ci-districts').value = data.districts_count || '';
  document.getElementById('ci-tagline').value   = data.tagline   || '';
  document.getElementById('ci-desc').value      = data.description || '';
  document.getElementById('ci-status').value    = data.status    || 'coming_soon';
}

async function saveCountyInfo() {
  const { error } = await sb.from('counties')
    .update({
      name:             document.getElementById('ci-name').value.trim(),
      capital:          document.getElementById('ci-capital').value.trim(),
      region:           document.getElementById('ci-region').value.trim(),
      established:      document.getElementById('ci-estab').value.trim(),
      population:       document.getElementById('ci-pop').value.trim(),
      districts_count:  parseInt(document.getElementById('ci-districts').value) || 0,
      tagline:          document.getElementById('ci-tagline').value.trim(),
      description:      document.getElementById('ci-desc').value.trim(),
      status:           document.getElementById('ci-status').value,
    })
    .eq('id', currentProfile.county_id);

  if (error) { toast('❌', error.message); return; }
  toast('✅','County info saved!','Changes are live on the platform.');
}

// ─────────────────────────────────────────
//  CONTRIBUTOR — SUBMIT CONTENT
// ─────────────────────────────────────────
async function submitContent(status) {
  const title   = document.getElementById('sub-title').value.trim();
  const body    = document.getElementById('sub-body').value.trim();
  const excerpt = document.getElementById('sub-excerpt').value.trim();

  if (!title) { toast('⚠️','Please add a title'); return; }
  if (!body)  { toast('⚠️','Please write some content'); return; }

  // Check if user has county assigned
  if (!currentProfile.county_id) {
    toast('❌', 'Error: Your profile is missing county assignment. Please contact an administrator.');
    console.error('User profile missing county_id:', currentProfile);
    return;
  }

  const contentData = {
    county_id: currentProfile.county_id,
    author_id: currentUser.id,
    type:      document.getElementById('sub-type').value,
    title,
    body,
    excerpt:   excerpt || null,
    tags:      [document.getElementById('sub-tag').value],
    status,
  };

  console.log('Submitting content with data:', contentData);

  const { error } = await sb.from('content').insert(contentData);

  if (error) { 
    console.error('Content submission error:', error);
    toast('❌', 'Submission failed', error.message); 
    return; 
  }

  const msg = status === 'pending_review'
    ? 'Submitted for review! An admin will review it soon.'
    : 'Saved as draft. You can submit it later.';

  toast('✅', status === 'pending_review' ? 'Submitted!' : 'Draft saved', msg);
  ['sub-title','sub-body','sub-excerpt'].forEach(id => document.getElementById(id).value='');
  loadMySubmissions();
}

async function loadMySubmissions() {
  const el = document.getElementById('my-submissions');
  const { data } = await sb.from('content')
    .select('id, title, type, status, created_at, rejection_note')
    .eq('author_id', currentUser.id)
    .order('created_at', { ascending:false });

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">✍️</div><div class="empty-title">No submissions yet</div><div class="empty-desc">Submit your first story above!</div></div>`;
    return;
  }

  const statusIcon = { published:'✅', pending_review:'⏳', draft:'📝', rejected:'❌' };
  const statusBg   = { published:'var(--green)', pending_review:'#b45309', draft:'#374151', rejected:'#7f1d1d' };

  el.innerHTML = data.map(c => `
    <div class="timeline-item">
      <div class="timeline-dot" style="background:${statusBg[c.status]||'#374151'}">
        ${statusIcon[c.status]||'📝'}
      </div>
      <div class="timeline-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem">
          <div class="timeline-title">${c.title}</div>
          <span class="badge badge-${c.status}" style="flex-shrink:0">${c.status.replace('_',' ')}</span>
        </div>
        <div class="timeline-meta">${c.type} · ${formatDate(c.created_at)}</div>
        ${c.rejection_note
          ? `<div style="margin-top:8px;padding:8px 12px;background:rgba(239,68,68,0.08);border-radius:8px;font-size:0.75rem;color:#fca5a5">
               <strong>Feedback:</strong> ${c.rejection_note}
             </div>`
          : ''}
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────
//  DELETE CONTENT
// ─────────────────────────────────────────
async function deleteContent(id) {
  if (!confirm('Delete this content permanently?')) return;
  await sb.from('content').delete().eq('id', id);
  toast('🗑️','Content deleted');
  loadContent();
}

// ─────────────────────────────────────────
//  SIDEBAR TOGGLE
// ─────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const main    = document.getElementById('main');
  sidebarOpen   = !sidebarOpen;

  if (window.innerWidth < 768) {
    // Mobile: overlay mode
    sidebar.classList.toggle('open', sidebarOpen);
    if (overlay) {
      overlay.classList.toggle('show', sidebarOpen);
      // Remove previous listeners to avoid duplicates
      overlay.onclick = null;
      if (sidebarOpen) {
        overlay.onclick = () => toggleSidebar();
      }
    }
  } else {
    // Desktop: collapsed mode
    sidebar.classList.toggle('collapsed', !sidebarOpen);
    main.classList.toggle('expanded', !sidebarOpen);
  }
}

// Close sidebar when overlay is clicked
function setupSidebarOverlay() {
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay && window.innerWidth < 768) {
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        toggleSidebar();
      }
    };
  }
}

// ─────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────
function goToPortal() {
  // Redirect to the news feed/portal based on county
  const countySlug = currentProfile.counties?.slug;
  if (countySlug && countySlug !== 'montserrado') {
    window.location.href = '../county-pages/' + countySlug + '.html';
  } else {
    window.location.href = '../index-page/index.html';
  }
}

// ─────────────────────────────────────────
//  PROFILE MANAGEMENT
// ─────────────────────────────────────────
function openProfileModal() {
  document.getElementById('profile-name').value = currentProfile.full_name || '';
  document.getElementById('profile-email').value = currentUser.email || '';
  
  // Load profile picture if exists
  if (currentProfile.avatar_url) {
    document.getElementById('profile-preview').src = currentProfile.avatar_url;
    document.getElementById('profile-preview').style.display = 'block';
    document.getElementById('profile-placeholder').style.display = 'none';
  }
  
  openModal('profile-modal');
}

async function saveProfile() {
  const fullName = document.getElementById('profile-name').value.trim();
  
  if (!fullName) { toast('⚠️','Please enter your name'); return; }
  
  const { error } = await sb.from('users')
    .update({ full_name: fullName })
    .eq('id', currentUser.id);
  
  if (error) { toast('❌', 'Failed to save profile:', error.message); return; }
  
  currentProfile.full_name = fullName;
  document.getElementById('user-name').textContent = fullName;
  
  toast('✅', 'Profile updated!');
  closeModal('profile-modal');
}

async function uploadProfilePicture() {
  const file = document.getElementById('profile-pic-input').files[0];
  if (!file) { toast('⚠️','Please select an image'); return; }
  
  const fileName = 'profile_' + currentUser.id + '_' + Date.now();
  
  const { error: uploadError } = await sb.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });
  
  if (uploadError) { 
    toast('❌', 'Upload failed:', uploadError.message); 
    return; 
  }
  
  // Get public URL
  const { data } = sb.storage.from('avatars').getPublicUrl(fileName);
  const avatarUrl = data.publicUrl;
  
  // Update user profile with avatar URL
  const { error: dbError } = await sb.from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', currentUser.id);
  
  if (dbError) { toast('❌', 'Failed to save picture:', dbError.message); return; }
  
  currentProfile.avatar_url = avatarUrl;
  document.getElementById('user-avatar-img').src = avatarUrl;
  document.getElementById('user-avatar-img').style.display = 'block';
  document.getElementById('user-avatar').style.display = 'none';
  document.getElementById('profile-preview').src = avatarUrl;
  document.getElementById('profile-preview').style.display = 'block';
  document.getElementById('profile-placeholder').style.display = 'none';
  
  toast('✅', 'Picture uploaded!');
  document.getElementById('profile-pic-input').value = '';
}

// ─────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────
async function logout() {
  await sb.auth.signOut();
  window.location.href = '../auth-page/auth.html';
}

// ─────────────────────────────────────────
//  MODAL HELPERS
// ─────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ─────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────
let toastTimer;
function toast(icon, title, msg = '') {
  const el = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent  = msg ? `${title} — ${msg}` : title;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

// ─────────────────────────────────────────
//  REFRESH
// ─────────────────────────────────────────
function refreshCurrentView() { navigate(currentView); }

// ─────────────────────────────────────────
//  WINDOW RESIZE HANDLER
// ─────────────────────────────────────────
window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  // Reset sidebar state on resize
  if (window.innerWidth >= 768) {
    // Desktop: show sidebar, hide overlay
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    sidebarOpen = true;
  } else {
    // Mobile: close sidebar by default
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    sidebarOpen = false;
  }
});

// ─────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function escHtml(str) {
  return (str||'').replace(/'/g,"&#39;").replace(/"/g,'&quot;');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');

  if (!sidebar) return;

  // Mobile behavior
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
  } else {
    // Desktop collapse/expand
    sidebar.classList.toggle('collapsed');

    if (main) {
      main.classList.toggle('expanded');
    }
  }
}

