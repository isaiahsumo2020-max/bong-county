/**
 * Navigation Module
 * Handles page navigation and sidebar highlighting
 */

const Navigation = {
  /**
   * Show a specific page and hide others
   */
  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('[data-page]').forEach(page => {
      page.classList.add('hidden');
    });

    // Show selected page
    const selectedPage = document.querySelector(`[data-page="${pageId}"]`);
    if (selectedPage) {
      selectedPage.classList.remove('hidden');
      this.updateSidebarActive(pageId);
      
      // Load page content if needed
      this.loadPageContent(pageId);
    }
  },

  /**
   * Update sidebar button active state
   */
  updateSidebarActive(sectionId) {
    // Remove active class from all buttons
    document.querySelectorAll('.sidebar-link').forEach(btn => {
      btn.classList.remove('active-link');
    });

    // Map section IDs to button text
    const sectionNames = {
      'overview': 'Dashboard',
      'counties': 'Counties',
      'content': 'Content',
      'tourism': 'Tourism',
      'events': 'Events',
      'opportunities': 'Opportunities',
      'users': 'Users',
      'districts': 'Districts',
      'analytics': 'Analytics',
      'settings': 'Settings'
    };

    // Add active class to clicked button
    const buttons = document.querySelectorAll('.sidebar-link');
    buttons.forEach(btn => {
      if (btn.textContent.trim().includes(sectionNames[sectionId])) {
        btn.classList.add('active-link');
      }
    });
  },

  /**
   * Load page content dynamically
   */
  async loadPageContent(pageId) {
    try {
      switch (pageId) {
        case 'overview':
          if (typeof Dashboard !== 'undefined') {
            await Dashboard.init();
          }
          break;
        case 'counties':
          if (typeof Counties !== 'undefined') {
            await Counties.init();
          }
          break;
        case 'content':
          if (typeof Content !== 'undefined') {
            await Content.init();
          }
          break;
        case 'tourism':
          if (typeof Tourism !== 'undefined') {
            await Tourism.init();
          }
          break;
        case 'events':
          if (typeof Events !== 'undefined') {
            await Events.init();
          }
          break;
        case 'opportunities':
          if (typeof Opportunities !== 'undefined') {
            await Opportunities.init();
          }
          break;
        case 'users':
          if (typeof UserManagement !== 'undefined') {
            await UserManagement.init();
          }
          break;
        case 'districts':
          if (typeof Districts !== 'undefined') {
            await Districts.init();
          }
          break;
        case 'analytics':
          if (typeof Analytics !== 'undefined') {
            await Analytics.init();
          }
          break;
        case 'settings':
          if (typeof Settings !== 'undefined') {
            await Settings.init();
          }
          break;
      }
    } catch (err) {
      console.error(`Error loading page ${pageId}:`, err);
    }
  }
};

// Make Navigation globally available
window.Navigation = Navigation;
