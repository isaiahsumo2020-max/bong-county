/**
 * ACCOUNT SETTINGS FORM MODULE
 * Manages user profile, security, and notification preferences
 * Schema: users table (no separate profiles table)
 * - Update profile (name, bio, organization info)
 * - Avatar upload
 * - Email change
 * - Password change
 * - Notification preferences
 */

const AccountSettingsForm = (() => {
  const sb = window.supabaseClient;

  // ─────────────────────────────────────────
  // FETCH PROFILE DATA
  // ─────────────────────────────────────────
  async function getProfileData(userId) {
    try {
      const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, data };

    } catch (error) {
      console.error('✗ Error fetching profile:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // UPDATE PROFILE
  // ─────────────────────────────────────────
  async function updateProfile(userId, profileData) {
    try {
      const {
        full_name,
        bio,
        county_id,
        profile_visibility,
        organization_name,
        organization_description,
        website_url
      } = profileData;

      // Validate required fields
      if (!full_name || full_name.trim().length === 0) {
        throw new Error('Full name is required');
      }

      const updatePayload = {
        full_name: full_name.trim(),
        bio: bio ? bio.trim().substring(0, 500) : '',
        county_id: county_id || null,
        profile_visibility: profile_visibility || 'public',
        organization_name: organization_name ? organization_name.trim() : null,
        organization_description: organization_description ? organization_description.trim() : null,
        website_url: website_url ? website_url.trim() : null,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile...');

      const { data, error } = await sb
        .from('users')
        .update(updatePayload)
        .eq('id', userId)
        .select();

      if (error) throw error;

      console.log('✓ Profile updated');
      return { success: true, data: data?.[0] };

    } catch (error) {
      console.error('✗ Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // UPDATE AVATAR
  // ─────────────────────────────────────────
  async function uploadAvatar(file, userId) {
    try {
      if (!file) return { success: false, error: 'No file provided' };

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;

      console.log(`Uploading avatar to ${filePath}...`);

      const { data, error } = await sb.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = sb.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with avatar URL
      const { error: updateError } = await sb
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.warn('Avatar uploaded but profile update failed', updateError);
      }

      console.log('✓ Avatar uploaded:', publicUrl);
      return { success: true, url: publicUrl };

    } catch (error) {
      console.error('✗ Error uploading avatar:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // UPDATE EMAIL
  // ─────────────────────────────────────────
  async function updateEmail(newEmail) {
    try {
      if (!newEmail || !newEmail.includes('@')) {
        throw new Error('Valid email is required');
      }

      console.log('Updating email...');

      const { data, error } = await sb.auth.updateUser({
        email: newEmail.trim(),
      });

      if (error) throw error;

      console.log('✓ Email update initiated. Please check your email for confirmation.');
      return { success: true };

    } catch (error) {
      console.error('✗ Error updating email:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // UPDATE PASSWORD
  // ─────────────────────────────────────────
  async function updatePassword(newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      console.log('Updating password...');

      const { data, error } = await sb.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      console.log('✓ Password updated');
      return { success: true };

    } catch (error) {
      console.error('✗ Error updating password:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // UPDATE NOTIFICATION PREFERENCES
  // ─────────────────────────────────────────
  async function updateNotificationPreferences(userId, preferences) {
    try {
      // preferences format: { topic_slug: boolean, ... }
      // Example: { agriculture: true, youth: false, ... }

      console.log('Updating notification preferences...');

      // Get all notification topics
      const { data: topics, error: topicsError } = await sb
        .from('notification_topics')
        .select('id, slug')
        .eq('is_active', true);

      if (topicsError) throw topicsError;

      // Delete existing subscriptions
      const { error: deleteError } = await sb
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) console.warn('Could not delete old subscriptions', deleteError);

      // Insert new subscriptions
      const subscriptions = [];
      for (const topic of topics || []) {
        if (preferences[topic.slug] === true) {
          subscriptions.push({
            user_id: userId,
            topic_id: topic.id,
            subscribed_at: new Date().toISOString()
          });
        }
      }

      if (subscriptions.length > 0) {
        const { error: insertError } = await sb
          .from('user_subscriptions')
          .insert(subscriptions);

        if (insertError) throw insertError;
      }

      console.log('✓ Notification preferences updated');
      return { success: true };

    } catch (error) {
      console.error('✗ Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // GET NOTIFICATION PREFERENCES
  // ─────────────────────────────────────────
  async function getNotificationPreferences(userId) {
    try {
      const { data: subscriptions, error } = await sb
        .from('user_subscriptions')
        .select('topic_id, notification_topics(slug)')
        .eq('user_id', userId);

      if (error) throw error;

      // Convert to object: { topic_slug: true, ... }
      const prefs = {};
      for (const sub of subscriptions || []) {
        if (sub.notification_topics?.slug) {
          prefs[sub.notification_topics.slug] = true;
        }
      }

      return { success: true, data: prefs };

    } catch (error) {
      console.error('✗ Error fetching notification preferences:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  // ─────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────
  return {
    getProfileData,
    updateProfile,
    uploadAvatar,
    updateEmail,
    updatePassword,
    updateNotificationPreferences,
    getNotificationPreferences,
  };
})();

// Make available globally
window.AccountSettingsForm = AccountSettingsForm;
