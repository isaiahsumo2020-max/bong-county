/**
 * THEME MANAGER - Unified Color System Management
 * 
 * Centralized theme application across all dashboards
 * Uses White, Blue, and Red unified color scheme
 */

class ThemeManager {
  constructor() {
    this.colors = {
      primary: '#1D4ED8',      // Professional Blue
      secondary: '#DC2626',    // Deep Red
      accent: '#3B82F6',       // Light Blue
      bg: '#FFFFFF',           // White
      text: '#1A1A1A',         // Dark text
      surface: '#DBEAFE',      // Light blue surface
      surface2: '#EFF6FF',     // Lighter blue surface
      border: '#93C5FD',       // Blue border
      border2: '#60A5FA',      // Medium blue border
      hover: 'rgba(29,78,216,0.1)',
      active: 'rgba(29,78,216,0.15)',
      glow: 'rgba(29,78,216,0.25)'
    };
  }

  /**
   * Apply unified theme to document
   */
  applyTheme() {
    const root = document.documentElement.style;

    // Apply unified colors
    root.setProperty('--county-primary', this.colors.primary);
    root.setProperty('--county-secondary', this.colors.secondary);
    root.setProperty('--county-accent', this.colors.accent);
    root.setProperty('--county-bg', this.colors.bg);
    root.setProperty('--county-surface', this.colors.surface);
    root.setProperty('--county-surface-light', this.colors.surface2);
    root.setProperty('--county-text', this.colors.text);
    root.setProperty('--county-border', this.colors.border);
    root.setProperty('--county-border-dark', this.colors.border2);
    root.setProperty('--county-hover', this.colors.hover);
    root.setProperty('--county-active', this.colors.active);
    root.setProperty('--county-glow', this.colors.glow);

    // Legacy variable compatibility
    root.setProperty('--green', this.colors.primary);
    root.setProperty('--green-lt', this.colors.accent);
    root.setProperty('--green-glow', this.colors.glow);
    root.setProperty('--bg', this.colors.bg);
    root.setProperty('--surface', this.colors.surface);
    root.setProperty('--surface2', this.colors.surface2);
    root.setProperty('--text', this.colors.text);
    root.setProperty('--border', this.colors.border);
    root.setProperty('--border2', this.colors.border2);

    console.log('✓ Unified theme applied (White, Blue, Red)');
  }

  /**
   * Get color by name
   */
  getColor(colorName) {
    return this.colors[colorName] || null;
  }

  /**
   * Update a color value
   */
  setColor(colorName, value) {
    if (this.colors.hasOwnProperty(colorName)) {
      this.colors[colorName] = value;
      document.documentElement.style.setProperty(`--county-${colorName}`, value);
      return true;
    }
    return false;
  }

  /**
   * Get all colors
   */
  getAllColors() {
    return { ...this.colors };
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.ThemeManager = new ThemeManager();
}
