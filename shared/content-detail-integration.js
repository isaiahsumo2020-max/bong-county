/**
 * Content Detail Page Integration Example
 * Shows how to integrate Comments & Reactions system into a content page
 * This is a template - adapt to your specific content pages
 */

class ContentDetailPageWithEngagement {
  constructor(contentId) {
    this.contentId = contentId;
    this.content = null;
    this.currentUser = null;
    this.commentSystem = null;
    this.reactionBar = null;
  }

  /**
   * Initialize page
   */
  async init() {
    try {
      // Load current user
      this.currentUser = await getCurrentUser();

      // Load content
      await this.loadContent();

      // Render page
      await this.renderPage();

      // Initialize engagement components
      await this.initEngagementComponents();

      // Setup event listeners
      this.setupListeners();

      // Handle cleanup on unload
      this.setupCleanup();
    } catch (error) {
      console.error('Error initializing page:', error);
      this.showError('Failed to load page');
    }
  }

  /**
   * Load content from database
   */
  async loadContent() {
    try {
      const { data, error } = await supabaseClient
        .from('content')
        .select(`
          *,
          users:author_id (id, full_name, avatar_url),
          counties:county_id (id, name, slug)
        `)
        .eq('id', this.contentId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Content not found');

      // Check visibility permissions
      if (!this.canViewContent(data)) {
        throw new Error('You do not have permission to view this content');
      }

      this.content = data;
    } catch (error) {
      console.error('Error loading content:', error);
      throw error;
    }
  }

  /**
   * Check if user can view this content
   */
  canViewContent(content) {
    // Public content - anyone can view
    if (content.visibility === 'public') return true;

    // Authenticated only - user must be logged in
    if (content.visibility === 'authenticated_only') {
      return !!this.currentUser;
    }

    // County only - user must be from same county
    if (content.visibility === 'county_only') {
      if (!this.currentUser) return false;
      // Check user's county matches content's county
      return this.currentUser.county_id === content.county_id;
    }

    // Private - only author can view
    if (content.visibility === 'private') {
      return this.currentUser?.id === content.author_id;
    }

    return false;
  }

  /**
   * Render page content
   */
  async renderPage() {
    const container = document.getElementById('content-detail-container');
    if (!container) return;

    const content = this.content;
    const formattedDate = new Date(content.published_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    container.innerHTML = `
      <!-- Breadcrumb Navigation -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/?type=${content.type}">${this.capitalizeContentType(content.type)}</a>
        <span>/</span>
        <span aria-current="page">${this.escapeHtml(content.title)}</span>
      </nav>

      <!-- Content Header -->
      <article class="content-detail">
        <header class="content-header">
          <!-- Featured Image -->
          ${content.featured_image_url ? `
            <figure class="featured-image">
              <img
                src="${content.featured_image_url}"
                alt="${this.escapeHtml(content.title)}"
                loading="lazy"
              >
              <figcaption>${this.escapeHtml(content.title)}</figcaption>
            </figure>
          ` : ''}

          <!-- Title -->
          <h1 class="content-title">${this.escapeHtml(content.title)}</h1>

          <!-- Meta Information -->
          <div class="content-meta">
            <div class="author-info">
              <div class="author-avatar">
                ${content.users?.avatar_url ?
                  `<img src="${content.users.avatar_url}" alt="${content.users.full_name}">` :
                  `<div class="avatar-initials">${getAvatarInitials(content.users?.full_name || 'Anonymous')}</div>`
                }
              </div>
              <div class="author-details">
                <p class="author-name">${this.escapeHtml(content.users?.full_name || 'Anonymous')}</p>
                <p class="publish-date">
                  Published <time datetime="${content.published_at}">${formattedDate}</time>
                </p>
              </div>
            </div>

            <div class="content-tags">
              <span class="badge-type">${this.capitalizeContentType(content.type)}</span>
              ${content.counties ?
                `<span class="badge-county">${content.counties.name}</span>` : ''
              }
            </div>
          </div>
        </header>

        <!-- Content Body -->
        <div class="content-body">
          ${content.description ?
            `<p class="description">${this.escapeHtml(content.description)}</p>` : ''
          }

          <!-- Type-specific content -->
          ${this.renderTypeSpecificContent(content)}
        </div>

        <!-- Engagement Section -->
        <section class="engagement-section">
          <!-- Reaction Bar -->
          <div id="reaction-bar" class="engagement-component"></div>

          <!-- Engagement Stats -->
          <div class="engagement-stats">
            <div class="stat-item">
              <span class="stat-icon">💬</span>
              <span class="stat-value" id="comment-count">0</span>
              <span class="stat-label">Comments</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">👍</span>
              <span class="stat-value" id="reaction-count">0</span>
              <span class="stat-label">Reactions</span>
            </div>
          </div>

          <!-- Share Section (optional) -->
          <div class="share-section">
            <button class="share-btn" onclick="shareContent('${this.contentId}')">
              <span class="icon">🔗</span>
              Share
            </button>
          </div>
        </section>

        <!-- Comments Section -->
        <section class="comments-section">
          <h2>Comments & Discussion</h2>
          <div id="comments-container" class="engagement-component"></div>
        </section>
      </article>

      <!-- Related Content (optional) -->
      ${await this.renderRelatedContent(content)}
    `;
  }

  /**
   * Render type-specific content
   */
  renderTypeSpecificContent(content) {
    switch (content.type) {
      case 'news':
        return `<div class="news-content">${this.escapeHtml(content.body || '')}</div>`;

      case 'event':
        return `
          <div class="event-details">
            ${content.event_date ?
              `<p><strong>Date:</strong> ${new Date(content.event_date).toLocaleDateString()}</p>` : ''
            }
            ${content.event_location ?
              `<p><strong>Location:</strong> ${this.escapeHtml(content.event_location)}</p>` : ''
            }
            ${content.body ?
              `<div class="event-description">${this.escapeHtml(content.body)}</div>` : ''
            }
          </div>
        `;

      case 'opportunity':
        return `
          <div class="opportunity-details">
            ${content.opportunity_type ?
              `<p><strong>Type:</strong> ${this.escapeHtml(content.opportunity_type)}</p>` : ''
            }
            ${content.deadline ?
              `<p><strong>Deadline:</strong> ${new Date(content.deadline).toLocaleDateString()}</p>` : ''
            }
            ${content.body ?
              `<div class="opportunity-description">${this.escapeHtml(content.body)}</div>` : ''
            }
          </div>
        `;

      case 'tourism':
        return `
          <div class="tourism-details">
            ${content.category ?
              `<p><strong>Category:</strong> ${this.escapeHtml(content.category)}</p>` : ''
            }
            ${content.entrance_fee ?
              `<p><strong>Entrance Fee:</strong> ${this.formatCurrency(content.entrance_fee)}</p>` : ''
            }
            ${content.gps_coordinates ?
              `<p><strong>Location:</strong> <a href="https://maps.google.com/?q=${content.gps_coordinates}" target="_blank">View on Map</a></p>` : ''
            }
            ${content.body ?
              `<div class="tourism-description">${this.escapeHtml(content.body)}</div>` : ''
            }
          </div>
        `;

      default:
        return content.body ? `<div class="content-text">${this.escapeHtml(content.body)}</div>` : '';
    }
  }

  /**
   * Render related content
   */
  async renderRelatedContent(content) {
    try {
      const { data: relatedContent } = await supabaseClient
        .from('content')
        .select('id, title, featured_image_url, type')
        .eq('county_id', content.county_id)
        .eq('type', content.type)
        .neq('id', content.id)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .limit(4);

      if (!relatedContent || relatedContent.length === 0) return '';

      return `
        <section class="related-content">
          <h3>Related ${this.capitalizeContentType(content.type)}</h3>
          <div class="related-grid">
            ${relatedContent.map(item => `
              <a href="?id=${item.id}" class="related-card">
                ${item.featured_image_url ?
                  `<img src="${item.featured_image_url}" alt="${this.escapeHtml(item.title)}">` :
                  `<div class="placeholder-image"></div>`
                }
                <h4>${this.escapeHtml(item.title)}</h4>
              </a>
            `).join('')}
          </div>
        </section>
      `;
    } catch (error) {
      console.error('Error loading related content:', error);
      return '';
    }
  }

  /**
   * Initialize engagement components (comments and reactions)
   */
  async initEngagementComponents() {
    // Initialize Reaction Bar
    this.reactionBar = new ReactionBar({
      contentId: this.contentId,
      containerId: 'reaction-bar',
      isAuthenticated: !!this.currentUser,
      currentUser: this.currentUser,
      onReactionChange: () => {
        this.updateEngagementStats();
      }
    });
    await this.reactionBar.init();

    // Initialize Comment System
    this.commentSystem = new CommentSystem({
      contentId: this.contentId,
      containerId: 'comments-container',
      isAuthenticated: !!this.currentUser,
      currentUser: this.currentUser,
      onCommentAdded: () => {
        this.updateEngagementStats();
      }
    });
    await this.commentSystem.init();

    // Load initial engagement stats
    this.updateEngagementStats();
  }

  /**
   * Update engagement stats (comment count, reaction count)
   */
  async updateEngagementStats() {
    try {
      const stats = await getEngagementStats(this.contentId);

      const commentCountEl = document.getElementById('comment-count');
      const reactionCountEl = document.getElementById('reaction-count');

      if (commentCountEl) {
        commentCountEl.textContent = stats.commentCount;
      }

      if (reactionCountEl) {
        reactionCountEl.textContent = stats.totalReactions;
      }
    } catch (error) {
      console.error('Error updating engagement stats:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Add any page-specific event listeners
  }

  /**
   * Setup cleanup on page unload
   */
  setupCleanup() {
    window.addEventListener('beforeunload', () => {
      if (this.commentSystem) {
        this.commentSystem.destroy();
      }
      if (this.reactionBar) {
        this.reactionBar.destroy();
      }
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    const container = document.getElementById('content-detail-container');
    if (container) {
      container.innerHTML = `
        <div class="error-alert">
          <h2>Error</h2>
          <p>${this.escapeHtml(message)}</p>
          <a href="/" class="btn-primary">Go Home</a>
        </div>
      `;
    }
  }

  /**
   * Utility: Escape HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Utility: Capitalize content type
   */
  capitalizeContentType(type) {
    const map = {
      news: 'News',
      event: 'Event',
      opportunity: 'Opportunity',
      tourism: 'Tourism'
    };
    return map[type] || type;
  }

  /**
   * Utility: Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

/**
 * Share content helper
 */
function shareContent(contentId) {
  const url = window.location.href;

  // Use native share API if available
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: url
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: Copy link to clipboard
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  }
}

/**
 * Redirect to authentication page
 */
function redirectToAuth(event) {
  if (event) {
    event.preventDefault();
  }
  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = window.location.origin + '/auth-page/auth.html?redirect=' + returnUrl;
}

/**
 * Initialize page on load
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Get content ID from URL
  const params = new URLSearchParams(window.location.search);
  const contentId = params.get('id');

  if (!contentId) {
    console.error('No content ID provided');
    window.location.href = window.location.origin + '/';
    return;
  }

  // Initialize page
  const page = new ContentDetailPageWithEngagement(contentId);
  await page.init();

  // Store for global access (optional)
  window.contentDetailPage = page;
});
