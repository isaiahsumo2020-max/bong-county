/**
 * Tourism Module
 * Handles tourism sites management
 */

const Tourism = {
  data: [],

  async init() {
    const page = document.getElementById('tourism-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading tourism sites...</div>';

    try {
      await this.loadTourism();
      this.render();
    } catch (err) {
      console.error('Tourism error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading tourism sites</div>';
    }
  },

  async loadTourism() {
    try {
      const { data, error } = await supabaseClient
        .from('tourism_sites')
        .select('*, counties(name)')
        .order('name');

      if (error) throw error;
      this.data = data || [];
    } catch (err) {
      console.error('Error loading tourism sites:', err);
      this.data = [];
    }
  },

  render() {
    const page = document.getElementById('tourism-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-2xl font-extrabold text-gray-900">Tourism Sites</h3>
            <p class="text-gray-500 mt-1">Manage tourism sites and attractions</p>
          </div>
          <button onclick="Tourism.openAddModal()" class="btn btn-primary">
            Add Site
          </button>
        </div>

        <div class="filter-bar">
          <div>
            <label>Category</label>
            <select id="tourismCategoryFilter" onchange="Tourism.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Categories</option>
              <option value="beach">Beach</option>
              <option value="park">Park</option>
              <option value="cultural">Cultural</option>
              <option value="historical">Historical</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label>Search</label>
            <input type="text" id="tourismSearchFilter" onkeyup="Tourism.applyFilters()" 
              placeholder="Search site name or location..." class="border border-gray-300 px-3 py-2 rounded w-64">
          </div>
          <button onclick="Tourism.loadTourism(); Tourism.render();" class="btn btn-secondary">Reset</button>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="pb-4 font-semibold text-gray-500">Site Name</th>
                <th class="pb-4 font-semibold text-gray-500">County</th>
                <th class="pb-4 font-semibold text-gray-500">Category</th>
                <th class="pb-4 font-semibold text-gray-500">Location</th>
                <th class="pb-4 font-semibold text-gray-500">Status</th>
                <th class="pb-4 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody id="tourismTableBody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTableRows() {
    if (this.data.length === 0) {
      return '<tr><td colspan="6" class="py-8 text-center text-gray-500">No tourism sites found</td></tr>';
    }

    return this.data.map(site => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-5 font-semibold text-gray-900">${Helpers.truncate(site.name, 30)}</td>
        <td class="py-5 text-gray-600">${site.counties?.name || '-'}</td>
        <td class="py-5 text-gray-600 capitalize">${site.category || '-'}</td>
        <td class="py-5 text-gray-600">${Helpers.truncate(site.location || '-', 25)}</td>
        <td class="py-5">${site.is_published ? '<span class="badge badge-success">Published</span>' : '<span class="badge badge-warning">Draft</span>'}</td>
        <td class="py-5">
          <div class="flex gap-2">
            <button onclick="Tourism.openEditModal(${site.id})" 
              class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Edit
            </button>
            <button onclick="Tourism.deleteSite(${site.id})" 
              class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  applyFilters() {
    const category = document.getElementById('tourismCategoryFilter').value;
    const search = document.getElementById('tourismSearchFilter').value.toLowerCase();

    let filtered = this.data;

    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }

    if (search) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        (s.location && s.location.toLowerCase().includes(search))
      );
    }

    const tableBody = document.getElementById('tourismTableBody');
    if (tableBody) {
      tableBody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="6" class="py-8 text-center text-gray-500">No tourism sites found</td></tr>'
        : filtered.map(site => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-5 font-semibold text-gray-900">${Helpers.truncate(site.name, 30)}</td>
            <td class="py-5 text-gray-600">${site.counties?.name || '-'}</td>
            <td class="py-5 text-gray-600 capitalize">${site.category || '-'}</td>
            <td class="py-5 text-gray-600">${Helpers.truncate(site.location || '-', 25)}</td>
            <td class="py-5">${site.is_published ? '<span class="badge badge-success">Published</span>' : '<span class="badge badge-warning">Draft</span>'}</td>
            <td class="py-5">
              <div class="flex gap-2">
                <button onclick="Tourism.openEditModal(${site.id})" 
                  class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Edit
                </button>
                <button onclick="Tourism.deleteSite(${site.id})" 
                  class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `).join('');
    }
  },

  openAddModal() {
    const content = `
      <form onsubmit="Tourism.saveNew(event)">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Site Name *</label>
          <input type="text" id="newSiteName" required placeholder="Enter site name" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Category *</label>
          <select id="newSiteCategory" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="">Select Category</option>
            <option value="beach">Beach</option>
            <option value="park">Park</option>
            <option value="cultural">Cultural</option>
            <option value="historical">Historical</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Location</label>
          <input type="text" id="newSiteLocation" placeholder="Enter location" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea id="newSiteDescription" placeholder="Enter description" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24"></textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">
            <input type="checkbox" id="newSitePublished" checked> Publish
          </label>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('addTourismModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Add Site</button>
        </div>
      </form>
    `;

    ModalManager.create('addTourismModal', 'Add Tourism Site', content);
  },

  async openEditModal(id) {
    const item = this.data.find(s => s.id === id);
    if (!item) {
      Helpers.showError('Site not found');
      return;
    }

    const content = `
      <form onsubmit="Tourism.saveEdit(event, ${id})">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Site Name *</label>
          <input type="text" id="editSiteName" value="${Helpers.escapeHtml(item.name)}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Category *</label>
          <select id="editSiteCategory" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="beach" ${item.category === 'beach' ? 'selected' : ''}>Beach</option>
            <option value="park" ${item.category === 'park' ? 'selected' : ''}>Park</option>
            <option value="cultural" ${item.category === 'cultural' ? 'selected' : ''}>Cultural</option>
            <option value="historical" ${item.category === 'historical' ? 'selected' : ''}>Historical</option>
            <option value="other" ${item.category === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Location</label>
          <input type="text" id="editSiteLocation" value="${item.location || ''}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea id="editSiteDescription" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24">${item.description || ''}</textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">
            <input type="checkbox" id="editSitePublished" ${item.is_published ? 'checked' : ''}> Publish
          </label>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('editTourismModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editTourismModal', 'Edit Tourism Site', content);
  },

  async saveNew(event) {
    event.preventDefault();

    const name = document.getElementById('newSiteName').value.trim();
    const category = document.getElementById('newSiteCategory').value;
    const location = document.getElementById('newSiteLocation').value.trim();
    const description = document.getElementById('newSiteDescription').value.trim();
    const is_published = document.getElementById('newSitePublished').checked;

    if (!name || !category) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const user = await supabaseClient.auth.getUser();
      const userProfile = await supabaseClient
        .from('users')
        .select('county_id')
        .eq('id', user.data.user.id)
        .single();

      const { error } = await supabaseClient
        .from('tourism_sites')
        .insert([{
          name,
          category,
          location: location || null,
          description: description || null,
          is_published,
          county_id: userProfile.data.county_id
        }]);

      if (error) throw error;

      Helpers.showSuccess('Tourism site added successfully!');
      ModalManager.close('addTourismModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async saveEdit(event, id) {
    event.preventDefault();

    const name = document.getElementById('editSiteName').value.trim();
    const category = document.getElementById('editSiteCategory').value;
    const location = document.getElementById('editSiteLocation').value.trim();
    const description = document.getElementById('editSiteDescription').value.trim();
    const is_published = document.getElementById('editSitePublished').checked;

    if (!name || !category) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('tourism_sites')
        .update({
          name,
          category,
          location: location || null,
          description: description || null,
          is_published
        })
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Tourism site updated successfully!');
      ModalManager.close('editTourismModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async deleteSite(id) {
    if (!Helpers.confirm('Are you sure you want to delete this tourism site?')) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('tourism_sites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Tourism site deleted successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};
