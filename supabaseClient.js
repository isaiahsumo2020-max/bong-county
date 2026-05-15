/**
 * Supabase Client Configuration
 * Initializes the Supabase client for frontend authentication & data fetching
 */

const SUPABASE_URL = 'https://choagncxtmsewzvxoncx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNob2FnbmN4dG1zZXd6dnhvbmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzk3NjUsImV4cCI6MjA5MzkxNTc2NX0.hVPjF0_b-5DTXMzeFUPYZ82tL27CrsFBIUQrm-XYonE';

// Initialize Supabase client with error handling
let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('Supabase library not loaded');
}

/**
 * Helper: Check if user is authenticated
 */
async function getCurrentUser() {
  try {
    if (!supabaseClient) return null;
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Helper: Get user's profile from users table
 */
async function getUserProfile(userId) {
  try {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Helper: Map database leaders to frontend format with eraTag for filtering
 */
function mapDbLeader(dbLeader) {
  const categoryMap = {
    'current': 'Current & Recent',
    'historical': 'Historical & Traditional',
    'traditional': 'Historical & Traditional',
    'past': 'Past Leaders'
  };

  return {
    initials: dbLeader.name.split(' ').map(n => n[0]).join(''),
    name: dbLeader.name,
    role: dbLeader.role,
    period: dbLeader.era || 'Current',
    eraTag: categoryMap[dbLeader.category] || 'Past Leaders',
    bio: dbLeader.bio || '',
    image: dbLeader.photo_url || '',
    tags: [] // Can be enhanced to include category
  };
}

/**
 * Helper: Fetch published leaders for a county
 */
async function getCountyLeaders(countyId, category = null) {
  try {
    if (!supabaseClient) return [];
    let query = supabaseClient
      .from('leaders')
      .select('*')
      .eq('county_id', countyId)
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leaders:', error);
    return [];
  }
}

/**
 * Helper: Fetch published content for a county
 */
async function getCountyContent(countyId, contentType = null) {
  try {
    if (!supabaseClient) return [];
    let query = supabaseClient
      .from('content')
      .select('*, author:author_id(full_name, avatar_url)')
      .eq('county_id', countyId)
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false });

    if (contentType) {
      query = query.eq('type', contentType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching content:', error);
    return [];
  }
}

/**
 * Helper: Fetch published tourism sites for a county
 */
async function getTourismSites(countyId) {
  try {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
      .from('tourism_sites')
      .select('*')
      .eq('county_id', countyId)
      .eq('is_published', true)
      .order('is_featured', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tourism sites:', error);
    return [];
  }
}

/**
 * Helper: Sign in with email & password
 */
async function signIn(email, password) {
  try {
    if (!supabaseClient) return { success: false, error: 'Supabase not initialized' };
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign in error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Sign up with email, password, full name
 */
async function signUp(email, password, fullName, countyId = null) {
  try {
    if (!supabaseClient) return { success: false, error: 'Supabase not initialized' };
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // The trigger handle_new_user() will create the users row automatically
    // But we can also update it with county info if provided
    if (data.user && countyId) {
      await supabaseClient
        .from('users')
        .update({ county_id: countyId })
        .eq('id', data.user.id);
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign up error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Sign out
 */
async function signOut() {
  try {
    if (!supabaseClient) return { success: false, error: 'Supabase not initialized' };
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Get the county ID for Bong County
 */
async function getCountyIdBySlug(slug) {
  try {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
      .from('counties')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data?.id;
  } catch (error) {
    console.error('Error fetching county:', error);
    return null;
  }
}

/**
 * Helper: Submit content (story/article/announcement)
 */
async function submitContent(countyId, title, body, type = 'story', excerpt = '', coverImageUrl = '') {
  try {
    if (!supabaseClient) return { success: false, error: 'Supabase not initialized' };
    const user = await getCurrentUser();
    if (!user) throw new Error('User must be logged in');

    const { data, error } = await supabaseClient
      .from('content')
      .insert([
        {
          county_id: countyId,
          author_id: user.id,
          title,
          body,
          excerpt,
          cover_image_url: coverImageUrl,
          type,
          status: 'pending_review' // Auto-submit for review
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, content: data };
  } catch (error) {
    console.error('Error submitting content:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Subscribe to auth changes
 */
function onAuthStateChange(callback) {
  if (!supabaseClient) {
    console.warn('Supabase not initialized, cannot listen to auth changes');
    return () => {};
  }
  return supabaseClient.auth.onAuthStateChange((event, session) => {
    callback({ event, session, user: session?.user });
  });
}

// Export functions for use in HTML/Vue
window.supabaseClient = supabaseClient;  // Make supabaseClient directly accessible for page protection
window.supabaseHelpers = {
  supabaseClient,
  getCurrentUser,
  getUserProfile,
  getCountyLeaders,
  getCountyContent,
  getTourismSites,
  signIn,
  signUp,
  signOut,
  getCountyIdBySlug,
  submitContent,
  onAuthStateChange,
  mapDbLeader
};
