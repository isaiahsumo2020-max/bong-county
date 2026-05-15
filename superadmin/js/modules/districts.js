/**
 * Districts Module
 * Handles districts management per county
 */

const Districts = {
  data: [],

  async init() {
    const page = document.getElementById('districts-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading districts...</div>';

    try {
      await this.loadDistricts();
      this.render();
    } catch (err) {
      console.error('Districts error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading districts</div>';
    }
  },

  async loadDistricts() {
    try {
      const { data, error } = await supabaseClient
        .from('districts')
        .select('*, counties(name)')
        .order('name');

      if (error) throw error;
      this.data = data || [];
    } catch (err) {
      console.error('Error loading districts:', err);
      this.data = [];
    }
  },

  render() {
    const page = document.getElementById('districts-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-2xl font-extrabold text-gray-900">Districts Management</h3>
            <p class="text-gray-500 mt-1">Manage districts and administrative divisions</p>
          </div>
          <button onclick="Districts.openAddModal()" class="btn btn-primary">
            Add District
          </button>
        </div>

        <div class="filter-bar">
          <div>
            <label>Search</label>
            <input type="text" id="districtSearchFilter" onkeyup="Districts.applyFilters()" 
              placeholder="Search district name..." class="border border-gray-300 px-3 py-2 rounded w-64">
          </div>
          <button onclick="Districts.loadDistricts(); Districts.render();" class="btn btn-secondary">Reset</button>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="pb-4 font-semibold text-gray-500">District Name</th>
                <th class="pb-4 font-semibold text-gray-500">County</th>
                <th class="pb-4 font-semibold text-gray-500">Description</th>
                <th class="pb-4 font-semibold text-gray-500">Tags</th>
                <th class="pb-4 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody id="districtsTableBody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTableRows() {
    if (this.data.length === 0) {
      return '<tr><td colspan="5" class="py-8 text-center text-gray-500">No districts found</td></tr>';
    }

    return this.data.map(district => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-5 font-semibold text-gray-900">${district.name}</td>
        <td class="py-5 text-gray-600">${district.counties?.name || '-'}</td>
        <td class="py-5 text-gray-600">${Helpers.truncate(district.description || '-', 30)}</td>
        <td class="py-5 text-gray-600"><span class="text-xs bg-gray-200 px-2 py-1 rounded">${district.tags?.join(', ') || '-'}</span></td>
        <td class="py-5">
          <div class="flex gap-2">
            <button onclick="Districts.openEditModal(${district.id})" 
              class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Edit
            </button>
            <button onclick="Districts.deleteDistrict(${district.id})" 
              class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  applyFilters() {
    const search = document.getElementById('districtSearchFilter').value.toLowerCase();

    let filtered = this.data;

    if (search) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(search) ||
        (d.description && d.description.toLowerCase().includes(search))
      );
    }

    const tableBody = document.getElementById('districtsTableBody');
    if (tableBody) {
      tableBody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="5" class="py-8 text-center text-gray-500">No districts found</td></tr>'
        : filtered.map(district => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-5 font-semibold text-gray-900">${district.name}</td>
            <td class="py-5 text-gray-600">${district.counties?.name || '-'}</td>
            <td class="py-5 text-gray-600">${Helpers.truncate(district.description || '-', 30)}</td>
            <td class="py-5 text-gray-600"><span class="text-xs bg-gray-200 px-2 py-1 rounded">${district.tags?.join(', ') || '-'}</span></td>
            <td class="py-5">
              <div class="flex gap-2">
                <button onclick="Districts.openEditModal(${district.id})" 
                  class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Edit
                </button>
                <button onclick="Districts.deleteDistrict(${district.id})" 
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
      <form onsubmit="Districts.saveNew(event)">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">District Name *</label>
          <input type="text" id="newDistrictName" required placeholder="Enter district name" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea id="newDistrictDescription" placeholder="Enter description" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24"></textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Tags</label>
          <input type="text" id="newDistrictTags" placeholder="Comma-separated tags" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('addDistrictModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Add District</button>
        </div>
      </form>
    `;

    ModalManager.create('addDistrictModal', 'Add New District', content);
  },

  async openEditModal(id) {
    const item = this.data.find(d => d.id === id);
    if (!item) {
      Helpers.showError('District not found');
      return;
    }

    const content = `
      <form onsubmit="Districts.saveEdit(event, ${id})">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">District Name *</label>
          <input type="text" id="editDistrictName" value="${Helpers.escapeHtml(item.name)}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea id="editDistrictDescription" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24">${item.description || ''}</textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Tags</label>
          <input type="text" id="editDistrictTags" value="${item.tags?.join(', ') || ''}" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('editDistrictModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editDistrictModal', 'Edit District', content);
  },

  async saveNew(event) {
    event.preventDefault();

    const name = document.getElementById('newDistrictName').value.trim();
    const description = document.getElementById('newDistrictDescription').value.trim();
    const tagsInput = document.getElementById('newDistrictTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    if (!name) {
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
        .from('districts')
        .insert([{
          name,
          description: description || null,
          tags: tags.length > 0 ? tags : [],
          county_id: userProfile.data.county_id
        }]);

      if (error) throw error;

      Helpers.showSuccess('District added successfully!');
      ModalManager.close('addDistrictModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async saveEdit(event, id) {
    event.preventDefault();

    const name = document.getElementById('editDistrictName').value.trim();
    const description = document.getElementById('editDistrictDescription').value.trim();
    const tagsInput = document.getElementById('editDistrictTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    if (!name) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('districts')
        .update({
          name,
          description: description || null,
          tags: tags.length > 0 ? tags : []
        })
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('District updated successfully!');
      ModalManager.close('editDistrictModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async deleteDistrict(id) {
    if (!Helpers.confirm('Are you sure you want to delete this district?')) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('districts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('District deleted successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};
