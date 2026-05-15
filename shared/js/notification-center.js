/**
 * NOTIFICATION CENTER UI
 * User interface for viewing, managing, and customizing notifications
 * 
 * Features:
 * - Notification list with filtering
 * - Mark as read/unread
 * - Notification preferences
 * - Real-time updates
 * - Archive/delete functionality
 */

export class NotificationCenter {
  
  constructor(containerId, notificationEngine, supabaseClient) {
    this.container = document.getElementById(containerId);
    this.engine = notificationEngine;
    this.supabase = supabaseClient;
    this.notifications = [];
    this.filters = {
      type: 'all',
      read: 'unread',
      sortBy: 'newest'
    };
  }

  /**
   * Initialize notification center
   */
  async initialize() {
    try {
      await this.loadNotifications();
      this.render();
      this.setupEventListeners();
      
      // Auto-refresh every 30 seconds
      setInterval(() => this.refreshNotifications(), 30000);
      
      return { success: true };
    } catch (error) {
      console.error('Error initializing notification center:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load notifications from backend
   */
  async loadNotifications() {
    try {
      this.notifications = await this.engine.getAllNotifications(null, 50);
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Refresh notifications
   */
  async refreshNotifications() {
    await this.loadNotifications();
    this.render();
  }

  /**
   * Render notification center UI
   */
  render() {
    const html = `
      <div class="notification-center">
        <div class="notification-header">
          <h2>Notifications</h2>
          <div class="header-actions">
            <button class="btn-clear-all" data-action="clearAll">Clear All</button>
            <button class="btn-settings" data-action="openSettings">⚙️ Settings</button>
          </div>
        </div>

        <div class="notification-filters">
          <div class="filter-group">
            <label>Type:</label>
            <select class="filter-type" data-filter="type">
              <option value="all">All</option>
              <option value="content_published">Content Published</option>
              <option value="opportunity_matched">Opportunity Matched</option>
              <option value="message">Messages</option>
              <option value="alert">Alerts</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Status:</label>
            <select class="filter-read" data-filter="read">
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Sort:</label>
            <select class="filter-sort" data-filter="sortBy">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
            </select>
          </div>
        </div>

        <div class="notification-stats">
          <span class="stat-unread">
            <strong>${this.getUnreadCount()}</strong> unread
          </span>
          <span class="stat-total">
            <strong>${this.notifications.length}</strong> total
          </span>
        </div>

        <div class="notification-list">
          ${this.renderNotificationList()}
        </div>

        <div id="settingsModal" class="modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Notification Settings</h3>
              <button class="close-btn" data-action="closeSettings">&times;</button>
            </div>
            <div class="modal-body">
              ${this.renderSettings()}
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" data-action="closeSettings">Cancel</button>
              <button class="btn-save" data-action="saveSettings">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Render notification list
   */
  renderNotificationList() {
    const filtered = this.getFilteredNotifications();

    if (filtered.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>No notifications yet</p>
          <small>Check back soon for updates</small>
        </div>
      `;
    }

    return filtered.map(notif => `
      <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" data-id="${notif.id}">
        <div class="notification-icon">${notif.icon || '📢'}</div>
        
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-body">${notif.body}</div>
          <div class="notification-meta">
            <span class="notification-time">${this.formatTime(notif.created_at)}</span>
            <span class="notification-type">${notif.type}</span>
          </div>
        </div>

        <div class="notification-actions">
          ${!notif.is_read ? `
            <button class="action-btn" data-action="markRead" data-id="${notif.id}" title="Mark as read">
              ✓
            </button>
          ` : ''}
          
          <button class="action-btn" data-action="viewDetail" data-id="${notif.id}" title="View">
            →
          </button>
          
          <button class="action-btn" data-action="delete" data-id="${notif.id}" title="Delete">
            ✕
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render settings modal
   */
  renderSettings() {
    return `
      <div class="settings-group">
        <h4>Notification Channels</h4>
        <div class="settings-option">
          <label>
            <input type="checkbox" name="channels" value="in_app" checked>
            In-App Notifications
          </label>
        </div>
        <div class="settings-option">
          <label>
            <input type="checkbox" name="channels" value="email" checked>
            Email Notifications
          </label>
        </div>
      </div>

      <div class="settings-group">
        <h4>Notification Frequency</h4>
        <div class="settings-option">
          <label>
            <input type="radio" name="frequency" value="immediate">
            Immediate
          </label>
        </div>
        <div class="settings-option">
          <label>
            <input type="radio" name="frequency" value="daily" checked>
            Daily Digest
          </label>
        </div>
        <div class="settings-option">
          <label>
            <input type="radio" name="frequency" value="weekly">
            Weekly Digest
          </label>
        </div>
      </div>

      <div class="settings-group">
        <h4>Notification Types</h4>
        <div class="settings-option">
          <label>
            <input type="checkbox" name="types" value="content_published" checked>
            New Content Published
          </label>
        </div>
        <div class="settings-option">
          <label>
            <input type="checkbox" name="types" value="opportunity_matched" checked>
            Matching Opportunities
          </label>
        </div>
        <div class="settings-option">
          <label>
            <input type="checkbox" name="types" value="message" checked>
            Messages
          </label>
        </div>
        <div class="settings-option">
          <label>
            <input type="checkbox" name="types" value="alert" checked>
            System Alerts
          </label>
        </div>
      </div>

      <div class="settings-group">
        <h4>Interests</h4>
        <div class="interests-preview">
          <p>Customize your interests in your profile settings</p>
        </div>
      </div>
    `;
  }

  /**
   * Get filtered notifications based on current filters
   */
  getFilteredNotifications() {
    let filtered = [...this.notifications];

    // Filter by type
    if (this.filters.type !== 'all') {
      filtered = filtered.filter(n => n.type === this.filters.type);
    }

    // Filter by read status
    if (this.filters.read === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (this.filters.read === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    // Sort
    if (this.filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (this.filters.sortBy === 'unread') {
      filtered.sort((a, b) => {
        if (a.is_read === b.is_read) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return a.is_read - b.is_read;
      });
    } else {
      // newest
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Filter changes
    const filterSelects = this.container.querySelectorAll('select[data-filter]');
    filterSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const filterName = e.target.dataset.filter;
        this.filters[filterName] = e.target.value;
        this.render();
        this.setupEventListeners();
      });
    });

    // Action buttons
    const actionBtns = this.container.querySelectorAll('[data-action]');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const notifId = btn.dataset.id;
        
        switch (action) {
          case 'markRead':
            this.markAsRead(notifId);
            break;
          case 'viewDetail':
            this.viewDetail(notifId);
            break;
          case 'delete':
            this.deleteNotification(notifId);
            break;
          case 'clearAll':
            this.clearAll();
            break;
          case 'openSettings':
            this.openSettings();
            break;
          case 'closeSettings':
            this.closeSettings();
            break;
          case 'saveSettings':
            this.saveSettings();
            break;
        }
      });
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notifId) {
    try {
      await this.engine.markAsRead(notifId);
      await this.refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Failed to mark notification as read');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notifId) {
    if (!confirm('Delete this notification?')) return;

    try {
      await this.engine.deleteNotification(notifId);
      await this.refreshNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  }

  /**
   * Clear all read notifications
   */
  async clearAll() {
    if (!confirm('Clear all read notifications?')) return;

    try {
      await this.engine.clearReadNotifications(null);
      await this.refreshNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      alert('Failed to clear notifications');
    }
  }

  /**
   * View notification detail
   */
  viewDetail(notifId) {
    const notif = this.notifications.find(n => n.id === notifId);
    if (notif && notif.action_url) {
      window.location.href = notif.action_url;
    }
  }

  /**
   * Open settings modal
   */
  openSettings() {
    const modal = this.container.querySelector('#settingsModal');
    modal.classList.remove('hidden');
  }

  /**
   * Close settings modal
   */
  closeSettings() {
    const modal = this.container.querySelector('#settingsModal');
    modal.classList.add('hidden');
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      const channelInputs = this.container.querySelectorAll('input[name="channels"]:checked');
      const channels = Array.from(channelInputs).map(el => el.value);

      const frequencyInput = this.container.querySelector('input[name="frequency"]:checked');
      const frequency = frequencyInput?.value || 'daily';

      const typeInputs = this.container.querySelectorAll('input[name="types"]:checked');
      const types = Array.from(typeInputs).map(el => el.value);

      // Save preferences
      await this.engine.updateNotificationPreferences(null, {
        frequency: frequency,
        channels: channels,
        interests: {
          tags: [],
          audiences: [],
          counties: []
        }
      });

      this.closeSettings();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.is_read).length;
  }

  /**
   * Format notification time
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Create badge for unread count
   */
  createUnreadBadge() {
    const count = this.getUnreadCount();
    if (count === 0) return '';

    return `<span class="badge badge-unread">${count > 99 ? '99+' : count}</span>`;
  }

  /**
   * Render mini notification widget (for navbar)
   */
  renderMiniWidget() {
    const unreadCount = this.getUnreadCount();
    const recent = this.notifications.slice(0, 3);

    return `
      <div class="notification-widget">
        <div class="widget-header">
          <button class="notification-bell" id="notificationBell">
            🔔
            ${this.createUnreadBadge()}
          </button>
          <div class="widget-dropdown" id="notificationDropdown" style="display: none;">
            <div class="dropdown-header">
              <h4>Recent Notifications</h4>
            </div>
            <div class="dropdown-list">
              ${recent.length > 0 ? recent.map(n => `
                <div class="dropdown-item ${n.is_read ? 'read' : 'unread'}">
                  <div class="item-title">${n.title}</div>
                  <div class="item-time">${this.formatTime(n.created_at)}</div>
                </div>
              `).join('') : '<p class="no-notifications">No notifications</p>'}
            </div>
            <div class="dropdown-footer">
              <a href="/notifications" class="view-all">View All →</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// CSS Styles
const notificationCenterStyles = `
<style>
.notification-center {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 15px;
}

.notification-header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.header-actions button:hover {
  background: #e5e7eb;
}

.notification-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  font-size: 14px;
}

.filter-group select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.notification-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.notification-stats span {
  font-size: 14px;
  color: #6b7280;
}

.notification-stats strong {
  font-weight: 600;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s;
}

.notification-item.unread {
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
}

.notification-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-body {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.notification-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  background: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #e5e7eb;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin: 8px 0;
}

.empty-state small {
  font-size: 13px;
  color: #d1d5db;
}

/* Modal Styles */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
}

.modal:not(.hidden) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.settings-group {
  margin-bottom: 24px;
}

.settings-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.settings-option {
  margin-bottom: 10px;
}

.settings-option label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.settings-option input[type="checkbox"],
.settings-option input[type="radio"] {
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.modal-footer button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-cancel {
  background: #f3f4f6;
  color: #1f2937;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

/* Badge Styles */
.badge {
  display: inline-block;
  padding: 2px 6px;
  background: #ef4444;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

/* Widget Styles */
.notification-widget {
  position: relative;
}

.notification-bell {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: relative;
}

.badge-unread {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
}

.widget-dropdown {
  position: absolute;
  top: 40px;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10;
  min-width: 300px;
}

.dropdown-header {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-list {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f9fafb;
}

.dropdown-item.unread {
  background: #f0f9ff;
}

.item-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.item-time {
  color: #9ca3af;
  font-size: 12px;
}

.dropdown-footer {
  padding: 12px;
  border-top: 1px solid #f3f4f6;
  text-align: center;
}

.view-all {
  color: #3b82f6;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}

.view-all:hover {
  text-decoration: underline;
}

.hidden {
  display: none !important;
}
</style>
`;

export default NotificationCenter;
