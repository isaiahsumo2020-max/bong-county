/**
 * Reaction Bar Component
 * Reusable component for displaying and managing reactions
 * Supports: like, love, celebrate, insightful, sad
 */

class ReactionBar {
  constructor(options = {}) {
    this.contentId = options.contentId;
    this.containerId = options.containerId || 'reaction-bar';
    this.isAuthenticated = options.isAuthenticated || false;
    this.currentUser = options.currentUser || null;
    this.onReactionChange = options.onReactionChange || null;

    this.reactions = {
      like: 0,
      love: 0,
      celebrate: 0,
      insightful: 0,
      sad: 0
    };
    this.userReaction = null;
    this.subscriptions = [];
    this.showPicker = false;
    this.documentClickHandler = null;
  }

  /**
   * Initialize component and load reactions
   */
  async init() {
    try {
      this.render();
      await this.loadReactions();
      this.setupRealtime();
    } catch (error) {
      console.error('Error initializing reaction bar:', error);
      const container = this.getContainer();
      container?.appendChild(this.createStatus('Reactions could not be loaded.'));
    }
  }

  /**
   * Render the reaction bar UI
   */
  render() {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="reaction-bar">
        <div class="reactions-display">
          <button class="main-reaction-btn ${this.isAuthenticated ? 'authenticated' : 'guest'}">
            <span class="icon">👍</span>
            <span class="label">Like</span>
            <span class="count"></span>
          </button>

          <div class="reactions-summary">
            <span class="total-count">Loading reactions…</span>
          </div>
        </div>

        ${this.isAuthenticated ? `
          <div class="reaction-picker-container">
            <button class="picker-toggle" title="Add reaction">
              <span class="icon">+</span>
            </button>
            <div class="reaction-picker" style="display: none;">
              <button class="reaction-option" data-reaction="like" title="Like">👍</button>
              <button class="reaction-option" data-reaction="love" title="Love">❤️</button>
              <button class="reaction-option" data-reaction="celebrate" title="Celebrate">🎉</button>
              <button class="reaction-option" data-reaction="insightful" title="Insightful">💡</button>
              <button class="reaction-option" data-reaction="sad" title="Sad">😢</button>
            </div>
          </div>
        ` : `
          <button class="reaction-login-prompt" onclick="redirectToAuth(event)">
            <span class="icon">+</span>
            <span class="label">React</span>
          </button>
        `}
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const container = this.getContainer();
    if (!container) return;
    if (this.isAuthenticated) {
      // Main reaction button - toggle last used reaction
      container.querySelector('.main-reaction-btn')?.addEventListener('click', () => {
        this.toggleReaction();
      });

      // Picker toggle
      container.querySelector('.picker-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePicker();
      });

      // Reaction options
      container.querySelectorAll('.reaction-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const reactionType = btn.dataset.reaction;
          this.setReaction(reactionType);
        });
      });

      // Close picker when clicking outside
      this.documentClickHandler = (e) => {
        if (!e.target.closest('.reaction-picker-container')) {
          this.hidePicker();
        }
      };
      document.addEventListener('click', this.documentClickHandler);
    }

    // Show reaction counts on hover (desktop)
    container.querySelector('.total-count')?.addEventListener('mouseenter', () => {
      this.showReactionBreakdown();
    });
  }

  getContainer() {
    return document.getElementById(this.containerId);
  }

  /**
   * Load reactions from database
   */
  async loadReactions() {
    try {
      // Get all reactions for this content
      const reactions = await fetchReactions(this.contentId);
      this.reactions = reactions;

      // Get user's current reaction if authenticated
      if (this.isAuthenticated) {
        this.userReaction = await getUserReaction(this.contentId);
      }

      this.updateUI();
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  }

  /**
   * Update UI to reflect current reactions
   */
  updateUI() {
    const container = this.getContainer();
    if (!container) return;

    const totalCount = this.reactions.total || 0;
    const totalCountEl = container.querySelector('.total-count');
    if (totalCountEl) {
      totalCountEl.textContent = totalCount === 0 ? 'No reactions yet' : `${totalCount} reaction${totalCount !== 1 ? 's' : ''}`;
    }

    // Update main button
    if (this.isAuthenticated && this.userReaction) {
      const mainBtn = container.querySelector('.main-reaction-btn');
      mainBtn.classList.add('active');
      mainBtn.innerHTML = `
        <span class="icon">${this.getReactionEmoji(this.userReaction)}</span>
        <span class="label">${this.capitalizeReaction(this.userReaction)}</span>
        <span class="count">${this.reactions[this.userReaction] || 0}</span>
      `;
    } else {
      const mainBtn = container.querySelector('.main-reaction-btn');
      mainBtn.classList.remove('active');
      mainBtn.innerHTML = `
        <span class="icon">👍</span>
        <span class="label">Like</span>
        <span class="count">${this.reactions.like || 0}</span>
      `;
    }
  }

  /**
   * Toggle reaction with main button (use last reaction or default to like)
   */
  async toggleReaction() {
    if (!this.isAuthenticated) {
      redirectToAuth();
      return;
    }

    if (this.userReaction) {
      // Remove reaction
      await this.removeReaction();
    } else {
      // Add default like reaction
      await this.setReaction('like');
    }
  }

  /**
   * Set a specific reaction
   */
  async setReaction(reactionType) {
    if (!this.isAuthenticated) {
      redirectToAuth();
      return;
    }

    try {
      await addReaction(this.contentId, reactionType);
      this.userReaction = reactionType;

      await this.refreshReactions();
      this.hidePicker();

      if (this.onReactionChange) {
        this.onReactionChange(reactionType);
      }
    } catch (error) {
      console.error('Error setting reaction:', error);
      this.showError('Your reaction could not be saved. Please try again.');
    }
  }

  /**
   * Remove reaction
   */
  async removeReaction() {
    try {
      await removeReaction(this.contentId);

      await this.refreshReactions();

      if (this.onReactionChange) {
        this.onReactionChange(null);
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      this.showError('Your reaction could not be removed. Please try again.');
    }
  }

  /**
   * Toggle reaction picker visibility
   */
  togglePicker() {
    const picker = this.getContainer()?.querySelector('.reaction-picker');
    if (!picker) return;

    if (this.showPicker) {
      this.hidePicker();
    } else {
      this.showPicker = true;
      picker.style.display = 'flex';
    }
  }

  /**
   * Hide reaction picker
   */
  hidePicker() {
    const picker = this.getContainer()?.querySelector('.reaction-picker');
    if (picker) {
      picker.style.display = 'none';
      this.showPicker = false;
    }
  }

  /**
   * Show reaction breakdown on hover
   */
  showReactionBreakdown() {
    const container = this.getContainer();
    if (!container) return;

    const breakdown = this.getReactionBreakdown();
    if (breakdown.length === 0) return;

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'reaction-tooltip';
    tooltip.innerHTML = breakdown
      .map(({ type, count }) => `
        <div class="reaction-item">
          <span class="emoji">${this.getReactionEmoji(type)}</span>
          <span class="type">${this.capitalizeReaction(type)}</span>
          <span class="count">${count}</span>
        </div>
      `)
      .join('');

    container.querySelector('.total-count').appendChild(tooltip);

    // Remove tooltip on mouse leave
    container.addEventListener('mouseleave', () => {
      tooltip.remove();
    }, { once: true });
  }

  async refreshReactions() {
    this.reactions = await fetchReactions(this.contentId);
    this.userReaction = this.isAuthenticated ? await getUserReaction(this.contentId) : null;
    this.updateUI();
  }

  createStatus(message) {
    const status = document.createElement('p');
    status.className = 'reaction-status';
    status.setAttribute('role', 'status');
    status.textContent = message;
    return status;
  }

  showError(message) {
    const container = this.getContainer();
    if (!container) return;
    const total = container.querySelector('.total-count');
    if (total) total.textContent = 'Reaction counts unavailable';
    container.querySelector('.reaction-status')?.remove();
    container.appendChild(this.createStatus(message));
  }

  /**
   * Get reaction breakdown
   */
  getReactionBreakdown() {
    const breakdown = [];
    const order = ['like', 'love', 'celebrate', 'insightful', 'sad'];

    order.forEach(type => {
      if (this.reactions[type] > 0) {
        breakdown.push({ type, count: this.reactions[type] });
      }
    });

    return breakdown;
  }

  /**
   * Get emoji for reaction type
   */
  getReactionEmoji(reactionType) {
    const emojis = {
      like: '👍',
      love: '❤️',
      celebrate: '🎉',
      insightful: '💡',
      sad: '😢'
    };
    return emojis[reactionType] || '👍';
  }

  /**
   * Capitalize reaction type
   */
  capitalizeReaction(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Setup real-time updates
   */
  setupRealtime() {
    const reactionSub = subscribeToReactions(this.contentId, (update) => {
      if (update.event === 'INSERT') {
        this.reactions[update.data.reaction_type] = (this.reactions[update.data.reaction_type] || 0) + 1;
        this.reactions.total++;
      } else if (update.event === 'UPDATE') {
        const oldType = update.data.old_reaction_type;
        const newType = update.data.reaction_type;
        if (oldType !== newType) {
          this.reactions[oldType] = Math.max(0, (this.reactions[oldType] || 1) - 1);
          this.reactions[newType] = (this.reactions[newType] || 0) + 1;
        }
      } else if (update.event === 'DELETE') {
        this.reactions[update.data.reaction_type] = Math.max(0, (this.reactions[update.data.reaction_type] || 1) - 1);
        this.reactions.total = Math.max(0, this.reactions.total - 1);
      }

      this.updateUI();
    });

    this.subscriptions.push(reactionSub);
  }

  /**
   * Cleanup subscriptions
   */
  destroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      this.documentClickHandler = null;
    }
  }
}
