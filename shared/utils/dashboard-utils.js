/**
 * DASHBOARD UTILITIES - Shared Functions for All Dashboards
 * 
 * Common functions, constants, and utilities used across dashboards
 */

class DashboardUtils {
  /**
   * Format date to readable string
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format time to readable string
   */
  static formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text, maxLength = 100) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Get status badge color
   */
  static getStatusColor(status) {
    const statusColors = {
      'draft': '#6B7280',      // Gray
      'pending': '#F59E0B',    // Amber
      'approved': '#10B981',   // Green
      'published': '#3B82F6',  // Blue
      'rejected': '#EF4444',   // Red
      'archived': '#9CA3AF'    // Light gray
    };
    return statusColors[status?.toLowerCase()] || '#6B7280';
  }

  /**
   * Get role display label
   */
  static getRoleLabel(role) {
    const roleLabels = {
      'super_admin': 'Super Admin',
      'county_admin': 'County Admin',
      'contributor': 'Contributor',
      'visitor': 'Visitor'
    };
    return roleLabels[role] || role;
  }

  /**
   * Check if content is editable
   */
  static isContentEditable(content, currentUserId, userRole) {
    // Super admin can edit anything
    if (userRole === 'super_admin') return true;

    // Drafts and pending submissions can be edited by author
    if (['draft', 'pending'].includes(content.status)) {
      return content.author_id === currentUserId;
    }

    return false;
  }

  /**
   * Check if content can be deleted
   */
  static isContentDeletable(content, currentUserId, userRole) {
    // Super admin can delete anything
    if (userRole === 'super_admin') return true;

    // Only draft content can be deleted by author
    if (content.status === 'draft') {
      return content.author_id === currentUserId;
    }

    return false;
  }

  /**
   * Show toast notification
   */
  static showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    const bgColor = {
      'success': '#10B981',
      'error': '#EF4444',
      'warning': '#F59E0B',
      'info': '#3B82F6'
    }[type] || '#3B82F6';

    toast.style.cssText = `
      padding: 12px 16px;
      background-color: ${bgColor};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Show loading spinner
   */
  static showLoadingSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #E5E7EB;
          border-top-color: #3B82F6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Show empty state message
   */
  static showEmptyState(containerId, title, description = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="
        text-align: center;
        padding: 40px 20px;
        color: #6B7280;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0; color: #1F2937;">${title}</h3>
        ${description ? `<p style="margin: 0; font-size: 14px;">${description}</p>` : ''}
      </div>
    `;
  }

  /**
   * Check if user has permission
   */
  static hasPermission(userPermissions, requiredPermission) {
    return Array.isArray(userPermissions) && userPermissions.includes(requiredPermission);
  }
}

// Make globally available
if (typeof window !== 'undefined') {
  window.DashboardUtils = DashboardUtils;
}
