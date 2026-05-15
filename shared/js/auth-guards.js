/**
 * AUTHENTICATION GUARDS & SECURITY
 * Frontend and backend protection for routes and resources
 * 
 * Features:
 * - Page access guards
 * - Content access verification
 * - API request validation
 * - Token management
 * - CSRF protection
 */

import { RoleManager } from './role-manager.js';
import { ContentVisibility } from './visibility.js';

export class AuthGuards {
  
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentUser = null;
    this.tokenCache = null;
    this.tokenExpiry = null;
  }

  /**
   * Initialize auth guards with current user
   */
  async initialize() {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) throw error;

      this.currentUser = data.session?.user || null;
      this.tokenCache = data.session?.access_token || null;
      
      return this.currentUser;
    } catch (error) {
      console.error('Error initializing auth guards:', error);
      return null;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(forceRefresh = false) {
    if (!forceRefresh && this.currentUser) {
      return this.currentUser;
    }

    return await this.initialize();
  }

  /**
   * Main guard for page access
   */
  async guardPageAccess(page, requiredRole = null) {
    const user = await this.getCurrentUser();

    // Check authentication requirement
    if (!user && page.requiresAuth) {
      return {
        allowed: false,
        redirect: `/auth?next=${encodeURIComponent(page.path)}`,
        reason: 'NOT_AUTHENTICATED',
        statusCode: 401
      };
    }

    // Check role requirement
    if (requiredRole && user) {
      const userLevel = RoleManager.getRoleLevel(user.role);
      const requiredLevel = RoleManager.getRoleLevel(requiredRole);

      if (userLevel < requiredLevel) {
        return {
          allowed: false,
          redirect: '/dashboard',
          reason: 'INSUFFICIENT_ROLE',
          statusCode: 403
        };
      }
    }

    // Check county access for county-specific pages
    if (page.county && user && user.role !== 'super_admin') {
      if (!RoleManager.hasCountyAccess(user, page.county)) {
        return {
          allowed: false,
          redirect: '/dashboard',
          reason: 'NO_COUNTY_ACCESS',
          statusCode: 403
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Guard for content access
   */
  async guardContentAccess(content, user) {
    if (!content) {
      return {
        allowed: false,
        reason: 'CONTENT_NOT_FOUND',
        statusCode: 404
      };
    }

    // Check visibility
    const canView = ContentVisibility.canSee(content, user);
    if (!canView) {
      return {
        allowed: false,
        reason: 'CONTENT_NOT_VISIBLE',
        statusCode: 403
      };
    }

    return { allowed: true };
  }

  /**
   * Guard for edit/delete operations
   */
  async guardResourceModification(resource, user, operation) {
    if (!resource) {
      return {
        allowed: false,
        reason: 'RESOURCE_NOT_FOUND',
        statusCode: 404
      };
    }

    const permission = `${operation}:content`;

    // Owner can always modify own content
    if (RoleManager.isResourceOwner(user, resource)) {
      return this.checkPermission(user, 'edit:own_content');
    }

    // Check role-based permission
    if (operation === 'edit' || operation === 'delete') {
      if (user.role === 'county_admin' && user.county === resource.county) {
        return this.checkPermission(user, `${operation}:county_content`);
      }

      if (user.role === 'super_admin') {
        return this.checkPermission(user, `${operation}:any_content`);
      }
    }

    return {
      allowed: false,
      reason: 'INSUFFICIENT_PERMISSION',
      statusCode: 403
    };
  }

  /**
   * Check if user has permission
   */
  checkPermission(user, permission) {
    if (!user) {
      return {
        allowed: false,
        reason: 'NOT_AUTHENTICATED',
        statusCode: 401
      };
    }

    if (!RoleManager.hasPermission(user, permission)) {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_PERMISSION',
        statusCode: 403
      };
    }

    return { allowed: true };
  }

  /**
   * Guard for API calls
   */
  async guardApiCall(endpoint, method, user) {
    // Verify authentication
    if (!user) {
      return {
        allowed: false,
        reason: 'NOT_AUTHENTICATED',
        statusCode: 401,
        headers: {}
      };
    }

    // Verify token is valid
    const token = await this.getAuthToken();
    if (!token) {
      return {
        allowed: false,
        reason: 'NO_AUTH_TOKEN',
        statusCode: 401,
        headers: {}
      };
    }

    // Verify token hasn't expired
    if (!await this.verifyToken(token)) {
      return {
        allowed: false,
        reason: 'INVALID_TOKEN',
        statusCode: 401,
        headers: {}
      };
    }

    // Return headers for API call
    return {
      allowed: true,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-ID': user.id,
        'X-User-Role': user.role
      }
    };
  }

  /**
   * Get auth token
   */
  async getAuthToken() {
    // Return cached token if still valid
    if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.tokenCache;
    }

    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) throw error;

      const token = data.session?.access_token;
      if (token) {
        // Cache token (expires in 1 hour typically)
        this.tokenCache = token;
        this.tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes
      }

      return token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Verify token is valid
   */
  async verifyToken(token) {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error) throw error;

      return !!data.user;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }

  /**
   * Check if token needs refresh
   */
  async refreshTokenIfNeeded() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (error) throw error;

      if (data.session) {
        this.tokenCache = data.session.access_token;
        this.tokenExpiry = Date.now() + (55 * 60 * 1000);
        this.currentUser = data.session.user;
      }

      return !!data.session;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.tokenCache = null;
      this.tokenExpiry = null;

      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check rate limiting
   */
  async checkRateLimit(userId, action) {
    // Store request timestamps
    const key = `rate_limit:${userId}:${action}`;
    const limits = window.localStorage.getItem(key);
    const currentTime = Date.now();

    let requests = [];
    if (limits) {
      requests = JSON.parse(limits).filter(t => currentTime - t < 60000); // Last 1 minute
    }

    // Different limits for different actions
    const limits_config = {
      'api_call': 100,
      'content_create': 10,
      'content_edit': 30,
      'comment': 50
    };

    const limit = limits_config[action] || 50;

    if (requests.length >= limit) {
      return {
        allowed: false,
        reason: 'RATE_LIMITED',
        retryAfter: Math.ceil((requests[0] + 60000 - currentTime) / 1000),
        statusCode: 429
      };
    }

    // Record this request
    requests.push(currentTime);
    window.localStorage.setItem(key, JSON.stringify(requests));

    return { allowed: true };
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token) {
    const storedToken = window.sessionStorage.getItem('csrf_token');
    return token === storedToken;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    const token = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);
    window.sessionStorage.setItem('csrf_token', token);
    return token;
  }

  /**
   * Comprehensive request validation
   */
  async validateRequest(request, user) {
    const checks = [
      { name: 'Authentication', check: () => !!user },
      { name: 'CSRF Token', check: () => this.validateCSRFToken(request.csrfToken) },
      { name: 'Rate Limit', check: () => this.checkRateLimit(user?.id, request.action) },
      { name: 'Input Validation', check: () => this.validateInput(request.data) }
    ];

    for (const check of checks) {
      if (typeof check.check === 'function') {
        const result = check.check();
        if (!result || (typeof result === 'object' && !result.allowed)) {
          return {
            valid: false,
            failedCheck: check.name,
            reason: result?.reason || 'Validation failed'
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validate and sanitize input
   */
  validateInput(data) {
    if (!data) return { valid: false, reason: 'No input data' };

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /['";--]/,  // SQL injection patterns
      /<script|javascript:|onerror=/i,  // XSS patterns
      /\.\.\//,   // Path traversal
    ];

    const dataString = JSON.stringify(data);

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(dataString)) {
        return { valid: false, reason: 'Suspicious input detected' };
      }
    }

    return { valid: true };
  }

  /**
   * Create secure API request
   */
  async createSecureRequest(endpoint, method, data) {
    const user = await this.getCurrentUser();
    const apiGuard = await this.guardApiCall(endpoint, method, user);

    if (!apiGuard.allowed) {
      throw new Error(`API Guard failed: ${apiGuard.reason}`);
    }

    // Validate request
    const validation = await this.validateRequest(
      { action: method, data, csrfToken: this.generateCSRFToken() },
      user
    );

    if (!validation.valid) {
      throw new Error(`Request validation failed: ${validation.reason}`);
    }

    return {
      method: method,
      headers: apiGuard.headers,
      body: method !== 'GET' ? JSON.stringify(data) : undefined
    };
  }

  /**
   * Get user's accessible resources
   */
  async getAccessibleResources(resourceType) {
    const user = await this.getCurrentUser();
    if (!user) return [];

    // Return resources based on user's role and permissions
    // This is a template - actual implementation depends on resource type
    const accessLevels = {
      'content': ['view:public_content'],
      'users': ['view:users'],
      'counties': RoleManager.getAccessibleCounties(user),
      'analytics': ['view:analytics']
    };

    return accessLevels[resourceType] || [];
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(action, resource, details) {
    const user = await this.getCurrentUser();
    if (!user) return null;

    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: action,
          resource_type: resource,
          details: JSON.stringify(details),
          timestamp: new Date().toISOString(),
          ip_address: await this.getClientIP()
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  /**
   * Get client IP (best effort)
   */
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if request is suspicious
   */
  isSuspiciousRequest(request) {
    // Check for unusual patterns
    const checks = [
      request.headers['user-agent']?.length > 500,  // Suspicious user agent
      request.data?.size > 10 * 1024 * 1024,        // Suspiciously large payload
      request.retries > 5,                           // Too many retries
    ];

    return checks.some(check => check);
  }
}

export default AuthGuards;
