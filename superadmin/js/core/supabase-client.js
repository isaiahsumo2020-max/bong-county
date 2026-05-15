/**
 * Supabase Client Configuration
 * Initializes the Supabase client for API communication
 */

const SUPABASE_URL = 'https://choagncxtmsewzvxoncx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNob2FnbmN4dG1zZXd6dnhvbmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzk3NjUsImV4cCI6MjA5MzkxNTc2NX0.hVPjF0_b-5DTXMzeFUPYZ82tL27CrsFBIUQrm-XYonE';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export for use in other modules
window.supabaseClient = supabaseClient;
