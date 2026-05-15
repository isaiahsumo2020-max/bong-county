/**
 * Helper Utilities
 * Common utility functions used across the application
 */

const Helpers = {
  /**
   * Format date to readable string
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format datetime to readable string
   */
  formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Show success notification
   */
  showSuccess(message) {
    alert(message);
  },

  /**
   * Show error notification
   */
  showError(message) {
    alert('Error: ' + message);
  },

  /**
   * Confirm user action
   */
  confirm(message) {
    return confirm(message);
  },

  /**
   * Get status badge HTML
   */
  getStatusBadge(status, type = 'default') {
    const badgeClasses = {
      'active': 'badge badge-success',
      'inactive': 'badge badge-danger',
      'draft': 'badge badge-warning',
      'published': 'badge badge-success',
      'pending_review': 'badge badge-info',
      'rejected': 'badge badge-danger',
      'upcoming': 'badge badge-info',
      'ongoing': 'badge badge-success',
      'past': 'badge badge-warning',
      'cancelled': 'badge badge-danger',
      'open': 'badge badge-success',
      'closing_soon': 'badge badge-warning',
      'closed': 'badge badge-danger',
      'true': 'badge badge-success',
      'false': 'badge badge-danger'
    };

    return `<span class="${badgeClasses[status] || 'badge badge-info'}">${status}</span>`;
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Debounce function
   */
  debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Make Helpers globally available
window.Helpers = Helpers;
