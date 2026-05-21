/**
 * UNIFIED COLOR SYSTEM - CONSISTENT BRANDING
 * 
 * Manages unified visual theming across the platform.
 * All counties now use the same White, Blue, and Red color scheme.
 * 
 * Features:
 * - Consistent colors across all dashboards
 * - Professional Blue and Red branding
 * - CSS variable system for consistent theming
 * - Accessible color contrasts
 * - Responsive design support
 */

const CountyBranding = {
  /**
   * Unified color definitions for all counties
   * Structure: { primary, secondary, accent, bg, text, surface, border, hover, active }
   */
  COUNTY_COLORS: {
    // Unified color scheme - all counties use the same branding
    bong: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',             // White
      text: '#1A1A1A',           // Dark text
      surface: '#DBEAFE',        // Light blue surface
      surface2: '#EFF6FF',       // Lighter blue surface
      border: '#93C5FD',         // Blue border
      border2: '#60A5FA',        // Medium blue border
      hover: 'rgba(29,78,216,0.1)',    // Hover state
      active: 'rgba(29,78,216,0.15)',  // Active state
      glow: 'rgba(29,78,216,0.25)',    // Glow/shadow
    },
    lofa: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    nimba: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    'grand-bassa': {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    margibi: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    montserrado: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    gbarpolu: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    sinoe: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    'grand-gedeh': {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    rivercess: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    maryland: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    'grand-kru': {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    'river-gee': {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    todee: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    'grand-cape-mount': {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    bomi: {
      primary: '#1D4ED8',        // Professional Blue
      secondary: '#DC2626',      // Deep Red
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#EFF6FF',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
  },

  /**
   * Apply unified branding to the current page
   * @param {string} countySlug - The slug of the county (e.g., 'bong', 'montserrado')
   */
  applyTheme(countySlug) {
    if (!countySlug) {
      console.warn('⚠ No county slug provided to applyTheme');
      return false;
    }

    const slug = countySlug.toLowerCase().trim();
    const colors = this.COUNTY_COLORS[slug];

    if (!colors) {
      console.warn(`⚠ County theme not found for slug: ${slug}`);
      return false;
    }

    try {
      this.applyColorVariables(colors);
      console.log(`✓ Applied unified branding theme (White, Blue, Red) for: ${slug}`);
      return true;
    } catch (err) {
      console.error('✗ Error applying unified theme:', err);
      return false;
    }
  },

  /**
   * Apply CSS variables to document root
   * @param {object} colors - Color object with all theme properties
   */
  applyColorVariables(colors) {
    const root = document.documentElement;
    
    // Primary branding colors
    root.style.setProperty('--county-primary', colors.primary);
    root.style.setProperty('--county-secondary', colors.secondary);
    root.style.setProperty('--county-accent', colors.accent);
    
    // Background and surface colors
    root.style.setProperty('--county-bg', colors.bg);
    root.style.setProperty('--county-surface', colors.surface);
    root.style.setProperty('--county-surface-light', colors.surface2);
    
    // Text and border colors
    root.style.setProperty('--county-text', colors.text);
    root.style.setProperty('--county-border', colors.border);
    root.style.setProperty('--county-border-dark', colors.border2);
    
    // State colors for interactivity
    root.style.setProperty('--county-hover', colors.hover);
    root.style.setProperty('--county-active', colors.active);
    root.style.setProperty('--county-glow', colors.glow);

    // Map to legacy dashboard variables for compatibility
    root.style.setProperty('--green', colors.primary);
    root.style.setProperty('--green-lt', colors.accent);
    root.style.setProperty('--green-glow', colors.glow);
    root.style.setProperty('--bg', colors.bg);
    root.style.setProperty('--surface', colors.surface);
    root.style.setProperty('--surface2', colors.surface2);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--border2', colors.border2);
  },

  /**
   * Get county color scheme object
   * @param {string} countySlug - County slug
   * @returns {object} Color object or null if not found
   */
  getCountyColors(countySlug) {
    if (!countySlug) return null;
    return this.COUNTY_COLORS[countySlug.toLowerCase()] || null;
  },

  /**
   * Apply theme based on database county data
   * Useful when you have county data from Supabase
   * @param {object} countyData - County object with 'slug' property
   */
  applyCountyTheme(countyData) {
    if (!countyData || !countyData.slug) {
      console.warn('⚠ Invalid county data provided');
      return false;
    }
    return this.applyTheme(countyData.slug);
  },

  /**
   * Reset theme to default (no county-specific colors)
   */
  resetTheme() {
    const root = document.documentElement;
    const defaultColors = this.COUNTY_COLORS['montserrado']; // Use first as default

    this.applyColorVariables(defaultColors);
    console.log('✓ Theme reset to default');
  },

  /**
   * Check if a county has a defined theme
   * @param {string} countySlug - County slug
   * @returns {boolean} True if theme exists
   */
  hasTheme(countySlug) {
    if (!countySlug) return false;
    return countySlug.toLowerCase() in this.COUNTY_COLORS;
  },

  /**
   * Get all available county themes
   * @returns {array} Array of county slugs
   */
  getAvailableCounties() {
    return Object.keys(this.COUNTY_COLORS);
  },
};

// Export for use
if (typeof window !== 'undefined') {
  window.CountyBranding = CountyBranding;
}
