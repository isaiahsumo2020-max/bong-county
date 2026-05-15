/**
 * Main Application Initialization
 * Entry point for the super admin dashboard
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  const isAuthenticated = await Auth.checkAuth();
  
  if (!isAuthenticated) {
    return;
  }

  // Initialize the dashboard
  await Dashboard.init();
  
  // Log successful initialization
  console.log('Super Admin Dashboard initialized successfully');
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
