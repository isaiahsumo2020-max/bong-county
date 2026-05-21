/**
 * SUBMISSION HANDLER MODULE
 * Manages all submission-related operations for contributors
 * Schema: content table + submissions table
 * - Create new content (status: draft/submitted)
 * - Edit drafts
 * - Submit for review (creates submissions record)
 * - Image uploads
 * - Delete submissions (drafts only)
 */

const SubmissionHandler = (() => {
  const sb = window.supabaseClient;

  // ─────────────────────────────────────────
  // CREATE/UPDATE SUBMISSION
  // ─────────────────────────────────────────
  async function saveSubmission(submissionData, isDraft = true) {
    try {
      const { 
        id, 
        title, 
        description,
        county_id,
        type = 'news',
        category,
        tags, 
        featuredImage,
        userId
      } = submissionData;

      // Validate required fields
      if (!title || !description || !county_id) {
        throw new Error('Title, description, and county are required');
      }

      // Map type from form to schema enum
      const validTypes = ['tourism', 'event', 'opportunity', 'news', 'community_story'];
      const mappedType = type && validTypes.includes(type) ? type : 'news';

      const contentPayload = {
        title: title.trim(),
        description: description.trim(),
        county_id: county_id,
        type: mappedType,
        category: category?.trim() || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []),
        featured_image_url: featuredImage || null,
        visibility: 'public',
        status: isDraft ? 'draft' : 'submitted',
        updated_at: new Date().toISOString(),
        author_id: userId
      };

      let contentResult;

      // Update existing content (if id provided)
      if (id && id !== 'new') {
        console.log(`Updating content ${id}...`);
        const { data, error } = await sb
          .from('content')
          .update(contentPayload)
          .eq('id', id)
          .select();

        if (error) throw error;
        contentResult = data?.[0];
        console.log('✓ Content updated', contentResult);

      } else {
        // Create new content
        console.log('Creating new content...');
        contentPayload.created_at = new Date().toISOString();

        const { data, error } = await sb
          .from('content')
          .insert([contentPayload])
          .select();

        if (error) throw error;
        contentResult = data?.[0];
        console.log('✓ Content created', contentResult);
      }

      // If submitting (not just saving as draft), create submissions record
      if (!isDraft && contentResult?.id) {
        console.log('Creating submission record...');
        const { error: submissionError } = await sb
          .from('submissions')
          .insert([{
            content_id: contentResult.id,
            submitter_id: userId,
            status: 'pending'
          }]);

        if (submissionError) {
          console.error('Warning: submissions record not created', submissionError);
          // Don't fail - content was created successfully
        }
      }

      return { success: true, data: contentResult };

    } catch (error) {
      console.error('✗ Error saving submission:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // FETCH SUBMISSIONS
  // ─────────────────────────────────────────
  async function getSubmissions(userId, filter = 'all') {
    try {
      let query = sb
        .from('content')
        .select('*')
        .eq('author_id', userId);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };

    } catch (error) {
      console.error('✗ Error fetching submissions:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ─────────────────────────────────────────
  // GET SINGLE SUBMISSION
  // ─────────────────────────────────────────
  async function getSubmission(submissionId) {
    try {
      const { data, error } = await sb
        .from('content')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      return { success: true, data };

    } catch (error) {
      console.error('✗ Error fetching submission:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // DELETE SUBMISSION
  // ─────────────────────────────────────────
  async function deleteSubmission(submissionId) {
    try {
      // Only allow deletion of draft submissions
      const { data: submission, error: fetchError } = await sb
        .from('content')
        .select('status, id')
        .eq('id', submissionId)
        .single();

      if (fetchError) throw fetchError;

      if (submission?.status !== 'draft') {
        throw new Error('Only draft submissions can be deleted');
      }

      // Delete submissions record if exists
      await sb
        .from('submissions')
        .delete()
        .eq('content_id', submissionId);

      // Delete content record
      const { error } = await sb
        .from('content')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      console.log('✓ Submission deleted');
      return { success: true };

    } catch (error) {
      console.error('✗ Error deleting submission:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // UPLOAD FEATURED IMAGE
  // ─────────────────────────────────────────
  async function uploadFeaturedImage(file, userId) {
    try {
      if (!file) return { success: false, error: 'No file provided' };

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `featured-images/${userId}/${fileName}`;

      console.log(`Uploading image to ${filePath}...`);

      const { data, error } = await sb.storage
        .from('content-images')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = sb.storage
        .from('content-images')
        .getPublicUrl(filePath);

      console.log('✓ Image uploaded:', publicUrl);
      return { success: true, url: publicUrl };

    } catch (error) {
      console.error('✗ Error uploading image:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // SUBMIT FOR REVIEW (creates submissions record)
  // ─────────────────────────────────────────
  async function submitForReview(contentId, userId) {
    try {
      // Get the content first
      const { data: content, error: fetchError } = await sb
        .from('content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (fetchError) throw fetchError;

      // Can only submit drafts
      if (content?.status !== 'draft') {
        throw new Error('Only draft content can be submitted for review');
      }

      // Update content status to 'submitted'
      const { data: updatedContent, error: contentError } = await sb
        .from('content')
        .update({
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId)
        .select();

      if (contentError) throw contentError;

      // Create submissions record if doesn't exist
      const { data: existingSubmission } = await sb
        .from('submissions')
        .select('id')
        .eq('content_id', contentId)
        .single();

      if (!existingSubmission) {
        const { error: submissionError } = await sb
          .from('submissions')
          .insert([{
            content_id: contentId,
            submitter_id: userId,
            status: 'pending'
          }]);

        if (submissionError) {
          console.warn('Note: submissions record creation failed', submissionError);
          // Don't fail - content status was updated
        }
      }

      console.log('✓ Content submitted for review');
      return { success: true, data: updatedContent?.[0] };

    } catch (error) {
      console.error('✗ Error submitting for review:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // GET STATISTICS
  // ─────────────────────────────────────────
  async function getStats(userId) {
    try {
      const { data: submissions, error } = await sb
        .from('content')
        .select('status')
        .eq('author_id', userId);

      if (error) throw error;

      const stats = {
        total: submissions?.length || 0,
        draft: submissions?.filter(s => s.status === 'draft').length || 0,
        submitted: submissions?.filter(s => s.status === 'submitted').length || 0,
        published: submissions?.filter(s => s.status === 'published').length || 0,
        rejected: submissions?.filter(s => s.status === 'rejected').length || 0,
      };

      return { success: true, data: stats };

    } catch (error) {
      console.error('✗ Error getting stats:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  // ─────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────
  return {
    saveSubmission,
    getSubmissions,
    getSubmission,
    deleteSubmission,
    uploadFeaturedImage,
    submitForReview,
    getStats,
  };
})();

// Make available globally
window.SubmissionHandler = SubmissionHandler;
