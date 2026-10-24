/**
 * DASHBOARD UTILS MODULE
 * Provides utility functions for the contributor dashboard
 * Methods: showToast, showLoadingSpinner, showEmptyState, formatDate, getStatusColor, truncateText
 */

const DashboardUtils = (() => {

  // ─────────────────────────────────────────
  // TOAST NOTIFICATIONS
  // ─────────────────────────────────────────
  function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? '#FEE2E2' : type === 'success' ? '#ECFDF5' : '#EFF6FF';
    const textColor = type === 'error' ? '#991B1B' : type === 'success' ? '#065F46' : '#1E40AF';
    const borderColor = type === 'error' ? '#FECACA' : type === 'success' ? '#86EFAC' : '#93C5FD';

    toast.style.cssText = `
      background: ${bgColor};
      color: ${textColor};
      border: 1px solid ${borderColor};
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-weight: 500;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;

    container.appendChild(toast);

    // Remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }

  // ─────────────────────────────────────────
  // LOADING SPINNER
  // ─────────────────────────────────────────
  function showLoadingSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        flex-direction: column;
        gap: 20px;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #E5E7EB;
          border-top-color: var(--county-primary, #1E40AF);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <p style="color: #6B7280; font-size: 14px;">Loading...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  // ─────────────────────────────────────────
  // EMPTY STATE
  // ─────────────────────────────────────────
  function showEmptyState(containerId, title, description = '', action = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let actionHTML = '';
    if (action) {
      actionHTML = `
        <button onclick="${action.callback}" style="
          background: var(--county-primary, #1E40AF);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 16px;
          font-weight: 600;
        ">
          ${action.label}
        </button>
      `;
    }

    container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      ">
        <svg style="width: 64px; height: 64px; color: #D1D5DB;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1F2937;">${title}</h3>
        <p style="margin: 0; color: #6B7280; font-size: 14px; max-width: 400px;">${description}</p>
        ${actionHTML}
      </div>
    `;
  }

  // ─────────────────────────────────────────
  // FORMAT DATE
  // ─────────────────────────────────────────
  function formatDate(dateString) {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);

      // Options for formatting
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };

      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return dateString;
    }
  }

  // ─────────────────────────────────────────
  // GET STATUS COLOR
  // ─────────────────────────────────────────
  function getStatusColor(status) {
    const colors = {
      'draft': '#9CA3AF',
      'pending_review': '#F59E0B',
      'published': '#10B981',
      'rejected': '#EF4444',
      'archived': '#6B7280'
    };

    return colors[status] || '#6B7280';
  }

  // ─────────────────────────────────────────
  // TRUNCATE TEXT
  // ─────────────────────────────────────────
  function truncateText(text, maxLength = 100) {
    if (!text) return '';

    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }

    return text;
  }

  // ─────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────
  return {
    showToast,
    showLoadingSpinner,
    showEmptyState,
    formatDate,
    getStatusColor,
    truncateText
  };
})();

// Add CSS animations to document
if (!document.getElementById('dashboard-utils-styles')) {
  const style = document.createElement('style');
  style.id = 'dashboard-utils-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(20px);
      }
    }
  `;
  document.head.appendChild(style);
}
