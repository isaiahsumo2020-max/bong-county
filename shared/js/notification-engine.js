/**
 * NOTIFICATION ENGINE
 * Handles personalized notifications with smart content matching
 * 
 * Features:
 * - In-app notifications
 * - Email notification queuing
 * - Dashboard alerts
 * - Subscriber matching
 * - Notification tracking
 */

export class NotificationEngine {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.notificationQueue = [];
    this.emailQueue = [];
  }

  /**
   * Called when content is published
   * Finds matching subscribers and creates notifications
   */
  async onContentPublished(content, author) {
    try {
      // Get all active subscribers
      const matchingSubscribers = await this.findMatchingSubscribers(content);

      // Create notifications for each subscriber
      for (const subscriber of matchingSubscribers) {
        await this.createNotification(content, subscriber, author);
      }

      console.log(`Created ${matchingSubscribers.length} notifications for content: ${content.title}`);
      return { success: true, notificationsCreated: matchingSubscribers.length };
    } catch (error) {
      console.error('Error publishing notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find all subscribers interested in this content
   */
  async findMatchingSubscribers(content) {
    try {
      // Get all active subscribers (updated in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: subscribers, error } = await this.db
        .from('user_subscriptions')
        .select('*')
        .gte('updated_at', thirtyDaysAgo);

      if (error) throw error;

      // Filter matching subscribers
      return subscribers.filter(sub => this.contentMatches(content, sub));
    } catch (error) {
      console.error('Error finding matching subscribers:', error);
      return [];
    }
  }

  /**
   * Check if content matches subscriber interests
   */
  contentMatches(content, subscriber) {
    // Check visibility permissions
    if (!this.userCanSeeContent(subscriber.user_id, content)) {
      return false;
    }

    // Check if has any matching criteria
    const audienceMatch = content.target_audiences?.some(aud =>
      subscriber.interested_audiences?.includes(aud)
    );

    const tagMatch = content.tags?.some(tag =>
      subscriber.interested_tags?.includes(tag)
    );

    const countyMatch = !subscriber.interested_counties?.length ||
      subscriber.interested_counties.includes(content.county);

    // Match if any criteria matched
    return audienceMatch || tagMatch || countyMatch;
  }

  /**
   * Create notification for subscriber
   */
  async createNotification(content, subscriber, author) {
    try {
      const notification = {
        recipient_id: subscriber.user_id,
        sender_id: author.id,
        type: 'content_published',
        title: this.generateTitle(content),
        body: content.description || content.title,
        icon: this.getIcon(content.opportunity_type),
        action_url: `/content/${content.id}`,
        target_audience: this.getTargetAudience(content, subscriber),
        personalization_context: JSON.stringify({
          matched_tags: this.getMatchedTags(content, subscriber),
          matched_audiences: this.getMatchedAudiences(content, subscriber),
          content_type: content.opportunity_type,
          county: content.county
        })
      };

      // Send in-app notification
      await this.sendInAppNotification(notification);

      // Queue email if subscriber enabled
      if (subscriber.notification_channels?.includes('email')) {
        await this.queueEmailNotification(notification, subscriber);
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send in-app notification immediately
   */
  async sendInAppNotification(notification) {
    try {
      const { data, error } = await this.db
        .from('notifications')
        .insert([{
          ...notification,
          in_app_sent: true,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
      throw error;
    }
  }

  /**
   * Queue email notification for batch sending
   */
  async queueEmailNotification(notification, subscriber) {
    try {
      // Store in email queue
      const { data, error } = await this.db
        .from('email_queue')
        .insert([{
          recipient_id: subscriber.user_id,
          recipient_email: subscriber.email,
          notification_id: notification.recipient_id, // Reuse as temporary ID
          template: 'content_published',
          subject: notification.title,
          context: JSON.stringify({
            firstName: subscriber.first_name,
            contentTitle: notification.title,
            contentBody: notification.body,
            actionUrl: notification.action_url,
            matchedTags: notification.personalization_context.matched_tags,
            matchedAudiences: notification.personalization_context.matched_audiences
          }),
          scheduled_for: new Date().toISOString(),
          sent: false
        }]);

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Failed to queue email notification:', error);
      throw error;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getUserNotificationPreferences(userId) {
    try {
      const { data, error } = await this.db
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        frequency: data.notification_frequency || 'daily',
        channels: data.notification_channels || ['in_app', 'email'],
        interests: {
          tags: data.interested_tags || [],
          audiences: data.interested_audiences || [],
          counties: data.interested_counties || []
        }
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      const { data, error } = await this.db
        .from('user_subscriptions')
        .update({
          notification_frequency: preferences.frequency,
          notification_channels: preferences.channels,
          interested_tags: preferences.interests.tags,
          interested_audiences: preferences.interests.audiences,
          interested_counties: preferences.interests.counties,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { data, error } = await this.db
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(userId, limit = 10) {
    try {
      const { data, error } = await this.db
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  }

  /**
   * Get all notifications for user
   */
  async getAllNotifications(userId, limit = 50) {
    try {
      const { data, error } = await this.db
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await this.db
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Archive notification (soft delete)
   */
  async archiveNotification(notificationId) {
    try {
      const { data, error } = await this.db
        .from('notifications')
        .update({ is_archived: true })
        .eq('id', notificationId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  /**
   * Clear all read notifications
   */
  async clearReadNotifications(userId) {
    try {
      const { error } = await this.db
        .from('notifications')
        .delete()
        .eq('recipient_id', userId)
        .eq('is_read', true);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const { data: unread } = await this.db
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      const { data: total } = await this.db
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId);

      return {
        unreadCount: unread?.length || 0,
        totalCount: total?.length || 0
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { unreadCount: 0, totalCount: 0 };
    }
  }

  // ============ HELPER METHODS ============

  generateTitle(content) {
    const type = content.opportunity_type?.toLowerCase() || 'content';
    const typeLabel = {
      'job': 'Job Opportunity',
      'grant': 'Grant/Funding',
      'scholarship': 'Scholarship',
      'partnership': 'Partnership',
      'event': 'Event',
      'none': 'New Content'
    }[type] || 'New Content';

    return `${typeLabel}: ${content.title}`;
  }

  getIcon(opportunityType) {
    const icons = {
      'job': '💼',
      'grant': '💰',
      'scholarship': '🎓',
      'partnership': '🤝',
      'event': '📅',
      'none': '📢'
    };
    return icons[opportunityType] || '📢';
  }

  getTargetAudience(content, subscriber) {
    const matching = content.target_audiences?.find(aud =>
      subscriber.interested_audiences?.includes(aud)
    );
    return matching || null;
  }

  getMatchedTags(content, subscriber) {
    return content.tags?.filter(tag =>
      subscriber.interested_tags?.includes(tag)
    ) || [];
  }

  getMatchedAudiences(content, subscriber) {
    return content.target_audiences?.filter(aud =>
      subscriber.interested_audiences?.includes(aud)
    ) || [];
  }

  userCanSeeContent(userId, content) {
    // Check visibility and permissions
    // This is primarily enforced by RLS policies on backend
    // Frontend check for UX purposes
    if (content.visibility === 'public') return true;
    if (content.visibility === 'authenticated_only') return !!userId;
    return false; // RLS will handle detailed checks
  }

  /**
   * Create custom notification
   */
  async createCustomNotification(recipientId, notification) {
    try {
      const { data, error } = await this.db
        .from('notifications')
        .insert([{
          ...notification,
          recipient_id: recipientId,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating custom notification:', error);
      throw error;
    }
  }

  /**
   * Batch create notifications
   */
  async createBatchNotifications(notifications) {
    try {
      const { data, error } = await this.db
        .from('notifications')
        .insert(notifications.map(n => ({
          ...n,
          created_at: new Date().toISOString()
        })))
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
let notificationEngine = null;

export function initNotificationEngine(supabaseClient) {
  if (!notificationEngine) {
    notificationEngine = new NotificationEngine(supabaseClient);
  }
  return notificationEngine;
}

export function getNotificationEngine() {
  if (!notificationEngine) {
    throw new Error('NotificationEngine not initialized. Call initNotificationEngine first.');
  }
  return notificationEngine;
}
