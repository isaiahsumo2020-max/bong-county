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
  
  // Initialize mobile responsive menu
  initMobileMenu();
  
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

/**
 * Mobile Menu Toggle Functionality
 */
function initMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  const mobileSidebarClose = document.getElementById('mobileSidebarClose');
  const navButtons = document.querySelectorAll('.sidebar-link');

  // Toggle sidebar on menu button click
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }

  // Close sidebar on close button click
  if (mobileSidebarClose) {
    mobileSidebarClose.addEventListener('click', () => {
      sidebar.classList.remove('sidebar-open');
    });
  }

  // Close sidebar when navigation button is clicked on mobile
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('sidebar-open');
      }
    });
  });

  // Handle window resize to close sidebar on larger screens
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('sidebar-open');
    }
  });

  // Close sidebar on outside click for mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        sidebar.classList.remove('sidebar-open');
      }
    }
  });
}
