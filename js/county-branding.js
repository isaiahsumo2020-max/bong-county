/**
 * COUNTY BRANDING SYSTEM
 * 
 * Manages county-specific visual theming across the platform.
 * Dynamically loads and applies county colors to CSS variables.
 * 
 * Features:
 * - Dynamic color loading based on user's county
 * - Reusable across all dashboards and pages
 * - CSS variable system for consistent theming
 * - Accessible color contrasts
 * - Responsive design support
 */

const CountyBranding = {
  /**
   * County color definitions with full theme support
   * Structure: { primary, secondary, accent, bg, text, surface, border, hover, active }
   */
  COUNTY_COLORS: {
    bong: {
      primary: '#F97316',        // Vibrant Orange (user provided)
      secondary: '#111111',      // Deep Black (user provided)
      accent: '#FDBA74',         // Light Orange
      bg: '#FFFFFF',             // White
      text: '#1A1A1A',           // Dark text
      surface: '#FEF3C7',        // Light orange surface
      surface2: '#FEF08A',       // Lighter orange surface
      border: '#FBBF24',         // Orange border
      border2: '#F59E0B',        // Dark orange border
      hover: 'rgba(249,115,22,0.1)',    // Hover state
      active: 'rgba(249,115,22,0.15)',  // Active state
      glow: 'rgba(249,115,22,0.25)',    // Glow/shadow
    },
    lofa: {
      primary: '#06B6D4',        // Vibrant Cyan
      secondary: '#0891B2',      // Dark Cyan
      accent: '#22D3EE',         // Light Cyan
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#CFFAFE',
      surface2: '#A5F3FC',
      border: '#67E8F9',
      border2: '#06B6D4',
      hover: 'rgba(6,182,212,0.1)',
      active: 'rgba(6,182,212,0.15)',
      glow: 'rgba(6,182,212,0.25)',
    },
    nimba: {
      primary: '#EC4899',        // Vibrant Pink
      secondary: '#DB2777',      // Deep Pink
      accent: '#F472B6',         // Light Pink
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#FCE7F3',
      surface2: '#FBCFE8',
      border: '#F9A8D4',
      border2: '#F472B6',
      hover: 'rgba(236,72,153,0.1)',
      active: 'rgba(236,72,153,0.15)',
      glow: 'rgba(236,72,153,0.25)',
    },
    'grand-bassa': {
      primary: '#1D4ED8',        // Vibrant Blue (user provided)
      secondary: '#0F172A',      // Deep Navy (user provided)
      accent: '#3B82F6',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#DBEAFE',
      surface2: '#BFDBFE',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)',
    },
    margibi: {
      primary: '#8B5CF6',        // Vibrant Purple
      secondary: '#7C3AED',      // Deep Purple
      accent: '#A78BFA',         // Light Purple
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#F3E8FF',
      surface2: '#EDE9FE',
      border: '#DDD6FE',
      border2: '#C4B5FD',
      hover: 'rgba(139,92,246,0.1)',
      active: 'rgba(139,92,246,0.15)',
      glow: 'rgba(139,92,246,0.25)',
    },
    montserrado: {
      primary: '#10B981',        // Vibrant Emerald
      secondary: '#059669',      // Deep Green
      accent: '#6EE7B7',         // Light Green
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#D1FAE5',
      surface2: '#A7F3D0',
      border: '#6EE7B7',
      border2: '#34D399',
      hover: 'rgba(16,185,129,0.1)',
      active: 'rgba(16,185,129,0.15)',
      glow: 'rgba(16,185,129,0.25)',
    },
    gbarpolu: {
      primary: '#EF4444',        // Vibrant Red
      secondary: '#DC2626',      // Deep Red
      accent: '#FCA5A5',         // Light Red
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#FEE2E2',
      surface2: '#FECACA',
      border: '#FCA5A5',
      border2: '#F87171',
      hover: 'rgba(239,68,68,0.1)',
      active: 'rgba(239,68,68,0.15)',
      glow: 'rgba(239,68,68,0.25)',
    },
    sinoe: {
      primary: '#F59E0B',        // Vibrant Amber
      secondary: '#D97706',      // Deep Amber
      accent: '#FBBF24',         // Light Amber
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#FEF3C7',
      surface2: '#FEE8A4',
      border: '#FDBF24',
      border2: '#F59E0B',
      hover: 'rgba(245,158,11,0.1)',
      active: 'rgba(245,158,11,0.15)',
      glow: 'rgba(245,158,11,0.25)',
    },
    'grand-gedeh': {
      primary: '#14B8A6',        // Vibrant Teal
      secondary: '#0D9488',      // Deep Teal
      accent: '#2DD4BF',         // Light Teal
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#CCFBF1',
      surface2: '#99F6E4',
      border: '#5EEAD4',
      border2: '#2DD4BF',
      hover: 'rgba(20,184,166,0.1)',
      active: 'rgba(20,184,166,0.15)',
      glow: 'rgba(20,184,166,0.25)',
    },
    rivercess: {
      primary: '#3B82F6',        // Vibrant Blue
      secondary: '#1E40AF',      // Deep Blue
      accent: '#60A5FA',         // Light Blue
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#EFF6FF',
      surface2: '#DBEAFE',
      border: '#93C5FD',
      border2: '#60A5FA',
      hover: 'rgba(59,130,246,0.1)',
      active: 'rgba(59,130,246,0.15)',
      glow: 'rgba(59,130,246,0.25)',
    },
    maryland: {
      primary: '#06B6D4',        // Vibrant Cyan
      secondary: '#0891B2',      // Deep Cyan
      accent: '#22D3EE',         // Light Cyan
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#CFFAFE',
      surface2: '#A5F3FC',
      border: '#67E8F9',
      border2: '#06B6D4',
      hover: 'rgba(6,182,212,0.1)',
      active: 'rgba(6,182,212,0.15)',
      glow: 'rgba(6,182,212,0.25)',
    },
    'grand-kru': {
      primary: '#6366F1',        // Vibrant Indigo
      secondary: '#4F46E5',      // Deep Indigo
      accent: '#818CF8',         // Light Indigo
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#E0E7FF',
      surface2: '#C7D2FE',
      border: '#A5B4FC',
      border2: '#818CF8',
      hover: 'rgba(99,102,241,0.1)',
      active: 'rgba(99,102,241,0.15)',
      glow: 'rgba(99,102,241,0.25)',
    },
    'river-gee': {
      primary: '#EF4444',        // Vibrant Red
      secondary: '#DC2626',      // Deep Red
      accent: '#FCA5A5',         // Light Red
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#FEE2E2',
      surface2: '#FECACA',
      border: '#FCA5A5',
      border2: '#F87171',
      hover: 'rgba(239,68,68,0.1)',
      active: 'rgba(239,68,68,0.15)',
      glow: 'rgba(239,68,68,0.25)',
    },
    todee: {
      primary: '#EC4899',        // Vibrant Pink
      secondary: '#DB2777',      // Deep Pink
      accent: '#F472B6',         // Light Pink
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#FCE7F3',
      surface2: '#FBCFE8',
      border: '#F9A8D4',
      border2: '#F472B6',
      hover: 'rgba(236,72,153,0.1)',
      active: 'rgba(236,72,153,0.15)',
      glow: 'rgba(236,72,153,0.25)',
    },
    'grand-cape-mount': {
      primary: '#F97316',        // Vibrant Orange
      secondary: '#EA580C',      // Deep Orange
      accent: '#FDBA74',         // Light Orange
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#FEF3C7',
      surface2: '#FEF08A',
      border: '#FBBF24',
      border2: '#F59E0B',
      hover: 'rgba(249,115,22,0.1)',
      active: 'rgba(249,115,22,0.15)',
      glow: 'rgba(249,115,22,0.25)',
    },
    bomi: {
      primary: '#10B981',        // Vibrant Green
      secondary: '#059669',      // Deep Green
      accent: '#6EE7B7',         // Light Green
      bg: '#FFFFFF',
      text: '#1A1A1A',
      surface: '#D1FAE5',
      surface2: '#A7F3D0',
      border: '#6EE7B7',
      border2: '#34D399',
      hover: 'rgba(16,185,129,0.1)',
      active: 'rgba(16,185,129,0.15)',
      glow: 'rgba(16,185,129,0.25)',
    },
  },

  /**
   * Apply county branding to the current page
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
      console.log(`✓ Applied county theme: ${slug}`);
      return true;
    } catch (err) {
      console.error('✗ Error applying county theme:', err);
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
