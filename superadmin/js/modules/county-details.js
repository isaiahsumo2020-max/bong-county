/**
 * County Details Module
 * Handles displaying detailed county management view
 */

const CountyDetails = {
  currentCounty: null,
  loading: false,

  /**
   * Open county details view
   */
  async open(countyId) {
    if (this.loading) return;
    this.loading = true;

    try {
      // Load county data
      const countyData = await this.loadCountyData(countyId);
      if (!countyData) {
        Helpers.showError('County not found');
        this.loading = false;
        return;
      }

      this.currentCounty = countyData;
      this.renderModal();
    } catch (err) {
      console.error('Error opening county details:', err);
      Helpers.showError('Error loading county details: ' + err.message);
    } finally {
      this.loading = false;
    }
  },

  /**
   * Load county data from database
   */
  async loadCountyData(countyId) {
    try {
      // Get county basic info
      const { data: county, error: countyError } = await supabaseClient
        .from('counties')
        .select('*')
        .eq('id', countyId)
        .single();

      if (countyError) throw countyError;
      if (!county) return null;

      // Get related statistics
      const [contributors, contents, opportunities, events] = await Promise.all([
        this.getCountryContributors(countyId),
        this.getCountyContents(countyId),
        this.getCountyOpportunities(countyId),
        this.getCountyEvents(countyId)
      ]);

      return {
        ...county,
        contributorsCount: contributors,
        contentsCount: contents,
        opportunitiesCount: opportunities,
        eventsCount: events
      };
    } catch (err) {
      console.error('Error loading county data:', err);
      throw err;
    }
  },

  /**
   * Get number of contributors for a county
   * Counts ALL users assigned to the county, regardless of role
   */
  async getCountryContributors(countyId) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('county_id', countyId);

      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      console.error('Error fetching contributors:', err);
      return 0;
    }
  },

  /**
   * Get number of contents for a county
   */
  async getCountyContents(countyId) {
    try {
      const { data, error } = await supabaseClient
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('county_id', countyId);

      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      console.error('Error fetching contents:', err);
      return 0;
    }
  },

  /**
   * Get number of opportunities for a county
   */
  async getCountyOpportunities(countyId) {
    try {
      const { data, error } = await supabaseClient
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('county_id', countyId);

      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      return 0;
    }
  },

  /**
   * Get number of events for a county
   */
  async getCountyEvents(countyId) {
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('county_id', countyId);

      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      console.error('Error fetching events:', err);
      return 0;
    }
  },

  /**
   * Render county details modal
   */
  renderModal() {
    const county = this.currentCounty;
    if (!county) return;

    const modalContent = `
      <div class="county-details-modal max-w-4xl">
        <!-- Loading State -->
        <div id="detailsLoadingState" class="hidden">
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>

        <!-- Content State -->
        <div id="detailsContent" class="space-y-6">
          <!-- Header Section -->
          <div class="border-b border-gray-200 pb-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-3xl font-bold text-gray-900">${Helpers.escapeHtml(county.name)}</h3>
                <p class="text-gray-500 text-sm mt-1">${county.slug ? 'Slug: ' + county.slug : 'No slug'}</p>
              </div>
              <div class="text-right">
                ${this.getStatusBadge(county.status)}
              </div>
            </div>
          </div>

          <!-- Main Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Column 1: Basic Information -->
            <div class="space-y-4">
              <h4 class="text-lg font-semibold text-gray-900">Basic Information</h4>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Region</p>
                <p class="text-lg font-semibold text-gray-900">${county.region || '-'}</p>
              </div>

              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Capital City</p>
                <p class="text-lg font-semibold text-gray-900">${county.capital_city || county.capital || '-'}</p>
              </div>

              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Motto/Tagline</p>
                <p class="text-lg font-semibold text-gray-900">${county.motto || county.tagline || '-'}</p>
              </div>

              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Established Year</p>
                <p class="text-lg font-semibold text-gray-900">${county.established_year || county.year_established || '-'}</p>
              </div>
            </div>

            <!-- Column 2: Statistics -->
            <div class="space-y-4">
              <h4 class="text-lg font-semibold text-gray-900">Statistics</h4>
              
              <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Contributors</p>
                <p class="text-3xl font-bold text-blue-600">${county.contributorsCount || 0}</p>
              </div>

              <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Content Items</p>
                <p class="text-3xl font-bold text-green-600">${county.contentsCount || 0}</p>
              </div>

              <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Opportunities</p>
                <p class="text-3xl font-bold text-purple-600">${county.opportunitiesCount || 0}</p>
              </div>

              <div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Events</p>
                <p class="text-3xl font-bold text-orange-600">${county.eventsCount || 0}</p>
              </div>
            </div>
          </div>

          <!-- Additional Details Section -->
          <div class="bg-gray-50 p-6 rounded-lg space-y-4">
            <h4 class="text-lg font-semibold text-gray-900">Additional Details</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">County Admin</p>
                <p class="text-base font-semibold text-gray-900">${county.admin_name || county.county_admin || 'Not assigned'}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
                <p class="text-base font-semibold text-gray-900">${county.updated_at ? Helpers.formatDateTime(county.updated_at) : '-'}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Created Date</p>
                <p class="text-base font-semibold text-gray-900">${county.created_at ? Helpers.formatDate(county.created_at) : '-'}</p>
              </div>

              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <p class="text-base font-semibold text-gray-900">${this.formatStatusText(county.status)}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="border-t border-gray-200 pt-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Actions</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button class="btn btn-primary edit-county-btn flex items-center justify-center gap-2 py-3" data-county-id="${county.id}">
                <span>✎</span> Edit County
              </button>
              <button class="btn btn-secondary view-site-btn flex items-center justify-center gap-2 py-3" data-county-id="${county.id}">
                <span>🌐</span> View Public Site
              </button>
              <button class="btn btn-secondary manage-contributors-btn flex items-center justify-center gap-2 py-3" data-county-id="${county.id}">
                <span>👥</span> Manage Contributors
              </button>
              <button class="btn btn-secondary manage-content-btn flex items-center justify-center gap-2 py-3" data-county-id="${county.id}">
                <span>📄</span> Manage Content
              </button>
              <button class="btn btn-secondary manage-opportunities-btn flex items-center justify-center gap-2 py-3" data-county-id="${county.id}">
                <span>💼</span> Manage Opportunities
              </button>
              <button class="btn btn-secondary manage-events-btn flex items-center justify-center gap-2 py-3" data-county-id="${county.id}">
                <span>📅</span> Manage Events
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 pt-6 flex gap-3 justify-end">
            <button class="close-details-btn btn btn-secondary px-6 py-2">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    ModalManager.create('countyDetailsModal', 'County Management', modalContent, {
      width: 'max-w-4xl',
      showClose: true,
      closeOnBackdrop: true
    });

    // Setup event listeners for action buttons
    setTimeout(() => {
      this.setupActionButtonListeners();
    }, 0);
  },

  /**
   * Setup event listeners for action buttons
   */
  setupActionButtonListeners() {
    const countyId = this.currentCounty?.id;
    if (!countyId) return;

    // Edit County
    const editBtn = document.querySelector('.edit-county-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => this.openEditModal(countyId));
    }

    // View Public Site
    const viewSiteBtn = document.querySelector('.view-site-btn');
    if (viewSiteBtn) {
      viewSiteBtn.addEventListener('click', () => this.openPublicSite(countyId));
    }

    // Manage Contributors
    const contributorsBtn = document.querySelector('.manage-contributors-btn');
    if (contributorsBtn) {
      contributorsBtn.addEventListener('click', () => this.manageContributors(countyId));
    }

    // Manage Content
    const contentBtn = document.querySelector('.manage-content-btn');
    if (contentBtn) {
      contentBtn.addEventListener('click', () => this.manageContent(countyId));
    }

    // Manage Opportunities
    const opportunitiesBtn = document.querySelector('.manage-opportunities-btn');
    if (opportunitiesBtn) {
      opportunitiesBtn.addEventListener('click', () => this.manageOpportunities(countyId));
    }

    // Manage Events
    const eventsBtn = document.querySelector('.manage-events-btn');
    if (eventsBtn) {
      eventsBtn.addEventListener('click', () => this.manageEvents(countyId));
    }

    // Close button
    const closeBtn = document.querySelector('.close-details-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => ModalManager.close('countyDetailsModal'));
    }
  },

  /**
   * Get status badge HTML
   */
  getStatusBadge(status) {
    const statusColors = {
      'live': 'bg-green-100 text-green-800 border border-green-300',
      'coming_soon': 'bg-blue-100 text-blue-800 border border-blue-300',
      'draft': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      'active': 'bg-green-100 text-green-800 border border-green-300',
      'inactive': 'bg-red-100 text-red-800 border border-red-300',
      'published': 'bg-green-100 text-green-800 border border-green-300'
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border border-gray-300';
    return `<span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${colorClass}">
      ${this.formatStatusText(status)}
    </span>`;
  },

  /**
   * Format status text
   */
  formatStatusText(status) {
    const statusMap = {
      'coming_soon': 'Coming Soon',
      'live': 'Live',
      'draft': 'Draft',
      'active': 'Active',
      'inactive': 'Inactive',
      'published': 'Published'
    };
    return statusMap[status] || status;
  },

  /**
   * Open edit county modal
   */
  openEditModal(countyId) {
    const county = this.currentCounty;
    if (!county) return;

    const editContent = `
      <form id="editCountyForm" data-county-id="${countyId}">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">County Name *</label>
          <input type="text" id="editCountyName" value="${Helpers.escapeHtml(county.name)}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Slug</label>
          <input type="text" id="editCountySlug" value="${county.slug || ''}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Region</label>
          <input type="text" id="editCountyRegion" value="${county.region || ''}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Capital City</label>
          <input type="text" id="editCountyCapital" value="${county.capital_city || county.capital || ''}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Motto/Tagline</label>
          <input type="text" id="editCountyMotto" value="${county.motto || county.tagline || ''}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Established Year</label>
          <input type="number" id="editCountyYear" value="${county.established_year || county.year_established || ''}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="editCountyStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="live" ${county.status === 'live' ? 'selected' : ''}>Live</option>
            <option value="coming_soon" ${county.status === 'coming_soon' ? 'selected' : ''}>Coming Soon</option>
            <option value="draft" ${county.status === 'draft' ? 'selected' : ''}>Draft</option>
          </select>
        </div>

        <div class="flex gap-3">
          <button type="button" class="cancel-edit-btn flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editCountyModalDetails', 'Edit County Details', editContent);

    // Setup event listeners for edit form
    setTimeout(() => {
      const form = document.getElementById('editCountyForm');
      const cancelBtn = document.querySelector('.cancel-edit-btn');

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const formCountyId = form.getAttribute('data-county-id');
          this.saveEdit(e, formCountyId);
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          ModalManager.close('editCountyModalDetails');
        });
      }
    }, 0);
  },

  /**
   * Save county edits
   */
  async saveEdit(event, countyId) {
    event.preventDefault();

    const name = document.getElementById('editCountyName').value.trim();
    const slug = document.getElementById('editCountySlug').value.trim();
    const region = document.getElementById('editCountyRegion').value.trim();
    const capital = document.getElementById('editCountyCapital').value.trim();
    const motto = document.getElementById('editCountyMotto').value.trim();
    const year = document.getElementById('editCountyYear').value;
    const status = document.getElementById('editCountyStatus').value;

    if (!name || !status) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const updateData = {
        name,
        status,
        slug: slug || null,
        region: region || null,
        capital_city: capital || null,
        motto: motto || null,
        established_year: year ? parseInt(year) : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('counties')
        .update(updateData)
        .eq('id', countyId);

      if (error) throw error;

      Helpers.showSuccess('County updated successfully!');
      ModalManager.close('editCountyModalDetails');
      
      // Refresh the details
      await this.open(countyId);
    } catch (err) {
      Helpers.showError('Error updating county: ' + err.message);
    }
  },

  /**
   * Open public site for county
   */
  openPublicSite(countyId) {
    const county = this.currentCounty;
    if (!county) return;

    // Navigate to public county page
    const countySlug = county.slug || county.name.toLowerCase().replace(/\s+/g, '-');
    window.open(`../county-pages/${countySlug}.html`, '_blank');
  },

  /**
   * Manage contributors
   */
  manageContributors(countyId) {
    Helpers.showSuccess('Redirecting to Contributors Management...\n\nFeature: Manage County Contributors');
    // TODO: Implement contributors management
    // This could open a new section or navigate to contributors page with county filter
  },

  /**
   * Manage content
   */
  manageContent(countyId) {
    Helpers.showSuccess('Redirecting to Content Management...\n\nFeature: Manage County Content');
    // TODO: Implement content management
    // This could navigate to content page with county filter
  },

  /**
   * Manage opportunities
   */
  manageOpportunities(countyId) {
    Helpers.showSuccess('Redirecting to Opportunities Management...\n\nFeature: Manage County Opportunities');
    // TODO: Implement opportunities management
    // This could navigate to opportunities page with county filter
  },

  /**
   * Manage events
   */
  manageEvents(countyId) {
    Helpers.showSuccess('Redirecting to Events Management...\n\nFeature: Manage County Events');
    // TODO: Implement events management
    // This could navigate to events page with county filter
  }
};

// Make CountyDetails globally available
window.CountyDetails = CountyDetails;
