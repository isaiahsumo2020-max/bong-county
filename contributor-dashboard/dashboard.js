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
let sidebarOpen = window.innerWidth > 1024;
let currentEditingSubmissionId = null;
let currentCoverImageUrl = null;
let countiesList = []; // Cache of counties from database
const communityState = {
  countyId: '',
  type: '',
  search: '',
  followedIds: null,
  mode: 'latest',
  offset: 0,
  pageSize: 10,
  hasMore: false,
  loading: false
};

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
const CONTRIBUTOR_NAV = [
  { section: 'Main', id: 'overview', label: 'Home', icon: 'home' },
  { section: 'Main', id: 'community', label: 'Community', icon: 'groups', route: true },
  { section: 'Main', id: 'feeds', label: 'Feeds', icon: 'dynamic_feed', route: true },
  { section: 'Discover', id: 'find-people', label: 'People', icon: 'people', route: true },
  { section: 'Discover', id: 'organizations', label: 'Organizations and Institutions', icon: 'corporate_fare', route: true },
  { section: 'My Activity', id: 'submissions', label: 'My Submissions', icon: 'description' },
  { section: 'My Activity', id: 'drafts', label: 'Drafts', icon: 'edit' },
  { section: 'My Activity', id: 'pending', label: 'Pending Review', icon: 'hourglass_empty' },
  { section: 'My Activity', id: 'published', label: 'Published', icon: 'check_circle' },
  { section: 'My Activity', id: 'rejected', label: 'Rejected', icon: 'cancel' },
  { section: 'My Activity', id: 'activity', label: 'Activity History', icon: 'history' },
  { section: 'My Activity', id: 'messages', label: 'Messages', icon: 'mail', route: true },
  { section: 'Account', id: 'profile', label: 'My Profile', icon: 'account_circle', route: true },
  { section: 'Account', id: 'account', label: 'Account Settings', icon: 'settings' },
  { section: 'Account', id: 'logout', label: 'Sign Out', icon: 'logout' }
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
    // Select the user's county by default when available
    if (currentProfile && (currentProfile.county_id === county.id || currentProfile.county === county.slug || currentProfile.county === county.name)) {
      option.selected = true;
    }
    dropdown.appendChild(option);
  }

  // If the user has a county assigned, lock the selector to prevent posting to another county
  try {
    if (currentProfile && currentProfile.county_id) {
      dropdown.value = currentProfile.county_id;
      dropdown.disabled = true;
      dropdown.setAttribute('title', 'Your county is pre-selected and cannot be changed.');
    } else {
      dropdown.disabled = false;
      dropdown.removeAttribute('title');
    }
  } catch (e) {
    console.warn('Could not lock county dropdown:', e);
  }
  // Ensure badge reflects locked state immediately after populating
  showLockedCountyBadge();
}

// Create or update a non-editable county badge next to the form selector when county is locked
function showLockedCountyBadge() {
  try {
    const dropdown = document.getElementById('form-county');
    if (!dropdown) return;

    const existing = document.getElementById('form-county-badge');

    const countyId = dropdown.value || (currentProfile && currentProfile.county_id);
    const county = countyId ? countiesList.find(c => c.id === countyId) : null;
    const countyName = county ? county.name : (countyId ? getCountyName(countyId) : null);
    const countySlug = county ? county.slug : (countyId ? (countiesList.find(c => c.id === countyId)?.slug || '') : '');

    if (dropdown.disabled && countyName) {
      // Hide the select to avoid confusion but keep it in DOM for form submission
      dropdown.style.display = 'none';

      if (existing) {
        existing.innerHTML = `${countyName} <span style="opacity:0.9; margin-left:6px; font-weight:500; font-size:12px; background: rgba(255,255,255,0.08); padding:2px 6px; border-radius:6px;">${countySlug}</span>`;
        existing.style.display = 'inline-block';
        return;
      }

      const badge = document.createElement('span');
      badge.id = 'form-county-badge';
      badge.setAttribute('aria-live', 'polite');
      badge.style.display = 'inline-block';
      badge.style.padding = '6px 10px';
      badge.style.background = 'var(--county-primary, #3B82F6)';
      badge.style.color = 'white';
      badge.style.borderRadius = '999px';
      badge.style.fontSize = '13px';
      badge.style.fontWeight = '600';
      badge.style.marginLeft = '8px';
      badge.innerHTML = `${countyName} <span style="opacity:0.9; margin-left:6px; font-weight:500; font-size:12px; background: rgba(255,255,255,0.08); padding:2px 6px; border-radius:6px;">${countySlug}</span>`;

      // Insert badge after the dropdown
      dropdown.parentNode?.insertBefore(badge, dropdown.nextSibling);
    } else {
      // If not locked, remove badge and show select
      if (existing) existing.style.display = 'none';
      dropdown.style.display = '';
    }
  } catch (err) {
    console.warn('Could not show locked county badge:', err);
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

    // Get current authenticated user via shared helpers
    const user = await window.supabaseHelpers.getCurrentUser();
    if (!user) {
      if (window.authGuard && typeof window.authGuard.redirect === 'function') {
        window.authGuard.redirect('../auth-page/auth.html');
      } else {
        window.location.href = '../auth-page/auth.html';
      }
      return;
    }

    currentUser = user;
    // Fetch profile row from `users` table rather than relying on a hardcoded or prepopulated object
    currentProfile = await window.supabaseHelpers.getUserProfile(currentUser.id) || window.authGuard?.userProfile || null;

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
    // Reveal sidebar now that dashboard is initialized to avoid duplicate/flicker
    const sidebar = document.getElementById('dashboard-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) {
      sidebar.style.display = '';
      if (window.innerWidth > 1024) {
        sidebar.removeAttribute('aria-hidden');
      } else {
        sidebar.setAttribute('aria-hidden', 'true');
        sidebar.classList.remove('open');
      }
    }
    if (overlay) {
      overlay.classList.remove('visible');
    }
  } catch (error) {
    console.error('✗ Dashboard initialization error:', error);
    DashboardUtils.showToast('Error initializing dashboard', 'error');
  }
  sidebarOpen = window.innerWidth > 1024;
}

// ─────────────────────────────────────────
// UI SETUP
// ─────────────────────────────────────────
function setupHeader() {
  const userEmailEl = document.getElementById('user-email');
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');
  const userRoleEls = document.querySelectorAll('#user-role, #profile-user-role');
  const userCountyEls = document.querySelectorAll('#user-county, #profile-user-county');
  const profileNameEl = document.getElementById('profile-name');
  const profileEmailEl = document.getElementById('profile-email');
  
  if (userEmailEl) {
    userEmailEl.textContent = currentProfile?.email || currentUser?.email;
  }
  
  if (userNameEl) {
    userNameEl.textContent = currentProfile?.full_name || 'Contributor';
  }
  if (userAvatarEl) {
    userAvatarEl.textContent = (currentProfile?.full_name || 'C').trim().charAt(0).toUpperCase();
  }
  if (profileNameEl) profileNameEl.textContent = currentProfile?.full_name || 'Contributor';
  if (profileEmailEl) profileEmailEl.textContent = currentProfile?.email || currentUser?.email;

  const countyName = (() => {
    if (!currentProfile) return null;
    if (currentProfile.county_id) return getCountyName(currentProfile.county_id);
    if (currentProfile.county) return currentProfile.county; // could be slug or name
    return null;
  })();

  // Set role and county text in all bound elements
  userRoleEls.forEach(el => el.textContent = currentProfile?.role || 'Contributor');
  userCountyEls.forEach(el => el.textContent = countyName || 'Unknown County');

  // Apply county branding if available
  try {
    const countySlug = (function() {
      if (!currentProfile) return null;
      if (currentProfile.county_id) {
        const c = countiesList.find(x => x.id === currentProfile.county_id);
        return c?.slug || null;
      }
      // If profile has county as slug or name, attempt to map
      if (currentProfile.county) {
        const bySlug = countiesList.find(x => x.slug === currentProfile.county);
        if (bySlug) return bySlug.slug;
        const byName = countiesList.find(x => x.name === currentProfile.county);
        if (byName) return byName.slug;
      }
      return null;
    })();

    if (window.CountyBranding && countySlug) {
      CountyBranding.applyTheme(countySlug);
    }
  } catch (err) {
    console.warn('County branding apply failed:', err);
  }
  // Update document title to include county
  try {
    const name = currentProfile?.full_name || currentUser?.email || 'Contributor';
    document.title = `${name} • ${countyName || ''} — CountySphere`;
  } catch (e) {}
}

function setupSidebar() {
  const sidebarNav = document.getElementById('sidebar-nav');
  if (!sidebarNav) return;

  let currentSection = '';
  sidebarNav.innerHTML = CONTRIBUTOR_NAV.map(item => {
    const sectionHeading = item.section !== currentSection
      ? `<p class="lc-sidebar-section-heading">${item.section}</p>`
      : '';
    currentSection = item.section;
    return `${sectionHeading}
    <button type="button" class="nav-item" data-view="${item.id}" style="
        padding: 12px 18px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-left: 4px solid transparent;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        font-size: 15px;
        font-weight: 500;
        user-select: none;
        text-align: left;
        color: inherit;
        background: transparent;
        border-top: 0;
        border-right: 0;
        border-bottom: 0;
      " ${item.route ? `data-lc-route="${item.id}"` : ''}>
        <span aria-hidden="true" class="material-icons" style="font-size: 22px; flex-shrink: 0; color: rgba(55,65,81,0.9);">${item.icon}</span>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.label}</span>
      </button>
    `;
    }).join('');

  // Attach event listeners to nav items
  sidebarNav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault && e.preventDefault();
      const viewId = e.currentTarget.dataset.view;
      if (viewId === 'logout') return logout && logout();
      await navigate(viewId);
    });

    // Hover effects
    item.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(59,130,246,0.06)';
      this.style.borderLeftColor = 'rgba(59,130,246,0.9)';
    });
    item.addEventListener('mouseleave', function() {
      if (!this.classList.contains('active')) {
        this.style.backgroundColor = 'transparent';
        this.style.borderLeftColor = 'transparent';
      }
    });
  });
}

function closeSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) {
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
  }
  if (overlay) overlay.classList.remove('visible');
  document.body.classList.remove('sidebar-active');
  sidebarOpen = false;
}

function openSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) {
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
  }
  if (overlay) overlay.classList.add('visible');
  document.body.classList.add('sidebar-active');
  sidebarOpen = true;
}

function setupEventListeners() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (sidebarOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  const sidebarClose = document.getElementById('sidebar-close');
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Search bar functionality
  const searchInput = document.getElementById('dashboard-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const submissions = document.querySelectorAll('[data-submission-title]');
      submissions.forEach(item => {
        const title = item.getAttribute('data-submission-title').toLowerCase();
        item.style.display = title.includes(query) ? '' : 'none';
      });
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('Search for:', e.target.value);
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  const openSubmissionBtn = document.getElementById('open-submission-form');
  if (openSubmissionBtn) {
    openSubmissionBtn.addEventListener('click', () => openSubmissionForm('new'));
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

    // Update active nav item with professional styling
    document.querySelectorAll('.nav-item').forEach(item => {
      const isActive = item.dataset.view === viewId;
      if (isActive) {
        item.classList.add('active');
        item.style.backgroundColor = 'rgba(59,130,246,0.12)';
        item.style.borderLeftColor = 'rgba(59,130,246,0.9)';
        item.style.color = 'rgba(15, 23, 42, 1)';
        item.style.fontWeight = '600';
      } else {
        item.classList.remove('active');
        item.style.backgroundColor = 'transparent';
        item.style.borderLeftColor = 'transparent';
        item.style.color = 'rgba(17, 24, 39, 0.95)';
        item.style.fontWeight = '500';
      }
    });

    // Load view
    const viewContent = document.getElementById('view-content');
    DashboardUtils.showLoadingSpinner('view-content');

    switch (viewId) {
      case 'overview':
        await loadOverview();
        break;
      case 'community':
        await renderNationalCommunity();
        break;
      case 'submissions':
        await loadSubmissions('all');
        break;
      case 'drafts':
        await loadSubmissions('draft');
        break;
      case 'pending':
        await loadSubmissions('pending_review');
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

    // Close sidebar on narrower screens after navigation
    if (window.innerWidth <= 1024) {
      closeSidebar();
    }

  } catch (error) {
    console.error('✗ Navigation error:', error);
    DashboardUtils.showToast('Error loading view', 'error');
  }
}

function createCommunityFilters() {
  const form = document.createElement('form');
  form.className = 'community-filters';
  form.setAttribute('aria-label', 'Filter the national community feed');

  const countySelect = document.createElement('select');
  countySelect.id = 'community-county-filter';
  countySelect.setAttribute('aria-label', 'Filter by county');
  const allCounties = document.createElement('option');
  allCounties.value = '';
  allCounties.textContent = 'All counties';
  countySelect.appendChild(allCounties);
  countiesList.forEach(county => {
    const option = document.createElement('option');
    option.value = county.id;
    option.textContent = county.name;
    countySelect.appendChild(option);
  });

  const typeSelect = document.createElement('select');
  typeSelect.id = 'community-type-filter';
  typeSelect.setAttribute('aria-label', 'Filter by content type');
  [
    ['', 'All types'],
    ['story', 'Stories'],
    ['article', 'Articles'],
    ['announcement', 'Announcements']
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  });

  const feedSelect = document.createElement('select');
  feedSelect.id = 'community-feed-mode';
  feedSelect.setAttribute('aria-label', 'Feed selection');
  [
    ['latest', 'Latest across Liberia'],
    ['recommended', 'Based on my topics']
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    feedSelect.appendChild(option);
  });

  const search = document.createElement('input');
  search.id = 'community-search';
  search.type = 'search';
  search.maxLength = 100;
  search.placeholder = 'Search titles';
  search.setAttribute('aria-label', 'Search published content titles');

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Search';

  form.append(feedSelect, countySelect, typeSelect, search, submit);
  return form;
}

function getSafeCommunityImageUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    if (url.protocol === 'https:' || url.origin === window.location.origin) return url.href;
  } catch (error) {
    console.warn('Skipping invalid community image URL:', error);
  }
  return null;
}

function renderCommunityCard(item) {
  const card = document.createElement('article');
  card.className = 'community-card';

  const county = countiesList.find(entry => entry.id === item.county_id);
  const heading = document.createElement('h3');
  heading.textContent = item.title || 'Untitled';

  const byline = document.createElement('p');
  byline.className = 'community-byline';
  const author = item.author?.organization_name || item.author?.full_name || 'CountySphere contributor';
  byline.textContent = `${author} · ${county?.name || 'County information unavailable'}`;
  const avatarUrl = getSafeCommunityImageUrl(item.author?.logo_url || item.author?.avatar_url);
  if (avatarUrl) {
    const avatar = document.createElement('img');
    avatar.className = 'community-author-avatar';
    avatar.src = avatarUrl;
    avatar.alt = '';
    avatar.loading = 'lazy';
    card.appendChild(avatar);
  }

  const summary = document.createElement('p');
  summary.textContent = item.excerpt || DashboardUtils.truncateText(item.body || '', 200) || 'No preview is available.';

  const metadata = document.createElement('p');
  metadata.className = 'community-meta';
  const publishedAt = item.published_at || item.created_at;
  metadata.textContent = `${item.type || 'Published content'}${publishedAt ? ` · ${DashboardUtils.formatDate(publishedAt)}` : ''}`;

  const actions = document.createElement('div');
  actions.className = 'community-card-actions';
  const details = document.createElement('button');
  details.type = 'button';
  details.textContent = 'Read and discuss';
  details.addEventListener('click', () => openCommunityDetail(item, county));
  actions.appendChild(details);

  if (county?.slug) {
    const countyLink = document.createElement('a');
    countyLink.href = `../county-pages/county.html?county=${encodeURIComponent(county.slug)}`;
    countyLink.textContent = `${county.name} county page`;
    actions.appendChild(countyLink);
  }

  const imageUrl = getSafeCommunityImageUrl(item.cover_image_url);
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove(), { once: true });
    card.appendChild(image);
  }

  card.append(heading, byline, summary, metadata, actions);
  return card;
}

function openCommunityDetail(item, county) {
  const dialog = document.createElement('dialog');
  dialog.className = 'community-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'community-detail-title');

  const header = document.createElement('div');
  header.className = 'community-detail-header';
  const title = document.createElement('h2');
  title.id = 'community-detail-title';
  title.textContent = item.title || 'Published content';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';
  close.addEventListener('click', () => dialog.close());
  header.append(title, close);

  const byline = document.createElement('p');
  byline.textContent = `${item.author?.organization_name || item.author?.full_name || 'CountySphere contributor'} · ${county?.name || 'County information unavailable'}`;
  const body = document.createElement('p');
  body.className = 'community-detail-body';
  body.textContent = item.body || item.excerpt || 'No full text is available for this item.';

  const engagement = document.createElement('section');
  engagement.className = 'community-engagement';
  const reactionRoot = document.createElement('div');
  reactionRoot.id = 'community-reaction-bar';
  const commentsRoot = document.createElement('div');
  commentsRoot.id = 'community-comments-root';
  engagement.append(reactionRoot, commentsRoot);

  dialog.append(header, byline, body);
  if (county?.slug) {
    const countyLink = document.createElement('a');
    countyLink.href = `../county-pages/county.html?county=${encodeURIComponent(county.slug)}`;
    countyLink.textContent = `View ${county.name} county page`;
    dialog.appendChild(countyLink);
  }
  dialog.appendChild(engagement);
  document.body.appendChild(dialog);

  dialog.addEventListener('close', () => {
    dialog.remove();
  }, { once: true });
  dialog.showModal();

  const reactionBar = new ReactionBar({
    contentId: item.id,
    containerId: 'community-reaction-bar',
    isAuthenticated: true,
    currentUser
  });
  reactionBar.init();

  const comments = new CommentSystem({
    contentId: item.id,
    containerId: 'community-comments-root',
    isAuthenticated: true,
    currentUser
  });
  comments.init();
}

async function loadCommunityPage(append = false) {
  const feed = document.getElementById('community-feed');
  const status = document.getElementById('community-feed-status');
  const loadMore = document.getElementById('community-load-more');
  if (!feed || communityState.loading) return;

  communityState.loading = true;
  status.textContent = communityState.mode === 'following'
    ? 'Loading posts from followed accounts…'
    : 'Loading published content from across Liberia…';
  loadMore.hidden = true;

  try {
    let query = sb
      .from('content')
      .select('id,title,excerpt,body,type,published_at,created_at,author_id,county_id,cover_image_url,view_count,tags,author:author_id(full_name,avatar_url,logo_url,organization_name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(communityState.offset, communityState.offset + communityState.pageSize - 1);

    if (communityState.mode === 'following') {
      const { data: follows, error: followsError } = await sb.from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
      if (followsError) throw followsError;
      const followedIds = [...new Set((follows || []).map(row => row.following_id))];
      if (!followedIds.length) {
        if (!append) feed.replaceChildren();
        const empty = document.createElement('div');
        empty.className = 'community-notice';
        empty.textContent = 'Your Community feed is empty. Follow people or organizations to personalize it.';
        const peopleLink = document.createElement('button');
        peopleLink.type = 'button';
        peopleLink.dataset.lcRoute = 'find-people';
        peopleLink.textContent = 'Discover People';
        const organizationsLink = document.createElement('button');
        organizationsLink.type = 'button';
        organizationsLink.dataset.lcRoute = 'organizations';
        organizationsLink.textContent = 'Discover Organizations';
        empty.append(peopleLink, organizationsLink);
        feed.appendChild(empty);
        status.textContent = 'Your Community feed is ready when you follow accounts.';
        loadMore.hidden = true;
        return;
      }
      query = query.in('author_id', followedIds);
    }

    if (communityState.mode === 'recommended') {
      const { data: subscriptions, error: subscriptionError } = await sb
        .from('user_subscriptions')
        .select('notification_topics!inner(slug)')
        .eq('user_id', currentUser.id);
      if (subscriptionError) throw subscriptionError;
      const topicSlugs = [...new Set((subscriptions || [])
        .map(subscription => subscription.notification_topics?.slug)
        .filter(Boolean))];
      if (!topicSlugs.length) {
        if (!append) feed.replaceChildren();
        status.textContent = 'Choose topics in Account Settings to personalize recommendations. Latest national content remains available.';
        loadMore.hidden = true;
        return;
      }
      query = query.overlaps('tags', topicSlugs);
    }

    if (communityState.countyId) query = query.eq('county_id', communityState.countyId);
    if (communityState.type) query = query.eq('type', communityState.type);
    if (communityState.search) query = query.ilike('title', `%${communityState.search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    if (!append) feed.replaceChildren();
    if (rows.length) rows.forEach(item => feed.appendChild(renderCommunityCard(item)));

    if (!rows.length && !append) {
      const empty = document.createElement('p');
      empty.className = 'community-notice';
      empty.textContent = 'No published content matches these filters yet.';
      feed.appendChild(empty);
    }

    communityState.offset += rows.length;
    communityState.hasMore = rows.length === communityState.pageSize;
    loadMore.hidden = !communityState.hasMore;
    status.textContent = rows.length
      ? `Showing ${communityState.offset} published ${communityState.offset === 1 ? 'item' : 'items'}.`
      : append ? 'You have reached the end of the feed.' : 'No published content is available for these filters.';
  } catch (error) {
    console.error('Failed to load the national community feed:', error);
    status.textContent = 'The community feed could not be loaded. Check your connection and try again.';
    if (!append) feed.replaceChildren();
    loadMore.hidden = true;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => loadCommunityPage(append), { once: true });
    feed.appendChild(retry);
  } finally {
    communityState.loading = false;
  }
}

async function renderNationalCommunity() {
  const view = document.getElementById('view-content');
  view.replaceChildren();
  const section = document.createElement('section');
  section.className = 'national-community';
  const heading = document.createElement('h1');
  heading.textContent = 'Latest Feeds';
  const description = document.createElement('p');
  description.textContent = 'Discover the latest published stories, articles, and announcements from all 15 counties.';

  const filters = createCommunityFilters();
  const feedStatus = document.createElement('p');
  feedStatus.id = 'community-feed-status';
  feedStatus.setAttribute('role', 'status');
  feedStatus.setAttribute('aria-live', 'polite');
  const feed = document.createElement('div');
  feed.id = 'community-feed';
  feed.className = 'community-feed';
  const loadMore = document.createElement('button');
  loadMore.id = 'community-load-more';
  loadMore.type = 'button';
  loadMore.textContent = 'Load more';
  loadMore.hidden = true;

  filters.addEventListener('submit', event => {
    event.preventDefault();
    communityState.countyId = filters.querySelector('#community-county-filter').value;
    communityState.type = filters.querySelector('#community-type-filter').value;
    communityState.search = filters.querySelector('#community-search').value.trim();
    communityState.mode = filters.querySelector('#community-feed-mode').value;
    communityState.offset = 0;
    loadCommunityPage();
  });
  filters.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', () => filters.requestSubmit());
  });
  loadMore.addEventListener('click', () => loadCommunityPage(true));

  section.append(heading, description, filters, feedStatus, feed, loadMore);
  view.appendChild(section);
  communityState.offset = 0;
  communityState.mode = 'latest';

  if (!countiesList.length) {
    feedStatus.textContent = 'County filters are unavailable because county data could not be loaded.';
  }
  await loadCommunityPage();
}

// ─────────────────────────────────────────
// VIEWS - OVERVIEW
// ─────────────────────────────────────────
async function loadOverview() {
  await renderNationalCommunity();
}

// ─────────────────────────────────────────
// VIEWS - SUBMISSIONS
// ─────────────────────────────────────────
async function loadSubmissions(filter) {
  try {
    console.log(`Loading submissions (${filter})...`);

    const result = await SubmissionHandler.getSubmissions(currentUser.id, filter, currentProfile?.county_id);
    if (!result.success) {
      throw new Error(result.error || 'Submissions could not be loaded.');
    }
    const submissions = result.data || [];
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);

    if (!submissions || submissions.length === 0) {
      const title = filter === 'all' ? 'No Submissions Yet' : `No ${filter.replace(/_/g, ' ')} submissions`;
      const description = filter === 'all'
        ? "You haven't submitted any content yet. Share a story, update, or opportunity with communities across Liberia."
        : `You don't have any ${filter.replace(/_/g, ' ')} submissions right now.`;
      document.getElementById('view-content').innerHTML = `
        <section class="lc-empty-submissions" aria-labelledby="submissions-empty-title">
          <span class="material-icons" aria-hidden="true">article</span>
          <h1 id="submissions-empty-title">${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
          <button type="button" class="btn btn-primary" onclick="openSubmissionForm('new')">
            ${filter === 'all' ? 'Create Your First Post' : 'Submit New Content'}
          </button>
        </section>`;
      return;
    }

    const html = `
      <div style="max-width: 1200px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
          <div>
            <h1 style="margin-top: 0; color: var(--county-primary);">
              ${filter === 'all' ? 'My Submissions' : DashboardUtils.truncateText(filter.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) + ' submissions', 50)}
            </h1>
            <p style="color: var(--county-text);">Showing ${submissions.length} of your submission(s)</p>
          </div>
          <button type="button" class="btn btn-primary" onclick="openSubmissionForm('new')">Submit New Content</button>
        </div>

        <div style="margin-top: 20px;">
          ${submissions.map(sub => `
            <article data-submission-title="${escapeHtml(sub.title)}" style="
              background: white;
              border: 1px solid var(--county-border);
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 16px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; color: var(--county-primary);">${escapeHtml(sub.title || 'Untitled submission')}</h3>
                  <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px;">
                    ${escapeHtml(DashboardUtils.truncateText(sub.body || sub.excerpt || '', 150))}
                  </p>
                  <div style="display: flex; gap: 12px; font-size: 12px; color: #9CA3AF; flex-wrap: wrap;">
                    <span>${escapeHtml(sub.type || 'Content')}</span>
                    <span>${escapeHtml(DashboardUtils.formatDate(sub.created_at))}</span>
                    <span>${escapeHtml(getCountyName(sub.county_id))}</span>
                    ${sub.tags && Array.isArray(sub.tags) ? `<span>${escapeHtml(DashboardUtils.truncateText(sub.tags.join(', '), 30))}</span>` : sub.tags ? `<span>${escapeHtml(DashboardUtils.truncateText(sub.tags, 30))}</span>` : ''}
                    <span style="background: ${DashboardUtils.getStatusColor(sub.status)}40; color: ${DashboardUtils.getStatusColor(sub.status)}; padding: 2px 8px; border-radius: 3px;">
                      ${escapeHtml((sub.status || 'unknown').replace(/_/g, ' '))}
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
                  ">View</button>
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
                </article>
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
              ${profile.avatar_url ? `<img src="${profile.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : '<span class="material-icons" style="font-size: 50px;">account_circle</span>'}
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

  // Ensure county is pre-selected and locked when user has a county
  try {
    const countySelect = document.getElementById('form-county');
    if (countySelect && currentProfile && currentProfile.county_id) {
      countySelect.value = currentProfile.county_id;
      countySelect.disabled = true;
      // Show a non-editable badge for clarity
      showLockedCountyBadge();
    }
  } catch (e) {
    console.warn('Could not pre-select/lock county on form:', e);
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
    
    // Map schema field names to form fields
    document.getElementById('form-title-input').value = sub.title || '';
    document.getElementById('form-content-type').value = sub.type || 'news';
    document.getElementById('form-county').value = sub.county_id || '';
    document.getElementById('form-excerpt').value = sub.excerpt || '';
    document.getElementById('form-content').value = sub.body || '';
    
    // Handle tags - they may be an array in database
    const tagsValue = Array.isArray(sub.tags) ? sub.tags.join(', ') : (sub.tags || '');
    document.getElementById('form-tags').value = tagsValue;

    if (sub.cover_image_url) {
      currentCoverImageUrl = sub.cover_image_url;
      displayImagePreview(sub.cover_image_url);
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

    // Map content type from form to schema enum (valid: 'story', 'announcement', 'article')
    const typeMapping = {
      'news': 'story',
      'event': 'announcement',
      'opportunity': 'article',
      'tourism': 'article',
      'community_story': 'story'
    };
    
    const formType = document.getElementById('form-content-type').value;
    const type = typeMapping[formType] || 'story';

    const submissionData = {
      id: currentEditingSubmissionId,
      title,
      description,
      excerpt: document.getElementById('form-excerpt').value.trim() || null,
      county_id,
      type,
      tags: document.getElementById('form-tags').value,
      coverImage: currentCoverImageUrl,
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
        <p><strong>County:</strong> ${getCountyName(sub.county_id)}</p>
        <p><strong>Status:</strong> ${sub.status}</p>
        <p><strong>Type:</strong> ${sub.type || sub.content_type || 'Unknown'}</p>
        ${sub.tags ? `<p><strong>Tags:</strong> ${Array.isArray(sub.tags) ? sub.tags.join(', ') : sub.tags}</p>` : ''}
        <p><strong>Created:</strong> ${DashboardUtils.formatDate(sub.created_at)}</p>
        <hr>
        <div>${sub.excerpt ? `<h4>Excerpt</h4><p>${sub.excerpt}</p>` : ''}</div>
        <div><h4>Full Content</h4><p>${sub.body || sub.content || ''}</p></div>
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
