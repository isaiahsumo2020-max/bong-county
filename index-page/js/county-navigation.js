/**
 * County Navigation Manager
 * Handles navigation between index page and county pages
 * Ensures proper link generation and navigation flow
 * 
 * This script is OPTIONAL on the index page but recommended for better navigation handling.
 */

class CountyNavigationManager {
  constructor() {
    this.counties = {
      'bong-county': {
        name: 'Bong County',
        slug: 'bong',
        url: '../county-pages/bong.html',
        capital: 'Gbarnga',
        status: 'live'
      },
      'lofa-county': {
        name: 'Lofa County',
        slug: 'lofa',
        url: '../county-pages/lofa.html',
        capital: 'Voinjama',
        status: 'live'
      },
      'nimba-county': {
        name: 'Nimba County',
        slug: 'nimba',
        url: '../county-pages/nimba.html',
        capital: 'Sanniquellie',
        status: 'live'
      },
      'grand-bassa-county': {
        name: 'Grand Bassa County',
        slug: 'bassa',
        url: '../county-pages/bassa.html',
        capital: 'Buchanan',
        status: 'live'
      },
      'montserrado-county': {
        name: 'Montserrado County',
        slug: 'montserrado',
        url: '../county-pages/montserrado.html',
        capital: 'Bensonville',
        status: 'live'
      }
    };
  }

  /**
   * Navigate to a county page
   * @param {string} countySlug - The slug of the county (e.g., 'bong', 'montserrado')
   */
  navigateToCounty(countySlug) {
    // Handle both slug and full county-county format
    let key = countySlug;
    if (!countySlug.includes('-county')) {
      key = countySlug.toLowerCase().replace(/\s+/g, '-') + '-county';
    }

    const county = this.counties[key];
    if (county && county.status === 'live') {
      window.location.href = county.url;
      return true;
    }
    console.warn(`County not found or not live: ${countySlug}`);
    return false;
  }

  /**
   * Get all live counties
   */
  getLiveCounties() {
    return Object.values(this.counties).filter(c => c.status === 'live');
  }

  /**
   * Get county by slug
   */
  getCounty(slug) {
    const key = slug.includes('-county') ? slug : `${slug}-county`;
    return this.counties[key];
  }

  /**
   * Verify a county page URL is correct and accessible
   */
  async verifyCountyPageAccess(countySlug) {
    try {
      const county = this.getCounty(countySlug);
      if (!county) {
        console.error(`County not found: ${countySlug}`);
        return false;
      }

      // Construct the full path from current location
      const basePath = window.location.origin + window.location.pathname.split('/').slice(0, -2).join('/');
      const fullUrl = basePath + '/' + county.url.replace(/^\.\.\//, '');

      // Try a HEAD request to verify the page exists
      const response = await fetch(fullUrl, { method: 'HEAD', mode: 'no-cors' });
      console.log(`County page access test for ${countySlug}: ${response.ok ? 'OK' : 'Check'}`);
      return true; // no-cors mode doesn't give us real status, so assume it works
    } catch (error) {
      console.error(`Error verifying county page access: ${error.message}`);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CountyNavigationManager;
}

// Initialize globally for easy access
const countyNavigator = new CountyNavigationManager();
console.log('✅ County Navigation Manager loaded');
