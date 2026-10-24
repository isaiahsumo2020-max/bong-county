/**
 * Comments & Reactions API Helpers
 * Complete utility functions for comment and reaction operations
 * Integrates with Supabase for CRUD, real-time, and aggregation
 */

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

/**
 * Fetch comments for a content item with pagination
 * @param {string} contentId - UUID of the content
 * @param {number} limit - Number of comments to fetch (default: 20)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Promise<Array>} Array of comment objects
 */
async function fetchComments(contentId, limit = 20, offset = 0) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const { data, error } = await supabaseClient
      .from('content_comments')
      .select(`
        id,
        body,
        is_edited,
        is_deleted,
        created_at,
        updated_at,
        user_id,
        parent_comment_id,
        users!content_comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('content_id', contentId)
      .eq('parent_comment_id', null)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

/**
 * Fetch replies to a specific comment
 * @param {string} parentCommentId - UUID of the parent comment
 * @param {number} limit - Number of replies to fetch (default: 10)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Promise<Array>} Array of reply objects
 */
async function fetchCommentReplies(parentCommentId, limit = 10, offset = 0) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const { data, error } = await supabaseClient
      .from('content_comments')
      .select(`
        id,
        body,
        is_edited,
        is_deleted,
        created_at,
        updated_at,
        user_id,
        parent_comment_id,
        users!content_comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('parent_comment_id', parentCommentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    return [];
  }
}

/**
 * Get a single comment with full details
 * @param {string} commentId - UUID of the comment
 * @returns {Promise<Object|null>} Comment object or null
 */
async function fetchComment(commentId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const { data, error } = await supabaseClient
      .from('content_comments')
      .select(`
        *,
        users!content_comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', commentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching comment:', error);
    return null;
  }
}

/**
 * Create a new comment or reply
 * @param {string} contentId - UUID of the content being commented on
 * @param {string} body - Comment text
 * @param {string|null} parentCommentId - UUID of parent comment (if a reply)
 * @returns {Promise<Object|null>} Created comment object or null
 */
async function createComment(contentId, body, parentCommentId = null) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!body || body.trim().length === 0) {
      throw new Error('Comment body cannot be empty');
    }

    const { data, error } = await supabaseClient
      .from('content_comments')
      .insert([{
        content_id: contentId,
        user_id: user.id,
        body: body.trim(),
        parent_comment_id: parentCommentId || null
      }])
      .select(`
        *,
        users!content_comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    // Trigger notification if not self-comment
    if (parentCommentId) {
      await notifyCommentReply(commentId, user.id);
    } else {
      await notifyNewComment(contentId, user.id);
    }

    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

/**
 * Update a comment
 * @param {string} commentId - UUID of the comment
 * @param {string} body - Updated comment text
 * @returns {Promise<Object|null>} Updated comment object or null
 */
async function updateComment(commentId, body) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (!body || body.trim().length === 0) {
      throw new Error('Comment body cannot be empty');
    }

    // Verify ownership
    const comment = await fetchComment(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.user_id !== user.id) throw new Error('Unauthorized');

    const { data, error } = await supabaseClient
      .from('content_comments')
      .update({
        body: body.trim(),
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        users!content_comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

/**
 * Soft delete a comment (mark as deleted)
 * @param {string} commentId - UUID of the comment
 * @returns {Promise<boolean>} Success status
 */
async function deleteComment(commentId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Verify ownership
    const comment = await fetchComment(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.user_id !== user.id) throw new Error('Unauthorized');

    const { error } = await supabaseClient
      .from('content_comments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

// ============================================================================
// REACTION OPERATIONS
// ============================================================================

/**
 * Get all reactions for a content item
 * @param {string} contentId - UUID of the content
 * @returns {Promise<Object>} Object with reaction counts by type
 */
async function fetchReactions(contentId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const { data, error } = await supabaseClient
      .from('content_reactions')
      .select('reaction_type, id')
      .eq('content_id', contentId);

    if (error) throw error;

    // Aggregate reactions by type
    const reactions = {
      like: 0,
      love: 0,
      celebrate: 0,
      insightful: 0,
      sad: 0,
      total: 0
    };

    if (data) {
      data.forEach(reaction => {
        if (reactions.hasOwnProperty(reaction.reaction_type)) {
          reactions[reaction.reaction_type]++;
          reactions.total++;
        }
      });
    }

    return reactions;
  } catch (error) {
    console.error('Error fetching reactions:', error);
    throw error;
  }
}

/**
 * Get user's current reaction on a content item
 * @param {string} contentId - UUID of the content
 * @returns {Promise<string|null>} Reaction type or null
 */
async function getUserReaction(contentId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
      .from('content_reactions')
      .select('reaction_type')
      .eq('content_id', contentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data?.reaction_type || null;
  } catch (error) {
    console.error('Error fetching user reaction:', error);
    return null;
  }
}

/**
 * Add or update a reaction
 * @param {string} contentId - UUID of the content
 * @param {string} reactionType - Type of reaction (like, love, celebrate, insightful, sad)
 * @returns {Promise<Object|null>} Created/updated reaction or null
 */
async function addReaction(contentId, reactionType) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const validReactions = ['like', 'love', 'celebrate', 'insightful', 'sad'];
    if (!validReactions.includes(reactionType)) {
      throw new Error(`Invalid reaction type: ${reactionType}`);
    }

    // Check if reaction already exists
    const { data: existingReaction, error: fetchError } = await supabaseClient
      .from('content_reactions')
      .select('id,reaction_type')
      .eq('content_id', contentId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (existingReaction?.reaction_type === reactionType) return existingReaction;

    let result;

    if (existingReaction) {
      // Update existing reaction
      const { data, error } = await supabaseClient
        .from('content_reactions')
        .update({
          reaction_type: reactionType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReaction.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new reaction
      const { data, error } = await supabaseClient
        .from('content_reactions')
        .insert([{
          content_id: contentId,
          user_id: user.id,
          reaction_type: reactionType
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Trigger notification
      await notifyNewReaction(contentId, user.id, reactionType);
    }

    return result;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

/**
 * Remove a reaction
 * @param {string} contentId - UUID of the content
 * @returns {Promise<boolean>} Success status
 */
async function removeReaction(contentId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabaseClient
      .from('content_reactions')
      .delete()
      .eq('content_id', contentId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
}

// ============================================================================
// ENGAGEMENT STATS
// ============================================================================

/**
 * Get comprehensive engagement stats for a content item
 * @param {string} contentId - UUID of the content
 * @returns {Promise<Object>} Engagement statistics
 */
async function getEngagementStats(contentId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    // Get comment stats
    const { data: commentData, error: commentError } = await supabaseClient
      .from('content_comments')
      .select('id, parent_comment_id, is_deleted')
      .eq('content_id', contentId);

    if (commentError) throw commentError;

    const comments = commentData || [];
    const commentCount = comments.filter(c => !c.is_deleted).length;
    const threadCount = comments.filter(c => !c.is_deleted && !c.parent_comment_id).length;

    // Get reaction stats
    const { data: reactionData, error: reactionError } = await supabaseClient
      .from('content_reactions')
      .select('reaction_type')
      .eq('content_id', contentId);

    if (reactionError) throw reactionError;

    const reactions = reactionData || [];
    const reactionStats = {
      like: 0,
      love: 0,
      celebrate: 0,
      insightful: 0,
      sad: 0
    };

    reactions.forEach(reaction => {
      if (reactionStats.hasOwnProperty(reaction.reaction_type)) {
        reactionStats[reaction.reaction_type]++;
      }
    });

    return {
      commentCount,
      threadCount,
      reactions: reactionStats,
      totalReactions: reactions.length
    };
  } catch (error) {
    console.error('Error getting engagement stats:', error);
    return {
      commentCount: 0,
      threadCount: 0,
      reactions: { like: 0, love: 0, celebrate: 0, insightful: 0, sad: 0 },
      totalReactions: 0
    };
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to comment updates (new, edited, deleted) for a content item
 * @param {string} contentId - UUID of the content
 * @param {Function} onUpdate - Callback function for updates
 * @returns {Object} Subscription object with unsubscribe method
 */
function subscribeToComments(contentId, onUpdate) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const subscription = supabaseClient
      .channel(`content_comments:${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_comments',
          filter: `content_id=eq.${contentId}`
        },
        (payload) => {
          onUpdate({
            event: payload.eventType,
            data: payload.new || payload.old
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabaseClient.removeChannel(subscription);
      },
      subscription
    };
  } catch (error) {
    console.error('Error subscribing to comments:', error);
    return {
      unsubscribe: () => {},
      subscription: null
    };
  }
}

/**
 * Subscribe to reaction updates for a content item
 * @param {string} contentId - UUID of the content
 * @param {Function} onUpdate - Callback function for updates
 * @returns {Object} Subscription object with unsubscribe method
 */
function subscribeToReactions(contentId, onUpdate) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const subscription = supabaseClient
      .channel(`content_reactions:${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_reactions',
          filter: `content_id=eq.${contentId}`
        },
        (payload) => {
          onUpdate({
            event: payload.eventType,
            data: payload.new || payload.old
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabaseClient.removeChannel(subscription);
      },
      subscription
    };
  } catch (error) {
    console.error('Error subscribing to reactions:', error);
    return {
      unsubscribe: () => {},
      subscription: null
    };
  }
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Format timestamp to relative time (e.g., "2h ago")
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time string
 */
function getRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;

  return `${Math.floor(seconds / 31536000)}y ago`;
}

/**
 * Get user avatar initials
 * @param {string} fullName - User's full name
 * @returns {string} Avatar initials (e.g., "JD")
 */
function getAvatarInitials(fullName) {
  if (!fullName) return '?';
  return fullName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// NOTIFICATION HELPERS (Integration with notifications table)
// ============================================================================

/**
 * Notify content author of a new comment
 * @param {string} contentId - UUID of content
 * @param {string} commenterId - UUID of commenter
 * @returns {Promise<boolean>} Success status
 */
async function notifyNewComment(contentId, commenterId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    // Get content to find author
    const { data: content, error: contentError } = await supabaseClient
      .from('content')
      .select('author_id')
      .eq('id', contentId)
      .single();

    if (contentError) throw contentError;
    if (!content || content.author_id === commenterId) return false;

    // Create notification
    const { error } = await supabaseClient
      .from('notifications')
      .insert([{
        user_id: content.author_id,
        type: 'comment',
        related_user_id: commenterId,
        related_content_id: contentId,
        title: 'New comment on your post',
        is_read: false
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating comment notification:', error);
    return false;
  }
}

/**
 * Notify comment author of a reply
 * @param {string} parentCommentId - UUID of parent comment
 * @param {string} replyerId - UUID of replier
 * @returns {Promise<boolean>} Success status
 */
async function notifyCommentReply(parentCommentId, replyerId) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    // Get parent comment to find author
    const { data: comment, error: commentError } = await supabaseClient
      .from('content_comments')
      .select('user_id, content_id')
      .eq('id', parentCommentId)
      .single();

    if (commentError) throw commentError;
    if (!comment || comment.user_id === replyerId) return false;

    // Create notification
    const { error } = await supabaseClient
      .from('notifications')
      .insert([{
        user_id: comment.user_id,
        type: 'comment_reply',
        related_user_id: replyerId,
        related_content_id: comment.content_id,
        title: 'Someone replied to your comment',
        is_read: false
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating reply notification:', error);
    return false;
  }
}

/**
 * Notify content author of a new reaction
 * @param {string} contentId - UUID of content
 * @param {string} reactorId - UUID of reactor
 * @param {string} reactionType - Type of reaction
 * @returns {Promise<boolean>} Success status
 */
async function notifyNewReaction(contentId, reactorId, reactionType) {
  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    // Get content to find author
    const { data: content, error: contentError } = await supabaseClient
      .from('content')
      .select('author_id')
      .eq('id', contentId)
      .single();

    if (contentError) throw contentError;
    if (!content || content.author_id === reactorId) return false;

    // Create notification
    const { error } = await supabaseClient
      .from('notifications')
      .insert([{
        user_id: content.author_id,
        type: 'reaction',
        related_user_id: reactorId,
        related_content_id: contentId,
        metadata: { reaction_type: reactionType },
        title: `Someone reacted with ${reactionType} to your post`,
        is_read: false
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating reaction notification:', error);
    return false;
  }
}
