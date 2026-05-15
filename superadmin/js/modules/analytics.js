/**
 * Analytics Module
 * Displays platform analytics and statistics
 */

const Analytics = {
  data: {
    totalViews: 0,
    contentViews: 0,
    opportunityViews: 0,
    searches: 0,
    topCounties: [],
    viewsByCounty: {}
  },

  async init() {
    const page = document.getElementById('analytics-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading analytics...</div>';

    try {
      await this.loadAnalytics();
      this.render();
    } catch (err) {
      console.error('Analytics error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading analytics</div>';
    }
  },

  async loadAnalytics() {
    try {
      const { data, error } = await supabaseClient
        .from('analytics')
        .select('*, counties(name)');

      if (error) throw error;

      // Process analytics data
      const analytics = data || [];
      this.data.totalViews = analytics.length;
      this.data.contentViews = analytics.filter(a => a.event_type === 'content_view').length;
      this.data.opportunityViews = analytics.filter(a => a.event_type === 'opportunity_view').length;
      this.data.searches = analytics.filter(a => a.event_type === 'search').length;

      // Group by county
      const countyMap = {};
      analytics.forEach(a => {
        const countyName = a.counties?.name || 'Unknown';
        countyMap[countyName] = (countyMap[countyName] || 0) + 1;
      });

      // Sort and get top counties
      this.data.topCounties = Object.entries(countyMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      this.data.viewsByCounty = countyMap;

    } catch (err) {
      console.error('Error loading analytics:', err);
      this.data = {
        totalViews: 0,
        contentViews: 0,
        opportunityViews: 0,
        searches: 0,
        topCounties: [],
        viewsByCounty: {}
      };
    }
  },

  render() {
    const page = document.getElementById('analytics-page');
    if (!page) return;

    page.innerHTML = `
      <div class="space-y-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Total Views</p>
                <p class="text-4xl font-bold text-gray-900">${this.data.totalViews}</p>
              </div>
              <div class="text-5xl opacity-10">📊</div>
            </div>
          </div>
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Content Views</p>
                <p class="text-4xl font-bold text-gray-900">${this.data.contentViews}</p>
              </div>
              <div class="text-5xl opacity-10">📰</div>
            </div>
          </div>
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Opportunity Views</p>
                <p class="text-4xl font-bold text-gray-900">${this.data.opportunityViews}</p>
              </div>
              <div class="text-5xl opacity-10">🎯</div>
            </div>
          </div>
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">Searches</p>
                <p class="text-4xl font-bold text-gray-900">${this.data.searches}</p>
              </div>
              <div class="text-5xl opacity-10">🔍</div>
            </div>
          </div>
        </div>

        <!-- Top Counties -->
        <div class="card">
          <h3 class="text-xl font-bold text-gray-900 mb-6">Top Counties by Views</h3>
          <div class="space-y-4">
            ${this.data.topCounties.length > 0
              ? this.data.topCounties.map(([county, views], index) => {
                const percentage = Math.round((views / this.data.totalViews) * 100);
                return `
                  <div>
                    <div class="flex justify-between mb-2">
                      <span class="font-semibold text-gray-700">${index + 1}. ${county}</span>
                      <span class="text-gray-500">${views} views (${percentage}%)</span>
                    </div>
                    <div class="bg-gray-200 rounded-full h-2">
                      <div class="bg-red-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                  </div>
                `;
              }).join('')
              : '<p class="text-gray-500 py-8 text-center">No analytics data available</p>'
            }
          </div>
        </div>

        <!-- View Distribution -->
        <div class="card">
          <h3 class="text-xl font-bold text-gray-900 mb-6">View Distribution</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p class="text-3xl font-bold text-red-600">${Math.round((this.data.contentViews / Math.max(this.data.totalViews, 1)) * 100)}%</p>
              <p class="text-gray-600 text-sm mt-2">Content</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-green-600">${Math.round((this.data.opportunityViews / Math.max(this.data.totalViews, 1)) * 100)}%</p>
              <p class="text-gray-600 text-sm mt-2">Opportunities</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-blue-600">${Math.round((this.data.searches / Math.max(this.data.totalViews, 1)) * 100)}%</p>
              <p class="text-gray-600 text-sm mt-2">Searches</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-purple-600">${Math.round(((this.data.totalViews - this.data.contentViews - this.data.opportunityViews - this.data.searches) / Math.max(this.data.totalViews, 1)) * 100)}%</p>
              <p class="text-gray-600 text-sm mt-2">Other</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
