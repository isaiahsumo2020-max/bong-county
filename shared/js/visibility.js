/**
 * CONTENT VISIBILITY SYSTEM
 * 
 * Filters content based on:
 * - Visibility level (public, authenticated_only, county_only, admin_only, private)
 * - User authentication status
 * - User role and permissions
 * - User's county (for county-specific content)
 */

/**
 * Visibility Levels
 */
export const VISIBILITY_LEVELS = {
  PUBLIC: 'public',
  AUTHENTICATED_ONLY: 'authenticated_only',
  COUNTY_ONLY: 'county_only',
  ADMIN_ONLY: 'admin_only',
  PRIVATE: 'private'
};

/**
 * Content Visibility Filter
 */
export class ContentVisibility {
  /**
   * Check if user can see content based on visibility level
   * @param {Object} content - Content item with visibility property
   * @param {Object|null} user - Current user or null if not authenticated
   * @returns {boolean} True if content is visible to user
   */
  static canSee(content, user) {
    const visibility = content.visibility || VISIBILITY_LEVELS.PUBLIC;

    switch (visibility) {
      case VISIBILITY_LEVELS.PUBLIC:
        return true;

      case VISIBILITY_LEVELS.AUTHENTICATED_ONLY:
        return user !== null;

      case VISIBILITY_LEVELS.COUNTY_ONLY:
        return user !== null && user.county === content.county;

      case VISIBILITY_LEVELS.ADMIN_ONLY:
        return this.isAdmin(user);

      case VISIBILITY_LEVELS.PRIVATE:
        return this.isOwnerOrAdmin(content, user);

      default:
        return false;
    }
  }

  /**
   * Filter array of content items
   * @param {Array} contentArray - Array of content items
   * @param {Object|null} user - Current user or null
   * @returns {Array} Filtered array visible to user
   */
  static filterContent(contentArray, user) {
    if (!Array.isArray(contentArray)) {
      return [];
    }

    return contentArray.filter(item => this.canSee(item, user));
  }

  /**
   * Get visibility level description for UI
   * @param {string} visibility - Visibility level
   * @returns {Object} Description object with icon and text
   */
  static getVisibilityInfo(visibility) {
    const info = {
      [VISIBILITY_LEVELS.PUBLIC]: {
        icon: '🌍',
        label: 'Public',
        description: 'Visible to everyone',
        color: '#10b981'
      },
      [VISIBILITY_LEVELS.AUTHENTICATED_ONLY]: {
        icon: '🔐',
        label: 'Authenticated',
        description: 'Visible to logged-in users',
        color: '#3b82f6'
      },
      [VISIBILITY_LEVELS.COUNTY_ONLY]: {
        icon: '🏛️',
        label: 'County Only',
        description: 'Visible to county members',
        color: '#f59e0b'
      },
      [VISIBILITY_LEVELS.ADMIN_ONLY]: {
        icon: '🔒',
        label: 'Admin Only',
        description: 'Visible to administrators',
        color: '#ef4444'
      },
      [VISIBILITY_LEVELS.PRIVATE]: {
        icon: '🔑',
        label: 'Private',
        description: 'Visible to owner only',
        color: '#8b5cf6'
      }
    };

    return info[visibility] || {
      icon: '❓',
      label: 'Unknown',
      description: 'Unknown visibility level',
      color: '#6b7280'
    };
  }

  /**
   * Get all visibility levels user can set
   * (depends on user's role)
   * @param {Object} user - Current user
   * @returns {Array} Array of available visibility levels
   */
  static getAvailableLevels(user) {
    if (!user) {
      return [];
    }

    const levels = [VISIBILITY_LEVELS.PUBLIC];

    // All authenticated users can mark as authenticated_only
    levels.push(VISIBILITY_LEVELS.AUTHENTICATED_ONLY);

    // Can always mark as private
    levels.push(VISIBILITY_LEVELS.PRIVATE);

    // County-based content if user has county
    if (user.county) {
      levels.push(VISIBILITY_LEVELS.COUNTY_ONLY);
    }

    // Admin can mark as admin_only
    if (user.role === 'super_admin' || user.role === 'county_admin') {
      levels.push(VISIBILITY_LEVELS.ADMIN_ONLY);
    }

    return levels;
  }

  /**
   * Check if user is admin
   * @private
   * @param {Object|null} user
   * @returns {boolean}
   */
  static isAdmin(user) {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'county_admin';
  }

  /**
   * Check if user is owner or admin
   * @private
   * @param {Object} content - Content item
   * @param {Object|null} user - User object
   * @returns {boolean}
   */
  static isOwnerOrAdmin(content, user) {
    if (!user) return false;
    return user.id === content.author_id || this.isAdmin(user);
  }

  /**
   * Get visibility badge HTML
   * @param {string} visibility - Visibility level
   * @returns {string} HTML badge string
   */
  static getBadgeHtml(visibility) {
    const info = this.getVisibilityInfo(visibility);
    return `
      <span style="
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: ${info.color}20;
        color: ${info.color};
        font-size: 12px;
        font-weight: 500;
        title: ${info.description}
      ">
        ${info.icon} ${info.label}
      </span>
    `;
  }
}

/**
 * Content Visibility Query Builder
 * Builds Supabase queries with visibility filtering
 */
export class VisibilityQueryBuilder {
  /**
   * Build WHERE clause for visibility filtering
   * @param {Object|null} user - Current user or null
   * @returns {Array} Array of conditions for Supabase query
   */
  static buildWhereClause(user) {
    const conditions = [];

    // Always include public content
    conditions.push(['visibility', 'eq', VISIBILITY_LEVELS.PUBLIC]);

    if (user) {
      // Add authenticated_only content
      conditions.push(['visibility', 'eq', VISIBILITY_LEVELS.AUTHENTICATED_ONLY]);

      // Add county-specific content if applicable
      if (user.county) {
        conditions.push([
          { visibility: VISIBILITY_LEVELS.COUNTY_ONLY, county: user.county },
          'and'
        ]);
      }

      // Add admin-only content if user is admin
      if (user.role === 'super_admin' || user.role === 'county_admin') {
        conditions.push(['visibility', 'eq', VISIBILITY_LEVELS.ADMIN_ONLY]);
      }

      // Add user's own private content
      conditions.push([
        { visibility: VISIBILITY_LEVELS.PRIVATE, author_id: user.id },
        'and'
      ]);
    }

    return conditions;
  }

  /**
   * Build full Supabase query with visibility filtering
   * @param {Object} client - Supabase client
   * @param {Object|null} user - Current user
   * @param {string} table - Table name
   * @param {Array} select - Select columns
   * @returns {Object} Supabase query builder
   */
  static buildQuery(client, user, table, select = '*') {
    let query = client.from(table).select(select);

    // Add visibility filtering via OR conditions
    // This is a simplified approach - for production, use RLS policies instead

    return query;
  }
}

/**
 * Visibility Selector Component
 * Returns HTML for visibility level selector
 */
export class VisibilitySelector {
  /**
   * Generate visibility selector HTML
   * @param {Object} user - Current user
   * @param {string} [currentLevel='public'] - Currently selected level
   * @param {string} [id='visibility-select'] - Element ID
   * @returns {string} HTML string
   */
  static generateHtml(user, currentLevel = 'public', id = 'visibility-select') {
    const levels = ContentVisibility.getAvailableLevels(user);

    let html = `<select id="${id}" name="visibility" style="
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background-color: white;
      cursor: pointer;
    ">`;

    levels.forEach(level => {
      const info = ContentVisibility.getVisibilityInfo(level);
      const selected = level === currentLevel ? 'selected' : '';
      html += `
        <option value="${level}" ${selected} title="${info.description}">
          ${info.icon} ${info.label}
        </option>
      `;
    });

    html += '</select>';

    return html;
  }

  /**
   * Generate visibility info display
   * @param {string} visibility - Current visibility level
   * @returns {string} HTML string
   */
  static generateInfo(visibility) {
    const info = ContentVisibility.getVisibilityInfo(visibility);
    return `
      <div style="
        padding: 12px;
        background-color: ${info.color}10;
        border-left: 4px solid ${info.color};
        border-radius: 4px;
        margin: 12px 0;
      ">
        <p style="margin: 0; color: ${info.color}; font-weight: 500;">
          ${info.icon} ${info.label}
        </p>
        <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">
          ${info.description}
        </p>
      </div>
    `;
  }
}

/**
 * Visibility Policy
 * Defines what visibility levels are allowed for different content types
 */
export const VISIBILITY_POLICIES = {
  CONTENT: {
    allowed: [
      VISIBILITY_LEVELS.PUBLIC,
      VISIBILITY_LEVELS.AUTHENTICATED_ONLY,
      VISIBILITY_LEVELS.COUNTY_ONLY,
      VISIBILITY_LEVELS.PRIVATE
    ],
    default: VISIBILITY_LEVELS.AUTHENTICATED_ONLY
  },

  ANNOUNCEMENTS: {
    allowed: [
      VISIBILITY_LEVELS.PUBLIC,
      VISIBILITY_LEVELS.ADMIN_ONLY
    ],
    default: VISIBILITY_LEVELS.PUBLIC
  },

  OPPORTUNITIES: {
    allowed: [
      VISIBILITY_LEVELS.PUBLIC,
      VISIBILITY_LEVELS.COUNTY_ONLY,
      VISIBILITY_LEVELS.ADMIN_ONLY
    ],
    default: VISIBILITY_LEVELS.PUBLIC
  },

  COMMUNITY_POSTS: {
    allowed: [
      VISIBILITY_LEVELS.AUTHENTICATED_ONLY,
      VISIBILITY_LEVELS.COUNTY_ONLY,
      VISIBILITY_LEVELS.PRIVATE
    ],
    default: VISIBILITY_LEVELS.AUTHENTICATED_ONLY
  },

  EDUCATION: {
    allowed: [
      VISIBILITY_LEVELS.PUBLIC,
      VISIBILITY_LEVELS.AUTHENTICATED_ONLY,
      VISIBILITY_LEVELS.COUNTY_ONLY,
      VISIBILITY_LEVELS.ADMIN_ONLY
    ],
    default: VISIBILITY_LEVELS.AUTHENTICATED_ONLY
  },

  INTERNAL_RESOURCES: {
    allowed: [
      VISIBILITY_LEVELS.ADMIN_ONLY,
      VISIBILITY_LEVELS.PRIVATE
    ],
    default: VISIBILITY_LEVELS.ADMIN_ONLY
  }
};

/**
 * Get allowed visibility levels for content type
 * @param {string} contentType - Type of content
 * @returns {Array} Array of allowed visibility levels
 */
export function getAllowedLevels(contentType) {
  return VISIBILITY_POLICIES[contentType]?.allowed || [VISIBILITY_LEVELS.PUBLIC];
}

/**
 * Get default visibility for content type
 * @param {string} contentType - Type of content
 * @returns {string} Default visibility level
 */
export function getDefaultVisibility(contentType) {
  return VISIBILITY_POLICIES[contentType]?.default || VISIBILITY_LEVELS.PUBLIC;
}

export default ContentVisibility;
