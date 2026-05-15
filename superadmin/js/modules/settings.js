/**
 * Settings Module
 * Handles platform settings and configuration
 */

const Settings = {
  data: null,

  async init() {
    const page = document.getElementById('settings-page');
    if (!page) return;

    page.innerHTML = '<div class="text-center py-10">Loading settings...</div>';

    try {
      await this.loadSettings();
      this.render();
    } catch (err) {
      console.error('Settings error:', err);
      page.innerHTML = '<div class="text-red-600">Error loading settings</div>';
    }
  },

  async loadSettings() {
    try {
      // For now, we'll create default settings if they don't exist
      const { data, error } = await supabaseClient
        .from('county_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      this.data = data || {
        website_title: 'County Portal',
        meta_description: 'County information portal',
        contact_email: '',
        contact_phone: '',
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        hero_title: 'Welcome',
        hero_subtitle: 'Discover county information'
      };
    } catch (err) {
      console.error('Error loading settings:', err);
      this.data = {
        website_title: 'County Portal',
        meta_description: 'County information portal',
        contact_email: '',
        contact_phone: '',
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        hero_title: 'Welcome',
        hero_subtitle: 'Discover county information'
      };
    }
  },

  render() {
    const page = document.getElementById('settings-page');
    if (!page) return;

    page.innerHTML = `
      <div class="card mb-10">
        <div class="mb-8">
          <h3 class="text-2xl font-extrabold text-gray-900">Platform Settings</h3>
          <p class="text-gray-500 mt-1">Manage platform configuration and metadata</p>
        </div>

        <form onsubmit="Settings.saveSettings(event)" class="space-y-6">
          <!-- Website Settings Section -->
          <div class="border-b border-gray-200 pb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Website Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Website Title</label>
                <input type="text" id="settingTitle" value="${Helpers.escapeHtml(this.data.website_title || '')}" 
                  placeholder="Enter website title"
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Meta Description</label>
                <input type="text" id="settingDescription" value="${Helpers.escapeHtml(this.data.meta_description || '')}" 
                  placeholder="Enter meta description"
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
            </div>
          </div>

          <!-- Contact Settings Section -->
          <div class="border-b border-gray-200 pb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Contact Email</label>
                <input type="email" id="settingEmail" value="${Helpers.escapeHtml(this.data.contact_email || '')}" 
                  placeholder="Enter contact email"
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Contact Phone</label>
                <input type="tel" id="settingPhone" value="${Helpers.escapeHtml(this.data.contact_phone || '')}" 
                  placeholder="Enter contact phone"
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
            </div>
          </div>

          <!-- Social Media Section -->
          <div class="border-b border-gray-200 pb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h4>
            <div class="space-y-4">
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Facebook URL</label>
                <input type="url" id="settingFacebook" value="${Helpers.escapeHtml(this.data.facebook_url || '')}" 
                  placeholder="https://facebook.com/..."
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Twitter URL</label>
                <input type="url" id="settingTwitter" value="${Helpers.escapeHtml(this.data.twitter_url || '')}" 
                  placeholder="https://twitter.com/..."
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Instagram URL</label>
                <input type="url" id="settingInstagram" value="${Helpers.escapeHtml(this.data.instagram_url || '')}" 
                  placeholder="https://instagram.com/..."
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
            </div>
          </div>

          <!-- Hero Section -->
          <div class="pb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Hero Section</h4>
            <div class="space-y-4">
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Hero Title</label>
                <input type="text" id="settingHeroTitle" value="${Helpers.escapeHtml(this.data.hero_title || '')}" 
                  placeholder="Enter hero title"
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Hero Subtitle</label>
                <input type="text" id="settingHeroSubtitle" value="${Helpers.escapeHtml(this.data.hero_subtitle || '')}" 
                  placeholder="Enter hero subtitle"
                  class="border border-gray-300 px-3 py-2 rounded w-full">
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button type="submit" class="flex-1 btn btn-primary">Save Settings</button>
            <button type="button" onclick="Settings.loadSettings(); Settings.render();" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    `;
  },

  async saveSettings(event) {
    event.preventDefault();

    const settings = {
      website_title: document.getElementById('settingTitle').value.trim(),
      meta_description: document.getElementById('settingDescription').value.trim(),
      contact_email: document.getElementById('settingEmail').value.trim(),
      contact_phone: document.getElementById('settingPhone').value.trim(),
      facebook_url: document.getElementById('settingFacebook').value.trim(),
      twitter_url: document.getElementById('settingTwitter').value.trim(),
      instagram_url: document.getElementById('settingInstagram').value.trim(),
      hero_title: document.getElementById('settingHeroTitle').value.trim(),
      hero_subtitle: document.getElementById('settingHeroSubtitle').value.trim()
    };

    try {
      if (this.data?.id) {
        // Update existing settings
        const { error } = await supabaseClient
          .from('county_settings')
          .update(settings)
          .eq('id', this.data.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabaseClient
          .from('county_settings')
          .insert([settings]);

        if (error) throw error;
      }

      Helpers.showSuccess('Settings saved successfully!');
      await this.init();
    } catch (err) {
      Helpers.showError(err.message);
    }
  }
};
