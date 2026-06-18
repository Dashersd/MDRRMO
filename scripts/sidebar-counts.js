/**
 * Sidebar Counts Updater
 * Shared script to update sidebar badge counts across all pages
 */

(function() {
  'use strict';

  let initialized = false;
  window._previousIncidents = null;
  
  // Determine API path based on current page location
  function getDashboardStatsApi() {
    const path = window.location.pathname;
    if (path.includes('/admin/')) {
      return '../api/dashboard-stats.php';
    }
    return 'api/dashboard-stats.php';
  }

  /**
   * Initialize sidebar counts on page load
   */
  function init() {
    // Prevent multiple initializations
    if (initialized) {
      return;
    }
    
    // Update counts immediately
    updateSidebarCounts();
    
    // Set up event listeners only once
    if (!window.sidebarCountsListenersSetup) {
      // Listen for custom events when incidents are added/updated

      // Listen for custom events when incidents are added/updated
      window.addEventListener('incidentAdded', function() {
        setTimeout(updateSidebarCounts, 100);
      });
      window.addEventListener('incidentUpdated', function() {
        setTimeout(updateSidebarCounts, 100);
      });
      window.addEventListener('userUpdated', function() {
        setTimeout(updateUserCount, 50);
      });
      
      window.sidebarCountsListenersSetup = true;
    }

    // Start polling every 10 seconds to check for status updates
    if (!window.sidebarPollingInterval) {
      window.sidebarPollingInterval = setInterval(() => {
        updateIncidentCount();
      }, 10000);
    }
    
    initialized = true;
  }

  /**
   * Update all sidebar counts
   */
  function updateSidebarCounts() {
    // updateIncidentCount is now async, but we don't need to await it
    updateIncidentCount().catch(err => {
      console.error('Error in updateIncidentCount:', err);
    });
    updateUserCount();
  }

  /**
   * Update incident count badge
   */
  async function updateIncidentCount() {
    try {
      const incidentBadge = document.getElementById('incidentCount');
      if (!incidentBadge) return;
      
      let incidents = [];
      const currentUser = getCurrentUser();
      
      // Determine API path based on current page location
      const path = window.location.pathname;
      let apiUrl = 'api/incidents.php';
      if (path.includes('/admin/') || path.includes('/client/') || path.includes('/bdrrmo/')) {
        apiUrl = '../api/incidents.php';
      }
      
      // Try to fetch from database API first
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && !data.error) {
            incidents = data;
            console.debug(`Sidebar: Loaded ${incidents.length} incidents from database for user: ${currentUser}`);
          } else if (data.error) {
            console.warn('API returned error:', data.error);
          }
        } else {
          console.warn(`API returned status ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Failed to fetch incidents from API for sidebar count:', apiError);
      }
      
      
      // Count pending incidents (New or pending status)
      const pendingCount = incidents.filter(inc => {
        const status = (inc.status || 'New').toLowerCase().trim();
        return status === 'new' || status === 'pending';
      }).length;
      
      // Check for notifications for BDRRMO users
      const brandText = document.getElementById('brandText');
      const isBdrrmo = brandText && (brandText.textContent.toUpperCase().includes('BDRRMO') || brandText.textContent.toUpperCase().includes('CLIENT'));

      if (isBdrrmo && window._previousIncidents !== null && Array.isArray(incidents)) {
        incidents.forEach(newInc => {
          const oldInc = window._previousIncidents.find(i => i.id === newInc.id);
          if (oldInc) {
            const oldStatus = (oldInc.status || '').toLowerCase().trim();
            const newStatus = (newInc.status || '').toLowerCase().trim();
            
            if ((oldStatus === 'new' || oldStatus === 'pending') && 
                (newStatus === 'approved' || newStatus === 'declined' || newStatus === 'decline')) {
              showStatusNotification(newInc.id, newInc.type, newStatus);
              // Trigger a local event so the dashboard can refresh
              window.dispatchEvent(new CustomEvent('incidentUpdated', { detail: newInc }));
            }
          }
        });
      }

      // Store the current incidents for the next poll
      if (Array.isArray(incidents)) {
        window._previousIncidents = [...incidents];
      }

      // Update badge
      incidentBadge.textContent = pendingCount;
      // Hide badge if count is 0
      if (pendingCount === 0) {
        incidentBadge.style.display = 'none';
      } else {
        incidentBadge.style.display = 'flex';
      }
    } catch (error) {
      console.error('Error updating incident count:', error);
      const incidentBadge = document.getElementById('incidentCount');
      if (incidentBadge) {
        incidentBadge.textContent = '0';
        incidentBadge.style.display = 'none';
      }
    }
  }
  
  /**
   * Get current user (try multiple methods)
   */
  function getCurrentUser() {
    // Try to get from meta tag
    const metaUser = document.querySelector('meta[name="current-user"]');
    if (metaUser) {
      return metaUser.getAttribute('content');
    }
    
    // Try to get from window variable (set by PHP)
    if (window.CURRENT_USER) {
      return window.CURRENT_USER;
    }
    
    // Try to get from data attribute
    const userElement = document.querySelector('[data-current-user]');
    if (userElement) {
      return userElement.getAttribute('data-current-user');
    }
    
    // Fallback: try to extract from navbar
    const navbarUser = document.querySelector('.navbar .nav-link.dropdown-toggle');
    if (navbarUser) {
      const text = navbarUser.textContent.trim();
      // Extract username (before badge)
      const match = text.match(/^(.+?)\s*Client|Admin/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * Update user count badge (for admin pages)
   */
  function updateUserCount() {
    // Only update if user is admin (check if userCount element exists)
    const userCountBadge = document.getElementById('userCount');
    if (!userCountBadge) {
      return; // Not an admin page or user count not needed
    }

    // Try to fetch from API first
    fetch(getDashboardStatsApi())
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        return response.json();
      })
      .then(data => {
        if (userCountBadge) {
          const totalUsers = data.users?.total || 0;
          userCountBadge.textContent = totalUsers;
          // Hide badge if count is 0
          if (totalUsers === 0) {
            userCountBadge.style.display = 'none';
          } else {
            userCountBadge.style.display = 'flex';
          }
        }
      })
      .catch(error => {
        console.error('Error fetching user count:', error);
        // Fallback: try to get from localStorage or set to 0
        if (userCountBadge) {
          userCountBadge.textContent = '0';
        }
      });
  }


  // Mark that sidebar-counts.js is loaded
  window.sidebarCountsLoaded = true;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      // Also run after a short delay to catch any late DOM changes
      setTimeout(init, 100);
    });
  } else {
    // DOM is already ready
    init();
    // Also run after a short delay to catch any late DOM changes
    setTimeout(init, 100);
  }

  // Also update on page visibility change (when user switches back to tab)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      updateSidebarCounts();
    }
  });

  // Run update after all scripts have loaded (use requestAnimationFrame for better timing)
  requestAnimationFrame(function() {
    setTimeout(updateSidebarCounts, 200);
  });

  // Expose update function globally for manual updates
  window.updateSidebarCounts = updateSidebarCounts;
  window.updateIncidentCount = updateIncidentCount;
  window.updateUserCount = updateUserCount;

  // Add a global notification function
  function showStatusNotification(incidentId, type, status) {
    const notification = document.createElement("div");
    notification.className = "toast align-items-center text-white border-0 show";
    
    // Choose colors based on status
    let bgColor = "bg-success";
    let iconClass = "bi-check-circle-fill";
    let statusText = "Approved";
    
    if (status === 'declined' || status === 'decline') {
      bgColor = "bg-danger";
      iconClass = "bi-x-circle-fill";
      statusText = "Declined";
    }

    notification.classList.add(bgColor);
    notification.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 1060; min-width: 300px; box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); border-radius: 8px;";
    
    notification.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center">
          <i class="bi ${iconClass} fs-4 me-3"></i>
          <div>
            <strong>Incident Update</strong><br>
            Your report for <b>${type || 'Incident'}</b> has been <b>${statusText}</b> by Admin.
          </div>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Automatically remove after 8 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transition = "opacity 0.5s ease";
        notification.style.opacity = "0";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 500);
      }
    }, 8000);
  }

})();

