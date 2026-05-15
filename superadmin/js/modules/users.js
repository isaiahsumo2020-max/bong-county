/**
 * Users Management Module
 * Handles user management and permissions
 */

const UserManagement = {
  data: [],

  async init() {
    const page = document.getElementById('users-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading users...</div>';

    try {
      await this.loadUsers();
      this.render();
    } catch (err) {
      console.error('Users error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading users</div>';
    }
  },

  async loadUsers() {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*, counties(name)')
        .order('full_name');

      if (error) throw error;
      this.data = data || [];
    } catch (err) {
      console.error('Error loading users:', err);
      this.data = [];
    }
  },

  render() {
    const page = document.getElementById('users-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-2xl font-extrabold text-gray-900">User Management</h3>
            <p class="text-gray-500 mt-1">Manage system users and roles</p>
          </div>
          <button onclick="UserManagement.openAddModal()" class="btn btn-primary">
            Add User
          </button>
        </div>

        <div class="filter-bar">
          <div>
            <label>Role</label>
            <select id="userRoleFilter" onchange="UserManagement.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="county_admin">County Admin</option>
              <option value="contributor">Contributor</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
          <div>
            <label>Verified</label>
            <select id="userVerifiedFilter" onchange="UserManagement.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>
          <div>
            <label>Search</label>
            <input type="text" id="userSearchFilter" onkeyup="UserManagement.applyFilters()" 
              placeholder="Search name or email..." class="border border-gray-300 px-3 py-2 rounded w-64">
          </div>
          <button onclick="UserManagement.loadUsers(); UserManagement.render();" class="btn btn-secondary">Reset</button>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="pb-4 font-semibold text-gray-500">Full Name</th>
                <th class="pb-4 font-semibold text-gray-500">Email</th>
                <th class="pb-4 font-semibold text-gray-500">Role</th>
                <th class="pb-4 font-semibold text-gray-500">County</th>
                <th class="pb-4 font-semibold text-gray-500">Verified</th>
                <th class="pb-4 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTableRows() {
    if (this.data.length === 0) {
      return '<tr><td colspan="6" class="py-8 text-center text-gray-500">No users found</td></tr>';
    }

    return this.data.map(user => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-5 font-semibold text-gray-900">${user.full_name || '-'}</td>
        <td class="py-5 text-gray-600">${user.email || '-'}</td>
        <td class="py-5"><span class="badge badge-primary capitalize">${user.role.replace('_', ' ')}</span></td>
        <td class="py-5 text-gray-600">${user.counties?.name || '-'}</td>
        <td class="py-5">${user.verified ? '<span class="badge badge-success">✓ Verified</span>' : '<span class="badge badge-warning">Unverified</span>'}</td>
        <td class="py-5">
          <div class="flex gap-2">
            <button onclick="UserManagement.openEditModal(${user.id})" 
              class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Edit
            </button>
            <button onclick="UserManagement.deleteUser('${user.id}')" 
              class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  applyFilters() {
    const role = document.getElementById('userRoleFilter').value;
    const verified = document.getElementById('userVerifiedFilter').value;
    const search = document.getElementById('userSearchFilter').value.toLowerCase();

    let filtered = this.data;

    if (role) {
      filtered = filtered.filter(u => u.role === role);
    }

    if (verified !== '') {
      filtered = filtered.filter(u => u.verified === (verified === 'true'));
    }

    if (search) {
      filtered = filtered.filter(u =>
        (u.full_name && u.full_name.toLowerCase().includes(search)) ||
        (u.email && u.email.toLowerCase().includes(search))
      );
    }

    const tableBody = document.getElementById('usersTableBody');
    if (tableBody) {
      tableBody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="6" class="py-8 text-center text-gray-500">No users found</td></tr>'
        : filtered.map(user => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-5 font-semibold text-gray-900">${user.full_name || '-'}</td>
            <td class="py-5 text-gray-600">${user.email || '-'}</td>
            <td class="py-5"><span class="badge badge-primary capitalize">${user.role.replace('_', ' ')}</span></td>
            <td class="py-5 text-gray-600">${user.counties?.name || '-'}</td>
            <td class="py-5">${user.verified ? '<span class="badge badge-success">✓ Verified</span>' : '<span class="badge badge-warning">Unverified</span>'}</td>
            <td class="py-5">
              <div class="flex gap-2">
                <button onclick="UserManagement.openEditModal(${user.id})" 
                  class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Edit
                </button>
                <button onclick="UserManagement.deleteUser('${user.id}')" 
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
      <form onsubmit="UserManagement.saveNew(event)">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Full Name *</label>
          <input type="text" id="newUserName" required placeholder="Enter full name" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Email *</label>
          <input type="email" id="newUserEmail" required placeholder="Enter email" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Role *</label>
          <select id="newUserRole" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="">Select Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="county_admin">County Admin</option>
            <option value="contributor">Contributor</option>
            <option value="visitor">Visitor</option>
          </select>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">
            <input type="checkbox" id="newUserVerified"> Mark as Verified
          </label>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('addUserModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Add User</button>
        </div>
      </form>
    `;

    ModalManager.create('addUserModal', 'Add New User', content);
  },

  async openEditModal(id) {
    const item = this.data.find(u => u.id === id);
    if (!item) {
      Helpers.showError('User not found');
      return;
    }

    const content = `
      <form onsubmit="UserManagement.saveEdit(event, '${item.id}')">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Full Name *</label>
          <input type="text" id="editUserName" value="${Helpers.escapeHtml(item.full_name || '')}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Email *</label>
          <input type="email" id="editUserEmail" value="${Helpers.escapeHtml(item.email || '')}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Role *</label>
          <select id="editUserRole" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="super_admin" ${item.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
            <option value="county_admin" ${item.role === 'county_admin' ? 'selected' : ''}>County Admin</option>
            <option value="contributor" ${item.role === 'contributor' ? 'selected' : ''}>Contributor</option>
            <option value="visitor" ${item.role === 'visitor' ? 'selected' : ''}>Visitor</option>
          </select>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">
            <input type="checkbox" id="editUserVerified" ${item.verified ? 'checked' : ''}> Mark as Verified
          </label>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('editUserModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editUserModal', 'Edit User', content);
  },

  async saveNew(event) {
    event.preventDefault();

    const full_name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const role = document.getElementById('newUserRole').value;
    const verified = document.getElementById('newUserVerified').checked;

    if (!full_name || !email || !role) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('users')
        .insert([{
          full_name,
          email,
          role,
          verified
        }]);

      if (error) throw error;

      Helpers.showSuccess('User added successfully!');
      ModalManager.close('addUserModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async saveEdit(event, id) {
    event.preventDefault();

    const full_name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const role = document.getElementById('editUserRole').value;
    const verified = document.getElementById('editUserVerified').checked;

    if (!full_name || !email || !role) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('users')
        .update({
          full_name,
          email,
          role,
          verified
        })
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('User updated successfully!');
      ModalManager.close('editUserModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async deleteUser(id) {
    if (!Helpers.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('User deleted successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};
