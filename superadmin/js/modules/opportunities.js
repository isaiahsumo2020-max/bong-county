/**
 * Opportunities Module
 * Handles scholarships, jobs, internships, training programs
 */

const Opportunities = {
  data: [],

  async init() {
    const page = document.getElementById('opportunities-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading opportunities...</div>';

    try {
      await this.loadOpportunities();
      this.render();
    } catch (err) {
      console.error('Opportunities error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading opportunities</div>';
    }
  },

  async loadOpportunities() {
    try {
      const { data, error } = await supabaseClient
        .from('opportunities')
        .select('*, counties(name), users(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.data = data || [];
    } catch (err) {
      console.error('Error loading opportunities:', err);
      this.data = [];
    }
  },

  render() {
    const page = document.getElementById('opportunities-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-2xl font-extrabold text-gray-900">Opportunities Management</h3>
            <p class="text-gray-500 mt-1">Manage scholarships, jobs, internships, and training programs</p>
          </div>
          <button onclick="Opportunities.openAddModal()" class="btn btn-primary">
            Add Opportunity
          </button>
        </div>

        <div class="filter-bar">
          <div>
            <label>Type</label>
            <select id="opportunityTypeFilter" onchange="Opportunities.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Types</option>
              <option value="scholarship">Scholarship</option>
              <option value="internship">Internship</option>
              <option value="training">Training</option>
              <option value="fellowship">Fellowship</option>
              <option value="grant">Grant</option>
              <option value="job">Job</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select id="opportunityStatusFilter" onchange="Opportunities.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="closing_soon">Closing Soon</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label>Search</label>
            <input type="text" id="opportunitySearchFilter" onkeyup="Opportunities.applyFilters()" 
              placeholder="Search title..." class="border border-gray-300 px-3 py-2 rounded w-64">
          </div>
          <button onclick="Opportunities.loadOpportunities(); Opportunities.render();" class="btn btn-secondary">Reset</button>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="pb-4 font-semibold text-gray-500">Title</th>
                <th class="pb-4 font-semibold text-gray-500">Type</th>
                <th class="pb-4 font-semibold text-gray-500">County</th>
                <th class="pb-4 font-semibold text-gray-500">Deadline</th>
                <th class="pb-4 font-semibold text-gray-500">Status</th>
                <th class="pb-4 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody id="opportunitiesTableBody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTableRows() {
    if (this.data.length === 0) {
      return '<tr><td colspan="6" class="py-8 text-center text-gray-500">No opportunities found</td></tr>';
    }

    return this.data.map(opp => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-5 font-semibold text-gray-900">${Helpers.truncate(opp.title, 30)}</td>
        <td class="py-5 text-gray-600 capitalize">${opp.type}</td>
        <td class="py-5 text-gray-600">${opp.counties?.name || '-'}</td>
        <td class="py-5 text-gray-600">${Helpers.formatDate(opp.deadline)}</td>
        <td class="py-5">${Helpers.getStatusBadge(opp.status)}</td>
        <td class="py-5">
          <div class="flex gap-2">
            <button onclick="Opportunities.openEditModal(${opp.id})" 
              class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Edit
            </button>
            <button onclick="Opportunities.deleteOpportunity(${opp.id})" 
              class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  applyFilters() {
    const type = document.getElementById('opportunityTypeFilter').value;
    const status = document.getElementById('opportunityStatusFilter').value;
    const search = document.getElementById('opportunitySearchFilter').value.toLowerCase();

    let filtered = this.data;

    if (type) {
      filtered = filtered.filter(o => o.type === type);
    }

    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    if (search) {
      filtered = filtered.filter(o =>
        o.title.toLowerCase().includes(search)
      );
    }

    const tableBody = document.getElementById('opportunitiesTableBody');
    if (tableBody) {
      tableBody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="6" class="py-8 text-center text-gray-500">No opportunities found</td></tr>'
        : filtered.map(opp => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-5 font-semibold text-gray-900">${Helpers.truncate(opp.title, 30)}</td>
            <td class="py-5 text-gray-600 capitalize">${opp.type}</td>
            <td class="py-5 text-gray-600">${opp.counties?.name || '-'}</td>
            <td class="py-5 text-gray-600">${Helpers.formatDate(opp.deadline)}</td>
            <td class="py-5">${Helpers.getStatusBadge(opp.status)}</td>
            <td class="py-5">
              <div class="flex gap-2">
                <button onclick="Opportunities.openEditModal(${opp.id})" 
                  class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Edit
                </button>
                <button onclick="Opportunities.deleteOpportunity(${opp.id})" 
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
      <form onsubmit="Opportunities.saveNew(event)">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Title *</label>
          <input type="text" id="newOppTitle" required placeholder="Enter opportunity title" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Type *</label>
          <select id="newOppType" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="">Select Type</option>
            <option value="scholarship">Scholarship</option>
            <option value="internship">Internship</option>
            <option value="training">Training</option>
            <option value="fellowship">Fellowship</option>
            <option value="grant">Grant</option>
            <option value="job">Job</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description *</label>
          <textarea id="newOppDescription" required placeholder="Enter description" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24"></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Deadline *</label>
          <input type="date" id="newOppDeadline" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="newOppStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="open">Open</option>
            <option value="closing_soon">Closing Soon</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('addOpportunityModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Add Opportunity</button>
        </div>
      </form>
    `;

    ModalManager.create('addOpportunityModal', 'Add New Opportunity', content);
  },

  async openEditModal(id) {
    const item = this.data.find(o => o.id === id);
    if (!item) {
      Helpers.showError('Opportunity not found');
      return;
    }

    const content = `
      <form onsubmit="Opportunities.saveEdit(event, ${id})">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Title *</label>
          <input type="text" id="editOppTitle" value="${Helpers.escapeHtml(item.title)}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Type *</label>
          <select id="editOppType" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="scholarship" ${item.type === 'scholarship' ? 'selected' : ''}>Scholarship</option>
            <option value="internship" ${item.type === 'internship' ? 'selected' : ''}>Internship</option>
            <option value="training" ${item.type === 'training' ? 'selected' : ''}>Training</option>
            <option value="fellowship" ${item.type === 'fellowship' ? 'selected' : ''}>Fellowship</option>
            <option value="grant" ${item.type === 'grant' ? 'selected' : ''}>Grant</option>
            <option value="job" ${item.type === 'job' ? 'selected' : ''}>Job</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description *</label>
          <textarea id="editOppDescription" required 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24">${item.description || ''}</textarea>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Deadline *</label>
          <input type="date" id="editOppDeadline" value="${item.deadline || ''}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="editOppStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="open" ${item.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="closing_soon" ${item.status === 'closing_soon' ? 'selected' : ''}>Closing Soon</option>
            <option value="closed" ${item.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('editOpportunityModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editOpportunityModal', 'Edit Opportunity', content);
  },

  async saveNew(event) {
    event.preventDefault();

    const title = document.getElementById('newOppTitle').value.trim();
    const type = document.getElementById('newOppType').value;
    const description = document.getElementById('newOppDescription').value.trim();
    const deadline = document.getElementById('newOppDeadline').value;
    const status = document.getElementById('newOppStatus').value;

    if (!title || !type || !description || !deadline) {
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
        .from('opportunities')
        .insert([{
          title,
          type,
          description,
          deadline,
          status,
          author_id: user.data.user.id,
          county_id: userProfile.data.county_id
        }]);

      if (error) throw error;

      Helpers.showSuccess('Opportunity added successfully!');
      ModalManager.close('addOpportunityModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async saveEdit(event, id) {
    event.preventDefault();

    const title = document.getElementById('editOppTitle').value.trim();
    const type = document.getElementById('editOppType').value;
    const description = document.getElementById('editOppDescription').value.trim();
    const deadline = document.getElementById('editOppDeadline').value;
    const status = document.getElementById('editOppStatus').value;

    if (!title || !type || !description || !deadline) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('opportunities')
        .update({
          title,
          type,
          description,
          deadline,
          status
        })
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Opportunity updated successfully!');
      ModalManager.close('editOpportunityModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async deleteOpportunity(id) {
    if (!Helpers.confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Opportunity deleted successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};
