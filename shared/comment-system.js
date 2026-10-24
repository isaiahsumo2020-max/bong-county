/**
 * Comments System Component
 * Reusable component for displaying and managing comments with nested replies
 * Works for: news posts, stories, opportunities, events, community posts
 */

class CommentSystem {
  constructor(options = {}) {
    this.contentId = options.contentId;
    this.containerId = options.containerId || 'comments-container';
    this.root = null;
    this.isAuthenticated = options.isAuthenticated || false;
    this.currentUser = options.currentUser || null;
    this.onCommentAdded = options.onCommentAdded || null;

    this.comments = [];
    this.currentPage = 0;
    this.hasMore = true;
    this.isLoading = false;
    this.subscriptions = [];

    this.pageSize = options.pageSize || 20;
    this.replyPageSize = options.replyPageSize || 5;
  }

  /**
   * Initialize component and load initial comments
   */
  async init() {
    try {
      this.render();
      await this.loadComments();
      this.setupRealtime();
    } catch (error) {
      console.error('Error initializing comment system:', error);
      this.showError('Failed to load comments');
    }
  }

  /**
   * Render the comment system UI
   */
  render() {
    const container = this.getRoot();
    if (!container) return;

    container.innerHTML = `
      <div class="comments-system">
        <!-- Comment Form (if authenticated) -->
        ${this.isAuthenticated ? `
          <div class="comment-form-wrapper">
            <div class="comment-form">
              <div class="comment-form-header">
                <h3>Share your thoughts</h3>
              </div>
              <form id="main-comment-form">
                <textarea
                  id="comment-input"
                  placeholder="What are your thoughts? (min 2 characters)"
                  rows="3"
                  minlength="2"
                  maxlength="5000"
                  required
                ></textarea>
                <div class="comment-form-actions">
                  <button type="submit" class="btn-primary">Post Comment</button>
                  <span class="char-count"><span id="char-count">0</span>/5000</span>
                </div>
              </form>
            </div>
          </div>
        ` : `
          <div class="comment-prompt-guest">
            <p>Join the conversation! <a href="#" onclick="redirectToAuth(event)">Sign in</a> to comment and react.</p>
          </div>
        `}

        <!-- Comments List -->
        <div class="comments-list">
          <div id="comments-loading" class="loading-skeleton" style="display: none;">
            ${this.getSkeletonLoader()}
          </div>
          <div id="comments-empty" class="empty-state" style="display: none;">
            <div class="empty-content">
              <h4>No comments yet</h4>
              <p>Be the first to share your thoughts!</p>
            </div>
          </div>
          <div id="comments-container"></div>
        </div>

        <!-- Load More Button -->
        <div id="load-more-wrapper" style="display: none;">
          <button id="load-more-btn" class="btn-secondary">Load More Comments</button>
        </div>

        <!-- Error Message -->
        <div id="error-message" class="error-message" style="display: none;"></div>
      </div>
    `;

    // Attach event listeners
    if (this.isAuthenticated) {
      this.getElement('main-comment-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitComment();
      });

      this.getElement('comment-input')?.addEventListener('input', (e) => {
        const count = this.getElement('char-count');
        if (count) count.textContent = e.target.value.length;
      });
    }

    this.getElement('load-more-btn')?.addEventListener('click', () => {
      this.loadComments(true);
    });
  }

  getRoot() {
    this.root = document.getElementById(this.containerId);
    return this.root;
  }

  getElement(id) {
    const root = this.root || this.getRoot();
    return root?.querySelector(`#${CSS.escape(id)}`) || null;
  }

  /**
   * Load comments from database
   */
  async loadComments(loadMore = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const offset = loadMore ? this.currentPage * this.pageSize : 0;
      const comments = await fetchComments(this.contentId, this.pageSize, offset);

      if (loadMore) {
        this.comments.push(...comments);
      } else {
        this.comments = comments;
      }

      this.currentPage++;
      this.hasMore = comments.length === this.pageSize;

      this.renderComments();
    } catch (error) {
      console.error('Error loading comments:', error);
      this.showError('Failed to load comments');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render comments list
   */
  renderComments() {
    const container = this.getElement('comments-container');
    const emptyState = this.getElement('comments-empty');
    const loadMoreBtn = this.getElement('load-more-wrapper');

    if (!container) return;

    if (this.comments.length === 0 && this.currentPage === 1) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      loadMoreBtn.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';

    // Render only comments on current view (avoid re-rendering)
    this.comments.forEach((comment, index) => {
      if (!this.getElement(`comment-${comment.id}`)) {
        const commentEl = this.createCommentElement(comment);
        container.appendChild(commentEl);
      }
    });

    // Show/hide load more
    loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
  }

  /**
   * Create a single comment element
   */
  createCommentElement(comment) {
    const wrapper = document.createElement('div');
    wrapper.id = `comment-${comment.id}`;
    wrapper.className = 'comment-item';

    const isOwner = this.currentUser?.id === comment.user_id;
    const isDeleted = comment.is_deleted;
    const rawAuthorName = comment.users?.full_name || 'Anonymous';
    const authorName = this.escapeHtml(rawAuthorName);

    wrapper.innerHTML = `
      <div class="comment-content">
        <div class="comment-header">
          <div class="comment-user">
            <div class="user-avatar">${this.escapeHtml(getAvatarInitials(rawAuthorName))}</div>
            <div class="user-info">
              <h4 class="user-name">${authorName}</h4>
              <span class="comment-time">${getRelativeTime(comment.created_at)}</span>
              ${comment.is_edited ? '<span class="edited-badge">(edited)</span>' : ''}
            </div>
          </div>
          ${isOwner && !isDeleted ? `
            <div class="comment-actions">
              <button class="action-btn edit-btn" title="Edit">✎</button>
              <button class="action-btn delete-btn" title="Delete">✕</button>
            </div>
          ` : ''}
        </div>

        <div class="comment-body">
          ${isDeleted ?
            '<em class="deleted-text">This comment has been deleted</em>' :
            `<p>${this.escapeHtml(comment.body)}</p>`
          }
        </div>

        ${!isDeleted ? `
          <div class="comment-actions-bar">
            <button class="reply-btn" data-comment-id="${comment.id}">
              <span class="icon">↳</span> Reply
            </button>
            <span class="reply-count" data-comment-id="${comment.id}" style="display: none;"></span>
          </div>

          <div class="replies-section" id="replies-${comment.id}">
            <!-- Replies will be loaded here -->
          </div>
        ` : ''}
      </div>
    `;

    // Attach event listeners
    if (isOwner && !isDeleted) {
      wrapper.querySelector('.edit-btn').addEventListener('click', () => this.editComment(comment));
      wrapper.querySelector('.delete-btn').addEventListener('click', () => this.deleteComment(comment.id));
    }

    if (!isDeleted) {
      wrapper.querySelector('.reply-btn').addEventListener('click', () => {
        this.showReplyForm(comment.id);
      });
    }

    return wrapper;
  }

  /**
   * Submit a new comment
   */
  async submitComment() {
    if (!this.isAuthenticated) {
      redirectToAuth();
      return;
    }

    const input = this.getElement('comment-input');
    if (!input) return;
    const body = input.value.trim();

    if (!body) {
      this.showError('Comment cannot be empty');
      return;
    }

    try {
      const comment = await createComment(this.contentId, body);
      input.value = '';
      const count = this.getElement('char-count');
      if (count) count.textContent = '0';

      // Add to beginning of list
      this.comments.unshift(comment);
      this.renderComments();

      this.showSuccess('Comment posted!');
      if (this.onCommentAdded) this.onCommentAdded(comment);
    } catch (error) {
      console.error('Error submitting comment:', error);
      this.showError('Failed to post comment');
    }
  }

  /**
   * Show reply form for a comment
   */
  showReplyForm(parentCommentId) {
    if (!this.isAuthenticated) {
      redirectToAuth();
      return;
    }

    const repliesSection = this.getElement(`replies-${parentCommentId}`);
    if (!repliesSection) return;

    // Check if form already exists
    if (repliesSection.querySelector('.reply-form')) return;

    const form = document.createElement('div');
    form.className = 'reply-form';
    form.innerHTML = `
      <textarea
        class="reply-input"
        placeholder="Write a reply... (min 2 characters)"
        minlength="2"
        maxlength="5000"
        rows="2"
      ></textarea>
      <div class="reply-actions">
        <button class="reply-submit-btn btn-primary">Reply</button>
        <button class="reply-cancel-btn btn-secondary">Cancel</button>
      </div>
    `;

    repliesSection.appendChild(form);

    form.querySelector('.reply-submit-btn').addEventListener('click', () => {
      this.submitReply(parentCommentId, form);
    });

    form.querySelector('.reply-cancel-btn').addEventListener('click', () => {
      form.remove();
    });

    form.querySelector('.reply-input').focus();
  }

  /**
   * Submit a reply to a comment
   */
  async submitReply(parentCommentId, formElement) {
    const textarea = formElement.querySelector('.reply-input');
    const body = textarea.value.trim();

    if (!body) {
      this.showError('Reply cannot be empty');
      return;
    }

    try {
      const reply = await createComment(this.contentId, body, parentCommentId);
      formElement.remove();

      // Load and display replies
      this.loadCommentReplies(parentCommentId);
      this.showSuccess('Reply posted!');
    } catch (error) {
      console.error('Error submitting reply:', error);
      this.showError('Failed to post reply');
    }
  }

  /**
   * Load replies for a comment
   */
  async loadCommentReplies(parentCommentId) {
    try {
      const replies = await fetchCommentReplies(parentCommentId, this.replyPageSize);
      const repliesSection = this.getElement(`replies-${parentCommentId}`);

      if (!repliesSection) return;

      // Remove existing replies (except form)
      repliesSection.querySelectorAll('.reply-item').forEach(el => el.remove());

      if (replies.length === 0) return;

      replies.forEach(reply => {
        const replyEl = this.createReplyElement(reply);
        repliesSection.appendChild(replyEl);
      });

      // Update reply count
      const replyCount = this.getRoot()?.querySelector(`[data-comment-id="${parentCommentId}"]`);
      if (replyCount) {
        replyCount.textContent = `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`;
        replyCount.style.display = 'inline';
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  }

  /**
   * Create a single reply element
   */
  createReplyElement(reply) {
    const wrapper = document.createElement('div');
    wrapper.id = `reply-${reply.id}`;
    wrapper.className = 'reply-item';

    const isOwner = this.currentUser?.id === reply.user_id;
    const isDeleted = reply.is_deleted;
    const rawAuthorName = reply.users?.full_name || 'Anonymous';
    const authorName = this.escapeHtml(rawAuthorName);

    wrapper.innerHTML = `
      <div class="reply-content">
        <div class="reply-header">
          <div class="reply-user">
            <div class="user-avatar-small">${this.escapeHtml(getAvatarInitials(rawAuthorName))}</div>
            <div class="user-info-small">
              <h5>${authorName}</h5>
              <span>${getRelativeTime(reply.created_at)}</span>
            </div>
          </div>
          ${isOwner && !isDeleted ? `
            <div class="reply-actions">
              <button class="action-btn edit-btn-reply" title="Edit">✎</button>
              <button class="action-btn delete-btn-reply" title="Delete">✕</button>
            </div>
          ` : ''}
        </div>

        <div class="reply-body">
          ${isDeleted ?
            '<em class="deleted-text">This reply has been deleted</em>' :
            `<p>${this.escapeHtml(reply.body)}</p>`
          }
        </div>
      </div>
    `;

    if (isOwner && !isDeleted) {
      wrapper.querySelector('.edit-btn-reply').addEventListener('click', () => this.editComment(reply));
      wrapper.querySelector('.delete-btn-reply').addEventListener('click', () => this.deleteComment(reply.id));
    }

    return wrapper;
  }

  /**
   * Edit a comment
   */
  async editComment(comment) {
    const container = this.getElement(`comment-${comment.id}`) || this.getElement(`reply-${comment.id}`);
    if (!container) return;

    const body = container.querySelector('.comment-body, .reply-body');
    if (!body) return;

    const originalBody = comment.body;
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
      <textarea class="edit-input" rows="3" maxlength="5000">${this.escapeHtml(originalBody)}</textarea>
      <div class="edit-actions">
        <button class="save-btn btn-primary">Save</button>
        <button class="cancel-btn btn-secondary">Cancel</button>
      </div>
    `;

    body.replaceWith(editForm);

    editForm.querySelector('.save-btn').addEventListener('click', async () => {
      const newBody = editForm.querySelector('.edit-input').value.trim();
      if (newBody !== originalBody) {
        try {
          await updateComment(comment.id, newBody);
          comment.body = newBody;
          comment.is_edited = true;
          this.renderComments();
          this.showSuccess('Comment updated!');
        } catch (error) {
          console.error('Error updating comment:', error);
          this.showError('Failed to update comment');
        }
      } else {
        this.renderComments();
      }
    });

    editForm.querySelector('.cancel-btn').addEventListener('click', () => {
      this.renderComments();
    });
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);

      // Update UI
      const comment = this.comments.find(c => c.id === commentId);
      if (comment) {
        comment.is_deleted = true;
      }
      this.renderComments();
      this.showSuccess('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      this.showError('Failed to delete comment');
    }
  }

  /**
   * Setup real-time updates
   */
  setupRealtime() {
    const commentSub = subscribeToComments(this.contentId, (update) => {
      if (update.event === 'INSERT') {
        this.comments.unshift(update.data);
        this.renderComments();
      } else if (update.event === 'UPDATE') {
        const index = this.comments.findIndex(c => c.id === update.data.id);
        if (index !== -1) {
          this.comments[index] = update.data;
          this.renderComments();
        }
      } else if (update.event === 'DELETE') {
        const index = this.comments.findIndex(c => c.id === update.data.id);
        if (index !== -1) {
          this.comments.splice(index, 1);
          this.renderComments();
        }
      }
    });

    this.subscriptions.push(commentSub);
  }

  /**
   * Get skeleton loader HTML
   */
  getSkeletonLoader() {
    return `
      ${Array(3).fill(`
        <div class="skeleton-comment">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
      `).join('')}
    `;
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorEl = this.getElement('error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // Implement toast notification
    console.log('✓', message);
  }

  /**
   * Escape HTML to prevent XSS
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
   * Cleanup subscriptions
   */
  destroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
