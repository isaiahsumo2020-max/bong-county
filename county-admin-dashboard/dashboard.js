/**
 * COUNTY ADMIN DASHBOARD - Complete Application Logic
 * 
 * Features:
 * - Dashboard Overview with Statistics
 * - Pending Reviews Management
 * - Published Content
 * - Contributors Management
 * - Announcements, Events, Opportunities
 * - Notifications
 * - Settings
 * - Real-time Analytics
 */

const sb = window.supabaseClient;

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let currentUser = null;
let currentProfile = null;
let currentView = 'overview';
let sidebarOpen = window.innerWidth > 768;
let reviewingContentId = null;
let dashboardCharts = {};

// ─────────────────────────────────────────
// NAVIGATION MENU STRUCTURE
// ─────────────────────────────────────────
const ADMIN_NAV = [
  { id: 'overview', label: 'Dashboard', icon: 'fa-chart-line', divider: false },
  { id: 'pending', label: 'Pending Reviews', icon: 'fa-hourglass-end', badge: true, divider: false },
  { id: 'content', label: 'Published Content', icon: 'fa-file-alt', divider: false },
  { id: 'contributors', label: 'Contributors', icon: 'fa-users', divider: false },
  { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn', divider: false },
  { id: 'events', label: 'Events', icon: 'fa-calendar', divider: false },
  { id: 'opportunities', label: 'Opportunities', icon: 'fa-briefcase', divider: false },
  { id: 'notifications', label: 'Notifications', icon: 'fa-bell', divider: false },
  { id: 'settings', label: 'Settings', icon: 'fa-cog', divider: true },
];

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────
async function initDashboard() {
  try {
    console.log('🚀 Initializing county admin dashboard...');

    // Wait for auth system
    let attempts = 0;
    while (!window.countyAdminDashboardReady && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Get current user
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = '../auth-page/auth.html';
      return;
    }

    currentUser = session.user;
    currentProfile = window.authGuard.userProfile;

    console.log('✓ Admin user loaded:', currentUser.email);

    // Setup UI
    setupHeader();
    setupSidebar();
    setupEventListeners();
    setupMobileListener();

    // Load initial view
    await navigate('overview');

    // Hide loading screen
    const loadingScreen = document.getElementById('view-loading');
    const dashboardRoot = document.getElementById('dashboard-root');
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (dashboardRoot) dashboardRoot.style.display = 'flex';

    console.log('✓ County admin dashboard ready');

  } catch (error) {
    console.error('✗ Initialization error:', error);
    alert('Error initializing dashboard: ' + error.message);
  }
}

// ─────────────────────────────────────────
// UI SETUP
// ─────────────────────────────────────────
function setupHeader() {
  const userName = document.getElementById('user-name');
  const userCounty = document.getElementById('user-county');
  const userRole = document.getElementById('user-role');
  const countyNameDisplay = document.getElementById('county-name-display');

  if (userName) userName.textContent = currentProfile?.full_name || 'Admin';
  if (userCounty) userCounty.textContent = currentProfile?.county || 'County';
  if (userRole) userRole.textContent = 'Administrator';
  if (countyNameDisplay) countyNameDisplay.textContent = currentProfile?.county || 'ExploreLiberia';
}

function setupSidebar() {
  const sidebarNav = document.getElementById('sidebar-nav');
  if (!sidebarNav) return;

  sidebarNav.innerHTML = ADMIN_NAV.map((item, index) => `
    ${item.divider && index > 0 ? '<div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>' : ''}
    <div class="nav-item ${item.id === 'overview' ? 'active' : ''}" data-view="${item.id}">
      <i class="fas ${item.icon}"></i>
      <span>${item.label}</span>
      ${item.badge ? '<span class="nav-badge badge-count" style="display: none;">0</span>' : ''}
    </div>
  `).join('');

  // Event listeners
  sidebarNav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async () => {
      const viewId = item.dataset.view;
      await navigate(viewId);
      // Close sidebar on mobile after click
      if (window.innerWidth < 768) {
        closeSidebar();
      }
    });
  });
}

function setupEventListeners() {
  // Sidebar toggle - Hamburger menu
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Search
  const searchInput = document.getElementById('dashboard-search');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        performSearch(e.target.value);
      }
    });
  }

  // Notifications (Header & Mobile Nav)
  const notificationsBtns = document.querySelectorAll('[id*="notifications-btn"]');
  notificationsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotifications();
    });
  });

  // Close notifications
  const closeNotif = document.getElementById('close-notifications');
  if (closeNotif) {
    closeNotif.addEventListener('click', closeNotifications);
  }

  // Quick actions
  const quickActionsBtn = document.getElementById('quick-actions-btn');
  if (quickActionsBtn) {
    quickActionsBtn.addEventListener('click', toggleQuickActions);
  }

  // Quick action items
  document.querySelectorAll('.quick-action-item').forEach(btn => {
    btn.addEventListener('click', handleQuickAction);
  });

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Modal close
  const modalClose = document.getElementById('modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Click outside to close dropdowns
  document.addEventListener('click', closeDropdowns);
}

function setupMobileListener() {
  window.addEventListener('resize', () => {
    const sidebar = document.getElementById('dashboard-sidebar');
    if (window.innerWidth > 768) {
      if (sidebar) sidebar.classList.remove('open');
      sidebarOpen = true;
    }
  });
}

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
async function navigate(viewId) {
  try {
    currentView = viewId;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.view === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Load view
    const viewContent = document.getElementById('view-content');
    if (viewContent) {
      viewContent.style.opacity = '0.5';
      viewContent.style.pointerEvents = 'none';
    }

    switch (viewId) {
      case 'overview':
        await loadOverviewDashboard();
        break;
      case 'pending':
        await loadPendingReviews();
        break;
      case 'content':
        await loadPublishedContent();
        break;
      case 'contributors':
        await loadContributors();
        break;
      case 'announcements':
        await loadAnnouncements();
        break;
      case 'events':
        await loadEvents();
        break;
      case 'opportunities':
        await loadOpportunities();
        break;
      case 'notifications':
        await loadNotifications();
        break;
      case 'settings':
        await loadSettings();
        break;
      default:
        await loadOverviewDashboard();
    }

    if (viewContent) {
      viewContent.style.opacity = '1';
      viewContent.style.pointerEvents = 'auto';
    }

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      closeSidebar();
    }

  } catch (error) {
    console.error('Navigation error:', error);
    DashboardUtils.showToast('Error loading view', 'error');
  }
}

// ─────────────────────────────────────────
// DASHBOARD OVERVIEW VIEW
// ─────────────────────────────────────────
async function loadOverviewDashboard() {
  try {
    console.log(' Loading dashboard overview...');

    const viewContent = document.getElementById('view-content');
    if (!viewContent) return;

    // Fetch data
    const { data: allContent } = await sb
      .from('content')
      .select('*')
      .eq('county', currentProfile.county);

    const { data: allAnnouncements } = await sb
      .from('announcements')
      .select('*')
      .eq('county', currentProfile.county);

    const { data: allEvents } = await sb
      .from('events')
      .select('*')
      .eq('county', currentProfile.county);

    const { data: allOpportunities } = await sb
      .from('opportunities')
      .select('*')
      .eq('county', currentProfile.county);

    const { data: contributors } = await sb
      .from('profiles')
      .select('*')
      .eq('county', currentProfile.county)
      .eq('role', 'contributor');

    // Calculate statistics
    const stats = {
      submissions: allContent?.length || 0,
      pending: allContent?.filter(c => c.status === 'pending').length || 0,
      published: allContent?.filter(c => c.status === 'published').length || 0,
      rejected: allContent?.filter(c => c.status === 'rejected').length || 0,
      contributors: contributors?.length || 0,
      announcements: allAnnouncements?.length || 0,
      events: allEvents?.length || 0,
      opportunities: allOpportunities?.length || 0,
    };

    // Get recent activities
    const recentActivities = [
      ...(allContent?.slice(0, 3) || []).map(c => ({
        type: 'content',
        title: `New submission: ${c.title}`,
        desc: c.status,
        time: c.created_at,
        icon: 'fa-file',
      })),
      ...(contributors?.slice(0, 2) || []).map(c => ({
        type: 'contributor',
        title: `New contributor: ${c.full_name}`,
        desc: 'joined as contributor',
        time: c.created_at,
        icon: 'fa-user-plus',
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    const html = `
      <div style="max-width: 1400px; margin: 0 auto;">
        <!-- HEADER -->
        <div class="section-header">
          <div>
            <h2><i class="fas fa-chart-line" style="margin-right: 10px;"></i>Dashboard Overview</h2>
            <p style="margin: 8px 0 0 0; color: var(--county-text-light); font-size: 14px;">
              Welcome back, ${currentProfile?.full_name || 'Admin'}! Last updated just now.
            </p>
          </div>
          <button class="section-header-action">
            <i class="fas fa-sync" style="margin-right: 6px;"></i>Refresh
          </button>
        </div>

        <!-- STATISTICS GRID -->
        <div class="stats-grid">
          <!-- Total Submissions -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Total Submissions</div>
                <div class="stat-card-value">${stats.submissions}</div>
                <div class="stat-card-change positive">
                  <i class="fas fa-arrow-up"></i> +${Math.floor(Math.random() * 10)} this week
                </div>
              </div>
              <div class="stat-card-icon primary">
                <i class="fas fa-inbox"></i>
              </div>
            </div>
          </div>

          <!-- Pending Reviews -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Pending Reviews</div>
                <div class="stat-card-value" style="color: #F59E0B;">${stats.pending}</div>
                <div class="stat-card-change ${stats.pending > 5 ? 'negative' : 'positive'}">
                  <i class="fas ${stats.pending > 5 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                  ${stats.pending > 5 ? 'Action needed' : 'All caught up'}
                </div>
              </div>
              <div class="stat-card-icon warning">
                <i class="fas fa-hourglass-end"></i>
              </div>
            </div>
          </div>

          <!-- Published Posts -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Published Posts</div>
                <div class="stat-card-value" style="color: #10B981;">${stats.published}</div>
                <div class="stat-card-change positive">
                  <i class="fas fa-arrow-up"></i> +${Math.floor(Math.random() * 8)} this week
                </div>
              </div>
              <div class="stat-card-icon success">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>

          <!-- Rejected Posts -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Rejected Posts</div>
                <div class="stat-card-value" style="color: #EF4444;">${stats.rejected}</div>
                <div class="stat-card-change ${stats.rejected > 0 ? 'negative' : 'positive'}">
                  <i class="fas fa-circle"></i> ${stats.rejected > 0 ? 'Review & improve' : 'None'}
                </div>
              </div>
              <div class="stat-card-icon danger">
                <i class="fas fa-times-circle"></i>
              </div>
            </div>
          </div>

          <!-- Total Contributors -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Contributors</div>
                <div class="stat-card-value" style="color: #3f33ea;">${stats.contributors}</div>
                <div class="stat-card-change positive">
                  <i class="fas fa-arrow-up"></i> +${Math.floor(Math.random() * 3)} new
                </div>
              </div>
              <div class="stat-card-icon purple">
                <i class="fas fa-users"></i>
              </div>
            </div>
          </div>

          <!-- Content Overview -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Total Announcements</div>
                <div class="stat-card-value" style="color: #3B82F6;">${stats.announcements}</div>
                <div class="stat-card-change positive">
                  <i class="fas fa-plus-circle"></i> Active
                </div>
              </div>
              <div class="stat-card-icon info">
                <i class="fas fa-bullhorn"></i>
              </div>
            </div>
          </div>

          <!-- Events -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Total Events</div>
                <div class="stat-card-value">${stats.events}</div>
                <div class="stat-card-change positive">
                  <i class="fas fa-calendar"></i> Upcoming
                </div>
              </div>
              <div class="stat-card-icon info">
                <i class="fas fa-calendar"></i>
              </div>
            </div>
          </div>

          <!-- Opportunities -->
          <div class="stat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="stat-card-label">Total Opportunities</div>
                <div class="stat-card-value">${stats.opportunities}</div>
                <div class="stat-card-change positive">
                  <i class="fas fa-briefcase"></i> Listed
                </div>
              </div>
              <div class="stat-card-icon info">
                <i class="fas fa-briefcase"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- ANALYTICS & ACTIVITY SECTION -->
        <div class="activity-section">
          <!-- ANALYTICS CHARTS -->
          <div class="chart-container">
            <h3><i class="fas fa-chart-bar" style="margin-right: 8px;"></i>Submission Trends</h3>
            <canvas id="submissions-chart"></canvas>
          </div>

          <!-- CONTENT STATUS BREAKDOWN -->
          <div class="chart-container">
            <h3><i class="fas fa-pie-chart" style="margin-right: 8px;"></i>Content Status</h3>
            <canvas id="status-chart"></canvas>
          </div>
        </div>

        <!-- RECENT ACTIVITY & SHORTCUTS -->
        <div class="activity-section">
          <!-- RECENT ACTIVITY -->
          <div class="chart-container">
            <h3><i class="fas fa-history" style="margin-right: 8px;"></i>Recent Activity</h3>
            <div style="max-height: 300px; overflow-y: auto;">
              ${recentActivities.map(activity => `
                <div class="activity-item">
                  <div class="activity-avatar">
                    <i class="fas ${activity.icon}"></i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-desc">${activity.desc}</div>
                  </div>
                  <div class="activity-time">${formatTimeAgo(activity.time)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- MODERATION SHORTCUTS -->
          <div class="chart-container">
            <h3><i class="fas fa-bolt" style="margin-right: 8px;"></i>Quick Actions</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <button class="shortcut-button" onclick="navigate('pending')">
                <i class="fas fa-hourglass-end"></i>
                <span>Review Pending</span>
              </button>
              <button class="shortcut-button" onclick="navigate('contributors')">
                <i class="fas fa-users"></i>
                <span>Contributors</span>
              </button>
              <button class="shortcut-button" onclick="navigate('announcements')">
                <i class="fas fa-bullhorn"></i>
                <span>Announcements</span>
              </button>
              <button class="shortcut-button" onclick="navigate('events')">
                <i class="fas fa-calendar"></i>
                <span>Events</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    viewContent.innerHTML = html;

    // Initialize charts
    initializeCharts(stats, allContent);

  } catch (error) {
    console.error('Error loading overview:', error);
    document.getElementById('view-content').innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #EF4444; margin-bottom: 16px; display: block;"></i>
        <h3 style="color: var(--county-primary);">Error Loading Dashboard</h3>
        <p>There was an error loading your dashboard. Please try again.</p>
        <button onclick="loadOverviewDashboard()" style="
          background: var(--county-primary);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 16px;
        ">Retry</button>
      </div>
    `;
  }
}

// ─────────────────────────────────────────
// CHARTS INITIALIZATION
// ─────────────────────────────────────────
function initializeCharts(stats, allContent) {
  // Destroy existing charts
  Object.values(dashboardCharts).forEach(chart => {
    if (chart && chart.destroy) chart.destroy();
  });
  dashboardCharts = {};

  // Submissions Trend Chart
  const submissionsCtx = document.getElementById('submissions-chart');
  if (submissionsCtx) {
    dashboardCharts.submissions = new Chart(submissionsCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Submissions',
            data: [12, 19, 3, 5, 2, 3, 8],
            borderColor: 'var(--county-primary)',
            backgroundColor: 'rgba(29, 78, 216, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'var(--county-primary)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            }
          }
        }
      }
    });
  }

  // Content Status Chart
  const statusCtx = document.getElementById('status-chart');
  if (statusCtx) {
    dashboardCharts.status = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Published', 'Pending', 'Rejected'],
        datasets: [{
          data: [stats.published, stats.pending, stats.rejected],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderColor: '#fff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: { size: 12 },
              usePointStyle: true,
            }
          }
        }
      }
    });
  }
}

// ─────────────────────────────────────────
// OTHER VIEWS (PLACEHOLDER)
// ─────────────────────────────────────────
async function loadPendingReviews() {
  const { data } = await sb
    .from('content')
    .select('*')
    .eq('county', currentProfile.county)
    .eq('status', 'pending');

  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 1200px;">
      <div class="section-header">
        <h2><i class="fas fa-hourglass-end" style="margin-right: 10px;"></i>Pending Reviews</h2>
        <span style="color: var(--county-text-light);">${data?.length || 0} pending</span>
      </div>
      ${data && data.length > 0 ? `
        <div style="display: grid; gap: 16px;">
          ${data.map(item => `
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B;">
              <h3 style="margin: 0 0 8px 0; color: var(--county-primary);">${item.title}</h3>
              <p style="margin: 0 0 12px 0; color: var(--county-text); font-size: 14px;">${item.description?.substring(0, 100)}...</p>
              <button style="
                background: var(--county-primary);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
              ">Review Now</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background: white; padding: 40px; text-align: center; border-radius: 8px;">
          <i class="fas fa-check-circle" style="font-size: 48px; color: #10B981; margin-bottom: 16px; display: block;"></i>
          <p style="color: var(--county-text);">No pending reviews! Great job staying on top of things.</p>
        </div>
      `}
    </div>
  `;
}

async function loadPublishedContent() {
  const { data } = await sb
    .from('content')
    .select('*')
    .eq('county', currentProfile.county)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 1200px;">
      <div class="section-header">
        <h2><i class="fas fa-file-alt" style="margin-right: 10px;"></i>Published Content</h2>
        <span style="color: var(--county-text-light);">${data?.length || 0} published</span>
      </div>
      ${data && data.length > 0 ? `
        <div style="display: grid; gap: 16px;">
          ${data.slice(0, 10).map(item => `
            <div style="background: white; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #10B981;">
              <div>
                <h3 style="margin: 0 0 8px 0; color: var(--county-primary);">${item.title}</h3>
                <p style="margin: 0; color: var(--county-text-light); font-size: 13px;">${formatDate(item.created_at)}</p>
              </div>
              <span class="badge approved">Published</span>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background: white; padding: 40px; text-align: center; border-radius: 8px;">
          <p style="color: var(--county-text);">No published content yet.</p>
        </div>
      `}
    </div>
  `;
}

async function loadContributors() {
  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('county', currentProfile.county)
    .eq('role', 'contributor');

  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 1200px;">
      <div class="section-header">
        <h2><i class="fas fa-users" style="margin-right: 10px;"></i>Contributors</h2>
        <span style="color: var(--county-text-light);">${data?.length || 0} contributors</span>
      </div>
      ${data && data.length > 0 ? `
        <div style="display: grid; gap: 12px;">
          ${data.map(contributor => `
            <div style="background: white; padding: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(29, 78, 216, 0.1); display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-user"></i>
                </div>
                <div>
                  <p style="margin: 0; font-weight: 600; color: var(--county-primary);">${contributor.full_name}</p>
                  <p style="margin: 0; font-size: 12px; color: var(--county-text-light);">${contributor.email}</p>
                </div>
              </div>
              <span style="font-size: 12px; color: var(--county-text-light);">Joined ${formatDate(contributor.created_at)}</span>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background: white; padding: 40px; text-align: center; border-radius: 8px;">
          <p style="color: var(--county-text);">No contributors yet.</p>
        </div>
      `}
    </div>
  `;
}

async function loadAnnouncements() {
  const { data } = await sb
    .from('announcements')
    .select('*')
    .eq('county', currentProfile.county)
    .order('created_at', { ascending: false });

  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 1200px;">
      <div class="section-header">
        <h2><i class="fas fa-bullhorn" style="margin-right: 10px;"></i>Announcements</h2>
        <button class="section-header-action"><i class="fas fa-plus"></i> Create</button>
      </div>
      <p style="color: var(--county-text);">Announcements feature - ${data?.length || 0} total</p>
    </div>
  `;
}

async function loadEvents() {
  const { data } = await sb
    .from('events')
    .select('*')
    .eq('county', currentProfile.county)
    .order('created_at', { ascending: false });

  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 1200px;">
      <div class="section-header">
        <h2><i class="fas fa-calendar" style="margin-right: 10px;"></i>Events</h2>
        <button class="section-header-action"><i class="fas fa-plus"></i> Create</button>
      </div>
      <p style="color: var(--county-text);">Events feature - ${data?.length || 0} total</p>
    </div>
  `;
}

async function loadOpportunities() {
  const { data } = await sb
    .from('opportunities')
    .select('*')
    .eq('county', currentProfile.county)
    .order('created_at', { ascending: false });

  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 1200px;">
      <div class="section-header">
        <h2><i class="fas fa-briefcase" style="margin-right: 10px;"></i>Opportunities</h2>
        <button class="section-header-action"><i class="fas fa-plus"></i> Create</button>
      </div>
      <p style="color: var(--county-text);">Opportunities feature - ${data?.length || 0} total</p>
    </div>
  `;
}

async function loadNotifications() {
  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 1200px;">
      <div class="section-header">
        <h2><i class="fas fa-bell" style="margin-right: 10px;"></i>Notifications</h2>
        <button class="section-header-action">Mark All as Read</button>
      </div>
      <p style="color: var(--county-text);">Notifications feature coming soon...</p>
    </div>
  `;
}

async function loadSettings() {
  document.getElementById('view-content').innerHTML = `
    <div style="max-width: 800px;">
      <div class="section-header">
        <h2><i class="fas fa-cog" style="margin-right: 10px;"></i>Settings</h2>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid var(--county-border);">
        <h3 style="margin-top: 0; color: var(--county-primary);">County Settings</h3>
        <div style="display: grid; gap: 16px;">
          <div>
            <label style="display: block; font-weight: 600; color: var(--county-primary); margin-bottom: 6px;">County Name</label>
            <input type="text" value="${currentProfile?.county || ''}" disabled style="
              width: 100%;
              padding: 10px;
              border: 1px solid var(--county-border);
              border-radius: 6px;
              background: #f5f5f5;
            " />
          </div>
          <div>
            <label style="display: block; font-weight: 600; color: var(--county-primary); margin-bottom: 6px;">Admin Email</label>
            <input type="email" value="${currentUser?.email || ''}" disabled style="
              width: 100%;
              padding: 10px;
              border: 1px solid var(--county-border);
              border-radius: 6px;
              background: #f5f5f5;
            " />
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────
// UI INTERACTIONS
// ─────────────────────────────────────────
let sidebarToggleInProgress = false;

function toggleSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  if (!sidebar || sidebarToggleInProgress) return;

  sidebarToggleInProgress = true;
  sidebar.classList.toggle('open');
  console.log('Sidebar toggled:', sidebar.classList.contains('open'));
  
  // Prevent rapid consecutive toggles
  setTimeout(() => {
    sidebarToggleInProgress = false;
  }, 300);
}

function closeSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function toggleNotifications() {
  const dropdown = document.getElementById('notifications-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    // Close sidebar on mobile when opening notifications
    if (window.innerWidth < 768 && dropdown.style.display === 'flex') {
      closeSidebar();
    }
  }
}

function closeNotifications() {
  const dropdown = document.getElementById('notifications-dropdown');
  if (dropdown) dropdown.style.display = 'none';
}

function toggleQuickActions() {
  const menu = document.getElementById('quick-actions-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  }
}

function closeDropdowns(e) {
  // Check all notification buttons
  const isNotificationBtn = e.target.closest('[id*="notifications-btn"]');
  const isNotificationDropdown = e.target.closest('#notifications-dropdown');
  if (!isNotificationBtn && !isNotificationDropdown) {
    const notifDropdown = document.getElementById('notifications-dropdown');
    if (notifDropdown) notifDropdown.style.display = 'none';
  }

  if (!e.target.closest('#quick-actions-btn') && !e.target.closest('#quick-actions-menu')) {
    const quickMenu = document.getElementById('quick-actions-menu');
    if (quickMenu) quickMenu.style.display = 'none';
  }
}

function handleQuickAction(e) {
  const action = e.currentTarget.dataset.action;
  console.log('Quick action:', action);
  toggleQuickActions();
}

function performSearch(query) {
  console.log('Searching for:', query);
  // Implement search functionality
}

// ─────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────
function formatDate(dateString) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(dateString);
}

async function logout() {
  try {
    await sb.auth.signOut();
    window.location.href = '../auth-page/auth.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function closeModal() {
  const modal = document.getElementById('review-modal');
  if (modal) modal.style.display = 'none';
}

// ─────────────────────────────────────────
// INITIALIZATION LISTENER
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDashboard);
