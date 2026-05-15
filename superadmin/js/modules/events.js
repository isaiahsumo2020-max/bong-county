/**
 * Events Module
 * Handles event management
 */

const Events = {
  data: [],

  async init() {
    const page = document.getElementById('events-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading events...</div>';

    try {
      await this.loadEvents();
      this.render();
    } catch (err) {
      console.error('Events error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading events</div>';
    }
  },

  async loadEvents() {
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('*, counties(name), users(full_name)')
        .order('event_date', { ascending: true });

      if (error) throw error;
      this.data = data || [];
    } catch (err) {
      console.error('Error loading events:', err);
      this.data = [];
    }
  },

  render() {
    const page = document.getElementById('events-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-2xl font-extrabold text-gray-900">Events Management</h3>
            <p class="text-gray-500 mt-1">Manage all upcoming and past events</p>
          </div>
          <button onclick="Events.openAddModal()" class="btn btn-primary">
            Add Event
          </button>
        </div>

        <div class="filter-bar">
          <div>
            <label>Status</label>
            <select id="eventStatusFilter" onchange="Events.applyFilters()" class="border border-gray-300 px-3 py-2 rounded">
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label>Search</label>
            <input type="text" id="eventSearchFilter" onkeyup="Events.applyFilters()" 
              placeholder="Search event title..." class="border border-gray-300 px-3 py-2 rounded w-64">
          </div>
          <button onclick="Events.loadEvents(); Events.render();" class="btn btn-secondary">Reset</button>
        </div>

        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="pb-4 font-semibold text-gray-500">Title</th>
                <th class="pb-4 font-semibold text-gray-500">County</th>
                <th class="pb-4 font-semibold text-gray-500">Date</th>
                <th class="pb-4 font-semibold text-gray-500">Author</th>
                <th class="pb-4 font-semibold text-gray-500">Status</th>
                <th class="pb-4 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody id="eventsTableBody">
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTableRows() {
    if (this.data.length === 0) {
      return '<tr><td colspan="6" class="py-8 text-center text-gray-500">No events found</td></tr>';
    }

    return this.data.map(event => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-5 font-semibold text-gray-900">${Helpers.truncate(event.title, 30)}</td>
        <td class="py-5 text-gray-600">${event.counties?.name || '-'}</td>
        <td class="py-5 text-gray-600">${Helpers.formatDate(event.event_date)}</td>
        <td class="py-5 text-gray-600">${event.users?.full_name || '-'}</td>
        <td class="py-5">${Helpers.getStatusBadge(event.status)}</td>
        <td class="py-5">
          <div class="flex gap-2">
            <button onclick="Events.openEditModal(${event.id})" 
              class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Edit
            </button>
            <button onclick="Events.deleteEvent(${event.id})" 
              class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  applyFilters() {
    const status = document.getElementById('eventStatusFilter').value;
    const search = document.getElementById('eventSearchFilter').value.toLowerCase();

    let filtered = this.data;

    if (status) {
      filtered = filtered.filter(e => e.status === status);
    }

    if (search) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(search)
      );
    }

    const tableBody = document.getElementById('eventsTableBody');
    if (tableBody) {
      tableBody.innerHTML = filtered.length === 0
        ? '<tr><td colspan="6" class="py-8 text-center text-gray-500">No events found</td></tr>'
        : filtered.map(event => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-5 font-semibold text-gray-900">${Helpers.truncate(event.title, 30)}</td>
            <td class="py-5 text-gray-600">${event.counties?.name || '-'}</td>
            <td class="py-5 text-gray-600">${Helpers.formatDate(event.event_date)}</td>
            <td class="py-5 text-gray-600">${event.users?.full_name || '-'}</td>
            <td class="py-5">${Helpers.getStatusBadge(event.status)}</td>
            <td class="py-5">
              <div class="flex gap-2">
                <button onclick="Events.openEditModal(${event.id})" 
                  class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  Edit
                </button>
                <button onclick="Events.deleteEvent(${event.id})" 
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
      <form onsubmit="Events.saveNew(event)">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Title *</label>
          <input type="text" id="newEventTitle" required placeholder="Enter event title" 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Event Date *</label>
          <input type="datetime-local" id="newEventDate" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea id="newEventDescription" placeholder="Enter event description" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24"></textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="newEventStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="past">Past</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('addEventModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Add Event</button>
        </div>
      </form>
    `;

    ModalManager.create('addEventModal', 'Add New Event', content);
  },

  async openEditModal(id) {
    const item = this.data.find(e => e.id === id);
    if (!item) {
      Helpers.showError('Event not found');
      return;
    }

    const content = `
      <form onsubmit="Events.saveEdit(event, ${id})">
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Title *</label>
          <input type="text" id="editEventTitle" value="${Helpers.escapeHtml(item.title)}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Event Date *</label>
          <input type="datetime-local" id="editEventDate" value="${item.event_date || ''}" required 
            class="border border-gray-300 px-3 py-2 rounded w-full">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea id="editEventDescription" 
            class="border border-gray-300 px-3 py-2 rounded w-full h-24">${item.description || ''}</textarea>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-2">Status *</label>
          <select id="editEventStatus" required class="border border-gray-300 px-3 py-2 rounded w-full">
            <option value="upcoming" ${item.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
            <option value="ongoing" ${item.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
            <option value="past" ${item.status === 'past' ? 'selected' : ''}>Past</option>
            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="ModalManager.close('editEventModal')" class="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    ModalManager.create('editEventModal', 'Edit Event', content);
  },

  async saveNew(event) {
    event.preventDefault();

    const title = document.getElementById('newEventTitle').value.trim();
    const event_date = document.getElementById('newEventDate').value;
    const description = document.getElementById('newEventDescription').value.trim();
    const status = document.getElementById('newEventStatus').value;

    if (!title || !event_date) {
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
        .from('events')
        .insert([{
          title,
          event_date,
          description: description || null,
          status,
          author_id: user.data.user.id,
          county_id: userProfile.data.county_id
        }]);

      if (error) throw error;

      Helpers.showSuccess('Event added successfully!');
      ModalManager.close('addEventModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async saveEdit(event, id) {
    event.preventDefault();

    const title = document.getElementById('editEventTitle').value.trim();
    const event_date = document.getElementById('editEventDate').value;
    const description = document.getElementById('editEventDescription').value.trim();
    const status = document.getElementById('editEventStatus').value;

    if (!title || !event_date) {
      Helpers.showError('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('events')
        .update({
          title,
          event_date,
          description: description || null,
          status
        })
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Event updated successfully!');
      ModalManager.close('editEventModal');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  },

  async deleteEvent(id) {
    if (!Helpers.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Helpers.showSuccess('Event deleted successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};
