/**
 * Dashboard Module
 * Displays overview statistics and key metrics
 */

const Dashboard = {
  /**
   * Initialize dashboard
   */
  async init() {
    const page = document.getElementById('overview-page');
    if (!page) return;

    // Show loading state
    page.innerHTML = '<div class="text-center py-10">Loading dashboard...</div>';

    try {
      await this.loadStats();
      this.render();
    } catch (err) {
      console.error('Dashboard error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading dashboard</div>';
    }
  },

  /**
   * Load statistics from database
   */
  async loadStats() {
    try {
      const [counties, content, users, tourism] = await Promise.all([
        supabaseClient.from('counties').select('*', { count: 'exact', head: true }),
        supabaseClient.from('content').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabaseClient.from('users').select('*', { count: 'exact', head: true }),
        supabaseClient.from('tourism_sites').select('*', { count: 'exact', head: true })
      ]);

      this.stats = {
        totalCounties: counties.count || 0,
        publishedContent: content.count || 0,
        registeredUsers: users.count || 0,
        tourismSites: tourism.count || 0
      };
    } catch (err) {
      console.error('Error loading stats:', err);
      this.stats = {
        totalCounties: 0,
        publishedContent: 0,
        registeredUsers: 0,
        tourismSites: 0
      };
    }
  },

  /**
   * Render dashboard view
   */
  render() {
    const page = document.getElementById('overview-page');
    if (!page) return;

    page.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <div class="stat-card">
          <h2>Total Counties</h2>
          <div class="value text-blue-600">${this.stats.totalCounties}</div>
        </div>

        <div class="stat-card">
          <h2>Published Content</h2>
          <div class="value text-green-600">${this.stats.publishedContent}</div>
        </div>

        <div class="stat-card">
          <h2>Registered Users</h2>
          <div class="value text-purple-600">${this.stats.registeredUsers}</div>
        </div>

        <div class="stat-card">
          <h2>Tourism Sites</h2>
          <div class="value text-orange-600">${this.stats.tourismSites}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Welcome to Super Admin Dashboard</h3>
        <p class="text-gray-600 mb-4">
          Use the navigation sidebar to manage counties, content, tourism sites, events, opportunities, users, and more.
        </p>
        <p class="text-gray-500 text-sm">
          Last updated: ${Helpers.formatDateTime(new Date().toISOString())}
        </p>
      </div>
    `;
  }
};
