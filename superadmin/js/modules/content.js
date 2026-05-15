/**
 * Content Module
 * Handles content management (articles, announcements, stories)
 */

const Content = {
  data: [],

  /**
   * Initialize content page
   */
  async init() {
    const page = document.getElementById('content-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading content...</div>';

    try {
      await this.loadContent();
      this.render();
    } catch (err) {
      console.error('Content error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading content</div>';
    }
  },

  /**
   * Load content from database
   */
  async loadContent() {
    try {
      const { data, error } = await supabaseClient
        .from('content')
        .select('*, counties(name), users(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.data = data || [];
    } catch (err) {
      console.error('Error loading content:', err);
      this.data = [];
    }
  },

  /**
   * Render content page
   */
  render() {
    const page = document.getElementById('content-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-2xl font-extrabold text-gray-900">Content Management</h3>
            <p class="text-gray-500 mt-1">Manage all articles, stories, and announcements</p>
          </div>
          <button onclick="Content.openAddModal()" class="btn btn-primary">
            Add Content
          </button>
        </div>

        <div class="filter-bar">
          <div>
            <label>Status</label>
            <select id="contentStatusFilter" onchange="Content.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label>Type</label>
            <select id="contentTypeFilter" onchange="Content.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Types</option>
              <option value="story">Story</option>
              <option value="article">Article</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>
          <div>
            <label>Search</label>
            <input type="text" id="contentSearchFilter" onkeyup="Content.applyFilters()" 
              placeholder="Search title or author..." class="border border-gray-300 px-3 py-2 rounded w-64">
          </div>
          <button onclick="Content.loadContent(); Content.render();" class="btn btn-secondary">Reset</button>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="pb-4 font-semibold text-gray-500">Title</th>
                <th class="pb-4 font-semibold text-gray-500">Type</th>
                <th class="pb-4 font-semibold text-gray-500">County</th>
                <th class="pb-4 font-semibold text-gray-500">Author</th>
                <th class="pb-4 font-semibold text-gray-500">Status</th>
                <th class="pb-4 font-semibold text-gray-500">Views</th>
                <th class="pb-4 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody id="contentTableBody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Render table rows
   */
  renderTableRows() {
    if (this.data.length === 0) {
      return '<tr><td colspan="7" class="py-8 text-center text-gray-500">No content found</td></tr>';
    }

    return this.data.map(content => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-5 font-semibold text-gray-900 max-w-xs truncate">${Helpers.truncate(content.title, 40)}</td>
        <td class="py-5 text-gray-600 capitalize">${content.type}</td>
        <td class="py-5 text-gray-600">${content.counties?.name || '-'}</td>
        <td class="py-5 text-gray-600">${content.users?.full_name || '-'}</td>
        <td class="py-5">${Helpers.getStatusBadge(content.status)}</td>
        <td class="py-5 text-gray-600">${content.view_count || 0}</td>
        <td class="py-5">
          <div class="flex gap-2">
            <button onclick="Content.openEditModal(${content.id})" 
              class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Edit
            </button>
            <button onclick="Content.deleteContent(${content.id})" 
              class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  /**
   * Apply filters
   */
  applyFilters() {
    const status = document.getElementById('contentStatusFilter').value;
    const type = document.getElementById('contentTypeFilter').value;
    const search = document.getElementById('contentSearchFilter').value.toLowerCase();

    let filtered = this.data;

    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }

    if (search) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search) ||
        (c.users?.full_name && c.users.full_name.toLowerCase().includes(search))
      );
    }

    // Render filtered results
    const tableBody = document.getElementById('contentTableBody');
    if (tableBody) {
      tableBody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="7" class="py-8 text-center text-gray-500">No content found</td></tr>'
        : filtered.map(content => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-5 font-semibold text-gray-900 max-w-xs truncate">${Helpers.truncate(content.title, 40)}</td>
            <td class="py-5 text-gray-600 capitalize">${content.type}</td>
            <td class="py-5 text-gray-600">${content.counties?.name || '-'}</td>
            <td class="py-5 text-gray-600">${content.users?.full_name || '-'}</td>
            <td class="py-5">${Helpers.getStatusBadge(content.status)}</td>
            <td class="py-5 text-gray-600">${content.view_count || 0}</td>
            <td class="py-5">
              <div class="flex gap-2">
                <button onclick="Content.openEditModal(${content.id})" 
                  class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Edit
                </button>
                <button onclick="Content.deleteContent(${content.id})" 
                  class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `).join('');
    }
  },

  /**
   * Open add content modal
   */
  openAddModal() {
    const content = `
      <form onsubmit="Content.saveNew(event)">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Title *</label>
          <input type="text" id="newContentTitle" required placeholder="Enter content title" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Type *</label>
          <select id="newContentType" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="">Select Type</option>
            <option value="story">Story</option>
            <option value="article">Article</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Excerpt</label>
          <textarea id="newContentExcerpt" placeholder="Enter content excerpt" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24"></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Body *</label>
          <textarea id="newContentBody" required placeholder="Enter content body" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24"></textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="newContentStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('addContentModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Add Content</button>
        </div>
      </form>
    `;

    ModalManager.create('addContentModal', 'Add New Content', content);
  },

  /**
   * Open edit content modal
   */
  async openEditModal(id) {
    const item = this.data.find(c => c.id === id);
    if (!item) {
      Helpers.showError('Content not found');
      return;
    }

    const content = `
      <form onsubmit="Content.saveEdit(event, ${id})">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Title *</label>
          <input type="text" id="editContentTitle" value="${Helpers.escapeHtml(item.title)}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Type *</label>
          <select id="editContentType" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="story" ${item.type === 'story' ? 'selected' : ''}>Story</option>
            <option value="article" ${item.type === 'article' ? 'selected' : ''}>Article</option>
            <option value="announcement" ${item.type === 'announcement' ? 'selected' : ''}>Announcement</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Excerpt</label>
          <textarea id="editContentExcerpt" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24">${item.excerpt || ''}</textarea>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Body *</label>
          <textarea id="editContentBody" required 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24">${item.body || ''}</textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="editContentStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="draft" ${item.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="pending_review" ${item.status === 'pending_review' ? 'selected' : ''}>Pending Review</option>
            <option value="published" ${item.status === 'published' ? 'selected' : ''}>Published</option>
            <option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('editContentModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editContentModal', 'Edit Content', content);
  },

  /**
   * Save new content
   */
  async saveNew(event) {
    event.preventDefault();

    const title = document.getElementById('newContentTitle').value.trim();
    const type = document.getElementById('newContentType').value;
    const excerpt = document.getElementById('newContentExcerpt').value.trim();
    const body = document.getElementById('newContentBody').value.trim();
    const status = document.getElementById('newContentStatus').value;

    if (!title || !type || !body) {
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
        .from('content')
        .insert([{
          title,
          type,
          excerpt: excerpt || null,
          body,
          status,
          author_id: user.data.user.id,
          county_id: userProfile.data.county_id
        }]);

      if (error) throw error;

      Helpers.showSuccess('Content added successfully!');
      ModalManager.close('addContentModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  /**
   * Save edited content
   */
  async saveEdit(event, id) {
    event.preventDefault();

    const title = document.getElementById('editContentTitle').value.trim();
    const type = document.getElementById('editContentType').value;
    const excerpt = document.getElementById('editContentExcerpt').value.trim();
    const body = document.getElementById('editContentBody').value.trim();
    const status = document.getElementById('editContentStatus').value;

    if (!title || !type || !body) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('content')
        .update({
          title,
          type,
          excerpt: excerpt || null,
          body,
          status
        })
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Content updated successfully!');
      ModalManager.close('editContentModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  /**
   * Delete content
   */
  async deleteContent(id) {
    if (!Helpers.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Content deleted successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};
