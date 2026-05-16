/**
 * COUNTY NAVIGATION SYSTEM
 * 
 * Manages navigation to public county pages
 * Ensures county pages are accessible to all users (visitors + authenticated)
 */

class CountyNavigator {
  constructor() {
    this.counties = {
      'montserrado': {
        name: 'Montserrado County',
        url: '../county-pages/montserrado.html',
        description: 'Capital County'
      },
      'bong': {
        name: 'Bong County',
        url: '../county-pages/bong.html',
        description: 'Mining County'
      },
      'nimba': {
        name: 'Nimba County',
        url: '../county-pages/nimba.html',
        description: 'Eastern County'
      },
      'lofa': {
        name: 'Lofa County',
        url: '../county-pages/lofa.html',
        description: 'Northern County'
      },
      'bassa': {
        name: 'Bassa County',
        url: '../county-pages/bassa.html',
        description: 'Coastal County'
      },
      'margibi': {
        name: 'Margibi County',
        url: '../county-pages/margibi.html',
        description: 'Eastern County'
      },
    };
  }

  /**
   * Navigate to county page
   * @param {string} countyName - Name or key of county
   */
  navigate(countyName) {
    const county = this.counties[countyName.toLowerCase()];
    if (!county) {
      console.error(`County not found: ${countyName}`);
      return false;
    }
    
    console.log(`Navigating to ${county.name}...`);
    window.location.href = county.url;
    return true;
  }

  /**
   * Get all counties
   * @returns {object} All county data
   */
  getCounties() {
    return this.counties;
  }

  /**
   * Get county by name
   * @param {string} countyName
   * @returns {object} County data
   */
  getCounty(countyName) {
    return this.counties[countyName.toLowerCase()];
  }

  /**
   * Check if county exists
   * @param {string} countyName
   * @returns {boolean}
   */
  exists(countyName) {
    return !!this.counties[countyName.toLowerCase()];
  }

  /**
   * Get HTML for county navigation links
   * @returns {string} HTML
   */
  getNavigationHTML() {
    return Object.values(this.counties)
      .map(county => `
        <a href="${county.url}" class="county-link" data-county="${Object.keys(this.counties).find(k => this.counties[k] === county)}">
          ${county.name}
        </a>
      `).join('\n');
  }
}

// Global instance
window.countyNavigator = new CountyNavigator();

// Example usage:
// countyNavigator.navigate('montserrado');
// countyNavigator.getCounty('bong');
// countyNavigator.getCounties();
