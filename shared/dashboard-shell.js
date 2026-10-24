(function () {
  'use strict';

  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'community', label: 'Community', icon: 'groups' },
    { id: 'people', label: 'People', icon: 'people' },
    { id: 'submissions', label: 'My Submissions', icon: 'article' }
  ];

  const state = {
    profile: null,
    viewedProfile: null,
    user: null,
    notifications: [],
    active: 'home',
    counties: [],
    follows: new Set(),
    reactions: new Map(),
    feedPosts: new Map(),
    listOffset: 0,
    listTotal: 0,
    listLoading: false,
    feedMode: 'latest',
    conversationId: null,
    messagePoll: null
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function profileSubmitHandler(event) {
    const form = event.target.closest('[data-profile-form]');
    if (form) {
      event.preventDefault();
      saveProfile(form, form.closest('.lc-dashboard-page'));
      return;
    }
    const messageForm = event.target.closest('[data-message-form]');
    if (messageForm) {
      event.preventDefault();
      sendMessage(messageForm);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function safeImageUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' || url.origin === window.location.origin ? url.href : null;
    } catch {
      return null;
    }
  }

  function getClient() {
    return window.supabaseClient || window.supabaseHelpers?.supabaseClient || null;
  }

  async function loadIdentity() {
    const client = getClient();
    if (!client) return;

    const { data, error } = await client.auth.getUser();
    if (error) {
      console.warn('Dashboard profile controls could not verify the current user:', error.message);
      return;
    }
    state.user = data?.user || null;
    if (!state.user) return;

    const { data: profile, error: profileError } = await client
      .from('users')
      .select('*')
      .eq('id', state.user.id)
      .maybeSingle();
    if (profileError) {
      console.warn('Dashboard profile details could not be loaded:', profileError.message);
    } else {
      state.profile = profile;
    }
  }

  function initials() {
    const name = state.profile?.full_name || state.user?.user_metadata?.full_name || state.user?.email || 'User';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
  }

  function roleLabel() {
    const roles = {
      contributor: 'Contributor',
      county_admin: 'County Administrator',
      super_admin: 'Super Administrator'
    };
    const role = document.body.dataset.dashboardRole || state.profile?.role;
    return roles[role] || 'Dashboard';
  }

  function setAvatar(button) {
    const imageUrl = state.profile?.avatar_url || state.user?.user_metadata?.avatar_url;
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = '';
      image.addEventListener('error', () => {
        button.replaceChildren(document.createTextNode(initials()));
      }, { once: true });
      button.replaceChildren(image);
      return;
    }
    button.textContent = initials();
  }

  function closePopovers(except) {
    document.querySelectorAll('.lc-header-popover').forEach(popover => {
      if (popover !== except) popover.hidden = true;
    });
  }

  function addPopoverButton(parent, icon, label, callback) {
    const button = element('button', 'lc-popover-item');
    button.type = 'button';
    const symbol = element('span', 'material-icons', icon);
    symbol.setAttribute('aria-hidden', 'true');
    button.append(symbol, document.createTextNode(label));
    button.addEventListener('click', callback);
    parent.appendChild(button);
    return button;
  }

  function routeToProfile() {
    renderDashboardPage('profile');
  }

  function routeToSettings() {
    const role = document.body.dataset.dashboardRole;
    if (role === 'contributor' && typeof window.navigate === 'function') {
      window.navigate('account');
    } else if (role === 'county_admin' && typeof window.navigateTo === 'function') {
      window.navigateTo('settings');
    } else if (typeof window.Navigation?.showPage === 'function') {
      window.Navigation.showPage('settings');
    }
    closePopovers();
  }

  function signOut() {
    const role = document.body.dataset.dashboardRole;
    if (role === 'contributor' && typeof window.logout === 'function') {
      window.logout();
    } else if (role === 'county_admin' && typeof window.handleLogout === 'function') {
      window.handleLogout();
    } else if (typeof window.authGuard?.logout === 'function') {
      window.authGuard.logout();
    } else if (typeof window.Auth?.logout === 'function') {
      window.Auth.logout();
    } else {
      window.location.assign('../auth-page/auth.html');
    }
  }

  function createProfileMenu(container) {
    const trigger = element('button', 'lc-profile-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Open profile menu');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    setAvatar(trigger);

    const menu = element('div', 'lc-header-popover');
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    const title = element('p', 'lc-popover-title', state.profile?.full_name || state.user?.email || 'Your account');
    menu.appendChild(title);
    addPopoverButton(menu, 'person', 'View Profile', routeToProfile);
    addPopoverButton(menu, 'settings', 'Account Settings', routeToSettings);
    addPopoverButton(menu, 'logout', 'Sign Out', signOut);

    trigger.addEventListener('click', () => {
      const shouldOpen = menu.hidden;
      closePopovers(menu);
      menu.hidden = !shouldOpen;
      trigger.setAttribute('aria-expanded', String(shouldOpen));
    });
    container.append(trigger, menu);
  }

  function safeNotificationUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.origin);
      return url.origin === window.location.origin ? url.href : null;
    } catch {
      return null;
    }
  }

  async function loadNotifications() {
    const client = getClient();
    if (!client || !state.user) return;

    let { data, error } = await client
      .from('notifications')
      .select('id,title,body,action_url,is_read,created_at')
      .eq('recipient_id', state.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      const legacyResult = await client
        .from('notifications')
        .select('id,title,message,link,read,created_at')
        .eq('user_id', state.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      data = legacyResult.data;
      error = legacyResult.error;
      if (error) {
        console.warn('Dashboard notifications could not be loaded:', error.message);
        return;
      }
      state.notifications = (data || []).map(notification => ({
        ...notification,
        _readField: 'read',
        _ownerField: 'user_id'
      }));
    } else {
      state.notifications = (data || []).map(notification => ({
        ...notification,
        message: notification.body,
        link: notification.action_url,
        read: notification.is_read,
        _readField: 'is_read',
        _ownerField: 'recipient_id'
      }));
    }
    const badge = document.querySelector('.lc-notification-count');
    const unread = state.notifications.filter(notification => !notification.read).length;
    if (badge) badge.textContent = unread ? String(unread > 9 ? '9+' : unread) : '';
  }

  async function markNotificationRead(notification) {
    if (notification.read || !state.user) return;
    const client = getClient();
    const { error } = await client
      .from('notifications')
      .update({ [notification._readField || 'is_read']: true })
      .eq('id', notification.id)
      .eq(notification._ownerField || 'recipient_id', state.user.id);
    if (error) {
      console.warn('Notification could not be marked as read:', error.message);
      return;
    }
    notification.read = true;
    loadNotifications();
  }

  function renderNotifications(list) {
    list.replaceChildren();
    if (!state.notifications.length) {
      list.appendChild(element('p', 'lc-notification-empty', 'You’re all caught up.'));
      return;
    }
    state.notifications.forEach(notification => {
      const href = safeNotificationUrl(notification.link);
      const item = element(href ? 'a' : 'button', `lc-notification-item${notification.read ? '' : ' is-unread'}`);
      if (href) item.href = href;
      else item.type = 'button';
      const title = element('strong', '', notification.title || 'Notification');
      const message = element('span', '', notification.message || '');
      item.append(title, message);
      item.addEventListener('click', () => markNotificationRead(notification));
      list.appendChild(item);
    });
  }

  function createNotifications(container) {
    const wrapper = element('div');
    wrapper.style.position = 'relative';
    const trigger = element('button', 'lc-header-control');
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Open notifications');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    const icon = element('span', 'material-icons', 'notifications');
    icon.setAttribute('aria-hidden', 'true');
    const count = element('span', 'lc-notification-count');
    count.setAttribute('aria-label', 'Unread notification count');
    trigger.append(icon, count);

    const menu = element('div', 'lc-header-popover');
    menu.hidden = true;
    menu.appendChild(element('p', 'lc-popover-title', 'Notifications'));
    const list = element('div', 'lc-notification-list');
    list.appendChild(element('p', 'lc-notification-empty', 'Loading notifications…'));
    menu.appendChild(list);
    trigger.addEventListener('click', async () => {
      const shouldOpen = menu.hidden;
      closePopovers(menu);
      menu.hidden = !shouldOpen;
      trigger.setAttribute('aria-expanded', String(shouldOpen));
      if (shouldOpen) {
        await loadNotifications();
        renderNotifications(list);
      }
    });
    wrapper.append(trigger, menu);
    container.appendChild(wrapper);
    loadNotifications();
  }

  function filterDashboard(query) {
    const normalized = query.trim().toLowerCase();
    document.querySelectorAll('[data-submission-title], .community-card, .lc-feed-card, #main-content tr, #main-content article, #content-page tr').forEach(item => {
      item.hidden = Boolean(normalized) && !item.textContent.toLowerCase().includes(normalized);
    });
  }

  function setupSearch(header, controls) {
    let search = header.querySelector('.search-container');
    if (!search) {
      search = element('div', 'search-container');
      const input = element('input');
      input.type = 'search';
      input.id = 'dashboard-search';
      input.placeholder = 'Search this dashboard';
      input.setAttribute('aria-label', 'Search this dashboard');
      search.appendChild(input);
      header.insertBefore(search, controls);
    }
    search.classList.add('lc-search-container', 'lc-search-collapsed');
    const input = search.querySelector('input');
    const button = element('button', 'lc-header-control');
    button.type = 'button';
    button.setAttribute('aria-label', 'Search dashboard');
    const icon = element('span', 'material-icons', 'search');
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    button.addEventListener('click', () => {
      const open = search.classList.contains('lc-search-collapsed');
      search.classList.toggle('lc-search-collapsed', !open);
      if (open) input?.focus();
      else if (input) {
        input.value = '';
        filterDashboard('');
      }
    });
    input?.addEventListener('input', event => filterDashboard(event.target.value));
    controls.appendChild(button);
  }

  function openCommunity() {
    renderDashboardPage('community');
  }

  function closeMobileSidebar() {
    if (window.innerWidth >= 1024) return;
    const role = document.body.dataset.dashboardRole;
    if (role === 'contributor' && typeof window.closeSidebar === 'function') {
      window.closeSidebar();
    } else if (role === 'county_admin' && typeof window.toggleSidebar === 'function') {
      window.toggleSidebar(false);
    } else {
      document.getElementById('sidebar')?.classList.remove('sidebar-open');
      document.body.classList.remove('lc-sidebar-open');
      const overlay = document.querySelector('.lc-dashboard-sidebar-overlay');
      if (overlay) overlay.hidden = true;
    }
    document.querySelector('#dashboard-sidebar, .sidebar, #sidebar')
      ?.classList.remove('open', 'active', 'sidebar-open');
    document.body.classList.remove('lc-sidebar-open', 'sidebar-active', 'no-scroll');
    const overlay = document.querySelector(
      '#sidebar-overlay, .sidebar-overlay, .lc-dashboard-sidebar-overlay'
    );
    if (overlay) {
      overlay.classList.remove('visible', 'active');
      if (overlay.classList.contains('lc-dashboard-sidebar-overlay')) overlay.hidden = true;
    }
    document.querySelectorAll('#mobileMenuToggle, #sidebar-toggle, #hamburger-btn')
      .forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
  }

  function openSubmissions() {
    const role = document.body.dataset.dashboardRole;
    if (role === 'contributor' && typeof window.navigate === 'function') {
      window.navigate('submissions');
    } else if (role === 'county_admin' && typeof window.navigateTo === 'function') {
      window.navigateTo('content-review');
    } else if (typeof window.Navigation?.showPage === 'function') {
      window.Navigation.showPage('content');
    }
    closeMobileSidebar();
    state.active = 'submissions';
    syncBottomNavigation();
  }

  function openHome() {
    const role = document.body.dataset.dashboardRole;
    if (role === 'contributor' && typeof window.navigate === 'function') {
      window.navigate('overview');
    } else if (role === 'county_admin' && typeof window.navigateTo === 'function') {
      window.navigateTo('overview');
    } else if (typeof window.Navigation?.showPage === 'function') {
      window.Navigation.showPage('overview');
    }
    closeMobileSidebar();
    state.active = 'home';
    syncBottomNavigation();
  }

  function createFeedDialog() {
    const dialog = element('dialog', 'lc-feed-dialog');
    dialog.setAttribute('aria-labelledby', 'lc-feed-title');
    const header = element('div', 'lc-feed-header');
    const title = element('h2', '', 'Liberia Community Feed');
    title.id = 'lc-feed-title';
    const close = element('button', 'lc-feed-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close feed');
    close.appendChild(element('span', 'material-icons', 'close'));
    close.addEventListener('click', () => dialog.close());
    header.append(title, close);

    const tools = element('div', 'lc-feed-tools');
    const search = element('input');
    search.type = 'search';
    search.placeholder = 'Search published stories';
    search.setAttribute('aria-label', 'Search published stories');
    tools.appendChild(search);

    const content = element('div', 'lc-feed-content');
    const status = element('p', 'lc-feed-status', 'Loading published stories…');
    dialog.append(header, tools, status, content);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      content.querySelectorAll('.lc-feed-card').forEach(card => {
        card.hidden = Boolean(query) && !card.textContent.toLowerCase().includes(query);
      });
    });
    document.body.appendChild(dialog);
    dialog.showModal();
    loadFeed(content, status);
  }

  async function loadFeed(content, status) {
    const client = getClient();
    if (!client) {
      status.textContent = 'The feed is unavailable because the platform connection could not be initialized.';
      return;
    }
    try {
      const { data, error } = await client
        .from('content')
        .select('id,title,excerpt,body,type,published_at,created_at,county_id')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(30);
      if (error) throw error;
      const items = data || [];
      if (!items.length) {
        status.textContent = 'There are no published stories to show yet.';
        return;
      }

      const countyIds = [...new Set(items.map(item => item.county_id).filter(Boolean))];
      let counties = [];
      if (countyIds.length) {
        const { data: countyData, error: countyError } = await client
          .from('counties')
          .select('id,name')
          .in('id', countyIds);
        if (countyError) console.warn('Feed county labels could not be loaded:', countyError.message);
        counties = countyData || [];
      }
      const countyNames = new Map(counties.map(county => [county.id, county.name]));

      items.forEach(item => {
        const card = element('article', 'lc-feed-card');
        const heading = element('h3', '', item.title || 'Untitled');
        const excerpt = element('p', '', item.excerpt || item.body || 'No preview is available.');
        const date = item.published_at || item.created_at;
        const meta = element('small', '', [
          item.type || 'Published content',
          countyNames.get(item.county_id),
          date ? new Date(date).toLocaleDateString() : ''
        ].filter(Boolean).join(' · '));
        card.append(heading, excerpt, meta);
        content.appendChild(card);
      });
      status.textContent = `Showing ${items.length} recent published ${items.length === 1 ? 'story' : 'stories'}.`;
    } catch (error) {
      console.error('Failed to load the Liberia community feed:', error);
      status.textContent = 'Published stories could not be loaded. Please try again later.';
    }
  }

  function syncBottomNavigation() {
    document.querySelectorAll('.lc-mobile-navigation button').forEach(button => {
      const isPeople = button.dataset.destination === 'people' && state.active === 'find-people';
      if (button.dataset.destination === state.active || isPeople) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  }

  function createBottomNavigation() {
    const nav = element('nav', 'lc-mobile-navigation');
    nav.setAttribute('aria-label', 'Dashboard quick navigation');
    const role = document.body.dataset.dashboardRole;
    const submissionLabels = {
      county_admin: 'Content Review',
      super_admin: 'Manage Content'
    };
    NAV_ITEMS.forEach(item => {
      const labelText = item.id === 'submissions' ? submissionLabels[role] || item.label : item.label;
      const button = element('button');
      button.type = 'button';
      button.dataset.destination = item.id;
      button.setAttribute('aria-label', labelText);
      const icon = element('span', 'material-icons', item.icon);
      icon.setAttribute('aria-hidden', 'true');
      const label = element('span', '', labelText);
      button.append(icon, label);
      button.addEventListener('click', () => {
        if (item.id === 'home') openHome();
        if (item.id === 'community') openCommunity();
        if (item.id === 'people') renderDashboardPage('find-people');
        if (item.id === 'submissions') openSubmissions();
      });
      nav.appendChild(button);
    });
    document.body.appendChild(nav);
    syncBottomNavigation();
  }

  function getPageTarget(pageId) {
    const role = document.body.dataset.dashboardRole;
    if (role === 'contributor') return document.getElementById('view-content');
    if (role === 'county_admin') return document.getElementById('main-content');
    return document.querySelector(`[data-page="lc-${pageId}"]`);
  }

  function updateDashboardTitle(pageId) {
    const titles = {
      community: ['Community', 'Published community stories from across Liberia.'],
      feeds: ['Feeds', 'Discover stories, updates, people, and organizations from across Liberia.'],
      'find-people': ['Find People', 'Discover public contributor profiles from Liberia’s counties.'],
      organizations: ['Organizations', 'Discover organizations and institutions represented on CountySphere.'],
      messages: ['Messages', 'Private conversations with accounts you mutually follow.'],
      profile: ['My Profile', 'Your public profile and contributions.']
    };
    const content = titles[pageId];
    if (!content) return;
    const title = document.getElementById('dashboard-page-title');
    const subtitle = document.getElementById('dashboard-page-subtitle');
    if (title) title.textContent = content[0];
    if (subtitle) subtitle.textContent = content[1];
  }

  function pageHeader(title, description) {
    return `<header class="lc-page-heading"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div></header>`;
  }

  function renderPageStatus(target, message, error = false) {
    target.innerHTML = `<p class="lc-page-status${error ? ' lc-inline-error' : ''}" role="status">${escapeHtml(message)}</p>`;
  }

  function discoveryErrorMessage(error, fallback) {
    const errorText = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    const missingSchemaObject = ['pgrst202', 'pgrst205', '42p01', '42883'].includes(String(error?.code || '').toLowerCase());
    if (missingSchemaObject && /get_discovery_profiles|user_follows|can_view_discovery_profile/.test(errorText)) {
      return 'People and organization discovery is unavailable until the social discovery migration is applied.';
    }
    return fallback;
  }

  async function loadCounties() {
    if (state.counties.length) return state.counties;
    const client = getClient();
    if (!client) return [];
    const { data, error } = await client.from('counties').select('id,name').order('name');
    if (error) {
      console.warn('County options could not be loaded for discovery:', error.message);
      return [];
    }
    state.counties = data || [];
    return state.counties;
  }

  function countyOptions(selected = '') {
    return `<option value="">All counties</option>${state.counties.map(county =>
      `<option value="${escapeHtml(county.id)}"${county.id === selected ? ' selected' : ''}>${escapeHtml(county.name)}</option>`
    ).join('')}`;
  }

  function avatarMarkup(profile, isOrganization = false) {
    const image = safeImageUrl(isOrganization
      ? profile.logo_url || profile.avatar_url
      : profile.avatar_url);
    const name = profile.full_name || profile.organization_name || 'CountySphere member';
    const initialsText = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    return `<span class="lc-person-avatar">${image ? `<img src="${escapeHtml(image)}" alt="">` : escapeHtml(initialsText || 'CS')}</span>`;
  }

  async function loadFollowState(userIds) {
    state.follows = new Set();
    if (!state.user || !userIds.length) return;
    const { data, error } = await getClient()
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', state.user.id)
      .in('following_id', userIds);
    if (error) {
      console.warn('Follow states are unavailable. Apply the social discovery migration to enable follows:', error.message);
      return;
    }
    (data || []).forEach(row => state.follows.add(row.following_id));
  }

  async function toggleFollow(targetUserId, button) {
    if (!state.user || !targetUserId || targetUserId === state.user.id) return;
    button.disabled = true;
    const client = getClient();
    const wasFollowing = state.follows.has(targetUserId);
    const result = wasFollowing
      ? await client.from('user_follows').delete().eq('follower_id', state.user.id).eq('following_id', targetUserId)
      : await client.from('user_follows').insert({ follower_id: state.user.id, following_id: targetUserId });
    if (result.error) {
      console.error('Could not update follow relationship:', result.error);
      button.disabled = false;
      button.textContent = wasFollowing ? 'Following' : 'Follow';
      const status = button.closest('.lc-person-card, .lc-profile-card, .lc-feed-post')?.querySelector('.lc-follow-status');
      if (status) status.textContent = result.error.code === '42P01' || result.error.code === 'PGRST205'
        ? 'Following is not available until the database migration is applied.'
        : 'The follow action could not be saved. Try again.';
      return;
    }
    if (wasFollowing) state.follows.delete(targetUserId);
    else state.follows.add(targetUserId);
    button.disabled = false;
    button.textContent = wasFollowing ? 'Follow' : 'Following';
    button.classList.toggle('lc-action-button-primary', !wasFollowing);
    button.setAttribute('aria-pressed', String(!wasFollowing));
    const count = button.closest('.lc-profile-card')?.querySelector('[data-follower-count]');
    if (count) count.textContent = String(Number(count.textContent || 0) + (wasFollowing ? -1 : 1));
  }

  function setupDiscoveryToolbar(target, filterName, countyFilter = true) {
    const toolbar = target.querySelector('.lc-discovery-toolbar');
    const search = toolbar?.querySelector('[data-discovery-search]');
    const county = toolbar?.querySelector('[data-discovery-county]');
    let timer;
    search?.addEventListener('input', () => {
      clearTimeout(timer);
      state.listOffset = 0;
      timer = setTimeout(() => loadDirectoryPage(filterName, target), 250);
    });
    county?.addEventListener('change', () => {
      state.listOffset = 0;
      loadDirectoryPage(filterName, target);
    });
    if (!countyFilter && county) county.hidden = true;
  }

  function directoryCard(profile, organization = false) {
    const name = organization ? profile.organization_name || profile.full_name : profile.full_name;
    const subline = profile.role === 'county_admin'
      ? 'County Administrator'
      : organization
      ? profile.institution_type || profile.contributor_kind?.replace(/_/g, ' ') || 'Organization'
      : profile.individual_category?.replace(/_/g, ' ') || 'Contributor';
    const county = state.counties.find(item => item.id === profile.county_id)?.name || 'County not specified';
    const bio = organization ? profile.organization_description || profile.bio : profile.bio;
    const website = safeImageUrl(profile.website_url);
    const following = state.follows.has(profile.id);
    return `<article class="lc-person-card" data-person-id="${escapeHtml(profile.id)}">
      <div class="lc-person-card-header">${avatarMarkup(profile, organization)}
        <div class="lc-person-copy"><h2>${escapeHtml(name || 'CountySphere member')}${profile.verified ? ' <span class="material-icons" aria-label="Verified">verified</span>' : ''}</h2>
          <p class="lc-person-kind">${escapeHtml(subline)}</p><p class="lc-person-county">${escapeHtml(county)}</p>
        </div>
      </div>
      <p class="lc-person-bio">${escapeHtml(bio || 'No public description has been added.')}</p>
      <div class="lc-card-actions">
        <button type="button" class="lc-action-button${following ? ' lc-action-button-primary' : ''}" data-action="toggle-follow" data-user-id="${escapeHtml(profile.id)}" aria-pressed="${String(following)}">${following ? 'Following' : 'Follow'}</button>
        <button type="button" class="lc-action-button" data-action="view-profile" data-user-id="${escapeHtml(profile.id)}">View profile</button>
        ${website ? `<a class="lc-action-button" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Website</a>` : ''}
      </div>
      <p class="lc-follow-status lc-page-status" aria-live="polite"></p>
    </article>`;
  }

  async function loadDirectoryPage(filterName, target) {
    if (state.listLoading) return;
    state.listLoading = true;
    const cards = target.querySelector('.lc-discovery-grid');
    const status = target.querySelector('[data-page-status]');
    const pagination = target.querySelector('.lc-pagination');
    const searchValue = target.querySelector('[data-discovery-search]')?.value.trim().replace(/[%_]/g, ' ') || '';
    const countyId = target.querySelector('[data-discovery-county]')?.value || '';
    if (!cards || !status) {
      state.listLoading = false;
      return;
    }
    cards.replaceChildren();
    status.textContent = 'Loading eligible profiles…';

    try {
      const { data, error } = await getClient().rpc('get_discovery_profiles', {
        p_search: searchValue || null,
        p_county_id: countyId || null,
        p_organizations: filterName === 'organizations',
        p_offset: state.listOffset,
        p_limit: 20,
        p_target_user_id: null,
        p_user_ids: null
      });
      if (error) throw error;
      const profiles = data || [];
      state.listTotal = Number(profiles[0]?.total_count || 0);
      await loadFollowState(profiles.map(profile => profile.id));
      cards.innerHTML = profiles.map(profile => directoryCard(profile, filterName === 'organizations')).join('');
      status.textContent = profiles.length
        ? `Showing ${state.listOffset + 1}–${state.listOffset + profiles.length} of ${state.listTotal} eligible public ${filterName === 'organizations' ? 'organizations and institutions' : 'contributors and county administrators'}.`
        : `No eligible public ${filterName === 'organizations' ? 'organizations or institutions' : 'contributors'} match your search.`;
      if (pagination) {
        pagination.innerHTML = '';
        if (state.listOffset > 0) pagination.appendChild(paginationButton('Previous', 'previous'));
        if (state.listOffset + profiles.length < state.listTotal) pagination.appendChild(paginationButton('Next', 'next'));
      }
    } catch (error) {
      console.error(`Could not load ${filterName} directory:`, error);
      status.textContent = discoveryErrorMessage(
        error,
        'Profiles could not be loaded. Please check your connection and try again.'
      );
      status.classList.add('lc-inline-error');
    } finally {
      state.listLoading = false;
    }
  }

  function paginationButton(label, direction) {
    const button = element('button', 'lc-action-button', label);
    button.type = 'button';
    button.dataset.pageDirection = direction;
    return button;
  }

  async function renderDirectory(target, type) {
    await loadCounties();
    const isOrganizations = type === 'organizations';
    target.innerHTML = `<div class="lc-dashboard-page">
      ${pageHeader(isOrganizations ? 'Organizations' : 'Find People', isOrganizations
        ? 'Discover public organizations and institutions represented on CountySphere.'
        : 'Find contributors and community members across Liberia’s counties.')}
      <div class="lc-discovery-toolbar">
        <input type="search" data-discovery-search aria-label="${isOrganizations ? 'Search organizations' : 'Search contributors'}" placeholder="${isOrganizations ? 'Search organization name' : 'Search contributor name'}">
        <select data-discovery-county aria-label="Filter by county">${countyOptions()}</select>
      </div>
      <p class="lc-page-status" data-page-status role="status">Loading eligible profiles…</p>
      <div class="lc-discovery-grid"></div>
      <div class="lc-pagination" aria-label="Directory pages"></div>
    </div>`;
    target.dataset.sharedPage = type;
    setupDiscoveryToolbar(target, type);
    await loadDirectoryPage(type, target);
  }

  function profileListCard(profile) {
    const name = profile.organization_name || profile.full_name || 'CountySphere member';
    const county = state.counties.find(item => item.id === profile.county_id)?.name || 'County not specified';
    return `<article class="lc-person-card">${avatarMarkup(profile, profile.contributor_kind !== 'individual')}
      <h2>${escapeHtml(name)}</h2><p class="lc-person-county">${escapeHtml(county)}</p>
      <button type="button" class="lc-action-button" data-action="view-profile" data-user-id="${escapeHtml(profile.id)}">View profile</button>
    </article>`;
  }

  async function renderProfile(target, userId = state.user?.id) {
    if (!userId) {
      renderPageStatus(target, 'Sign in to view your profile.', true);
      return;
    }
    renderPageStatus(target, 'Loading your public profile…');
    try {
      const client = getClient();
      const { data: profiles, error } = await client.rpc('get_discovery_profiles', {
        p_search: null,
        p_county_id: null,
        p_organizations: false,
        p_offset: 0,
        p_limit: 1,
        p_target_user_id: userId,
        p_user_ids: null
      });
      if (error) throw error;
      const profile = profiles?.[0] || null;
      if (!profile || (profile.id !== state.user?.id && (profile.is_active !== true || profile.profile_visibility !== 'public'))) {
        throw new Error('This profile is unavailable or private.');
      }
      state.viewedProfile = profile;
      target.dataset.profileId = profile.id;
      const ownProfile = profile.id === state.user?.id;
      const counties = await loadCounties();
      const countyName = counties.find(item => item.id === profile.county_id)?.name || 'County not specified';
      const [, followerResult, followingResult] = await Promise.all([
        ownProfile ? Promise.resolve({ data: [], error: null }) : loadFollowState([profile.id]),
        client.from('user_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id),
        client.from('user_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.id)
      ]);
      const followUnavailable = followerResult.error || followingResult.error;
      const followers = followerResult.count || 0;
      const followingCount = followingResult.count || 0;
      const avatar = safeImageUrl(profile.logo_url || profile.avatar_url);
      const name = profile.organization_name || profile.full_name || 'CountySphere member';
      target.innerHTML = `<div class="lc-dashboard-page">
        ${pageHeader(ownProfile ? 'My Profile' : 'Profile', 'Public information and published contributions.')}
        <section class="lc-profile-card">
          <div class="lc-profile-hero"><span class="lc-profile-avatar">${avatar ? `<img src="${escapeHtml(avatar)}" alt="">` : escapeHtml(name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())}</span>
            <div><h2>${escapeHtml(name)}${profile.verified ? ' <span class="material-icons" aria-label="Verified">verified</span>' : ''}</h2>
              <p class="lc-person-kind">${escapeHtml(profile.contributor_kind?.replace(/_/g, ' ') || profile.role || 'Member')}</p>
              <p class="lc-person-county">${escapeHtml(countyName)}</p>
              <p class="lc-profile-bio">${escapeHtml(profile.organization_description || profile.bio || 'No public biography yet.')}</p>
              <p class="lc-person-kind">Joined ${profile.created_at ? escapeHtml(new Date(profile.created_at).toLocaleDateString()) : 'date unavailable'} · <span data-follower-count>${followers}</span> followers · ${followingCount} following</p>
            </div>
          </div>
          ${!ownProfile ? `<div class="lc-profile-actions"><button type="button" class="lc-action-button${state.follows.has(profile.id) ? ' lc-action-button-primary' : ''}" data-action="toggle-follow" data-user-id="${escapeHtml(profile.id)}" aria-pressed="${String(state.follows.has(profile.id))}">${state.follows.has(profile.id) ? 'Following' : 'Follow'}</button><button type="button" class="lc-action-button" data-action="start-message" data-user-id="${escapeHtml(profile.id)}">Message</button><p class="lc-follow-status lc-page-status" aria-live="polite"></p></div>` : ''}
          ${ownProfile ? `<form class="lc-profile-form" data-profile-form>
            <label>Display name<input name="full_name" maxlength="120" required value="${escapeHtml(profile.full_name || '')}"></label>
            <label>Biography<textarea name="bio" maxlength="1000">${escapeHtml(profile.bio || '')}</textarea></label>
            <p class="lc-person-kind">County affiliation: ${escapeHtml(countyName)}. Contact an administrator to change county assignment.</p>
            <button class="lc-action-button lc-action-button-primary" type="submit">Save profile</button>
            <p class="lc-page-status" data-profile-status role="status"></p>
          </form>` : ''}
          ${followUnavailable ? '<p class="lc-page-status">Follower counts are unavailable until the social discovery migration is applied.</p>' : ''}
        </section>
        <nav class="lc-profile-tabs" aria-label="Profile sections">
          <button type="button" class="lc-action-button lc-profile-tab" data-profile-tab="contributions" aria-selected="true">Contributions</button>
          <button type="button" class="lc-action-button lc-profile-tab" data-profile-tab="about" aria-selected="false">About</button>
          <button type="button" class="lc-action-button lc-profile-tab" data-profile-tab="followers" aria-selected="false">Followers</button>
          <button type="button" class="lc-action-button lc-profile-tab" data-profile-tab="following" aria-selected="false">Following</button>
        </nav>
        <section class="lc-discovery-grid" data-profile-content role="region" aria-live="polite"><p class="lc-page-status">Loading published contributions…</p></section>
      </div>`;
      const profileContent = target.querySelector('[data-profile-content]');
      await renderProfileTab(profileContent, profile, 'contributions');
    } catch (error) {
      console.error('Profile could not be rendered:', error);
      renderPageStatus(target, discoveryErrorMessage(error, error.message || 'Profile could not be loaded.'), true);
    }
  }

  async function renderProfileTab(container, profile, tab) {
    container.replaceChildren();
    const client = getClient();
    if (tab === 'about') {
      const details = element('article', 'lc-person-card');
      details.append(
        element('h2', '', profile.organization_name || profile.full_name || 'About'),
        element('p', 'lc-person-bio', profile.organization_description || profile.bio || 'No public biography yet.'),
        element('p', 'lc-person-county', state.counties.find(item => item.id === profile.county_id)?.name || 'County not specified')
      );
      if (profile.website_url) {
        const safeUrl = safeImageUrl(profile.website_url);
        if (safeUrl) {
          const website = element('a', 'lc-action-button', 'Website');
          website.href = safeUrl;
          website.target = '_blank';
          website.rel = 'noopener noreferrer';
          details.appendChild(website);
        }
      }
      container.appendChild(details);
      return;
    }
    if (tab === 'contributions') {
      const { data, error } = await client.from('content')
        .select('id,title,excerpt,body,type,published_at,created_at')
        .eq('author_id', profile.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      if (!data?.length) {
        container.appendChild(element('p', 'lc-page-status', 'No public contributions to show yet.'));
        return;
      }
      data.forEach(post => {
        const card = element('article', 'lc-feed-post');
        card.append(element('h2', '', post.title || 'Untitled'), element('p', '', post.excerpt || post.body || ''));
        const date = post.published_at || post.created_at;
        card.appendChild(element('small', 'lc-feed-post-meta', `${post.type || 'Published content'}${date ? ` · ${new Date(date).toLocaleDateString()}` : ''}`));
        container.appendChild(card);
      });
      return;
    }

    const ownerColumn = tab === 'followers' ? 'following_id' : 'follower_id';
    const profileColumn = tab === 'followers' ? 'follower_id' : 'following_id';
    const { data: relations, error: relationError } = await client.from('user_follows')
      .select('follower_id,following_id')
      .eq(ownerColumn, profile.id)
      .limit(100);
    if (relationError) throw relationError;
    const ids = [...new Set((relations || []).map(relation => relation[profileColumn]).filter(Boolean))];
    if (!ids.length) {
      container.appendChild(element('p', 'lc-page-status', `No public ${tab} to show yet.`));
      return;
    }
    const { data: users, error } = await client.rpc('get_discovery_profiles', {
      p_search: null,
      p_county_id: null,
      p_organizations: false,
      p_offset: 0,
      p_limit: Math.min(ids.length, 50),
      p_target_user_id: null,
      p_user_ids: ids
    });
    if (error) throw error;
    container.innerHTML = (users || []).map(user => profileListCard(user)).join('');
  }

  async function saveProfile(form, target) {
    const status = form.querySelector('[data-profile-status]');
    const submit = form.querySelector('[type="submit"]');
    const values = new FormData(form);
    const fullName = String(values.get('full_name') || '').trim();
    const bio = String(values.get('bio') || '').trim();
    if (!fullName) {
      status.textContent = 'Display name is required.';
      status.classList.add('lc-inline-error');
      return;
    }
    submit.disabled = true;
    status.textContent = 'Saving profile…';
    try {
      const { data, error } = await getClient().from('users')
        .update({ full_name: fullName, bio: bio || null })
        .eq('id', state.user.id)
        .select('id,full_name,bio,avatar_url')
        .single();
      if (error) throw error;
      state.profile = { ...state.profile, ...data };
      refreshIdentityUI();
      status.textContent = 'Profile saved.';
      status.classList.remove('lc-inline-error');
    } catch (error) {
      console.error('Profile update failed:', error);
      status.textContent = 'Profile could not be saved. Check your access and try again.';
      status.classList.add('lc-inline-error');
    } finally {
      submit.disabled = false;
    }
  }

  async function renderFeed(target, pageId = 'feeds') {
    await loadCounties();
    const community = pageId === 'community';
    state.feedMode = community ? 'following' : 'latest';
    target.innerHTML = `<div class="lc-dashboard-page">
      ${pageHeader(community ? 'Community' : 'Latest Feeds', community
        ? 'A connected feed of published posts from people and organizations you follow.'
        : 'Discover the newest eligible published content from all 15 counties.')}
      <div class="lc-feed-layout">
        <section>
          ${community ? '<p class="lc-feed-intro">Only published posts from accounts you follow appear here. Find people and organizations to build your network.</p>' : `<div class="lc-feed-filters" aria-label="Feed filters">
            <button type="button" class="lc-filter-button" data-feed-mode="latest" aria-pressed="true">Latest</button>
            <button type="button" class="lc-filter-button" data-feed-mode="recommended" aria-pressed="false">For You</button>
            <select data-feed-county aria-label="Filter feed by county">${countyOptions()}</select>
            <select data-feed-type aria-label="Filter by content type">
              <option value="">All content types</option>
              <option value="story">Stories</option>
              <option value="article">Articles</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>
          <div class="lc-discovery-toolbar" style="grid-template-columns:minmax(0,1fr);margin-top:12px">
            <input type="search" data-feed-search aria-label="Search published posts" placeholder="Search published stories">
          </div>`}
          <p class="lc-page-status" data-feed-status role="status">Loading published posts…</p>
          <div class="lc-feed-list" data-feed-list></div>
          <div class="lc-pagination" data-feed-pagination></div>
        </section>
      </div>
    </div>`;
    target.dataset.sharedPage = pageId;
    target.querySelectorAll('[data-feed-mode]').forEach(button => {
      button.addEventListener('click', () => {
        state.feedMode = button.dataset.feedMode;
        state.listOffset = 0;
        target.querySelectorAll('[data-feed-mode]').forEach(entry => entry.setAttribute('aria-pressed', String(entry === button)));
        loadFeedPage(target);
      });
    });
    target.querySelector('[data-feed-county]')?.addEventListener('change', () => {
      state.listOffset = 0;
      loadFeedPage(target);
    });
    target.querySelector('[data-feed-type]')?.addEventListener('change', () => {
      state.listOffset = 0;
      loadFeedPage(target);
    });
    let timer;
    target.querySelector('[data-feed-search]')?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.listOffset = 0;
        loadFeedPage(target);
      }, 250);
    });
    await loadFeedPage(target);
  }

  async function loadFeedPage(target) {
    const status = target.querySelector('[data-feed-status]');
    const list = target.querySelector('[data-feed-list]');
    const pagination = target.querySelector('[data-feed-pagination]');
    if (!status || !list) return;
    status.textContent = 'Loading published posts…';
    list.replaceChildren();
    try {
      const client = getClient();
      let query = client.from('content')
        .select('id,title,excerpt,body,type,published_at,created_at,county_id,author_id,cover_image_url', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .range(state.listOffset, state.listOffset + 9);
      const countyId = target.querySelector('[data-feed-county]')?.value;
      const search = target.querySelector('[data-feed-search]')?.value.trim().replace(/[%_]/g, ' ');
      const contentType = target.querySelector('[data-feed-type]')?.value;
      if (countyId) query = query.eq('county_id', countyId);
      if (search) query = query.ilike('title', `%${search}%`);
      if (contentType) query = query.eq('type', contentType);
      if (target.dataset.sharedPage === 'community') {
        if (!state.user) {
          status.textContent = 'Sign in to see posts from accounts you follow.';
          pagination.replaceChildren();
          return;
        }
        const { data: followed, error: followError } = await client.from('user_follows')
          .select('following_id').eq('follower_id', state.user.id);
        if (followError) throw followError;
        const followedIds = (followed || []).map(item => item.following_id);
        if (!followedIds.length) {
          status.textContent = 'Your Community feed is empty. Follow people or organizations to personalize it.';
          list.innerHTML = '<div class="lc-community-empty"><a href="#" data-lc-route="find-people">Discover People</a><a href="#" data-lc-route="organizations">Discover Organizations</a></div>';
          pagination.replaceChildren();
          return;
        }
        query = query.in('author_id', followedIds);
      } else if (state.feedMode === 'recommended') {
        if (!state.user) {
          status.textContent = 'Sign in to see recommendations based on your topics.';
          pagination.replaceChildren();
          return;
        }
        const { data: subscriptions, error: subscriptionError } = await client
          .from('user_subscriptions')
          .select('notification_topics!inner(slug)')
          .eq('user_id', state.user.id);
        if (subscriptionError) throw subscriptionError;
        const topics = [...new Set((subscriptions || [])
          .map(item => item.notification_topics?.slug)
          .filter(Boolean))];
        if (!topics.length) {
          status.textContent = 'Choose topics in Account Settings to personalize your feed. Latest national content remains available.';
          pagination.replaceChildren();
          return;
        }
        query = query.overlaps('tags', topics);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      const posts = data || [];
      if (!posts.length) {
        status.textContent = state.listOffset ? 'No more posts to show.' : 'No published posts match these filters.';
        pagination.replaceChildren();
        return;
      }
      const authorIds = [...new Set(posts.map(post => post.author_id).filter(Boolean))];
      state.feedPosts = new Map(posts.map(post => [post.id, post]));
      const countyIds = [...new Set(posts.map(post => post.county_id).filter(Boolean))];
      const [authorsResult, countiesResult, reactionsResult] = await Promise.all([
        authorIds.length ? client.from('users').select('id,full_name,avatar_url,logo_url,contributor_kind,organization_name,verified').in('id', authorIds) : Promise.resolve({ data: [], error: null }),
        countyIds.length ? client.from('counties').select('id,name').in('id', countyIds) : Promise.resolve({ data: [], error: null }),
        client.from('content_reactions').select('content_id,user_id,reaction_type').in('content_id', posts.map(post => post.id))
      ]);
      if (authorsResult.error) console.warn('Feed author details could not be loaded:', authorsResult.error.message);
      if (countiesResult.error) console.warn('Feed county names could not be loaded:', countiesResult.error.message);
      if (reactionsResult.error) console.warn('Feed reactions could not be loaded:', reactionsResult.error.message);
      const authors = new Map((authorsResult.data || []).map(author => [author.id, author]));
      const counties = new Map((countiesResult.data || []).map(county => [county.id, county.name]));
      const reactions = new Map();
      (reactionsResult.data || []).forEach(reaction => {
        const item = reactions.get(reaction.content_id) || { total: 0, counts: {}, userReaction: null };
        item.total += 1;
        item.counts[reaction.reaction_type] = (item.counts[reaction.reaction_type] || 0) + 1;
        if (reaction.user_id === state.user?.id) item.userReaction = reaction.reaction_type;
        reactions.set(reaction.content_id, item);
      });
      if (!reactionsResult.error) {
        posts.forEach(post => {
          if (!reactions.has(post.id)) reactions.set(post.id, { total: 0, counts: {}, userReaction: null });
        });
      }
      state.reactions = reactions;
      await loadFollowState(authorIds);
      posts.forEach(post => {
        const author = authors.get(post.author_id) || {};
        const authorName = author.organization_name || author.full_name || 'CountySphere contributor';
        const county = counties.get(post.county_id) || 'Liberia';
        const avatar = safeImageUrl(author.logo_url || author.avatar_url);
        const card = element('article', 'lc-feed-post');
        const header = element('div', 'lc-feed-author');
        const avatarNode = element('span', 'lc-person-avatar');
        if (avatar) {
          const image = element('img');
          image.src = avatar;
          image.alt = '';
          avatarNode.appendChild(image);
        } else {
          avatarNode.textContent = authorName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
        }
        const name = element('div');
        name.appendChild(element('strong', '', authorName + (author.verified ? ' ✓' : '')));
        name.appendChild(element('small', '', county));
        header.append(avatarNode, name);
        const title = element('h2', '', post.title || 'Untitled');
        const excerpt = element('p', '', post.excerpt || post.body || 'No preview available.');
        const published = post.published_at || post.created_at;
        const metadata = element('small', 'lc-feed-post-meta', `${post.type || 'Post'}${published ? ` · ${new Date(published).toLocaleDateString()}` : ''}`);
        card.append(header, title, excerpt, metadata);
        const imageUrl = safeImageUrl(post.cover_image_url);
        if (imageUrl) {
          const image = element('img');
          image.src = imageUrl;
          image.alt = '';
          image.loading = 'lazy';
          card.appendChild(image);
        }
        const actions = element('div', 'lc-card-actions');
        const reactionState = state.reactions.get(post.id);
        if (reactionsResult.error) {
          actions.appendChild(element('span', 'lc-page-status', 'Reactions unavailable'));
        } else {
        const reactionButton = element('button', 'lc-action-button lc-reaction-button');
        reactionButton.type = 'button';
        reactionButton.dataset.action = 'toggle-reaction';
        reactionButton.dataset.contentId = post.id;
        reactionButton.setAttribute('aria-label', `${reactionState?.userReaction ? 'Change or remove' : 'Add'} reaction, ${reactionState?.total || 0} total`);
        const reactionType = element('select', 'lc-reaction-select');
        reactionType.dataset.reactionChoice = '';
        reactionType.setAttribute('aria-label', 'Choose reaction');
        ['like', 'love', 'celebrate', 'insightful', 'sad'].forEach(type => {
          const option = element('option', '', type[0].toUpperCase() + type.slice(1));
          option.value = type;
          reactionType.appendChild(option);
        });
        if (reactionState?.userReaction) reactionType.value = reactionState.userReaction;
        const reactionStatus = element('span', 'lc-follow-status');
        reactionStatus.dataset.reactionStatus = '';
        actions.append(reactionType, reactionButton, reactionStatus);
        updateReactionControl(card, reactionState);
        }
        const detailsButton = element('button', 'lc-action-button', 'Read more');
        detailsButton.type = 'button';
        detailsButton.dataset.action = 'view-content-details';
        detailsButton.dataset.contentId = post.id;
        actions.appendChild(detailsButton);
        if (author.id !== state.user?.id && author.id) {
          const follow = element('button', `lc-action-button${state.follows.has(author.id) ? ' lc-action-button-primary' : ''}`, state.follows.has(author.id) ? 'Following' : 'Follow');
          follow.type = 'button';
          follow.dataset.action = 'toggle-follow';
          follow.dataset.userId = author.id;
          follow.setAttribute('aria-pressed', String(state.follows.has(author.id)));
          actions.appendChild(follow);
        }
        const profileButton = element('button', 'lc-action-button', 'View profile');
        profileButton.type = 'button';
        profileButton.dataset.action = 'view-profile';
        profileButton.dataset.userId = post.author_id;
        actions.appendChild(profileButton);
        card.appendChild(actions);
        list.appendChild(card);
      });
      status.textContent = `Showing ${state.listOffset + 1}–${state.listOffset + posts.length} of ${count ?? posts.length} published posts.`;
      pagination.replaceChildren();
      if (state.listOffset > 0) pagination.appendChild(paginationButton('Previous', 'previous'));
      if (state.listOffset + posts.length < (count || 0)) pagination.appendChild(paginationButton('Next', 'next'));
    } catch (error) {
      console.error('Published feed could not be loaded:', error);
      status.textContent = target.dataset.sharedPage === 'community' && ['42P01', 'PGRST205'].includes(error.code)
        ? 'Community follows are unavailable until the social discovery migration is applied.'
        : 'Published posts could not be loaded. Please check your connection and try again.';
      status.classList.add('lc-inline-error');
    }
  }

  async function renderMessages(target) {
    target.dataset.sharedPage = 'messages';
    target.innerHTML = `<div class="lc-dashboard-page">
      ${pageHeader('Messages', 'Private conversations are available only between mutually followed accounts.')}
      <div class="lc-messages-layout">
        <section class="lc-conversation-list" aria-label="Conversations">
          <h2>Conversations</h2>
          <p class="lc-page-status" data-conversation-status role="status">Loading conversations…</p>
          <div data-conversation-list></div>
        </section>
        <section class="lc-message-thread" aria-label="Selected conversation">
          <div data-message-thread-status class="lc-page-status" role="status">Choose a conversation to view messages.</div>
          <div data-message-list class="lc-message-list" aria-live="polite"></div>
          <form data-message-form class="lc-message-form" hidden>
            <label class="sr-only" for="lc-message-body">Message</label>
            <textarea id="lc-message-body" name="body" maxlength="5000" required placeholder="Write a message…"></textarea>
            <button type="submit" class="lc-action-button lc-action-button-primary">Send</button>
            <p class="lc-page-status" data-message-status role="status"></p>
          </form>
        </section>
      </div>
    </div>`;
    await loadConversationList(target);
    if (state.messagePoll) clearInterval(state.messagePoll);
    state.messagePoll = setInterval(async () => {
      if (!target.isConnected) {
        clearInterval(state.messagePoll);
        state.messagePoll = null;
        return;
      }
      await loadConversationList(target);
      if (state.conversationId) await loadMessageThread(target, state.conversationId, false);
    }, 15000);
  }

  async function loadConversationList(target) {
    const status = target.querySelector('[data-conversation-status]');
    const list = target.querySelector('[data-conversation-list]');
    if (!status || !list || !state.user) return;
    try {
      const { data, error } = await getClient().rpc('get_my_conversations');
      if (error) throw error;
      list.replaceChildren();
      const conversations = data || [];
      if (!conversations.length) {
        status.textContent = 'No conversations yet. Start by finding a person you mutually follow.';
        return;
      }
      status.textContent = `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`;
      conversations.forEach(conversation => {
        const button = element('button', `lc-conversation-item${conversation.conversation_id === state.conversationId ? ' is-active' : ''}`);
        button.type = 'button';
        button.dataset.action = 'open-conversation';
        button.dataset.conversationId = conversation.conversation_id;
        const title = conversation.other_organization_name || conversation.other_full_name || 'CountySphere member';
        button.append(
          element('strong', '', title),
          element('span', '', conversation.last_message || 'No messages yet'),
          element('small', '', conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString() : 'New conversation')
        );
        if (conversation.unread_count > 0) {
          button.appendChild(element('span', 'lc-unread-count', String(conversation.unread_count)));
        }
        list.appendChild(button);
      });
      if (!state.conversationId && conversations.length) {
        state.conversationId = conversations[0].conversation_id;
      }
      if (state.conversationId) await loadMessageThread(target, state.conversationId, false);
    } catch (error) {
      console.error('Conversations could not be loaded:', error);
      status.textContent = ['PGRST202', 'PGRST205', '42883'].includes(error.code)
        ? 'Messaging is unavailable until the direct-messaging migration is applied.'
        : 'Conversations could not be loaded. Please try again.';
    }
  }

  async function loadMessageThread(target, conversationId, markRead = true) {
    const status = target.querySelector('[data-message-thread-status]');
    const list = target.querySelector('[data-message-list]');
    const form = target.querySelector('[data-message-form]');
    if (!status || !list || !form) return;
    status.textContent = 'Loading messages…';
    try {
      const { data: messages, error } = await getClient().from('messages')
        .select('id,sender_id,body,created_at,read_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      list.replaceChildren();
      (messages || []).forEach(message => {
        const bubble = element('article', `lc-message-bubble${message.sender_id === state.user.id ? ' is-own' : ''}`);
        bubble.append(
          element('p', '', message.body),
          element('small', '', `${new Date(message.created_at).toLocaleString()}${message.sender_id === state.user.id && message.read_at ? ' · Read' : ''}`)
        );
        list.appendChild(bubble);
      });
      status.textContent = messages?.length ? '' : 'No messages yet. Say hello.';
      form.hidden = false;
      if (markRead) {
        const { error: readError } = await getClient().rpc('mark_direct_messages_read', {
          target_conversation_id: conversationId
        });
        if (readError) throw readError;
        await loadConversationList(target);
      }
    } catch (error) {
      console.error('Conversation messages could not be loaded:', error);
      status.textContent = 'Messages could not be loaded. Please check access and try again.';
      form.hidden = true;
    }
  }

  async function sendMessage(form) {
    const body = String(new FormData(form).get('body') || '').trim();
    const status = form.querySelector('[data-message-status]');
    if (!state.conversationId || !body) return;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Sending…';
    try {
      const { error } = await getClient().rpc('send_direct_message', {
        target_conversation_id: state.conversationId,
        message_body: body
      });
      if (error) throw error;
      form.reset();
      status.textContent = 'Message sent.';
      const target = form.closest('[data-shared-page="messages"]');
      await loadMessageThread(target, state.conversationId);
      await loadConversationList(target);
    } catch (error) {
      console.error('Message could not be sent:', error);
      status.textContent = error.message || 'Message could not be sent. A mutual follow relationship is required.';
      status.classList.add('lc-inline-error');
    } finally {
      submit.disabled = false;
    }
  }

  async function startConversation(targetUserId) {
    try {
      const { data: conversationId, error } = await getClient().rpc('start_direct_conversation', {
        target_user_id: targetUserId
      });
      if (error) throw error;
      state.conversationId = conversationId;
      renderDashboardPage('messages');
    } catch (error) {
      console.error('Could not start conversation:', error);
      const status = document.querySelector('.lc-profile-actions .lc-page-status');
      if (status) {
        status.textContent = error.message || 'Messaging requires both accounts to follow each other.';
        status.classList.add('lc-inline-error');
      }
    }
  }

  function updateReactionControl(card, reactionState) {
    const button = card.querySelector('[data-action="toggle-reaction"]');
    const choice = card.querySelector('[data-reaction-choice]');
    if (!button || !choice) return;
    const total = reactionState?.total || 0;
    const currentType = reactionState?.userReaction;
    const actionText = currentType === choice.value ? `Remove ${choice.value}` : `React ${choice.value}`;
    button.textContent = `${actionText} · ${total}`;
    button.setAttribute('aria-label', `${actionText}; ${total} total reactions`);
    button.setAttribute('aria-pressed', String(Boolean(currentType)));
  }

  function showContentDetails(contentId) {
    const post = state.feedPosts.get(contentId);
    if (!post) return;
    const previousDialog = document.querySelector('.lc-content-detail-dialog');
    if (previousDialog?.open) previousDialog.close();
    else previousDialog?.remove();
    const dialog = element('dialog', 'lc-content-detail-dialog');
    dialog.setAttribute('aria-labelledby', 'lc-content-detail-title');
    const close = element('button', 'lc-action-button', 'Close');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    const title = element('h2', '', post.title || 'Published story');
    title.id = 'lc-content-detail-title';
    const body = element('div', 'lc-content-detail-body', post.body || post.excerpt || 'No additional story text is available.');
    const date = post.published_at || post.created_at;
    dialog.append(close, title, body);
    if (date) dialog.appendChild(element('p', 'lc-feed-post-meta', new Date(date).toLocaleString()));

    const engagement = element('section', 'lc-content-engagement');
    const reactionHost = element('div');
    reactionHost.id = 'lc-detail-reactions';
    const commentHost = element('div');
    commentHost.id = 'lc-detail-comments';
    engagement.append(
      element('h3', '', 'Reactions'),
      reactionHost,
      element('h3', '', 'Comments and discussion'),
      commentHost
    );
    dialog.appendChild(engagement);

    let reactionBar;
    let commentSystem;
    let disposed = false;
    dialog.addEventListener('close', () => {
      disposed = true;
      reactionBar?.destroy();
      commentSystem?.destroy();
      dialog.remove();
    }, { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();

    if (typeof ReactionBar !== 'function' || typeof CommentSystem !== 'function') {
      const status = element('p', 'lc-inline-error', 'Story engagement could not be initialized. Please reload the dashboard.');
      status.setAttribute('role', 'alert');
      engagement.appendChild(status);
      console.error('Story engagement components are unavailable.');
      return;
    }

    reactionBar = new ReactionBar({
      contentId,
      containerId: reactionHost.id,
      isAuthenticated: Boolean(state.user),
      currentUser: state.user
    });
    commentSystem = new CommentSystem({
      contentId,
      containerId: commentHost.id,
      isAuthenticated: Boolean(state.user),
      currentUser: state.user
    });
    Promise.all([reactionBar.init(), commentSystem.init()]).then(() => {
      if (disposed) {
        reactionBar.destroy();
        commentSystem.destroy();
      }
    }).catch(error => {
      console.error('Story engagement could not be initialized:', error);
    });
  }

  async function togglePostReaction(button) {
    if (!state.user) return;
    const contentId = button.dataset.contentId;
    const card = button.closest('.lc-feed-post');
    const choice = card?.querySelector('[data-reaction-choice]');
    const status = card?.querySelector('[data-reaction-status]');
    const selectedType = choice?.value;
    if (!contentId || !selectedType || button.disabled) return;
    button.disabled = true;
    if (status) status.textContent = 'Saving reaction…';
    try {
      const current = state.reactions.get(contentId)?.userReaction;
      const result = current === selectedType
        ? await getClient().from('content_reactions').delete().eq('content_id', contentId).eq('user_id', state.user.id)
        : await getClient().from('content_reactions').upsert({
          content_id: contentId,
          user_id: state.user.id,
          reaction_type: selectedType
        }, { onConflict: 'content_id,user_id' });
      if (result.error) throw result.error;
      const { data, error } = await getClient().from('content_reactions')
        .select('content_id,user_id,reaction_type')
        .eq('content_id', contentId);
      if (error) throw error;
      const updated = { total: (data || []).length, counts: {}, userReaction: null };
      (data || []).forEach(reaction => {
        updated.counts[reaction.reaction_type] = (updated.counts[reaction.reaction_type] || 0) + 1;
        if (reaction.user_id === state.user.id) updated.userReaction = reaction.reaction_type;
      });
      state.reactions.set(contentId, updated);
      document.querySelectorAll('.lc-feed-post').forEach(postCard => {
        if (postCard.querySelector(`[data-action="toggle-reaction"][data-content-id="${contentId}"]`)) {
          updateReactionControl(postCard, updated);
          const choiceControl = postCard.querySelector('[data-reaction-choice]');
          if (updated.userReaction && choiceControl) choiceControl.value = updated.userReaction;
          const reactionStatus = postCard.querySelector('[data-reaction-status]');
          if (reactionStatus) reactionStatus.textContent = '';
        }
      });
    } catch (error) {
      console.error('Post reaction could not be saved:', error);
      if (status) status.textContent = error.message || 'Reaction could not be saved. Please try again.';
    } finally {
      button.disabled = false;
    }
  }

  function reactionSelectionHandler(event) {
    const choice = event.target.closest('[data-reaction-choice]');
    if (!choice) return;
    const card = choice.closest('.lc-feed-post');
    if (card) updateReactionControl(card, state.reactions.get(card.querySelector('[data-action="toggle-reaction"]')?.dataset.contentId));
  }

  function renderDashboardPage(pageId, userId) {
    const role = document.body.dataset.dashboardRole;
    if (state.messagePoll) {
      clearInterval(state.messagePoll);
      state.messagePoll = null;
    }
    if (pageId === 'home') {
      openHome();
      return;
    }
    if (role === 'contributor' && pageId === 'submissions') {
      window.navigate('submissions');
      state.active = 'submissions';
      state.listOffset = 0;
      syncBottomNavigation();
      closeMobileSidebar();
      return;
    }
    const target = getPageTarget(pageId);
    if (!target) {
      console.error(`No shared dashboard content target is configured for "${pageId}".`);
      return;
    }
    state.active = pageId === 'profile' ? 'home' : pageId;
    state.listOffset = 0;
    syncBottomNavigation();
    closeMobileSidebar();
    updateDashboardTitle(pageId);
    if (role === 'super_admin' && typeof window.Navigation?.showPage === 'function') {
      document.querySelectorAll('.page').forEach(section => section.classList.add('hidden'));
      target.classList.remove('hidden');
      document.querySelectorAll('.sidebar-link').forEach(link => link.classList.toggle('active-link', link.dataset.lcRoute === pageId));
    }
    const renderer = {
      'find-people': node => renderDirectory(node, 'find-people'),
      organizations: node => renderDirectory(node, 'organizations'),
      feeds: node => renderFeed(node, 'feeds'),
      community: node => renderFeed(node, 'community'),
      profile: node => renderProfile(node, userId),
      messages: node => renderMessages(node)
    }[pageId];
    if (renderer) renderer(target);
  }

  function routeClickHandler(event) {
    const route = event.target.closest('[data-lc-route]');
    if (route) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMobileSidebar();
      renderDashboardPage(route.dataset.lcRoute === 'people' ? 'find-people' : route.dataset.lcRoute);
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action?.dataset.action === 'start-message') {
      event.preventDefault();
      event.stopImmediatePropagation();
      startConversation(action.dataset.userId);
      return;
    }
    if (action?.dataset.action === 'view-profile') {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderDashboardPage('profile', action.dataset.userId);
      return;
    }
    if (action?.dataset.action === 'toggle-follow') {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleFollow(action.dataset.userId, action);
      return;
    }
    if (action?.dataset.action === 'toggle-reaction') {
      event.preventDefault();
      event.stopImmediatePropagation();
      togglePostReaction(action);
      return;
    }
    if (action?.dataset.action === 'view-content-details') {
      event.preventDefault();
      event.stopImmediatePropagation();
      showContentDetails(action.dataset.contentId);
      return;
    }
    if (action?.dataset.action === 'open-conversation') {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.conversationId = action.dataset.conversationId;
      const target = action.closest('[data-shared-page="messages"]');
      if (target) {
        loadConversationList(target);
        loadMessageThread(target, state.conversationId);
      }
      return;
    }
    const pageButton = event.target.closest('[data-page-direction]');
    if (pageButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const target = pageButton.closest('[data-shared-page]') || document.querySelector(`[data-page="lc-${state.active}"]`);
      if (target?.dataset.sharedPage === 'find-people' || target?.dataset.sharedPage === 'organizations') {
        state.listOffset = Math.max(0, state.listOffset + (pageButton.dataset.pageDirection === 'next' ? 20 : -20));
        loadDirectoryPage(target.dataset.sharedPage, target);
      } else if (target?.dataset.sharedPage === 'feeds' || target?.dataset.sharedPage === 'community') {
        state.listOffset = Math.max(0, state.listOffset + (pageButton.dataset.pageDirection === 'next' ? 10 : -10));
        loadFeedPage(target);
      }
      return;
    }
    const tabButton = event.target.closest('[data-profile-tab]');
    if (tabButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const target = tabButton.closest('.lc-dashboard-page');
      const currentProfile = state.viewedProfile;
      target?.querySelectorAll('[data-profile-tab]').forEach(button => button.setAttribute('aria-selected', String(button === tabButton)));
      if (target) renderProfileTab(target.querySelector('[data-profile-content]'), currentProfile, tabButton.dataset.profileTab)
        .catch(error => renderPageStatus(
          target.querySelector('[data-profile-content]'),
          discoveryErrorMessage(error, error.message || 'Profile details could not be loaded.'),
          true
        ));
      return;
    }
    const feedMode = event.target.closest('[data-feed-mode]');
    if (feedMode) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.feedMode = feedMode.dataset.feedMode;
      state.listOffset = 0;
      feedMode.closest('.lc-dashboard-page')?.querySelectorAll('[data-feed-mode]').forEach(entry =>
        entry.setAttribute('aria-pressed', String(entry === feedMode)));
      loadFeedPage(feedMode.closest('.lc-dashboard-page'));
    }
  }

  function addRoleNavigation() {
    const role = document.body.dataset.dashboardRole;
    const nav = role === 'contributor'
      ? document.getElementById('sidebar-nav')
      : role === 'county_admin'
        ? document.querySelector('.sidebar-nav')
        : document.querySelector('#sidebar nav');
    if (!nav || nav.querySelector('[data-lc-route="find-people"]')) return false;
    const routes = [
      ['feeds', 'dynamic_feed', 'Feeds'],
      ['find-people', 'person_search', 'People'],
      ['organizations', 'corporate_fare', 'Organizations'],
      ['profile', 'account_circle', 'My Profile'],
      ['messages', 'mail', 'Messages']
    ];
    if (role !== 'contributor' && !nav.querySelector('[data-lc-route="community"], [data-view="community"]')) {
      routes.unshift(['community', 'groups', 'Community']);
    }
    routes.forEach(([route, icon, label]) => {
      const item = element(role === 'super_admin' ? 'button' : role === 'county_admin' ? 'a' : 'button', `nav-item lc-discovery-nav${role === 'super_admin' ? ' sidebar-link w-full' : ''}`);
      if (item.tagName === 'BUTTON') item.type = 'button';
      if (item.tagName === 'A') item.href = '#';
      item.dataset.lcRoute = route;
      const symbol = element('span', 'material-icons', icon);
      symbol.setAttribute('aria-hidden', 'true');
      item.append(symbol, document.createTextNode(label));
      const settingsLink = nav.querySelector('[data-page="settings"], .sidebar-link[data-page="settings"]');
      if (role === 'county_admin' && settingsLink) nav.insertBefore(item, settingsLink);
      else nav.appendChild(item);
    });
    const logoutLink = nav.querySelector('[data-page="logout"]');
    const settingsLink = nav.querySelector('[data-page="settings"], .sidebar-link[data-page="settings"]');
    if (role === 'county_admin' && settingsLink && logoutLink) nav.insertBefore(settingsLink, logoutLink);
    if (role === 'super_admin') {
      const settingsButton = nav.querySelector('button[onclick*="settings"]');
      if (settingsButton) nav.appendChild(settingsButton);
    }
    return true;
  }

  function watchRoleNavigation() {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (addRoleNavigation() || attempts >= 40) clearInterval(timer);
    }, 100);
  }

  function setupHeader() {
    const header = document.querySelector('#dashboard-header, .topbar, header');
    if (!header) return;
    let headerLeft = header.querySelector('.header-left');
    if (!headerLeft) {
      headerLeft = element('div', 'header-left lc-dashboard-header-left');
      const menuButton = header.querySelector('#mobileMenuToggle');
      const adminIdentity = document.getElementById('admin-identity');
      header.insertBefore(headerLeft, header.firstChild);
      if (menuButton) headerLeft.appendChild(menuButton);
      if (adminIdentity) headerLeft.appendChild(adminIdentity);
    }

    let brand = headerLeft.querySelector('.brand-mobile');
    if (!brand) {
      brand = element('div', 'brand-mobile lc-header-brand');
      const badge = element('div', 'brand-badge', 'CS');
      const copy = element('div', 'brand-copy');
      copy.append(
        element('p', 'brand-title', 'Liberia CountySphere'),
        element('p', 'brand-subtitle', roleLabel())
      );
      brand.append(badge, copy);
      const adminIdentity = document.getElementById('admin-identity');
      headerLeft.insertBefore(brand, adminIdentity || null);
    } else {
      const subtitle = brand.querySelector('.brand-subtitle');
      if (subtitle) subtitle.textContent = roleLabel();
      const title = brand.querySelector('.brand-title');
      if (title) title.textContent = 'Liberia CountySphere';
    }

    const controls = element('div', 'header-right lc-dashboard-header-controls');
    const existingRight = header.querySelector('.header-right');
    if (existingRight) {
      existingRight.classList.add('header-right');
      existingRight.appendChild(controls);
    } else {
      controls.classList.add('header-right');
      header.appendChild(controls);
    }

    setupSearch(header, controls);
    createNotifications(controls);
    const profile = element('div');
    profile.style.position = 'relative';
    createProfileMenu(profile);
    controls.appendChild(profile);
    const primaryAction = header.querySelector('#open-submission-form, #open-add-modal');
    if (primaryAction) {
      primaryAction.setAttribute('aria-label', primaryAction.id === 'open-add-modal' ? 'Add opportunity' : 'Submit new content');
      controls.appendChild(primaryAction);
    }

    refreshIdentityUI(header);
  }

  function refreshIdentityUI(header = document.querySelector('#dashboard-header, .topbar, header')) {
    if (!header) return;
    const profileTrigger = header.querySelector('.lc-profile-trigger');
    if (profileTrigger) setAvatar(profileTrigger);
    const profileTitle = header.querySelector('.lc-profile-trigger + .lc-header-popover .lc-popover-title');
    if (profileTitle) profileTitle.textContent = state.profile?.full_name || state.user?.email || 'Your account';
    const name = state.profile?.full_name || state.user?.email || 'Account';
    ['user-name', 'header-user-name', 'adminName'].forEach(id => {
      const target = document.getElementById(id);
      if (target) target.textContent = name;
    });
    const role = roleLabel();
    ['user-email', 'header-user-county'].forEach(id => {
      const target = document.getElementById(id);
      if (target) target.textContent = role;
    });
    const roleLabelNode = header.querySelector('.brand-subtitle');
    if (roleLabelNode) roleLabelNode.textContent = role;
  }

  function updateActiveFromNavigation(event) {
    const target = event.target.closest('[data-view], [data-page], .sidebar-link');
    if (!target) return;
    const view = target.dataset.view;
    const page = target.dataset.page || target.getAttribute('data-page');
    const value = view || page;
    if (['overview', 'home'].includes(value)) state.active = 'home';
    else if (value === 'community') state.active = 'community';
    else if (['submissions', 'content-review', 'content'].includes(value)) state.active = 'submissions';
    syncBottomNavigation();
  }

  function setupDesktopSidebarToggle() {
    const toggles = [
      document.getElementById('mobileMenuToggle'),
      document.getElementById('sidebar-toggle'),
      document.getElementById('hamburger-btn')
    ].filter(Boolean);
    toggles.forEach(toggle => {
      toggle.setAttribute('aria-label', 'Toggle navigation menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        if (window.innerWidth >= 1024) {
          document.body.classList.toggle('lc-sidebar-collapsed');
          toggle.setAttribute('aria-expanded', String(!document.body.classList.contains('lc-sidebar-collapsed')));
        } else {
          window.setTimeout(() => {
            const sidebar = document.querySelector('#dashboard-sidebar, .sidebar, #sidebar');
            const isOpen = sidebar?.classList.contains('open')
              || sidebar?.classList.contains('active')
              || sidebar?.classList.contains('sidebar-open');
            toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
          }, 0);
        }
      });
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) document.body.classList.remove('lc-sidebar-collapsed');
    });

    const sidebar = document.getElementById('sidebar');
    if (sidebar && !document.querySelector('#sidebar-overlay, .sidebar-overlay')) {
      const overlay = element('div', 'lc-dashboard-sidebar-overlay');
      overlay.hidden = true;
      overlay.addEventListener('click', closeMobileSidebar);
      document.body.insertBefore(overlay, document.body.firstChild);
      toggles.forEach(toggle => toggle.addEventListener('click', () => {
        if (window.innerWidth >= 1024) return;
        window.setTimeout(() => {
          const open = sidebar.classList.contains('sidebar-open');
          document.body.classList.toggle('lc-sidebar-open', open);
          overlay.hidden = !open;
        }, 0);
      }));
      const closeButton = document.getElementById('mobileSidebarClose');
      closeButton?.addEventListener('click', closeMobileSidebar);
      sidebar.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', closeMobileSidebar);
      });
      document.addEventListener('click', event => {
        if (window.innerWidth >= 1024 || sidebar.contains(event.target)) return;
        if (toggles.some(toggle => toggle.contains(event.target))) return;
        closeMobileSidebar();
      });
    }
  }

  async function init() {
    document.body.classList.add('lc-dashboard-shell');
    const role = document.body.dataset.dashboardRole;
    for (let attempt = 0; attempt < 30 && !getClient(); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setupHeader();
    createBottomNavigation();
    setupDesktopSidebarToggle();
    document.addEventListener('click', routeClickHandler, true);
    document.addEventListener('click', updateActiveFromNavigation, true);
    document.addEventListener('submit', profileSubmitHandler);
    document.addEventListener('change', reactionSelectionHandler);
    document.addEventListener('click', event => {
      if (!event.target.closest('.lc-dashboard-header-controls')) closePopovers();
    });
    addRoleNavigation();
    watchRoleNavigation();
    if (!role) console.warn('Dashboard shell started without a role configuration.');
    try {
      await loadIdentity();
      refreshIdentityUI();
      await loadNotifications();
    } catch (error) {
      console.warn('Dashboard profile controls could not be initialized:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
