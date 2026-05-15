/**
 * Authentication Module
 * Handles user authentication and authorization
 */

const Auth = {
  /**
   * Check if user is authenticated and has super admin role
   */
  async checkAuth() {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        window.location.href = '../auth-page/auth.html';
        return false;
      }

      const { data: profile, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        alert('Error loading user profile');
        window.location.href = '../auth-page/auth.html';
        return false;
      }

      if (profile.role !== 'super_admin') {
        alert('Unauthorized Access - Super Admin role required');
        window.location.href = '../index-page/index.html?error=unauthorized';
        return false;
      }

      document.getElementById('adminName').innerText = profile.full_name || 'Admin';
      return true;
    } catch (err) {
      console.error('Auth check error:', err);
      return false;
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await supabaseClient.auth.signOut();
      window.location.href = '../auth-page/auth.html';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Error logging out: ' + err.message);
    }
  }
};

// Make Auth globally available
window.Auth = Auth;
