let currentUserProfile = null;

const pageTemplates = {
  overview: () => `
    <section>
      <h2>Welcome, ${currentUserProfile?.full_name || 'Admin'}</h2>
      <p>Managing ${currentUserProfile?.county || 'Your'} County</p>
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
        <button onclick="navigateTo('content-review')" class="px-4 py-2 bg-white text-green-600 rounded-lg shadow hover:bg-gray-100 transition duration-200 text-sm">Review Content</button>
        <button onclick="navigateTo('leaders')" class="px-4 py-2 bg-white text-green-600 rounded-lg shadow hover:bg-gray-100 transition duration-200 text-sm">Add Leader</button>
        <button class="px-4 py-2 bg-white text-green-600 rounded-lg shadow hover:bg-gray-100 transition duration-200 text-sm">View County Page</button>
      </div>
    </section>
    <section>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div class="bg-white p-4 md:p-5 rounded-lg shadow-md border-l-4 border-blue-500"><div class="flex justify-between items-center mb-2"><h3 class="text-base md:text-lg font-semibold text-gray-700">Total Content</h3><svg class="h-5 w-5 md:h-6 md:w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg></div><p class="text-3xl md:text-4xl font-bold text-gray-900">250</p><p class="text-xs md:text-sm text-gray-500">+5% from last month</p></div>
        <div class="bg-white p-4 md:p-5 rounded-lg shadow-md border-l-4 border-orange-500"><div class="flex justify-between items-center mb-2"><h3 class="text-base md:text-lg font-semibold text-gray-700">Pending Review</h3><svg class="h-5 w-5 md:h-6 md:w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><p class="text-3xl md:text-4xl font-bold text-gray-900">12</p><p class="text-xs md:text-sm text-gray-500">-10% from last week</p></div>
        <div class="bg-white p-4 md:p-5 rounded-lg shadow-md border-l-4 border-green-500"><div class="flex justify-between items-center mb-2"><h3 class="text-base md:text-lg font-semibold text-gray-700">Published Content</h3><svg class="h-5 w-5 md:h-6 md:w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><p class="text-3xl md:text-4xl font-bold text-gray-900">200</p><p class="text-xs md:text-sm text-gray-500">+8% from last month</p></div>
      </div>
    </section>
  `,
  'content-review': () => `
    <section>
      <h2>Content Review</h2>
      <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="relative px-6 py-3"><span class="sr-only">Actions</span></th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><tr><td data-label="Title" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tourism Initiative Proposal</td><td data-label="Type" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Article</td><td data-label="Author" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mary Doe</td><td data-label="Status" class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Pending Review</span></td><td data-label="Actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="#" class="text-green-600 hover:text-green-900 mr-3">Approve</a><a href="#" class="text-red-600 hover:text-red-900">Reject</a></td></tr><tr><td data-label="Title" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Community Health Workshop Announcement</td><td data-label="Type" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Announcement</td><td data-label="Author" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Peter Smith</td><td data-label="Status" class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Pending Review</span></td><td data-label="Actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="#" class="text-green-600 hover:text-green-900 mr-3">Approve</a><a href="#" class="text-red-600 hover:text-red-900">Reject</a></td></tr></tbody></table></div>
    </section>
  `,
  leaders: () => `
    <section>
      <h2>Manage County Leaders</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"><div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm"><img src="https://via.placeholder.com/300x200" alt="Leader Photo" class="w-full h-48 object-cover"><div class="p-4"><h3 class="text-lg font-semibold text-gray-800">Hon. James K. Doe</h3><p class="text-sm text-gray-600">County Superintendent</p><p class="text-xs text-gray-500 mb-3">2020 - Present</p><div class="flex justify-between"><button class="text-blue-600 hover:underline text-sm font-medium">Edit</button><button class="text-red-600 hover:underline text-sm font-medium">Delete</button></div></div></div><div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm"><img src="https://via.placeholder.com/300x200" alt="Leader Photo" class="w-full h-48 object-cover"><div class="p-4"><h3 class="text-lg font-semibold text-gray-800">Madam Sarah L. Johnson</h3><p class="text-sm text-gray-600">Assistant Superintendent for Development</p><p class="text-xs text-gray-500 mb-3">2022 - Present</p><div class="flex justify-between"><button class="text-blue-600 hover:underline text-sm font-medium">Edit</button><button class="text-red-600 hover:underline text-sm font-medium">Delete</button></div></div></div></div>
    </section>
  `,
  contributors: () => `
    <section>
      <h2>Contributors</h2>
      <p class="text-gray-600">People who contribute content to the county page.</p>
      <div class="overflow-x-auto mt-4">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contributions</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr>
              <td data-label="Name" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mary Doe</td>
              <td data-label="Role" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Reporter</td>
              <td data-label="Contributions" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12 articles</td>
              <td data-label="Email" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">mary@example.com</td>
              <td data-label="Actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="#" class="text-blue-600 hover:text-blue-900 mr-3">View</a><a href="#" class="text-red-600 hover:text-red-900">Remove</a></td>
            </tr>
            <tr>
              <td data-label="Name" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Peter Smith</td>
              <td data-label="Role" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Contributor</td>
              <td data-label="Contributions" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5 posts</td>
              <td data-label="Email" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">peter@example.com</td>
              <td data-label="Actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="#" class="text-blue-600 hover:text-blue-900 mr-3">View</a><a href="#" class="text-red-600 hover:text-red-900">Remove</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  opportunities: () => `
    <section>
      <h2>Manage Opportunities</h2>
      <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th><th class="relative px-6 py-3"><span class="sr-only">Actions</span></th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><tr><td data-label="Title" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">County Scholarship Program</td><td data-label="Type" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Scholarship</td><td data-label="Status" class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Open</span></td><td data-label="Deadline" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-08-31</td><td data-label="Actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="#" class="text-blue-600 hover:text-blue-900 mr-3">Edit</a><a href="#" class="text-red-600 hover:text-red-900">Delete</a></td></tr></tbody></table></div>
    </section>
  `,
  events: () => `
    <section>
      <h2>Manage Events</h2>
      <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="relative px-6 py-3"><span class="sr-only">Actions</span></th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><tr><td data-label="Title" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">County Cultural Festival</td><td data-label="Date" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-07-10</td><td data-label="Location" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Main City Park</td><td data-label="Status" class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Upcoming</span></td><td data-label="Actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="#" class="text-blue-600 hover:text-blue-900 mr-3">Edit</a><a href="#" class="text-red-600 hover:text-red-900">Delete</a></td></tr></tbody></table></div>
    </section>
  `,
  analytics: () => `
    <section>
      <h2>County Analytics Overview</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"><div class="border border-gray-200 p-4 rounded-lg flex items-center justify-center h-64 bg-gray-50"><p class="text-gray-500">[Content Status Distribution Pie Chart]</p></div><div class="border border-gray-200 p-4 rounded-lg flex items-center justify-center h-64 bg-gray-50"><p class="text-gray-500">[Monthly Content Views Line Chart]</p></div></div>
    </section>
  `,
  media: () => `<section><h2>Media Library</h2><p class="text-gray-600">Media items will appear here.</p></section>`,
  settings: () => `<section><h2>Profile Settings</h2><p class="text-gray-600">This section is ready for profile and account settings.</p></section>`,
  'county-settings': () => `
    <section>
      <h2>County Settings</h2>
      <p class="text-gray-600">Manage the public information and administrative preferences for this county.</p>
      <form class="mt-4 grid gap-4 md:grid-cols-2">
        <label class="grid gap-2">
          <span class="font-semibold">County Name</span>
          <input type="text" value="Bong County" class="border border-gray-200 rounded-lg px-3 py-2">
        </label>
        <label class="grid gap-2">
          <span class="font-semibold">Official Contact</span>
          <input type="text" value="+231 77 000 0000" class="border border-gray-200 rounded-lg px-3 py-2">
        </label>
        <label class="grid gap-2">
          <span class="font-semibold">Website</span>
          <input type="url" value="https://county.gov.lr" class="border border-gray-200 rounded-lg px-3 py-2">
        </label>
        <label class="grid gap-2">
          <span class="font-semibold">Admin Email</span>
          <input type="email" value="admin@county.gov.lr" class="border border-gray-200 rounded-lg px-3 py-2">
        </label>
        <label class="grid gap-2 md:col-span-2">
          <span class="font-semibold">County Description</span>
          <textarea rows="4" class="border border-gray-200 rounded-lg px-3 py-2">Supporting civic updates, public services, and county-level development initiatives.</textarea>
        </label>
        <label class="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked>
          <span>Enable public county page visibility</span>
        </label>
        <div class="md:col-span-2 flex justify-end gap-3">
          <button type="button" class="secondary-btn">Cancel</button>
          <button type="submit" class="primary-btn">Save Changes</button>
        </div>
      </form>
    </section>
  `,
  help: () => `<section><h2>Help & Support</h2><p class="text-gray-600">Support contact and FAQs will appear here.</p></section>`
};

async function getAdminCountyId() {
  if (!window.supabaseClient) return null;

  const countyId = currentUserProfile?.county_id || null;
  if (countyId) return countyId;

  const countyKey = currentUserProfile?.county;
  if (!countyKey) return null;

  try {
    const client = window.supabaseClient;
    let { data, error } = await client
      .from('counties')
      .select('id')
      .eq('slug', countyKey)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      ({ data, error } = await client
        .from('counties')
        .select('id')
        .eq('name', countyKey)
        .maybeSingle());
      if (error) throw error;
    }
    return data?.id || null;
  } catch (error) {
    console.warn('Could not resolve admin county ID:', error);
    return null;
  }
}

async function fetchPendingSubmissions() {
  if (!window.supabaseClient) return { data: [], error: new Error('Supabase client unavailable') };

  const countyId = await getAdminCountyId();
  if (!countyId) {
    return { data: [], error: new Error('Your county assignment could not be verified. Contact an administrator.') };
  }

  let query = window.supabaseClient
    .from('content')
    .select('id,title,type,status,created_at,author:author_id(full_name)')
    .eq('status', 'pending_review')
    .eq('county_id', countyId)
    .order('created_at', { ascending: false });

  return query;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

const countyAdminCollections = {
  leaders: {
    title: 'County leaders',
    table: 'leaders',
    columns: [['name', 'Name'], ['role', 'Role'], ['era', 'Term'], ['category', 'Category'], ['is_published', 'Published']],
    select: 'name,role,era,category,is_published',
    order: 'display_order'
  },
  contributors: {
    title: 'County contributors',
    table: 'users',
    columns: [['full_name', 'Name'], ['role', 'Role'], ['verified', 'Verified'], ['created_at', 'Joined']],
    select: 'full_name,role,verified,created_at',
    order: 'created_at',
    role: 'contributor'
  },
  opportunities: {
    title: 'County opportunities',
    table: 'opportunities',
    columns: [['title', 'Title'], ['type', 'Type'], ['status', 'Status'], ['deadline', 'Deadline'], ['is_published', 'Published']],
    select: 'title,type,status,deadline,is_published',
    order: 'created_at'
  },
  events: {
    title: 'County events',
    table: 'events',
    columns: [['title', 'Title'], ['event_date', 'Date'], ['location', 'Location'], ['status', 'Status'], ['is_published', 'Published']],
    select: 'title,event_date,location,status,is_published',
    order: 'event_date'
  },
  media: {
    title: 'County media',
    table: 'content',
    columns: [['title', 'Content'], ['type', 'Type'], ['cover_image_url', 'Image'], ['created_at', 'Added']],
    select: 'title,type,cover_image_url,created_at',
    order: 'created_at',
    notNull: 'cover_image_url'
  }
};

function formatCountyAdminValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
  return String(value);
}

async function renderCountyCollectionPage(pageName) {
  const mainContent = document.getElementById('main-content');
  const config = countyAdminCollections[pageName];
  if (!mainContent || !config) return;
  mainContent.innerHTML = `<section><h2>${config.title}</h2><p role="status" class="mt-4 text-gray-600">Loading county records…</p></section>`;

  const countyId = await getAdminCountyId();
  if (!countyId) {
    mainContent.innerHTML = `<section><h2>${config.title}</h2><p role="alert" class="mt-4 text-red-700">Your county assignment could not be verified. Contact an administrator.</p></section>`;
    return;
  }

  let query = window.supabaseClient
    .from(config.table)
    .select(config.select)
    .eq('county_id', countyId)
    .order(config.order, { ascending: pageName === 'leaders' || pageName === 'events' })
    .limit(100);
  if (config.role) query = query.eq('role', config.role);
  if (config.notNull) query = query.not(config.notNull, 'is', null);

  const { data, error } = await query;
  if (error) {
    console.error(`Failed to load ${config.title.toLowerCase()}:`, error);
    mainContent.innerHTML = `<section><h2>${config.title}</h2><p role="alert" class="mt-4 text-red-700">County records could not be loaded. Check your access and try again.</p></section>`;
    return;
  }

  if (!data?.length) {
    mainContent.innerHTML = `<section><h2>${config.title}</h2><p class="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-gray-600">No ${config.title.toLowerCase()} are available for this county yet.</p></section>`;
    return;
  }

  const headers = config.columns.map(([, label]) => `<th scope="col" class="px-4 py-3 text-left text-sm font-semibold text-gray-700">${escapeHtml(label)}</th>`).join('');
  const rows = data.map(record => `<tr>${config.columns.map(([field]) => `<td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(formatCountyAdminValue(record[field]))}</td>`).join('')}</tr>`).join('');
  mainContent.innerHTML = `
    <section>
      <h2>${config.title}</h2>
      <p class="mt-1 text-sm text-gray-600">Showing up to 100 records assigned to your county.</p>
      <div class="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50"><tr>${headers}</tr></thead>
          <tbody class="divide-y divide-gray-200">${rows}</tbody>
        </table>
      </div>
    </section>
  `;
  applyResponsiveTableLabels(mainContent);
  enableTableSorting(mainContent);
}

async function renderCountySettingsPage() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  mainContent.innerHTML = '<section><h2>County settings</h2><p role="status" class="mt-4 text-gray-600">Loading county profile…</p></section>';
  const countyId = await getAdminCountyId();
  if (!countyId) {
    mainContent.innerHTML = '<section><h2>County settings</h2><p role="alert" class="mt-4 text-red-700">Your county assignment could not be verified. Contact an administrator.</p></section>';
    return;
  }
  const { data, error } = await window.supabaseClient
    .from('counties')
    .select('name,slug,region,capital,tagline,description,status')
    .eq('id', countyId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error('Failed to load county profile:', error);
    mainContent.innerHTML = '<section><h2>County settings</h2><p role="alert" class="mt-4 text-red-700">County profile information could not be loaded.</p></section>';
    return;
  }
  const fields = [['name', 'County'], ['slug', 'URL slug'], ['region', 'Region'], ['capital', 'Capital'], ['tagline', 'Tagline'], ['description', 'Description'], ['status', 'Page status']];
  mainContent.innerHTML = `<section><h2>County profile</h2><dl class="mt-4 grid gap-4 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-2">${fields.map(([field, label]) => `<div><dt class="text-sm font-semibold text-gray-600">${label}</dt><dd data-county-profile="${field}" class="mt-1 whitespace-pre-wrap text-gray-900"></dd></div>`).join('')}</dl><p class="mt-3 text-sm text-gray-600">Profile editing is managed by a platform administrator.</p></section>`;
  fields.forEach(([field]) => {
    mainContent.querySelector(`[data-county-profile="${field}"]`).textContent = data[field] || '—';
  });
}

async function renderCountyAnalyticsPage() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  mainContent.innerHTML = '<section><h2>County analytics</h2><p role="status" class="mt-4 text-gray-600">Loading content statistics…</p></section>';
  const countyId = await getAdminCountyId();
  if (!countyId) {
    mainContent.innerHTML = '<section><h2>County analytics</h2><p role="alert" class="mt-4 text-red-700">Your county assignment could not be verified. Contact an administrator.</p></section>';
    return;
  }
  const count = status => {
    let query = window.supabaseClient.from('content').select('id', { count: 'exact', head: true }).eq('county_id', countyId);
    if (status) query = query.eq('status', status);
    return query;
  };
  const [total, pending, published, rejected] = await Promise.all([
    count(), count('pending_review'), count('published'), count('rejected')
  ]);
  const stats = [['Total content', total], ['Pending review', pending], ['Published', published], ['Rejected', rejected]];
  mainContent.innerHTML = `<section><h2>County analytics</h2><p class="mt-1 text-sm text-gray-600">Current content totals for your county.</p><div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${stats.map(([label]) => `<article class="rounded-lg border border-gray-200 bg-white p-5"><h3 class="text-sm font-medium text-gray-600">${label}</h3><p class="mt-2 text-3xl font-bold" data-analytics="${label}">Unavailable</p></article>`).join('')}</div></section>`;
  stats.forEach(([label, result]) => {
    const metric = mainContent.querySelector(`[data-analytics="${label}"]`);
    if (result.error) {
      console.error(`Failed to load ${label.toLowerCase()} analytics:`, result.error);
      return;
    }
    metric.textContent = String(result.count ?? 0);
  });
}

function renderCountyAdminAccount() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  const user = window.authGuard?.currentUser;
  mainContent.innerHTML = '<section><h2>Account settings</h2><dl class="mt-4 grid gap-4 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-2"><div><dt class="text-sm font-semibold text-gray-600">Name</dt><dd data-account-name class="mt-1 text-gray-900"></dd></div><div><dt class="text-sm font-semibold text-gray-600">Email</dt><dd data-account-email class="mt-1 break-all text-gray-900"></dd></div><div><dt class="text-sm font-semibold text-gray-600">Role</dt><dd data-account-role class="mt-1 text-gray-900"></dd></div></dl><p class="mt-3 text-sm text-gray-600">For account changes, use the account settings page.</p><a class="mt-3 inline-block text-green-800 underline" href="../profile-page/profile.html">Open account profile</a></section>';
  mainContent.querySelector('[data-account-name]').textContent = currentUserProfile?.full_name || '—';
  mainContent.querySelector('[data-account-email]').textContent = currentUserProfile?.email || user?.email || '—';
  mainContent.querySelector('[data-account-role]').textContent = currentUserProfile?.role || 'County administrator';
}

async function renderCountyAdminOverview() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  mainContent.innerHTML = '<section><h2>County overview</h2><p role="status" class="mt-4 text-gray-600">Loading county statistics…</p></section>';

  const countyId = await getAdminCountyId();
  if (!countyId) {
    mainContent.innerHTML = '<section><h2>County overview</h2><p role="alert" class="mt-4 text-red-700">Your county assignment could not be verified. Contact an administrator.</p></section>';
    return;
  }

  const client = window.supabaseClient;
  const countQuery = (table, column, value) => {
    let query = client.from(table).select('id', { count: 'exact', head: true }).eq('county_id', countyId);
    if (column) query = query.eq(column, value);
    return query;
  };
  const [total, pending, published, contributors] = await Promise.all([
    countQuery('content'),
    countQuery('content', 'status', 'pending_review'),
    countQuery('content', 'status', 'published'),
    countQuery('users', 'role', 'contributor')
  ]);
  const results = [total, pending, published, contributors];
  const labels = ['Total content', 'Pending review', 'Published content', 'County contributors'];

  mainContent.innerHTML = `
    <section>
      <h2>Welcome, <span id="county-admin-welcome"></span></h2>
      <p class="text-gray-600 mt-1">County overview</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
        ${labels.map((label, index) => `
          <article class="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <h3 class="text-sm font-medium text-gray-600">${label}</h3>
            <p class="mt-2 text-3xl font-bold text-gray-900" data-county-metric="${index}">Unavailable</p>
          </article>
        `).join('')}
      </div>
      <button type="button" data-open-content-review class="mt-6 rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800">Review pending content</button>
    </section>
  `;
  mainContent.querySelector('#county-admin-welcome').textContent = currentUserProfile?.full_name || 'Admin';
  results.forEach((result, index) => {
    const metric = mainContent.querySelector(`[data-county-metric="${index}"]`);
    if (result.error) {
      console.error(`Failed to load ${labels[index].toLowerCase()} metric:`, result.error);
      metric.setAttribute('aria-label', `${labels[index]} unavailable`);
      return;
    }
    metric.textContent = String(result.count ?? 0);
  });
  if (results.some(result => result.error)) {
    const notice = document.createElement('p');
    notice.className = 'mt-4 text-amber-800';
    notice.setAttribute('role', 'status');
    notice.textContent = 'Some statistics could not be loaded. Please try again later.';
    mainContent.querySelector('section').appendChild(notice);
  }
  mainContent.querySelector('[data-open-content-review]').addEventListener('click', () => navigateTo('content-review'));
}

async function renderContentReviewPage() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <section>
      <h2>Content Review</h2>
      <div class="mt-4 text-gray-500">Loading pending submissions…</div>
    </section>
  `;

  let data;
  let error;
  try {
    ({ data, error } = await fetchPendingSubmissions());
  } catch (caughtError) {
    console.error('Failed to load pending submissions:', caughtError);
    error = caughtError;
  }
  if (error) {
    console.error('Failed to load pending submissions:', error);
    mainContent.innerHTML = '<section><h2>Content Review</h2><p role="alert" class="text-red-600 mt-4">Pending submissions could not be loaded. Verify your county assignment and try again.</p></section>';
    return;
  }

  if (!data || data.length === 0) {
    mainContent.innerHTML = `
      <section>
        <h2>Content Review</h2>
        <div class="mt-4 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <p class="text-gray-600">There are no pending submissions for review right now.</p>
        </div>
      </section>
    `;
    return;
  }

  const rows = data.map(item => {
    const authorName = item.author?.full_name || 'County contributor';
    const createdAt = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown';
    const itemType = item.type || 'Story';
    return `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHtml(item.title || 'Untitled')}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(itemType)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(authorName)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(createdAt)}</td>
        <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Pending Review</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button type="button" data-review-action="approve" data-content-id="${escapeHtml(item.id)}" class="text-green-600 hover:text-green-900 mr-3">Approve</button>
          <button type="button" data-review-action="reject" data-content-id="${escapeHtml(item.id)}" class="text-red-600 hover:text-red-900">Reject</button>
        </td>
      </tr>
    `;
  }).join('');

  mainContent.innerHTML = `
    <section>
      <h2>Content Review</h2>
      <div class="overflow-x-auto mt-4">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;

  applyResponsiveTableLabels(mainContent);
  enableTableSorting(mainContent);
  mainContent.querySelectorAll('[data-review-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.reviewAction;
      if (action === 'approve') approveContent(button.dataset.contentId);
      if (action === 'reject') rejectContent(button.dataset.contentId);
    });
  });
}

function applyResponsiveTableLabels(root) {
  root.querySelectorAll('table').forEach(table => {
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach(row => {
      Array.from(row.children).forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  });
}

/* Enable clickable sorting for any tables inside the provided root element. */
function enableTableSorting(root) {
  root.querySelectorAll('table').forEach(table => {
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    // Clear previous handlers to avoid duplicates
    thead.querySelectorAll('th').forEach((th, colIndex) => {
      th.style.cursor = 'pointer';
      th.removeEventListener('click', th._sortHandler);
      const handler = () => {
        const currentDir = th.getAttribute('data-sort-dir') || 'none';
        const newDir = currentDir === 'asc' ? 'desc' : 'asc';
        // reset other headers
        thead.querySelectorAll('th').forEach(h => h.removeAttribute('data-sort-dir'));
        th.setAttribute('data-sort-dir', newDir);

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});

        rows.sort((a, b) => {
          const aCell = a.children[colIndex];
          const bCell = b.children[colIndex];
          const aText = (aCell && aCell.textContent || '').trim();
          const bText = (bCell && bCell.textContent || '').trim();
          return collator.compare(aText, bText) * (newDir === 'asc' ? 1 : -1);
        });

        // reattach rows in sorted order
        rows.forEach(r => tbody.appendChild(r));
      };
      th._sortHandler = handler;
      th.addEventListener('click', handler);
    });
  });
}

function toggleSidebar(force) {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !overlay) return;
  const shouldOpen = typeof force === 'boolean' ? force : !sidebar.classList.contains('active');
  sidebar.classList.toggle('active', shouldOpen);
  overlay.classList.toggle('active', shouldOpen);
  document.body.classList.toggle('no-scroll', shouldOpen && window.innerWidth < 1024);
}

function handleNavClick(event) {
  const link = event.target.closest('.nav-item');
  if (!link) return;
  event.preventDefault();
  const page = link.getAttribute('data-page');
  if (page === 'logout') {
    handleLogout();
    return;
  }
  navigateTo(page);
  if (window.innerWidth < 1024) {
    toggleSidebar(false);
  }
}

function openModal() {
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.add('active');
    document.body.classList.add('no-scroll');
    modalBackdrop.querySelector('input')?.focus();
  }
}

function closeModal() {
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
    document.body.classList.remove('no-scroll');
    document.getElementById('open-add-modal')?.focus();
  }
}

function handleSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  const sections = mainContent.querySelectorAll('section');
  sections.forEach(section => {
    const text = section.textContent.toLowerCase();
    section.style.display = text.includes(query) ? '' : 'none';
  });
}

function navigateTo(pageName) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  const openAddModalBtn = document.getElementById('open-add-modal');
  if (openAddModalBtn) openAddModalBtn.hidden = pageName !== 'opportunities';
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-page') === pageName);
  });
  if (pageName === 'overview') {
    renderCountyAdminOverview();
    mainContent.scrollTop = 0;
    return;
  }
  if (pageName === 'content-review') {
    renderContentReviewPage();
    mainContent.scrollTop = 0;
    return;
  }
  if (countyAdminCollections[pageName]) {
    renderCountyCollectionPage(pageName);
    mainContent.scrollTop = 0;
    return;
  }
  if (pageName === 'analytics') {
    renderCountyAnalyticsPage();
    mainContent.scrollTop = 0;
    return;
  }
  if (pageName === 'county-settings') {
    renderCountySettingsPage();
    mainContent.scrollTop = 0;
    return;
  }
  if (pageName === 'settings') {
    renderCountyAdminAccount();
    mainContent.scrollTop = 0;
    return;
  }
  const template = pageTemplates[pageName];
  if (!template) {
    mainContent.innerHTML = '<section><h2>Page not found</h2></section>';
    return;
  }
  mainContent.innerHTML = template();
  applyResponsiveTableLabels(mainContent);
  enableTableSorting(mainContent);
  mainContent.scrollTop = 0;
}

function handleLogout() {
  if (window.authGuard && typeof window.authGuard.logout === 'function') {
    window.authGuard.logout();
  } else {
    window.location.href = '../auth-page/auth.html';
  }
}

async function syncDashboardProfile() {
  const authGuard = window.authGuard;

  if (authGuard && typeof authGuard.init === 'function') {
    try {
      await authGuard.init();
    } catch (error) {
      console.error('Failed to initialize auth guard:', error);
    }
  }

  const profile = authGuard?.userProfile || null;
  const user = authGuard?.currentUser || null;
  const fallbackName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Admin';
  const fallbackCounty = profile?.county || user?.user_metadata?.county || 'County Admin';

  currentUserProfile = profile || {
    full_name: fallbackName,
    county: fallbackCounty
  };

  const headerUserName = document.getElementById('header-user-name');
  const headerUserCounty = document.getElementById('header-user-county');
  if (headerUserName) headerUserName.textContent = currentUserProfile?.full_name || 'Admin';
  if (headerUserCounty) headerUserCounty.textContent = currentUserProfile?.county || 'County Admin';

  const activePage = document.querySelector('.nav-item.active')?.getAttribute('data-page') || 'overview';
  navigateTo(activePage);
}

document.addEventListener('DOMContentLoaded', function () {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');
  const openAddModalBtn = document.getElementById('open-add-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelModalBtn = document.getElementById('cancel-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const opportunityForm = document.getElementById('opportunity-form');
  const searchInput = document.getElementById('dashboard-search');

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => toggleSidebar());
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', () => toggleSidebar(false));
  if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));
  document.addEventListener('click', handleNavClick);

  if (openAddModalBtn) openAddModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', event => {
    if (event.target === modalBackdrop) closeModal();
  });

  if (opportunityForm) {
    opportunityForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const formData = new FormData(opportunityForm);
      const status = document.getElementById('opportunity-form-status');
      const saveButton = opportunityForm.querySelector('[type="submit"]');
      const currentUser = window.authGuard?.currentUser;
      const countyId = await getAdminCountyId();
      const title = formData.get('title')?.toString().trim();
      const description = formData.get('description')?.toString().trim();
      if (!title || !description || !countyId || !currentUser?.id) {
        status.textContent = 'Opportunity details or county authorization are unavailable.';
        return;
      }

      saveButton.disabled = true;
      status.textContent = 'Saving opportunity…';
      try {
        const { error } = await window.supabaseClient
          .from('opportunities')
          .insert({
            county_id: countyId,
            author_id: currentUser.id,
            title,
            description,
            type: formData.get('type'),
            deadline: formData.get('deadline') || null,
            status: formData.get('status'),
            is_published: false
          });
        if (error) throw error;
        opportunityForm.reset();
        status.textContent = '';
        closeModal();
        await renderCountyCollectionPage('opportunities');
      } catch (error) {
        console.error('Failed to save county opportunity:', error);
        status.textContent = 'The opportunity could not be saved. Check your access and try again.';
      } finally {
        saveButton.disabled = false;
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', handleSearch);

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar(false);
    }
  });

  syncDashboardProfile();
});

window.navigateTo = navigateTo;
window.dashboardApp = { navigateTo, getCurrentUser: () => currentUserProfile };
