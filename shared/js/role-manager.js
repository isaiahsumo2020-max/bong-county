/**
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * Manages user roles, permissions, and resource access
 * 
 * Features:
 * - 4-level role hierarchy
 * - Permission matrix
 * - Resource ownership
 * - County isolation
 * - Permission caching
 */

export class RoleManager {
  
  // Role definitions with hierarchy levels
  static ROLES = {
    VISITOR: 'visitor',
    CONTRIBUTOR: 'contributor',
    COUNTY_ADMIN: 'county_admin',
    SUPER_ADMIN: 'super_admin'
  };

  // Role levels for comparison
  static ROLE_LEVELS = {
    'visitor': 0,
    'contributor': 1,
    'county_admin': 2,
    'super_admin': 3
  };

  // Comprehensive permission matrix
  static PERMISSIONS = {
    // Content permissions
    'view:public_content': { level: 0, description: 'View public content' },
    'view:authenticated_content': { level: 1, description: 'View authenticated content' },
    'view:county_content': { level: 1, description: 'View county-specific content' },
    'view:admin_content': { level: 2, description: 'View admin-only content' },
    'view:private_content': { level: 3, description: 'View all private content' },
    
    'create:content': { level: 1, description: 'Create new content' },
    'edit:own_content': { level: 1, description: 'Edit own content' },
    'edit:county_content': { level: 2, description: 'Edit any county content' },
    'edit:any_content': { level: 3, description: 'Edit any content' },
    
    'delete:own_content': { level: 1, description: 'Delete own content' },
    'delete:county_content': { level: 2, description: 'Delete county content' },
    'delete:any_content': { level: 3, description: 'Delete any content' },
    
    'publish:content': { level: 1, description: 'Publish content' },
    'unpublish:content': { level: 2, description: 'Unpublish content' },
    
    // User management
    'view:users': { level: 2, description: 'View user list' },
    'view:all_users': { level: 3, description: 'View all users in system' },
    'manage:county_users': { level: 2, description: 'Manage county users' },
    'manage:users': { level: 3, description: 'Manage all users' },
    'create:user': { level: 3, description: 'Create new user' },
    'delete:user': { level: 3, description: 'Delete user' },
    'ban:user': { level: 2, description: 'Ban/suspend user' },
    'unban:user': { level: 3, description: 'Unban user' },
    
    // Permission management
    'assign:contributor': { level: 2, description: 'Assign contributor role' },
    'assign:county_admin': { level: 3, description: 'Assign county admin role' },
    'manage:permissions': { level: 3, description: 'Manage all permissions' },
    'revoke:permissions': { level: 2, description: 'Revoke permissions' },
    
    // Settings and configuration
    'manage:county_settings': { level: 2, description: 'Manage county settings' },
    'manage:system_settings': { level: 3, description: 'Manage system settings' },
    'configure:audiences': { level: 3, description: 'Configure audiences' },
    'configure:tags': { level: 3, description: 'Configure tags' },
    'configure:opportunity_types': { level: 3, description: 'Configure opportunity types' },
    
    // Analytics
    'view:analytics': { level: 1, description: 'View own analytics' },
    'view:county_analytics': { level: 2, description: 'View county analytics' },
    'view:admin_analytics': { level: 3, description: 'View all analytics' },
    
    // Moderation
    'moderate:content': { level: 2, description: 'Moderate content' },
    'remove:content': { level: 2, description: 'Remove content' },
    'moderate:users': { level: 3, description: 'Moderate users' },
    
    // Dashboard access
    'access:admin_dashboard': { level: 2, description: 'Access admin dashboard' },
    'access:super_admin_dashboard': { level: 3, description: 'Access super admin dashboard' }
  };

  /**
   * Get role hierarchy level
   */
  static getRoleLevel(role) {
    return this.ROLE_LEVELS[role] || 0;
  }

  /**
   * Check if role is valid
   */
  static isValidRole(role) {
    return Object.values(this.ROLES).includes(role);
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(user, permission) {
    if (!user || !user.role) return false;

    const permConfig = this.PERMISSIONS[permission];
    if (!permConfig) return false;

    const userLevel = this.getRoleLevel(user.role);
    return userLevel >= permConfig.level;
  }

  /**
   * Check multiple permissions (AND logic)
   */
  static hasAllPermissions(user, permissions) {
    return permissions.every(perm => this.hasPermission(user, perm));
  }

  /**
   * Check multiple permissions (OR logic)
   */
  static hasAnyPermission(user, permissions) {
    return permissions.some(perm => this.hasPermission(user, perm));
  }

  /**
   * Get all permissions for a role
   */
  static getPermissionsForRole(role) {
    const roleLevel = this.getRoleLevel(role);
    const permissions = {};
    
    for (const [perm, config] of Object.entries(this.PERMISSIONS)) {
      if (roleLevel >= config.level) {
        permissions[perm] = true;
      }
    }
    
    return permissions;
  }

  /**
   * Get permission description
   */
  static getPermissionDescription(permission) {
    return this.PERMISSIONS[permission]?.description || 'Unknown permission';
  }

  /**
   * Check if user owns resource
   */
  static isResourceOwner(user, resource) {
    if (!user || !resource) return false;
    return user.id === resource.author_id || user.id === resource.created_by;
  }

  /**
   * Check if user can edit resource
   */
  static canEditResource(user, resource) {
    // Owner can always edit own content
    if (this.isResourceOwner(user, resource)) {
      return this.hasPermission(user, 'edit:own_content');
    }

    // Admin can edit any content in county
    if (user.role === 'county_admin' && user.county === resource.county) {
      return this.hasPermission(user, 'edit:county_content');
    }

    // Super admin can edit anything
    if (user.role === 'super_admin') {
      return this.hasPermission(user, 'edit:any_content');
    }

    return false;
  }

  /**
   * Check if user can delete resource
   */
  static canDeleteResource(user, resource) {
    // Owner can delete own content
    if (this.isResourceOwner(user, resource)) {
      return this.hasPermission(user, 'delete:own_content');
    }

    // County admin can delete county content
    if (user.role === 'county_admin' && user.county === resource.county) {
      return this.hasPermission(user, 'delete:county_content');
    }

    // Super admin can delete anything
    if (user.role === 'super_admin') {
      return this.hasPermission(user, 'delete:any_content');
    }

    return false;
  }

  /**
   * Check if user has access to county
   */
  static hasCountyAccess(user, county) {
    if (!user) return false;

    // Super admin has access to all counties
    if (user.role === 'super_admin') return true;

    // County admin has access to their county
    if (user.role === 'county_admin') return user.county === county;

    // Contributors can view all public content
    if (user.role === 'contributor') return true;

    // Visitors can only view public content (enforced at content level)
    return false;
  }

  /**
   * Get accessible counties for user
   */
  static getAccessibleCounties(user) {
    if (!user) return [];

    if (user.role === 'super_admin') {
      return ['bong', 'grand_cape_mount', 'grand_bassa', 'lofa', 'montserrado', 'nimba', 'rivercess'];
    }

    if (user.role === 'county_admin') {
      return [user.county];
    }

    if (user.role === 'contributor') {
      return [user.county];
    }

    return [];
  }

  /**
   * Assign role to user
   */
  static async assignRole(targetUserId, newRole, assignedBy, assignedCounty = null) {
    if (!this.isValidRole(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    // Check if assignedBy has permission to assign this role
    const assignerLevel = this.getRoleLevel(assignedBy.role);
    const targetLevel = this.getRoleLevel(newRole);

    if (assignerLevel < targetLevel) {
      throw new Error('Insufficient permissions to assign this role');
    }

    // Validate county for county_admin role
    if (newRole === 'county_admin' && !assignedCounty) {
      throw new Error('County required for county_admin role');
    }

    return {
      userId: targetUserId,
      role: newRole,
      county: assignedCounty || null,
      assignedAt: new Date(),
      assignedBy: assignedBy.id
    };
  }

  /**
   * Revoke role from user
   */
  static revokeRole(targetUserId, revokedBy) {
    if (revokedBy.role !== 'super_admin') {
      throw new Error('Only super admins can revoke roles');
    }

    return {
      userId: targetUserId,
      role: 'visitor',
      revokedAt: new Date(),
      revokedBy: revokedBy.id
    };
  }

  /**
   * Check if user can promote/demote another user
   */
  static canManageUserRole(manager, targetUser, newRole) {
    // Can't change own role
    if (manager.id === targetUser.id) return false;

    // Super admin can manage anyone
    if (manager.role === 'super_admin') return true;

    // County admin can manage contributors in their county
    if (manager.role === 'county_admin' && targetUser.county === manager.county) {
      // But can only promote to contributor, not to county_admin or higher
      return this.getRoleLevel(newRole) === 1;
    }

    return false;
  }

  /**
   * Create role-based navigation
   */
  static getNavigationForRole(role) {
    const navItems = {
      'visitor': [
        { label: 'Home', path: '/', icon: '🏠' },
        { label: 'Counties', path: '/counties', icon: '🗺️' },
        { label: 'Tourism', path: '/tourism', icon: '✈️' },
        { label: 'Gallery', path: '/gallery', icon: '🖼️' },
        { label: 'About', path: '/about', icon: 'ℹ️' }
      ],
      'contributor': [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' },
        { label: 'Profile', path: '/profile', icon: '👤' },
        { label: 'My Content', path: '/my-content', icon: '📝' },
        { label: 'Notifications', path: '/notifications', icon: '🔔' },
        { label: 'Opportunities', path: '/opportunities', icon: '💡' },
        { label: 'Community', path: '/community', icon: '👥' }
      ],
      'county_admin': [
        { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { label: 'Content', path: '/admin/content', icon: '📝' },
        { label: 'Users', path: '/admin/users', icon: '👥' },
        { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
        { label: 'Analytics', path: '/admin/analytics', icon: '📈' }
      ],
      'super_admin': [
        { label: 'Dashboard', path: '/super-admin/dashboard', icon: '📊' },
        { label: 'Content', path: '/super-admin/content', icon: '📝' },
        { label: 'Users', path: '/super-admin/users', icon: '👥' },
        { label: 'System', path: '/super-admin/system', icon: '⚙️' },
        { label: 'Analytics', path: '/super-admin/analytics', icon: '📈' },
        { label: 'Configuration', path: '/super-admin/config', icon: '🔧' }
      ]
    };

    return navItems[role] || navItems['visitor'];
  }

  /**
   * Get dashboard components for role
   */
  static getDashboardComponents(role) {
    const components = {
      'visitor': ['public_content', 'featured_counties', 'galleries'],
      'contributor': ['my_stats', 'recent_content', 'notifications', 'opportunities', 'trending'],
      'county_admin': ['county_stats', 'content_overview', 'user_management', 'pending_content'],
      'super_admin': ['system_stats', 'all_content', 'all_users', 'system_health', 'analytics']
    };

    return components[role] || [];
  }

  /**
   * Validate role transition
   */
  static isValidRoleTransition(currentRole, newRole) {
    // Can't transition to same role
    if (currentRole === newRole) return false;

    // Define valid transitions
    const validTransitions = {
      'visitor': ['contributor'],
      'contributor': ['county_admin'], // Only super admin can promote further
      'county_admin': [],
      'super_admin': []
    };

    return validTransitions[currentRole]?.includes(newRole) || false;
  }

  /**
   * Get role capabilities summary
   */
  static getRoleCapabilities(role) {
    const perms = this.getPermissionsForRole(role);
    
    return {
      role: role,
      level: this.getRoleLevel(role),
      canCreateContent: !!perms['create:content'],
      canEditContent: !!perms['edit:own_content'],
      canManageUsers: !!perms['manage:county_users'],
      canViewAnalytics: !!perms['view:analytics'],
      canAccessAdmin: !!perms['access:admin_dashboard'],
      totalPermissions: Object.keys(perms).length
    };
  }

  /**
   * Compare two roles
   */
  static compareRoles(role1, role2) {
    const level1 = this.getRoleLevel(role1);
    const level2 = this.getRoleLevel(role2);

    return {
      role1: role1,
      role2: role2,
      level1: level1,
      level2: level2,
      role1IsHigher: level1 > level2,
      role2IsHigher: level2 > level1,
      isEqual: level1 === level2
    };
  }

  /**
   * Export role configuration
   */
  static exportConfiguration() {
    return {
      roles: this.ROLES,
      roleLevels: this.ROLE_LEVELS,
      permissions: this.PERMISSIONS,
      exportDate: new Date().toISOString()
    };
  }
}

export default RoleManager;
