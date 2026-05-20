/**
 * Counties Module
 * Handles county management (CRUD operations)
 */

const Counties = {
  data: [],

  /**
   * Initialize counties page
   */
  async init() {
    const page = document.getElementById('counties-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading counties...</div>';

    try {
      await this.loadCounties();
      this.render();
    } catch (err) {
      console.error('Counties error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading counties</div>';
    }
  },

  /**
   * Load counties from database
   */
  async loadCounties() {
    try {
      const { data, error } = await supabaseClient
        .from('counties')
        .select('*')
        .order('name');

      if (error) throw error;
      this.data = data || [];
    } catch (err) {
      console.error('Error loading counties:', err);
      this.data = [];
    }
  },

  /**
   * Render counties page
   */
  render() {
    const page = document.getElementById('counties-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-2xl font-extrabold text-gray-900">Counties</h3>
            <p class="text-gray-500 mt-1">Manage all Liberia counties</p>
          </div>
          <button id="addCountyBtn" class="btn btn-primary">
            Add County
          </button>
        </div>

        <div class="filter-bar">
          <div>
            <label>Status</label>
            <select id="countyStatusFilter" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label>Search</label>
            <input type="text" id="countySearchFilter" 
              placeholder="Search county name or region..." class="border border-gray-300 px-3 py-2 rounded w-64">
          </div>
          <button id="resetCountyFiltersBtn" class="btn btn-secondary">Reset</button>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="pb-4 font-semibold text-gray-500">County</th>
                <th class="pb-4 font-semibold text-gray-500">Region</th>
                <th class="pb-4 font-semibold text-gray-500">Capital</th>
                <th class="pb-4 font-semibold text-gray-500">Status</th>
                <th class="pb-4 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody id="countiesTableBody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Setup event listeners after rendering
    this.setupEventListeners();
    this.setupFilterListeners();
  },

  /**
   * Setup filter event listeners
   */
  setupFilterListeners() {
    const statusFilter = document.getElementById('countyStatusFilter');
    const searchFilter = document.getElementById('countySearchFilter');
    const resetBtn = document.getElementById('resetCountyFiltersBtn');
    const addBtn = document.getElementById('addCountyBtn');

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }
    if (searchFilter) {
      searchFilter.addEventListener('keyup', () => this.applyFilters());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.loadCounties().then(() => this.render());
      });
    }
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }
  },

  /**
   * Render table rows
   */
  renderTableRows() {
    if (this.data.length === 0) {
      return '<tr><td colspan="6" class="py-8 text-center text-gray-500">No counties found</td></tr>';
    }

    return this.data.map(county => {
      return `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-5 font-semibold text-gray-900" data-county-id="${county.id}">${county.name}</td>
        <td class="py-5 text-gray-600">${county.region || '-'}</td>
        <td class="py-5 text-gray-600">${county.capital || '-'}</td>
        <td class="py-5">${Helpers.getStatusBadge(county.status)}</td>
        <td class="py-5">
          <div class="flex gap-2">
            <button class="btn btn-primary county-view-details" data-id="${county.id}" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              View Details
            </button>
            <button class="btn btn-secondary county-edit" data-id="${county.id}" data-name="${Helpers.escapeHtml(county.name)}" data-region="${county.region || ''}" data-capital="${county.capital || ''}" data-status="${county.status}" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Quick Edit
            </button>
            <button class="btn btn-danger county-delete" data-id="${county.id}" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  },

  /**
   * Setup event listeners for county table
   */
  setupEventListeners() {
    const countiesTableBody = document.getElementById('countiesTableBody');
    if (!countiesTableBody) return;

    // View Details button
    countiesTableBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('county-view-details')) {
        e.stopPropagation();
        const countyId = e.target.getAttribute('data-id');
        if (typeof CountyDetails !== 'undefined' && CountyDetails.open) {
          CountyDetails.open(countyId);
        }
      }

      // Edit button
      if (e.target.classList.contains('county-edit')) {
        e.stopPropagation();
        const id = e.target.getAttribute('data-id');
        const name = e.target.getAttribute('data-name');
        const region = e.target.getAttribute('data-region');
        const capital = e.target.getAttribute('data-capital');
        const status = e.target.getAttribute('data-status');
        this.openEditModal(id, name, region, capital, status);
      }

      // Delete button
      if (e.target.classList.contains('county-delete')) {
        e.stopPropagation();
        const countyId = e.target.getAttribute('data-id');
        this.deleteCounty(countyId);
      }
    });
  },

  /**
   * Apply filters
   */
  applyFilters() {
    const status = document.getElementById('countyStatusFilter').value;
    const search = document.getElementById('countySearchFilter').value.toLowerCase();

    let filtered = this.data;

    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        (c.region && c.region.toLowerCase().includes(search))
      );
    }

    // Render filtered results
    const tableBody = document.getElementById('countiesTableBody');
    if (tableBody) {
      tableBody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="6" class="py-8 text-center text-gray-500">No counties found</td></tr>'
        : filtered.map(county => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-5 font-semibold text-gray-900" data-county-id="${county.id}">${county.name}</td>
            <td class="py-5 text-gray-600">${county.region || '-'}</td>
            <td class="py-5 text-gray-600">${county.capital || '-'}</td>
            <td class="py-5">${Helpers.getStatusBadge(county.status)}</td>
            <td class="py-5">
              <div class="flex gap-2">
                <button class="btn btn-primary county-view-details" data-id="${county.id}" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  View Details
                </button>
                <button class="btn btn-secondary county-edit" data-id="${county.id}" data-name="${Helpers.escapeHtml(county.name)}" data-region="${county.region || ''}" data-capital="${county.capital || ''}" data-status="${county.status}" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Quick Edit
                </button>
                <button class="btn btn-danger county-delete" data-id="${county.id}" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `).join('');
      
      // Re-setup event listeners for filtered results
      this.setupEventListeners();
    }
  },

  /**
   * Open add county modal
   */
  openAddModal() {
    const content = `
      <form id="addCountyForm">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">County Name *</label>
          <input type="text" id="newCountyName" required placeholder="Enter county name" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Region</label>
          <input type="text" id="newCountyRegion" placeholder="Enter region" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Capital</label>
          <input type="text" id="newCountyCapital" placeholder="Enter capital city" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="newCountyStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" id="cancelAddCounty" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Add County</button>
        </div>
      </form>
    `;

    ModalManager.create('addCountyModal', 'Add New County', content);

    // Setup form event listeners
    setTimeout(() => {
      const form = document.getElementById('addCountyForm');
      const cancelBtn = document.getElementById('cancelAddCounty');

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveNew(e);
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          ModalManager.close('addCountyModal');
        });
      }
    }, 0);
  },

  /**
   * Open edit county modal
   */
  openEditModal(id, name, region, capital, status) {
    const content = `
      <form id="editCountyForm" data-id="${id}">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">County Name *</label>
          <input type="text" id="editCountyName" value="${name}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Region</label>
          <input type="text" id="editCountyRegion" value="${region}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Capital</label>
          <input type="text" id="editCountyCapital" value="${capital}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="editCountyStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="active" ${status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" id="cancelEditCounty" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editCountyModal', 'Edit County', content);

    // Setup form event listeners
    setTimeout(() => {
      const form = document.getElementById('editCountyForm');
      const cancelBtn = document.getElementById('cancelEditCounty');

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const formId = form.getAttribute('data-id');
          this.saveEdit(e, parseInt(formId));
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          ModalManager.close('editCountyModal');
        });
      }
    }, 0);
  },

  /**
   * Save new county
   */
  async saveNew(event) {
    event.preventDefault();

    const name = document.getElementById('newCountyName').value.trim();
    const region = document.getElementById('newCountyRegion').value.trim();
    const capital = document.getElementById('newCountyCapital').value.trim();
    const status = document.getElementById('newCountyStatus').value;

    if (!name || !status) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('counties')
        .insert([{ name, region: region || null, capital: capital || null, status }]);

      if (error) throw error;

      Helpers.showSuccess('County added successfully!');
      ModalManager.close('addCountyModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  /**
   * Save edited county
   */
  async saveEdit(event, id) {
    event.preventDefault();

    const name = document.getElementById('editCountyName').value.trim();
    const region = document.getElementById('editCountyRegion').value.trim();
    const capital = document.getElementById('editCountyCapital').value.trim();
    const status = document.getElementById('editCountyStatus').value;

    if (!name || !status) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('counties')
        .update({ name, region: region || null, capital: capital || null, status })
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('County updated successfully!');
      ModalManager.close('editCountyModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  /**
   * Delete county
   */
  async deleteCounty(id) {
    if (!Helpers.confirm('Are you sure you want to delete this county? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('counties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('County deleted successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};

// Make Counties globally available
window.Counties = Counties;
