/**
 * CONTRIBUTOR DASHBOARD - Complete Application Logic
 * 
 * Full-featured contributor workspace with:
 * - Dashboard overview with statistics
 * - Create/edit/submit content
 * - Manage drafts and submissions
 * - Full account settings
 * - Real-time Supabase integration
 */

const sb = window.supabaseClient;

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let currentUser = null;
let currentProfile = null;
let currentView = 'overview';
let sidebarOpen = true;
let currentEditingSubmissionId = null;
let currentCoverImageUrl = null;
let countiesList = []; // Cache of counties from database

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
const CONTRIBUTOR_NAV = [
  { id: 'overview', label: 'My Dashboard', icon: '📊' },
  { id: 'submissions', label: 'My Submissions', icon: '📝' },
  { id: 'drafts', label: 'Drafts', icon: '✏️' },
  { id: 'pending', label: 'Pending Review', icon: '⏳' },
  { id: 'published', label: 'Published', icon: '✅' },
  { id: 'rejected', label: 'Rejected', icon: '❌' },
  { id: 'activity', label: 'Activity History', icon: '📋' },
  { id: 'account', label: 'Account Settings', icon: '⚙️' },
];

// ─────────────────────────────────────────
// HELPER: Fetch and cache counties
// ─────────────────────────────────────────
async function loadCounties() {
  try {
    if (countiesList.length > 0) return; // Already loaded

    const { data, error } = await sb
      .from('counties')
      .select('id, name, slug')
      .order('name');

    if (error) throw error;

    countiesList = data || [];
    console.log('✓ Loaded counties:', countiesList.length);

    // Populate county dropdown
    populateCountyDropdown();
  } catch (error) {
    console.warn('⚠ Could not load counties:', error);
    // Fallback with static county names
  }
}

// ─────────────────────────────────────────
// HELPER: Get county name by ID
// ─────────────────────────────────────────
function getCountyName(countyId) {
  if (!countyId) return 'Unknown County';
  const county = countiesList.find(c => c.id === countyId);
  return county ? county.name : 'Unknown';
}

// ─────────────────────────────────────────
// HELPER: Populate county dropdown
// ─────────────────────────────────────────
function populateCountyDropdown() {
  const dropdown = document.getElementById('form-county');
  if (!dropdown) return;

  // Keep the "Select a county" option
  dropdown.innerHTML = '<option value="">Select a county</option>';

  // Add counties from database
  for (const county of countiesList) {
    const option = document.createElement('option');
    option.value = county.id; // Use UUID as value
    option.textContent = county.name; // Show name to user
    dropdown.appendChild(option);
  }
}

// ─────────────────────────────────────────
// HELPER: Populate profile county dropdown
// ─────────────────────────────────────────
function populateProfileCountyDropdown(selectedCountyId = null) {
  const dropdown = document.getElementById('profile-county');
  if (!dropdown) return;

  // Clear existing options except the first one
  while (dropdown.options.length > 1) {
    dropdown.remove(1);
  }

  // Add counties from database
  for (const county of countiesList) {
    const option = document.createElement('option');
    option.value = county.id;
    option.textContent = county.name;
    if (selectedCountyId === county.id) {
      option.selected = true;
    }
    dropdown.appendChild(option);
  }
}

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────
async function initDashboard() {
  try {
    console.log('ℹ Initializing contributor dashboard...');

    // Wait for auth system to be ready
    let attempts = 0;
    while (!window.contributorDashboardReady && attempts < 20) {
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

    console.log('✓ User loaded:', currentUser.email);

    // Load counties for dropdown
    await loadCounties();

    // Setup UI
    setupHeader();
    setupSidebar();
    setupEventListeners();
    setupFormHandlers();

    // Load initial view
    await navigate('overview');

    // Hide loading screen
    const loadingScreen = document.getElementById('view-loading');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    const dashboardRoot = document.getElementById('dashboard-root');
    if (dashboardRoot) {
      dashboardRoot.style.display = 'flex';
    }

  } catch (error) {
    console.error('✗ Dashboard initialization error:', error);
    DashboardUtils.showToast('Error initializing dashboard', 'error');
  }
}

// ─────────────────────────────────────────
// UI SETUP
// ─────────────────────────────────────────
function setupHeader() {
  const userEmail = document.getElementById('user-email');
  if (userEmail) {
    userEmail.textContent = currentProfile?.email || currentUser?.email;
  }
}

function setupSidebar() {
  const sidebarNav = document.getElementById('sidebar-nav');
  if (!sidebarNav) return;

  sidebarNav.innerHTML = CONTRIBUTOR_NAV.map(item => `
    <div class="nav-item" data-view="${item.id}" style="
      padding: 12px 20px;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 3px solid transparent;
      color: rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    ">
      <span style="font-size: 18px;">${item.icon}</span>
      <span>${item.label}</span>
    </div>
  `).join('');

  // Add event listeners
  sidebarNav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      const viewId = e.currentTarget.dataset.view;
      await navigate(viewId);
    });
  });
}

function setupEventListeners() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebarOpen = !sidebarOpen;
      const sidebar = document.getElementById('dashboard-sidebar');
      if (sidebar) {
        sidebar.style.transform = sidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
      }
    });
  }

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
}

function setupFormHandlers() {
  // Form modal close buttons
  const formClose = document.getElementById('form-close');
  if (formClose) {
    formClose.addEventListener('click', closeSubmissionForm);
  }

  const formCancel = document.getElementById('form-cancel');
  if (formCancel) {
    formCancel.addEventListener('click', closeSubmissionForm);
  }

  // Form buttons
  const formSaveDraft = document.getElementById('form-save-draft');
  if (formSaveDraft) {
    formSaveDraft.addEventListener('click', () => handleFormSubmit(true));
  }

  const formSubmit = document.getElementById('form-submit');
  if (formSubmit) {
    formSubmit.addEventListener('click', () => handleFormSubmit(false));
  }

  // Image upload
  const formImageDropzone = document.getElementById('form-image-dropzone');
  const formImageInput = document.getElementById('form-image-input');
  
  if (formImageDropzone && formImageInput) {
    formImageDropzone.addEventListener('click', () => formImageInput.click());
    
    formImageDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      formImageDropzone.style.backgroundColor = 'rgba(29, 78, 216, 0.1)';
    });
    
    formImageDropzone.addEventListener('dragleave', () => {
      formImageDropzone.style.backgroundColor = '';
    });
    
    formImageDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      formImageDropzone.style.backgroundColor = '';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageUpload(files[0]);
      }
    });
    
    formImageInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
      }
    });
  }

  const formImageRemove = document.getElementById('form-image-remove');
  if (formImageRemove) {
    formImageRemove.addEventListener('click', removeFormImage);
  }
}

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
async function navigate(viewId) {
  try {
    currentView = viewId;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      const isActive = item.dataset.view === viewId;
      item.style.borderLeftColor = isActive ? 'white' : 'transparent';
      item.style.backgroundColor = isActive ? 'rgba(255,255,255,0.1)' : 'transparent';
      item.style.color = isActive ? 'white' : 'rgba(255,255,255,0.8)';
    });

    // Load view
    const viewContent = document.getElementById('view-content');
    DashboardUtils.showLoadingSpinner('view-content');

    switch (viewId) {
      case 'overview':
        await loadOverview();
        break;
      case 'submissions':
        await loadSubmissions('all');
        break;
      case 'drafts':
        await loadSubmissions('draft');
        break;
      case 'pending':
        await loadSubmissions('pending');
        break;
      case 'published':
        await loadSubmissions('published');
        break;
      case 'rejected':
        await loadSubmissions('rejected');
        break;
      case 'activity':
        await loadActivity();
        break;
      case 'account':
        await loadAccountSettings();
        break;
      default:
        await loadOverview();
    }

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      const sidebar = document.getElementById('dashboard-sidebar');
      if (sidebar) {
        sidebar.style.transform = 'translateX(-100%)';
        sidebarOpen = false;
      }
    }

  } catch (error) {
    console.error('✗ Navigation error:', error);
    DashboardUtils.showToast('Error loading view', 'error');
  }
}

// ─────────────────────────────────────────
// VIEWS - OVERVIEW
// ─────────────────────────────────────────
async function loadOverview() {
  try {
    console.log('Loading overview...');

    // Get statistics
    const statsResult = await SubmissionHandler.getStats(currentUser.id);
    const stats = statsResult.data || {};

    const { data: submissions } = await SubmissionHandler.getSubmissions(currentUser.id, 'all');

    const html = `
      <div style="max-width: 1200px;">
        <h1 style="margin-top: 0; color: var(--county-primary);">Welcome, ${currentProfile?.full_name || 'Contributor'}!</h1>
        <p style="color: var(--county-text); margin-bottom: 30px;">
          Here's a summary of your contributions to ExploreLiberia.
        </p>

        <!-- STATS CARDS -->
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        ">
          <div class="stat-card" style="
            background: white;
            border: 1px solid var(--county-border);
            padding: 20px;
            border-radius: 8px;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">📝</div>
            <p style="margin: 0 0 8px 0; color: var(--county-text); font-size: 14px;">Total Submissions</p>
            <h2 style="margin: 0; font-size: 32px; color: var(--county-primary);">${stats.total}</h2>
          </div>
          
          <div class="stat-card" style="
            background: white;
            border: 1px solid var(--county-border);
            padding: 20px;
            border-radius: 8px;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">✏️</div>
            <p style="margin: 0 0 8px 0; color: var(--county-text); font-size: 14px;">Drafts</p>
            <h2 style="margin: 0; font-size: 32px; color: #6B7280;">${stats.draft}</h2>
          </div>

          <div class="stat-card" style="
            background: white;
            border: 1px solid var(--county-border);
            padding: 20px;
            border-radius: 8px;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
            <p style="margin: 0 0 8px 0; color: var(--county-text); font-size: 14px;">Submitted</p>
            <h2 style="margin: 0; font-size: 32px; color: #F59E0B;">${stats.submitted}</h2>
          </div>

          <div class="stat-card" style="
            background: white;
            border: 1px solid var(--county-border);
            padding: 20px;
            border-radius: 8px;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
            <p style="margin: 0 0 8px 0; color: var(--county-text); font-size: 14px;">Published</p>
            <h2 style="margin: 0; font-size: 32px; color: #10B981;">${stats.published}</h2>
          </div>
        </div>

        <!-- QUICK ACTIONS -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: var(--county-primary);">Quick Actions</h2>
          <button onclick="openSubmissionForm()" style="
            background: var(--county-primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            font-size: 14px;
          ">
            ➕ Create New Submission
          </button>
        </div>

        <!-- RECENT SUBMISSIONS -->
        <div>
          <h2 style="color: var(--county-primary);">Recent Submissions</h2>
          <div id="recent-submissions" style="margin-top: 16px;">
            ${submissions && submissions.length > 0 ? 
              submissions.slice(0, 5).map(sub => `
                <div style="
                  background: white;
                  border: 1px solid var(--county-border);
                  padding: 16px;
                  border-radius: 6px;
                  margin-bottom: 12px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                ">
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; color: var(--county-primary);">${sub.title}</h4>
                    <p style="margin: 0; font-size: 12px; color: var(--county-text);">
                      ${DashboardUtils.formatDate(sub.created_at)} • 
                      <span style="background: ${DashboardUtils.getStatusColor(sub.status)}40; color: ${DashboardUtils.getStatusColor(sub.status)}; padding: 2px 8px; border-radius: 3px;">
                        ${sub.status}
                      </span>
                    </p>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    ${sub.status === 'draft' ? `
                      <button onclick="editSubmission('${sub.id}')" style="
                        background: var(--county-primary);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                      ">Edit</button>
                    ` : ''}
                    <button onclick="viewSubmission('${sub.id}')" style="
                      background: var(--county-border);
                      color: var(--county-primary);
                      border: none;
                      padding: 6px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 12px;
                    ">View</button>
                  </div>
                </div>
              `).join('')
              : '<p style="color: var(--county-text);">No submissions yet. <a href="#" onclick="openSubmissionForm(); return false;" style="color: var(--county-primary); text-decoration: none;">Create one now!</a></p>'
            }
          </div>
        </div>
      </div>
    `;

    document.getElementById('view-content').innerHTML = html;

  } catch (error) {
    console.error('✗ Error loading overview:', error);
    DashboardUtils.showEmptyState('view-content', 'Error Loading Overview', 'Please try refreshing the page');
  }
}

// ─────────────────────────────────────────
// VIEWS - SUBMISSIONS
// ─────────────────────────────────────────
async function loadSubmissions(filter) {
  try {
    console.log(`Loading submissions (${filter})...`);

    const result = await SubmissionHandler.getSubmissions(currentUser.id, filter);
    const submissions = result.data || [];

    if (!submissions || submissions.length === 0) {
      DashboardUtils.showEmptyState('view-content', 'No Submissions', 
        `You don't have any ${filter === 'all' ? 'submissions' : filter + ' submissions'} yet.`);
      return;
    }

    const html = `
      <div style="max-width: 1200px;">
        <h1 style="margin-top: 0; color: var(--county-primary);">
          ${filter === 'all' ? 'My Submissions' : DashboardUtils.truncateText(filter.charAt(0).toUpperCase() + filter.slice(1) + ' submissions', 50)}
        </h1>
        <p style="color: var(--county-text);">Showing ${submissions.length} submission(s)</p>

        <div style="margin-top: 20px;">
          ${submissions.map(sub => `
            <div style="
              background: white;
              border: 1px solid var(--county-border);
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 16px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; color: var(--county-primary);">${sub.title}</h3>
                  <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px;">
                    ${DashboardUtils.truncateText(sub.description || sub.category || '', 150)}
                  </p>
                  <div style="display: flex; gap: 12px; font-size: 12px; color: #9CA3AF; flex-wrap: wrap;">
                    <span> ${DashboardUtils.formatDate(sub.created_at)}</span>
                    <span> ${getCountyName(sub.county_id)}</span>
                    ${sub.tags && Array.isArray(sub.tags) ? `<span> ${DashboardUtils.truncateText(sub.tags.join(', '), 30)}</span>` : sub.tags ? `<span> ${DashboardUtils.truncateText(sub.tags, 30)}</span>` : ''}
                    <span style="background: ${DashboardUtils.getStatusColor(sub.status)}40; color: ${DashboardUtils.getStatusColor(sub.status)}; padding: 2px 8px; border-radius: 3px;">
                      ${sub.status}
                    </span>
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  ${sub.status === 'draft' ? `
                    <button onclick="editSubmission('${sub.id}')" style="
                      background: var(--county-primary);
                      color: white;
                      border: none;
                      padding: 8px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 12px;
                    "> Edit</button>
                  ` : ''}
                  <button onclick="viewSubmission('${sub.id}')" style="
                    background: var(--county-border);
                    color: var(--county-primary);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                  ">👁️ View</button>
                  ${sub.status === 'draft' ? `
                    <button onclick="deleteSubmission('${sub.id}')" style="
                      background: #FEE2E2;
                      color: #EF4444;
                      border: none;
                      padding: 8px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 12px;
                    "> Delete</button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('view-content').innerHTML = html;

  } catch (error) {
    console.error('✗ Error loading submissions:', error);
    DashboardUtils.showEmptyState('view-content', 'Error Loading Submissions', 'Please try again');
  }
}

async function loadActivity() {
  try {
    console.log('Loading activity...');

    const html = `
      <div style="max-width: 1200px;">
        <h1 style="margin-top: 0; color: var(--county-primary);">Activity History</h1>
        <p style="color: var(--county-text);">Your recent activity on the platform</p>
        <div style="background: white; border: 1px solid var(--county-border); padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p style="color: #6B7280; text-align: center;">Activity history tracking coming soon...</p>
        </div>
      </div>
    `;

    document.getElementById('view-content').innerHTML = html;

  } catch (error) {
    console.error('✗ Error loading activity:', error);
  }
}

// ─────────────────────────────────────────
// VIEWS - ACCOUNT SETTINGS
// ─────────────────────────────────────────
async function loadAccountSettings() {
  try {
    console.log('Loading account settings...');

    const profileResult = await AccountSettingsForm.getProfileData(currentUser.id);
    const profile = profileResult.data || currentProfile || {};

    const html = `
      <div style="max-width: 800px;">
        <h1 style="margin-top: 0; color: var(--county-primary);">Account Settings</h1>

        <!-- PROFILE SECTION -->
        <div style="background: white; border: 1px solid var(--county-border); padding: 24px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: var(--county-primary); font-size: 18px;">Profile Information</h2>
          
          <!-- Avatar -->
          <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
            <div style="
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--county-primary), var(--county-accent));
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 36px;
            ">
              ${profile.avatar_url ? `<img src="${profile.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : '👤'}
            </div>
            <div>
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Profile Photo</p>
              <button onclick="triggerAvatarUpload()" style="
                background: var(--county-primary);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              ">Change Photo</button>
              <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
            </div>
          </div>

          <!-- Profile Form -->
          <form id="profile-form" style="display: none;">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-weight: 600; margin-bottom: 6px;">Full Name</label>
              <input type="text" id="profile-fullname" value="${profile.full_name || ''}" placeholder="Your full name" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--county-border);
                border-radius: 6px;
                font-family: inherit;
              ">
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-weight: 600; margin-bottom: 6px;">Bio</label>
              <textarea id="profile-bio" placeholder="Tell us about yourself" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--county-border);
                border-radius: 6px;
                font-family: inherit;
                min-height: 100px;
                resize: vertical;
              ">${profile.bio || ''}</textarea>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-weight: 600; margin-bottom: 6px;">County</label>
              <select id="profile-county" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--county-border);
                border-radius: 6px;
                font-family: inherit;
              ">
                <option value="">Select County</option>
              </select>
            </div>

            <button type="button" onclick="saveProfileChanges()" style="
              background: var(--county-primary);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            ">💾 Save Changes</button>
          </form>

          <button id="edit-profile-btn" onclick="toggleProfileEdit()" style="
            background: var(--county-primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          "> Edit Profile</button>
        </div>

        <!-- SECURITY SECTION -->
        <div style="background: white; border: 1px solid var(--county-border); padding: 24px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: var(--county-primary); font-size: 18px;">Security & Account</h2>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px;">Email Address</label>
            <p style="margin: 0 0 12px 0; color: #6B7280;">${currentUser.email}</p>
            <button onclick="toggleEmailChange()" style="
              background: var(--county-border);
              color: var(--county-primary);
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">Change Email</button>

            <form id="email-form" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--county-border);">
              <input type="email" id="new-email" placeholder="New email address" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--county-border);
                border-radius: 6px;
                font-family: inherit;
                margin-bottom: 12px;
              ">
              <div style="display: flex; gap: 12px;">
                <button type="button" onclick="saveEmailChange()" style="
                  background: var(--county-primary);
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">Save</button>
                <button type="button" onclick="toggleEmailChange()" style="
                  background: #E5E7EB;
                  color: #1F2937;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">Cancel</button>
              </div>
            </form>
          </div>

          <div style="margin-bottom: 16px; padding-top: 16px; border-top: 1px solid var(--county-border);">
            <label style="display: block; font-weight: 600; margin-bottom: 6px;">Password</label>
            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px;">Last changed: ${profile.last_password_change ? DashboardUtils.formatDate(profile.last_password_change) : 'Never'}</p>
            <button onclick="togglePasswordChange()" style="
              background: var(--county-border);
              color: var(--county-primary);
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">Change Password</button>

            <form id="password-form" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--county-border);">
              <input type="password" id="new-password" placeholder="New password" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--county-border);
                border-radius: 6px;
                font-family: inherit;
                margin-bottom: 12px;
              ">
              <input type="password" id="confirm-password" placeholder="Confirm new password" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--county-border);
                border-radius: 6px;
                font-family: inherit;
                margin-bottom: 12px;
              ">
              <div style="display: flex; gap: 12px;">
                <button type="button" onclick="savePasswordChange()" style="
                  background: var(--county-primary);
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">Save</button>
                <button type="button" onclick="togglePasswordChange()" style="
                  background: #E5E7EB;
                  color: #1F2937;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <!-- NOTIFICATION PREFERENCES -->
        <div style="background: white; border: 1px solid var(--county-border); padding: 24px; border-radius: 8px;">
          <h2 style="margin-top: 0; color: var(--county-primary); font-size: 18px;">Notification Preferences</h2>
          
          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
              <input type="checkbox" id="notify-approval" ${profile.email_on_approval !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
              <div>
                <p style="margin: 0; font-weight: 600;">Approval Notifications</p>
                <p style="margin: 0; color: #6B7280; font-size: 13px;">Get notified when your submissions are approved</p>
              </div>
            </label>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
              <input type="checkbox" id="notify-rejection" ${profile.email_on_rejection !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
              <div>
                <p style="margin: 0; font-weight: 600;">Rejection Notifications</p>
                <p style="margin: 0; color: #6B7280; font-size: 13px;">Get notified when submissions need revision</p>
              </div>
            </label>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
              <input type="checkbox" id="notify-comments" ${profile.email_on_review_comment !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
              <div>
                <p style="margin: 0; font-weight: 600;">Review Comments</p>
                <p style="margin: 0; color: #6B7280; font-size: 13px;">Get notified of comments on your submissions</p>
              </div>
            </label>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
              <input type="checkbox" id="notify-newsletter" ${profile.email_newsletter !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
              <div>
                <p style="margin: 0; font-weight: 600;">Newsletter</p>
                <p style="margin: 0; color: #6B7280; font-size: 13px;">Subscribe to our monthly newsletter</p>
              </div>
            </label>
          </div>

          <button onclick="saveNotificationPreferences()" style="
            background: var(--county-primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            margin-top: 16px;
          ">💾 Save Preferences</button>
        </div>
      </div>
    `;

    document.getElementById('view-content').innerHTML = html;

    // Populate county dropdowns with dynamic data
    populateProfileCountyDropdown(profile.county_id);

    // Setup avatar upload
    const avatarUpload = document.getElementById('avatar-upload');
    if (avatarUpload) {
      avatarUpload.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          const result = await AccountSettingsForm.uploadAvatar(e.target.files[0], currentUser.id);
          if (result.success) {
            DashboardUtils.showToast('Avatar uploaded successfully', 'success');
            currentProfile.avatar_url = result.url;
            await loadAccountSettings(); // Reload to show new avatar
          } else {
            DashboardUtils.showToast(result.error, 'error');
          }
        }
      });
    }

  } catch (error) {
    console.error('✗ Error loading account settings:', error);
    DashboardUtils.showEmptyState('view-content', 'Error Loading Settings', 'Please try again');
  }
}

// ─────────────────────────────────────────
// SUBMISSION FORM FUNCTIONS
// ─────────────────────────────────────────
function openSubmissionForm(submissionId = null) {
  currentEditingSubmissionId = null;
  currentCoverImageUrl = null;

  const formModal = document.getElementById('submission-form-modal');
  const formTitle = document.getElementById('form-title');
  const form = document.getElementById('submission-form');
  
  if (!formModal || !form) return;

  if (submissionId && submissionId !== 'new') {
    formTitle.textContent = 'Edit Submission';
    currentEditingSubmissionId = submissionId;
    loadSubmissionIntoForm(submissionId);
  } else {
    formTitle.textContent = 'Create New Submission';
    form.reset();
    currentCoverImageUrl = null;
    const preview = document.getElementById('form-image-preview');
    if (preview) preview.style.display = 'none';
  }

  formModal.style.display = 'block';
  form.style.display = 'block';
}

function closeSubmissionForm() {
  const formModal = document.getElementById('submission-form-modal');
  if (formModal) {
    formModal.style.display = 'none';
  }
  currentEditingSubmissionId = null;
  currentCoverImageUrl = null;
}

async function loadSubmissionIntoForm(submissionId) {
  try {
    const result = await SubmissionHandler.getSubmission(submissionId);
    if (!result.success) throw result.error;

    const sub = result.data;
    
    // Map schema field names
    document.getElementById('form-title-input').value = sub.title || '';
    document.getElementById('form-content-type').value = sub.type || 'news';
    document.getElementById('form-county').value = sub.county_id || '';
    document.getElementById('form-excerpt').value = sub.category || ''; // Using category as excerpt field for now
    document.getElementById('form-content').value = sub.description || '';
    
    // Handle tags - they may be an array in database
    const tagsValue = Array.isArray(sub.tags) ? sub.tags.join(', ') : (sub.tags || '');
    document.getElementById('form-tags').value = tagsValue;

    if (sub.featured_image_url) {
      currentCoverImageUrl = sub.featured_image_url;
      displayImagePreview(sub.featured_image_url);
    }

  } catch (error) {
    console.error('Error loading submission:', error);
    DashboardUtils.showToast('Error loading submission', 'error');
  }
}

async function handleFormSubmit(isDraft) {
  try {
    const form = document.getElementById('submission-form');
    const loading = document.getElementById('form-loading');
    const message = document.getElementById('form-message');

    // Validate form
    const title = document.getElementById('form-title-input').value.trim();
    const description = document.getElementById('form-content').value.trim();
    const county_id = document.getElementById('form-county').value;

    if (!title) {
      showFormError('form-title-error', 'Title is required');
      return;
    }
    if (!description) {
      showFormError('form-content-error', 'Content/Description is required');
      return;
    }
    if (!county_id) {
      showFormError('form-county-error', 'County is required');
      return;
    }

    loading.style.display = 'block';

    // Map content type from form to schema enum
    const typeMapping = {
      'article': 'news',
      'event': 'event',
      'opportunity': 'opportunity',
      'announcement': 'community_story',
      'tourism': 'tourism',
      'news': 'news',
      'community_story': 'community_story'
    };
    
    const formType = document.getElementById('form-content-type').value;
    const type = typeMapping[formType] || 'news';

    const submissionData = {
      id: currentEditingSubmissionId,
      title,
      description,
      county_id,
      type,
      category: document.getElementById('form-excerpt').value.trim() || null, // Using excerpt field as category for now
      tags: document.getElementById('form-tags').value,
      featuredImage: currentCoverImageUrl,
      userId: currentUser.id,
    };

    const result = await SubmissionHandler.saveSubmission(submissionData, isDraft);

    loading.style.display = 'none';

    if (result.success) {
      const messageText = isDraft ? 'Draft saved successfully!' : 'Submitted for review!';
      message.textContent = messageText;
      message.style.background = '#ECFDF5';
      message.style.color = '#065F46';
      message.style.display = 'block';

      DashboardUtils.showToast(messageText, 'success');

      setTimeout(() => {
        closeSubmissionForm();
        navigate(currentView);
      }, 1500);
    } else {
      showFormMessage(result.error, 'error');
    }

  } catch (error) {
    console.error('Error submitting form:', error);
    showFormMessage(error.message, 'error');
    document.getElementById('form-loading').style.display = 'none';
  }
}

async function handleImageUpload(file) {
  try {
    const loading = document.getElementById('form-loading');
    loading.style.display = 'block';

    const result = await SubmissionHandler.uploadCoverImage(file, currentUser.id);

    loading.style.display = 'none';

    if (result.success) {
      currentCoverImageUrl = result.url;
      displayImagePreview(result.url);
      DashboardUtils.showToast('Image uploaded successfully', 'success');
    } else {
      DashboardUtils.showToast(result.error, 'error');
    }

  } catch (error) {
    console.error('Error uploading image:', error);
    DashboardUtils.showToast('Error uploading image', 'error');
    document.getElementById('form-loading').style.display = 'none';
  }
}

function displayImagePreview(imageUrl) {
  const preview = document.getElementById('form-image-preview');
  const img = document.getElementById('form-preview-img');
  if (preview && img) {
    img.src = imageUrl;
    preview.style.display = 'block';
  }
}

function removeFormImage() {
  currentCoverImageUrl = null;
  const preview = document.getElementById('form-image-preview');
  const input = document.getElementById('form-image-input');
  if (preview) preview.style.display = 'none';
  if (input) input.value = '';
}

function showFormError(errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function showFormMessage(message, type) {
  const messageEl = document.getElementById('form-message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.style.background = type === 'error' ? '#FEE2E2' : '#ECFDF5';
    messageEl.style.color = type === 'error' ? '#991B1B' : '#065F46';
    messageEl.style.display = 'block';
  }
}

// ─────────────────────────────────────────
// SUBMISSION ACTIONS
// ─────────────────────────────────────────
async function viewSubmission(submissionId) {
  try {
    const result = await SubmissionHandler.getSubmission(submissionId);
    if (!result.success) throw result.error;

    const sub = result.data;
    const content = `
      <div>
        <h3>${sub.title}</h3>
        ${sub.cover_image_url ? `<img src="${sub.cover_image_url}" style="max-width: 100%; max-height: 300px; margin: 16px 0; border-radius: 6px;">` : ''}
        <p><strong>County:</strong> ${sub.county}</p>
        <p><strong>Status:</strong> ${sub.status}</p>
        <p><strong>Type:</strong> ${sub.content_type}</p>
        ${sub.tags ? `<p><strong>Tags:</strong> ${sub.tags}</p>` : ''}
        <p><strong>Created:</strong> ${DashboardUtils.formatDate(sub.created_at)}</p>
        <hr>
        <div>${sub.excerpt ? `<h4>Excerpt</h4><p>${sub.excerpt}</p>` : ''}</div>
        <div><h4>Full Content</h4><p>${sub.content}</p></div>
      </div>
    `;
    openModal(sub.title, content);
  } catch (error) {
    console.error('Error viewing submission:', error);
    DashboardUtils.showToast('Error loading submission', 'error');
  }
}

async function editSubmission(submissionId) {
  openSubmissionForm(submissionId);
}

async function deleteSubmission(submissionId) {
  if (!confirm('Are you sure you want to delete this draft?')) return;

  try {
    const result = await SubmissionHandler.deleteSubmission(submissionId);
    if (result.success) {
      DashboardUtils.showToast('Submission deleted', 'success');
      navigate(currentView);
    } else {
      DashboardUtils.showToast(result.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting submission:', error);
    DashboardUtils.showToast('Error deleting submission', 'error');
  }
}

// ─────────────────────────────────────────
// ACCOUNT SETTINGS FUNCTIONS
// ─────────────────────────────────────────
function toggleProfileEdit() {
  const form = document.getElementById('profile-form');
  const btn = document.getElementById('edit-profile-btn');
  if (form) {
    if (form.style.display === 'none') {
      form.style.display = 'block';
      btn.textContent = ' Cancel';
    } else {
      form.style.display = 'none';
      btn.textContent = ' Edit Profile';
    }
  }
}

async function saveProfileChanges() {
  try {
    const countyValue = document.getElementById('profile-county').value;
    
    const result = await AccountSettingsForm.updateProfile(
      currentUser.id,
      {
        full_name: document.getElementById('profile-fullname').value,
        bio: document.getElementById('profile-bio').value,
        county_id: countyValue,
        profile_visibility: 'public', // Default value
      }
    );

    if (result.success) {
      DashboardUtils.showToast('Profile updated successfully', 'success');
      currentProfile = result.data; // Update local profile
      await loadAccountSettings();
    } else {
      DashboardUtils.showToast(result.error, 'error');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    DashboardUtils.showToast('Error saving profile', 'error');
  }
}

function triggerAvatarUpload() {
  const input = document.getElementById('avatar-upload');
  if (input) input.click();
}

function toggleEmailChange() {
  const form = document.getElementById('email-form');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
}

async function saveEmailChange() {
  try {
    const newEmail = document.getElementById('new-email').value.trim();
    if (!newEmail) {
      DashboardUtils.showToast('Please enter a new email', 'error');
      return;
    }

    const result = await AccountSettingsForm.updateEmail(newEmail);
    if (result.success) {
      DashboardUtils.showToast('Email update initiated. Check your email for confirmation.', 'success');
      toggleEmailChange();
    } else {
      DashboardUtils.showToast(result.error, 'error');
    }
  } catch (error) {
    console.error('Error updating email:', error);
    DashboardUtils.showToast('Error updating email', 'error');
  }
}

function togglePasswordChange() {
  const form = document.getElementById('password-form');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
}

async function savePasswordChange() {
  try {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!newPassword) {
      DashboardUtils.showToast('Please enter a new password', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      DashboardUtils.showToast('Passwords do not match', 'error');
      return;
    }

    const result = await AccountSettingsForm.updatePassword(newPassword);
    if (result.success) {
      DashboardUtils.showToast('Password updated successfully', 'success');
      togglePasswordChange();
    } else {
      DashboardUtils.showToast(result.error, 'error');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    DashboardUtils.showToast('Error updating password', 'error');
  }
}

async function saveNotificationPreferences() {
  try {
    const preferences = {
      emailOnApproval: document.getElementById('notify-approval').checked,
      emailOnRejection: document.getElementById('notify-rejection').checked,
      emailOnReviewComment: document.getElementById('notify-comments').checked,
      emailNewsletter: document.getElementById('notify-newsletter').checked,
    };

    const result = await AccountSettingsForm.updateNotificationPreferences(currentUser.id, preferences);
    if (result.success) {
      DashboardUtils.showToast('Notification preferences saved', 'success');
    } else {
      DashboardUtils.showToast(result.error, 'error');
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
    DashboardUtils.showToast('Error saving preferences', 'error');
  }
}

// ─────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────
function openModal(title, content) {
  const modal = document.getElementById('submission-modal');
  const modalContent = document.getElementById('modal-content');
  if (modal && modalContent) {
    modalContent.innerHTML = content;
    modal.style.display = 'flex';
  }
}

function closeModal() {
  const modal = document.getElementById('submission-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function logout() {
  try {
    await sb.auth.signOut();
    window.location.href = '../auth-page/auth.html';
  } catch (error) {
    console.error('✗ Logout error:', error);
    DashboardUtils.showToast('Error logging out', 'error');
  }
}

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDashboard);
