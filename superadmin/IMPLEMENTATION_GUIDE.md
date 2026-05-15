# Implementation Guide for Module Templates

This guide shows how to implement the remaining modules using the `counties.js` module as a template.

## Module Structure Overview

Every module follows this consistent pattern:

```javascript
const ModuleName = {
  // Data storage
  data: [],
  
  // Main initialization
  async init() { },
  
  // Load data from database
  async loadData() { },
  
  // Render HTML view
  render() { },
  
  // Render table rows
  renderTableRows() { },
  
  // Apply filters to data
  applyFilters() { },
  
  // Open modal for adding
  openAddModal() { },
  
  // Open modal for editing
  openEditModal() { },
  
  // Save new record
  async saveNew(event) { },
  
  // Save edited record
  async saveEdit(event, id) { },
  
  // Delete record
  async deleteRecord(id) { }
};
```

## Step-by-Step Implementation

### Step 1: Identify Database Table
Example for Content module:
- Table name: `content`
- Fields: `id, title, type, body, excerpt, county_id, author_id, status, created_at`

### Step 2: Copy County Module Structure
```javascript
const Content = {
  data: [],
  
  async init() {
    const page = document.getElementById('content-page');
    if (!page) return;
    page.innerHTML = '<div class="text-center py-10">Loading content...</div>';
    
    try {
      await this.loadData();
      this.render();
    } catch (err) {
      console.error('Content error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading content</div>';
    }
  },
  
  // ... rest of the methods
};
```

### Step 3: Implement loadData() Method
```javascript
async loadData() {
  try {
    const { data, error } = await supabaseClient
      .from('content')
      .select('*, counties(name), users(full_name)')  // Include related data
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    this.data = data || [];
  } catch (err) {
    console.error('Error loading content:', err);
    this.data = [];
  }
}
```

### Step 4: Implement render() Method
```javascript
render() {
  const page = document.getElementById('content-page');
  if (!page) return;
  
  page.innerHTML = `
    <div class="card mb-10">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-2xl font-extrabold text-gray-900">Content</h3>
          <p class="text-gray-500 mt-1">Manage platform content</p>
        </div>
        <button onclick="Content.openAddModal()" class="btn btn-primary">
          Add Content
        </button>
      </div>
      
      <!-- Filter section -->
      <div class="filter-bar">
        <!-- Add filters for: county, type, status -->
      </div>
      
      <!-- Table section -->
      <div class="overflow-x-auto">
        <table>
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="pb-4 font-semibold text-gray-500">Title</th>
              <th class="pb-4 font-semibold text-gray-500">Type</th>
              <th class="pb-4 font-semibold text-gray-500">County</th>
              <th class="pb-4 font-semibold text-gray-500">Status</th>
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
}
```

### Step 5: Implement renderTableRows() Method
```javascript
renderTableRows() {
  if (this.data.length === 0) {
    return '<tr><td colspan="5" class="py-8 text-center text-gray-500">No content found</td></tr>';
  }
  
  return this.data.map(item => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="py-5 font-semibold text-gray-900">${item.title}</td>
      <td class="py-5 text-gray-600">${item.type}</td>
      <td class="py-5 text-gray-600">${item.counties?.name || '-'}</td>
      <td class="py-5">${Helpers.getStatusBadge(item.status)}</td>
      <td class="py-5">
        <div class="flex gap-2">
          <button onclick="Content.openEditModal(${item.id}, '${Helpers.escapeHtml(item.title)}', '${item.type}')" 
            class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
            Edit
          </button>
          <button onclick="Content.deleteRecord(${item.id})" 
            class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}
```

### Step 6: Implement Modal Methods
```javascript
openAddModal() {
  const content = `
    <form onsubmit="Content.saveNew(event)">
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Title *</label>
        <input type="text" id="newContentTitle" required 
          class="border border-gray-300 px-3 py-2 rounded w-full">
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Type *</label>
        <select id="newContentType" required class="border border-gray-300 px-3 py-2 rounded w-full">
          <option value="">Select Type</option>
          <option value="story">Story</option>
          <option value="announcement">Announcement</option>
          <option value="article">Article</option>
        </select>
      </div>
      <!-- Add more fields -->
      <div class="flex gap-3">
        <button type="button" onclick="ModalManager.close('addContentModal')" 
          class="flex-1 btn btn-secondary">Cancel</button>
        <button type="submit" class="flex-1 btn btn-primary">Add Content</button>
      </div>
    </form>
  `;
  
  ModalManager.create('addContentModal', 'Add New Content', content);
}

openEditModal(id, title, type) {
  const content = `
    <form onsubmit="Content.saveEdit(event, ${id})">
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Title *</label>
        <input type="text" id="editContentTitle" value="${title}" required 
          class="border border-gray-300 px-3 py-2 rounded w-full">
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-2">Type *</label>
        <select id="editContentType" required class="border border-gray-300 px-3 py-2 rounded w-full">
          <option value="story" ${type === 'story' ? 'selected' : ''}>Story</option>
          <option value="announcement" ${type === 'announcement' ? 'selected' : ''}>Announcement</option>
          <option value="article" ${type === 'article' ? 'selected' : ''}>Article</option>
        </select>
      </div>
      <!-- Add more fields -->
      <div class="flex gap-3">
        <button type="button" onclick="ModalManager.close('editContentModal')" 
          class="flex-1 btn btn-secondary">Cancel</button>
        <button type="submit" class="flex-1 btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  
  ModalManager.create('editContentModal', 'Edit Content', content);
}
```

### Step 7: Implement CRUD Methods
```javascript
async saveNew(event) {
  event.preventDefault();
  
  const title = document.getElementById('newContentTitle').value.trim();
  const type = document.getElementById('newContentType').value;
  // Get other field values
  
  if (!title || !type) {
    Helpers.showError('Please fill in all required fields');
    return;
  }
  
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { error } = await supabaseClient
      .from('content')
      .insert([{
        title,
        type,
        author_id: user.id,
        // Add other fields
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    Helpers.showSuccess('Content added successfully!');
    ModalManager.close('addContentModal');
    await this.init();
  } catch (err) {
    Helpers.showError(err.message);
  }
}

async saveEdit(event, id) {
  event.preventDefault();
  
  const title = document.getElementById('editContentTitle').value.trim();
  const type = document.getElementById('editContentType').value;
  
  if (!title || !type) {
    Helpers.showError('Please fill in all required fields');
    return;
  }
  
  try {
    const { error } = await supabaseClient
      .from('content')
      .update({ title, type })
      .eq('id', id);
    
    if (error) throw error;
    
    Helpers.showSuccess('Content updated successfully!');
    ModalManager.close('editContentModal');
    await this.init();
  } catch (err) {
    Helpers.showError(err.message);
  }
}

async deleteRecord(id) {
  if (!Helpers.confirm('Are you sure you want to delete this content?')) {
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
```

## Quick Reference: Module Checklist

- [ ] Update module name
- [ ] Update page ID reference
- [ ] Update loading message
- [ ] Implement loadData() with correct table name
- [ ] Implement render() with appropriate UI
- [ ] Implement renderTableRows() with correct fields
- [ ] Implement openAddModal() with form fields
- [ ] Implement openEditModal() with form fields
- [ ] Implement saveNew() with correct insert statement
- [ ] Implement saveEdit() with correct update statement
- [ ] Implement deleteRecord() with correct delete statement
- [ ] Implement applyFilters() if needed
- [ ] Test all CRUD operations
- [ ] Add error handling

## Common Database Patterns

### Get with Related Data
```javascript
const { data } = await supabaseClient
  .from('events')
  .select('*, counties(name), users(full_name)')
  .order('event_date');
```

### Filter and Search
```javascript
let query = supabaseClient.from('content').select('*');

if (status) {
  query = query.eq('status', status);
}
if (county) {
  query = query.eq('county_id', county);
}

const { data } = await query;
```

### Get Current User
```javascript
const { data: { user } } = await supabaseClient.auth.getUser();
const userId = user.id;
```

## Testing Each Module

1. **Load Page** - Click menu item to load page
2. **Load Data** - Verify data loads and displays
3. **Add Item** - Click add button, fill form, save
4. **Edit Item** - Click edit button, modify, save
5. **Delete Item** - Click delete button, confirm
6. **Filter Data** - Use filters to find items
7. **Refresh** - Page should reload and show changes

## Additional Tips

1. **Reuse Helper Functions** - `Helpers.showSuccess()`, `Helpers.showError()`, etc.
2. **Use ModalManager** - For all modal operations
3. **Follow Naming** - Keep consistent naming for function IDs
4. **Add Comments** - Document complex logic
5. **Error Handling** - Always wrap async in try-catch
6. **Escape HTML** - Use `Helpers.escapeHtml()` for user input

---

**Complete any template module using this guide and the counties.js example!**
