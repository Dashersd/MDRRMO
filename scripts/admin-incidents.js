/**
 * Admin Incidents Management JavaScript
 * Handles loading and displaying all incidents for admin management
 */

(function() {
  'use strict';

  const API_URL = '../api/incidents.php';
  
  // DOM Elements
  const incidentsList = document.getElementById('incidentsList');
  const filterStatus = document.getElementById('filterStatus');
  const btnRefresh = document.getElementById('btnRefresh');
  const loadingState = document.getElementById('incidentsLoading');
  const emptyState = document.getElementById('incidentsEmpty');
  
  // Store incidents in memory for quick access
  let allIncidents = [];

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    if (incidentsList) {
      loadAndDisplayIncidents();
      setupEventListeners();
    }
  });

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    if (filterStatus) {
      filterStatus.addEventListener('change', loadAndDisplayIncidents);
    }

    if (btnRefresh) {
      btnRefresh.addEventListener('click', function() {
        loadAndDisplayIncidents();
        // Add visual feedback
        const icon = btnRefresh.querySelector('i');
        if (icon) {
          icon.classList.add('spinning');
          setTimeout(() => icon.classList.remove('spinning'), 1000);
        }
      });
    }

    // Listen for new incidents being added
    window.addEventListener('incidentAdded', function() {
      loadAndDisplayIncidents();
    });

    // Listen for custom events when incidents are added/updated
  }

  /**
   * Load and display incidents from database API
   */
  async function loadAndDisplayIncidents() {
    try {
      // Show loading state
      if (loadingState) loadingState.style.display = 'flex';
      if (emptyState) emptyState.style.display = 'none';
      if (incidentsList) incidentsList.innerHTML = '';
      
      // Fetch incidents from API
      const statusFilter = filterStatus ? filterStatus.value : 'All';
      const url = API_URL;
      
      let incidents = [];
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if response is an error object
        if (data.error) {
          throw new Error(data.error);
        }
        
        incidents = Array.isArray(data) ? data : [];
        console.info(`Loaded ${incidents.length} incidents from database`);
      } catch (apiError) {
        console.error('Failed to fetch from database API:', apiError);
        incidents = [];
      }
      
      // Store incidents for quick access
      allIncidents = incidents;
      
      // Filter by status on client side as well (API handles it, but double-check for consistency)
      let filteredIncidents = incidents;
      if (statusFilter !== 'All') {
        filteredIncidents = incidents.filter(inc => {
          // Normalize status comparison
          const incStatus = (inc.status || 'New').trim().toLowerCase();
          const filterStatusLower = statusFilter.toLowerCase();
          
          // Handle Pending - matches both 'New' and 'pending'
          if (filterStatusLower === 'pending') {
            return incStatus === 'new' || incStatus === 'pending';
          }
          
          // Handle Approved
          if (filterStatusLower === 'approved') {
            return incStatus === 'approved';
          }
          
          // Handle Declined/Decline
          if (filterStatusLower === 'decline' || filterStatusLower === 'declined') {
            return incStatus === 'decline' || incStatus === 'declined';
          }
          
          // Exact match for other statuses
          return incStatus === filterStatusLower;
        });
      }

      // Sort by newest first (should already be sorted by API, but ensure it)
      filteredIncidents.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // Hide loading state
      if (loadingState) loadingState.style.display = 'none';

      // Update count text
      const countText = document.getElementById('incidentsCountText');
      if (countText) {
        const totalCount = incidents.length;
        const filteredCount = filteredIncidents.length;
        if (statusFilter === 'All') {
          countText.textContent = `${totalCount} ${totalCount === 1 ? 'incident' : 'incidents'} total`;
        } else {
          countText.textContent = `${filteredCount} of ${totalCount} ${statusFilter.toLowerCase()} ${filteredCount === 1 ? 'incident' : 'incidents'}`;
        }
      }

      if (filteredIncidents.length === 0) {
        // Show empty state
        if (emptyState) emptyState.style.display = 'flex';
        if (incidentsList) incidentsList.innerHTML = '';
      } else {
        // Hide empty state
        if (emptyState) emptyState.style.display = 'none';
        
        // Render incidents
        if (incidentsList) {
          incidentsList.innerHTML = filteredIncidents.map(incident => renderIncidentCard(incident)).join('');
        }

        // Attach event listeners to buttons
        attachEventListeners();
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      if (loadingState) loadingState.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      if (incidentsList) incidentsList.innerHTML = '';
      
      // Show error message in empty state
      const emptyStateEl = document.getElementById('incidentsEmpty');
      if (emptyStateEl) {
        emptyStateEl.innerHTML = `
          <div class="mb-4">
            <i class="bi bi-exclamation-triangle" style="font-size: 4rem; color: #dc3545;"></i>
          </div>
          <h5 class="fw-semibold mb-2 text-danger">Error Loading Incidents</h5>
          <p class="text-muted mb-4">Failed to load incidents from the database. Please try again.</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise me-2"></i> Retry
          </button>
        `;
      }
    }
  }

  /**
   * Render an incident card (1:1 square aspect ratio)
   */
  function renderIncidentCard(incident) {
    const date = new Date(incident.createdAt || Date.now());
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const timeAgo = getTimeAgo(date);
    const statusBadge = getStatusBadge(incident.status || 'New');
    const typeIcon = getTypeIcon(incident.type);
    const typeClass = getTypeClass(incident.type);

    return `
      <div class="incident-grid-item">
        <div class="incident-card-square hover-lift" onclick="viewIncidentDetails('${incident.id}')" style="cursor: pointer;">
          <!-- Image Section -->
          <div class="incident-card-image-wrapper" onclick="event.stopPropagation(); viewIncidentDetails('${incident.id}')">
            ${incident.photoDataUrl ? `
              <img src="${incident.photoDataUrl}" 
                   alt="Incident photo" 
                   class="incident-card-image"
                   loading="lazy">
            ` : `
              <div class="incident-card-image-placeholder">
                <i class="${typeIcon}"></i>
              </div>
            `}
            <!-- Status Badge Overlay -->
            <div class="incident-card-status-overlay">
              <span class="badge ${statusBadge.class} incident-status-badge">${escapeHtml(statusBadge.text)}</span>
            </div>
            <!-- Type Icon Overlay -->
            <div class="incident-card-type-overlay">
              <div class="incident-type-icon ${typeClass}">
                <i class="${typeIcon}"></i>
              </div>
            </div>
          </div>
          
          <!-- Content Section -->
          <div class="incident-card-content">
            <!-- Header -->
            <div class="incident-card-header">
              <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
                <h6 class="incident-card-title mb-0" title="${escapeHtml(incident.type || 'Unknown')}">
                  ${escapeHtml(incident.type || 'Unknown')}
                </h6>
                <span class="badge bg-light text-dark border small py-0.5 px-1.5" style="font-size: 0.65rem; border-radius: 4px; white-space: nowrap; background-color: #f1f3f5; color: #495057; border: 1px solid #dee2e6; font-weight: 600;" title="Reported by BDRRMO Staff">
                  <i class="bi bi-person-fill me-1 text-primary"></i>${escapeHtml(incident.reportedBy || 'Staff')}
                </span>
              </div>
              <small class="incident-card-time">${timeAgo}</small>
            </div>
            
            <!-- Description -->
            <p class="incident-card-description" title="${escapeHtml(incident.description || 'No description provided')}">
              ${escapeHtml(incident.description || 'No description provided')}
            </p>
            
            <!-- Actions -->
            <div class="incident-card-actions" onclick="event.stopPropagation();">
              <button class="btn btn-sm btn-outline-dark incident-action-btn" onclick="event.stopPropagation(); showDownloadOptions('${incident.id}')" title="Download Options">
                <i class="bi bi-download"></i>
              </button>
              <button class="btn btn-sm btn-outline-success incident-action-btn" onclick="event.stopPropagation(); updateIncidentStatus('${incident.id}', 'Approved')" title="Approve">
                <i class="bi bi-check-circle"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger incident-action-btn" onclick="event.stopPropagation(); updateIncidentStatus('${incident.id}', 'Decline')" title="Decline">
                <i class="bi bi-x-circle"></i>
              </button>
              <button class="btn btn-sm btn-outline-warning incident-action-btn" onclick="event.stopPropagation(); editIncident('${incident.id}')" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger incident-action-btn" onclick="event.stopPropagation(); deleteIncident('${incident.id}')" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to dynamically generated buttons
   */
  function attachEventListeners() {
    // Event listeners are attached via onclick handlers in the HTML
    // This is intentional to avoid event delegation complexity
  }

  /**
   * Get time ago string
   */
  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    
    return date.toLocaleDateString();
  }

  /**
   * Get status badge class and text
   */
  function getStatusBadge(status) {
    const statusLower = (status || 'New').toLowerCase().trim();
    switch (statusLower) {
      case 'new':
      case 'pending':
        return { class: 'bg-secondary', text: 'New' };
      case 'dispatched':
        return { class: 'bg-primary', text: 'Dispatched' };
      case 'resolved':
        return { class: 'bg-success', text: 'Resolved' };
      case 'approved':
        return { class: 'bg-success', text: 'Approved' };
      case 'decline':
      case 'declined':
        return { class: 'bg-danger', text: 'Declined' };
      case 'cancelled':
      case 'canceled':
        return { class: 'bg-danger', text: 'Cancelled' };
      default:
        return { class: 'bg-secondary', text: status || 'New' };
    }
  }

/**
   * Get type CSS class for icon colors
   */
  function getTypeClass(type) {
    if (!type) return 'incident-type-other';
    const typeLower = type.toLowerCase().replace(/\s+/g, '-');
    return `incident-type-${typeLower}`;
  }

  /**
   * Get type icon
   */
  function getTypeIcon(type) {
    const icons = {
      'Fire': 'bi bi-fire',
      'Flood': 'bi bi-droplet',
      'Road Accident': 'bi bi-car-front',
      'Medical': 'bi bi-heart-pulse',
      'Landslide': 'bi bi-triangle',
      'Earthquake': 'bi bi-activity',
      'Power Outage': 'bi bi-lightning',
    };
    return icons[type] || 'bi bi-exclamation-octagon';
  }

  /**
   * Get incident by ID from cached data or fetch if needed
   */
  async function getIncidentById(incidentId) {
    // First try cached data
    let incident = allIncidents.find(inc => inc.id === incidentId);
    
    // If not found, fetch fresh data
    if (!incident) {
      await loadAndDisplayIncidents();
      incident = allIncidents.find(inc => inc.id === incidentId);
    }
    
    return incident;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Global functions for onclick handlers
   */
  window.viewReportImage = async function(incidentId) {
    try {
      const incident = await getIncidentById(incidentId);
      if (incident && incident.photoDataUrl) {
        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'reportImageModal';
        modal.innerHTML = `
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Incident Photo - ${escapeHtml(incident.type || 'Unknown')}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-center">
                <img src="${incident.photoDataUrl}" alt="Incident Photo" class="img-fluid rounded">
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
      }
    } catch (error) {
      console.error('Error viewing report image:', error);
      alert('Error loading incident photo');
    }
  };

window.viewIncidentDetails = async function(incidentId) {
    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) {
        alert('Incident not found');
        return;
      }

      const date = new Date(incident.createdAt || Date.now()).toLocaleString();
      const statusBadge = getStatusBadge(incident.status || 'New');
      
      // Get type icon
      const typeIcon = getTypeIcon(incident.type);
      const typeClass = getTypeClass(incident.type);
      
      // Create a nice modal for details
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'incidentDetailsModal';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="overflow: hidden;">
            <!-- Enhanced Header -->
            <div class="modal-header border-0 pb-0" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 1.25rem 1.5rem;">
              <div class="d-flex align-items-center w-100">
                <div class="flex-grow-1 d-flex align-items-center gap-3 pb-3">
                  <h5 class="modal-title mb-0 fw-bold" style="font-size: 1.3rem; color: #212529;">
                    ${escapeHtml(incident.type || 'Unknown Incident')}
                  </h5>
                  <span class="badge ${statusBadge.class} px-3 py-2" style="font-size: 0.75rem; font-weight: 600;">
                    ${escapeHtml(statusBadge.text)}
                  </span>
                </div>
                <button type="button" class="btn-close pb-3" data-bs-dismiss="modal" style="opacity: 0.7;"></button>
              </div>
            </div>
            
            <div class="modal-body" style="padding: 1.25rem;">
              <!-- Incident Information Card -->
              <div class="card border-0 shadow-sm mb-3" style="background: #f8f9fa;">
                <div class="card-body p-3">
                  <h6 class="card-title fw-bold mb-3 d-flex align-items-center" style="color: #495057; font-size: 0.95rem;">
                    <i class="bi bi-info-circle-fill me-2 text-primary"></i>
                    Incident Information
                  </h6>
                  
                  <!-- Type -->
                  <div class="d-flex align-items-start mb-2 pb-2 border-bottom">
                    <div class="flex-shrink-0 me-3">
                      <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <i class="bi bi-tag-fill text-primary" style="font-size: 0.85rem;"></i>
                      </div>
                    </div>
                    <div class="flex-grow-1">
                      <small class="text-muted d-block mb-0.5" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Type</small>
                      <div class="fw-semibold" style="color: #212529; font-size: 0.9rem;">
                        ${escapeHtml(incident.type || 'Unknown')}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Date & Time -->
                  <div class="d-flex align-items-start mb-2 pb-2 border-bottom">
                    <div class="flex-shrink-0 me-3">
                      <div class="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <i class="bi bi-calendar3-fill text-success" style="font-size: 0.85rem;"></i>
                      </div>
                    </div>
                    <div class="flex-grow-1">
                      <small class="text-muted d-block mb-0.5" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</small>
                      <div class="fw-semibold" style="color: #212529; font-size: 0.9rem;">
                        ${escapeHtml(date)}
                      </div>
                    </div>
                  </div>

                  <!-- Status -->
                  <div class="d-flex align-items-start mb-2 pb-2 border-bottom">
                    <div class="flex-shrink-0 me-3">
                      <div class="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <i class="bi bi-flag-fill text-info" style="font-size: 0.85rem;"></i>
                      </div>
                    </div>
                    <div class="flex-grow-1">
                      <small class="text-muted d-block mb-0.5" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Status</small>
                      <div class="fw-semibold" style="color: #212529; font-size: 0.9rem;">
                        <span class="badge ${statusBadge.class}" style="font-size: 0.75rem;">${escapeHtml(statusBadge.text)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Reported By -->
                  <div class="d-flex align-items-start mb-2 pb-2 border-bottom">
                    <div class="flex-shrink-0 me-3">
                      <div class="bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <i class="bi bi-person-fill text-secondary" style="font-size: 0.85rem;"></i>
                      </div>
                    </div>
                    <div class="flex-grow-1">
                      <small class="text-muted d-block mb-0.5" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">Reported By</small>
                      <div class="fw-semibold text-dark" style="font-size: 0.9rem;">
                        ${escapeHtml(incident.reportedBy || 'System / Citizen')}
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
              
              <!-- Description Card -->
              <div class="card border-0 shadow-sm mb-3" style="background: #f8f9fa;">
                <div class="card-body p-3">
                  <h6 class="card-title fw-bold mb-2 d-flex align-items-center" style="color: #495057; font-size: 0.95rem;">
                    <i class="bi bi-file-text-fill me-2 text-info"></i>
                    Description
                  </h6>
                  <p class="mb-0 text-muted" style="line-height: 1.5; font-size: 0.85rem; max-height: 120px; overflow-y: auto;">
                    ${escapeHtml(incident.description || 'No description provided')}
                  </p>
                </div>
              </div>
              
              <!-- Photo Card -->
              ${incident.photoDataUrl ? `
                <div class="card border-0 shadow-sm" style="background: #f8f9fa;">
                  <div class="card-body p-3">
                    <h6 class="card-title fw-bold mb-2 d-flex align-items-center" style="color: #495057; font-size: 0.95rem;">
                      <i class="bi bi-image-fill me-2 text-danger"></i>
                      Incident Photo
                    </h6>
                    <div class="text-center" style="background: white; border-radius: 8px; padding: 0.5rem; box-shadow: inset 0 2px 6px rgba(0,0,0,0.05);">
                      <img src="${incident.photoDataUrl}" 
                           alt="Incident Photo" 
                           class="img-fluid rounded shadow-sm" 
                           style="max-height: 380px; width: 100%; object-fit: cover; cursor: pointer; transition: transform 0.3s ease;"
                           onclick="viewReportImage('${incident.id}')"
                           onmouseover="this.style.transform='scale(1.02)'"
                           onmouseout="this.style.transform='scale(1)'">
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="modal-footer border-top bg-light" style="padding: 1rem 1.5rem;">
              <button type="button" class="btn btn-outline-danger" onclick="showDownloadOptions('${incident.id}')">
                <i class="bi bi-download me-1"></i> Download Report
              </button>
              ${(incident.status || 'New').toLowerCase() === 'new' || (incident.status || 'New').toLowerCase() === 'pending' ? `
                <button type="button" class="btn btn-outline-success" onclick="updateIncidentStatus('${incident.id}', 'Approved'); bootstrap.Modal.getInstance(document.getElementById('incidentDetailsModal')).hide();">
                  <i class="bi bi-check-circle me-1"></i> Approve
                </button>
                <button type="button" class="btn btn-outline-danger" onclick="updateIncidentStatus('${incident.id}', 'Decline'); bootstrap.Modal.getInstance(document.getElementById('incidentDetailsModal')).hide();">
                  <i class="bi bi-x-circle me-1"></i> Decline
                </button>
              ` : ''}
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle me-1"></i> Close
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      modal.addEventListener('hidden.bs.modal', () => modal.remove());
    } catch (error) {
      console.error('Error viewing incident details:', error);
      alert('Error loading incident details');
    }
  };

  window.downloadIncidentReport = async function(incidentId, format = 'print') {
    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) {
        alert('Incident not found');
        return;
      }

      const date = new Date(incident.createdAt || Date.now());
      const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const statusBadge = getStatusBadge(incident.status || 'New');
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print/download the report.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MDRRMO Incident Report - ${escapeHtml(incident.type || 'Incident')}</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
              color: #212529;
              background: #fff;
              line-height: 1.6;
            }
            .report-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 2.5rem 2rem;
            }
            /* Official Header */
            .report-header {
              display: flex;
              align-items: center;
              justify-content: center;
              border-bottom: 3px double #dc3545;
              padding-bottom: 1.5rem;
              margin-bottom: 2rem;
              text-align: center;
            }
            .header-logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
              margin-right: 1.5rem;
            }
            .header-text {
              flex-grow: 1;
              text-align: center;
            }
            .header-text h5 {
              margin: 0;
              font-size: 0.8rem;
              letter-spacing: 1px;
              text-transform: uppercase;
              color: #6c757d;
              font-weight: 600;
            }
            .header-text h4 {
              margin: 2px 0;
              font-size: 0.95rem;
              font-weight: 700;
              color: #343a40;
            }
            .header-text h3 {
              margin: 4px 0 0 0;
              font-size: 1.25rem;
              font-weight: 800;
              color: #dc3545;
              letter-spacing: 0.5px;
            }
            /* Title Section */
            .report-title-section {
              text-align: center;
              margin-bottom: 2rem;
            }
            .report-title {
              display: inline-block;
              font-size: 1.4rem;
              font-weight: 800;
              text-transform: uppercase;
              color: #212529;
              border-bottom: 2px solid #212529;
              padding-bottom: 4px;
            }
            /* Metadata Table */
            .metadata-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 2rem;
              font-size: 0.9rem;
            }
            .metadata-table th, .metadata-table td {
              border: 1px solid #dee2e6;
              padding: 10px 12px;
              text-align: left;
            }
            .metadata-table th {
              background-color: #f8f9fa;
              font-weight: 700;
              color: #495057;
              width: 25%;
            }
            .metadata-table td {
              color: #212529;
            }
            /* Description Block */
            .report-section-title {
              font-size: 1.05rem;
              font-weight: 700;
              color: #212529;
              border-left: 4px solid #dc3545;
              padding-left: 8px;
              margin-bottom: 1rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .report-description {
              font-size: 0.95rem;
              color: #333;
              text-align: justify;
              background-color: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 2.5rem;
              white-space: pre-wrap;
            }
            /* Photo Evidence */
            .evidence-section {
              margin-bottom: 3rem;
            }
            .evidence-card {
              border: 1px solid #dee2e6;
              border-radius: 8px;
              overflow: hidden;
              background: #fff;
              padding: 8px;
              max-width: 450px;
              margin: 0 auto;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .evidence-img-container {
              width: 100%;
              height: 300px;
              background: #f8f9fa;
              overflow: hidden;
              border-radius: 4px;
            }
            .evidence-img-container img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .evidence-caption {
              font-size: 0.8rem;
              color: #6c757d;
              text-align: center;
              margin-top: 8px;
              font-weight: 600;
            }
            /* Signatures */
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 4rem;
              font-size: 0.9rem;
            }
            .signature-block {
              width: 40%;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1.5px solid #212529;
              height: 45px;
              margin-bottom: 8px;
            }
            .signature-title {
              font-weight: 700;
              color: #212529;
              margin: 0;
            }
            .signature-sub {
              font-size: 0.75rem;
              color: #6c757d;
              margin: 2px 0 0 0;
            }
            /* Page breaks and print rules */
            @media print {
              body {
                background: white;
                color: black;
              }
              .report-container {
                padding: 0;
                max-width: 100%;
              }
              .no-print {
                display: none !important;
              }
              .page-break-inside-avoid {
                page-break-inside: avoid;
              }
              .evidence-card {
                page-break-inside: avoid;
              }
              .signature-section {
                page-break-inside: avoid;
              }
              @page {
                size: portrait;
                margin: 1.5cm;
              }
            }
          </style>
        </head>
        <body>
          ${format === 'pdf' ? `
            <div class="no-print" style="background-color: #dc3545; color: white; text-align: center; padding: 12px; font-weight: bold; font-size: 0.9rem; font-family: sans-serif; border-radius: 4px; margin-bottom: 20px;">
              ℹ️ PDF EXPORT MODE: Set "Destination" to "Save as PDF" in the print dialog.
            </div>
          ` : ''}

          <div class="report-container">
            <!-- Official Government Header -->
            <div class="report-header">
              <img src="../assets/icon.png" class="header-logo" alt="MDRRMO Logo">
              <div class="header-text">
                <h5>Republic of the Philippines</h5>
                <h4>Province of Zamboanga del Sur</h4>
                <h4>Municipality of Lapuyan</h4>
                <h3>MUNICIPAL DISASTER RISK REDUCTION & MANAGEMENT OFFICE</h3>
              </div>
            </div>

            <!-- Report Title -->
            <div class="report-title-section">
              <div class="report-title">Official Incident Report</div>
            </div>

            <!-- Details Grid -->
            <table class="metadata-table">
              <tr>
                <th>Report ID</th>
                <td>${escapeHtml(incident.id)}</td>
                <th>Incident Type</th>
                <td><strong>${escapeHtml(incident.type || 'Unknown')}</strong></td>
              </tr>
              <tr>
                <th>Date & Time Logged</th>
                <td>${escapeHtml(dateStr)}</td>
                <th>Current Status</th>
                <td><span style="font-weight:700; color: ${incident.status === 'Approved' ? '#198754' : (incident.status === 'Decline' ? '#dc3545' : '#6c757d')}">${escapeHtml(statusBadge.text)}</span></td>
              </tr>
              <tr>
                <th>Reported By</th>
                <td>${escapeHtml(incident.reportedBy || 'BDRRMO Staff')}</td>
              </tr>
            </table>

            <!-- Narrative / Logs -->
            <div class="report-section-title">Incident Details & Narrative</div>
            <div class="report-description">${escapeHtml(incident.description || 'No description or logs provided for this incident.')}</div>

            <!-- Evidence Gallery -->
            ${incident.photoDataUrl ? `
              <div class="evidence-section page-break-inside-avoid">
                <div class="report-section-title">Photo Evidence</div>
                <div class="evidence-card">
                  <div class="evidence-img-container">
                    <img src="${incident.photoDataUrl}" alt="Incident Photo Evidence">
                  </div>
                  <div class="evidence-caption">Figure 1: Geotagged Photo Evidence for Incident ID ${escapeHtml(incident.id)}</div>
                </div>
              </div>
            ` : ''}

            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-block">
                <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">${escapeHtml(incident.reportedBy || 'BDRRMO Responder')}</div>
                <div class="signature-line" style="height: 10px; margin-top: 0;"></div>
                <h5 class="signature-title">Reported By</h5>
                <p class="signature-sub">BDRRMO Responder / Citizen Representative</p>
              </div>
              <div class="signature-block">
                <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">MDRRMO ADMIN</div>
                <div class="signature-line" style="height: 10px; margin-top: 0;"></div>
                <h5 class="signature-title">Approved By</h5>
                <p class="signature-sub">MDRRMO Operations Administrator</p>
              </div>
            </div>
          </div>
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            });
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error downloading incident report:', error);
      alert('Error generating PDF report');
    }
  };

  window.downloadIncidentPhoto = async function(incidentId) {
    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) {
        alert('Incident not found');
        return;
      }
      if (!incident.photoDataUrl) {
        alert('No photo available for this incident');
        return;
      }
      const a = document.createElement('a');
      a.href = incident.photoDataUrl;
      a.download = `${incident.type || 'incident'}_${incidentId}.jpg`;
      a.click();
    } catch (error) {
      console.error('Error downloading photo:', error);
      alert('Error downloading photo');
    }
  };

  window.showDownloadOptions = async function(incidentId) {
    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) {
        alert('Incident not found');
        return;
      }
      
      const hasPhoto = !!incident.photoDataUrl;
      
      if (!document.getElementById('downloadOptionsStyles')) {
        const style = document.createElement('style');
        style.id = 'downloadOptionsStyles';
        style.textContent = `
          .download-option-card {
            display: flex;
            align-items: center;
            padding: 1rem;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            background: #fff;
            margin-bottom: 0.75rem;
          }
          .download-option-card:hover {
            border-color: #dc3545;
            background-color: #fdf2f2;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.08);
          }
          .download-option-card .option-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            flex-shrink: 0;
          }
          .download-option-card .option-details {
            flex-grow: 1;
          }
          .download-option-card .option-arrow {
            margin-left: 0.5rem;
            flex-shrink: 0;
          }
          .download-option-card .option-details h6 {
            margin: 0;
            font-weight: 700;
            color: #212529;
            font-size: 0.95rem;
          }
          .download-option-card .option-details p {
            margin: 0;
            color: #6c757d;
            font-size: 0.8rem;
          }
        `;
        document.head.appendChild(style);
      }

      // Check if details modal is open and close it
      let closedDetailsModal = false;
      const detailsModalEl = document.getElementById('incidentDetailsModal');
      if (detailsModalEl && detailsModalEl.classList.contains('show')) {
        const detailsModal = bootstrap.Modal.getInstance(detailsModalEl);
        if (detailsModal) {
          detailsModal.hide();
          closedDetailsModal = true;
        }
      }

      const modalEl = document.createElement('div');
      modalEl.className = 'modal fade';
      modalEl.id = 'downloadOptionsModal';
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
            <div class="modal-header border-0 pb-0" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 1.5rem 1.5rem 1rem;">
              <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2" style="font-size: 1.2rem;">
                <i class="bi bi-download text-danger"></i> Download Options
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4" style="background-color: #fdfdfd;">
              <p class="text-muted small mb-4">Select the format in which you would like to download or print this official incident report.</p>
              
              <div class="d-flex flex-column">
                <div class="download-option-card" onclick="downloadIncidentReport('${incidentId}', 'print'); bootstrap.Modal.getInstance(document.getElementById('downloadOptionsModal')).hide();">
                  <div class="option-icon bg-primary bg-opacity-10 text-primary">
                    <i class="bi bi-printer-fill fs-4"></i>
                  </div>
                  <div class="option-details">
                    <h6>Printed Report</h6>
                    <p>Format and print a hard copy of the report.</p>
                  </div>
                  <div class="option-arrow">
                    <i class="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
                
                <div class="download-option-card" onclick="downloadIncidentReport('${incidentId}', 'pdf'); bootstrap.Modal.getInstance(document.getElementById('downloadOptionsModal')).hide();">
                  <div class="option-icon bg-danger bg-opacity-10 text-danger">
                    <i class="bi bi-file-pdf-fill fs-4"></i>
                  </div>
                  <div class="option-details">
                    <h6>PDF File</h6>
                    <p>Save a digital PDF copy of the report.</p>
                  </div>
                  <div class="option-arrow">
                    <i class="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
                
                ${hasPhoto ? `
                <div class="download-option-card" onclick="downloadIncidentPhoto('${incidentId}'); bootstrap.Modal.getInstance(document.getElementById('downloadOptionsModal')).hide();">
                  <div class="option-icon bg-success bg-opacity-10 text-success">
                    <i class="bi bi-image-fill fs-4"></i>
                  </div>
                  <div class="option-details">
                    <h6>Incident Photo Only</h6>
                    <p>Download the geotagged JPG photo evidence.</p>
                  </div>
                  <div class="option-arrow">
                    <i class="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            <div class="modal-footer border-0 bg-light py-2 px-4 d-flex justify-content-end">
              <button type="button" class="btn btn-secondary btn-sm rounded-pill px-3" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
      
      modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
        if (closedDetailsModal) {
          const detailsEl = document.getElementById('incidentDetailsModal');
          if (detailsEl) {
            const bsDetails = new bootstrap.Modal(detailsEl);
            bsDetails.show();
          }
        }
      });
    } catch (error) {
      console.error('Error showing download options:', error);
      alert('Error loading download settings');
    }
  };

  window.updateIncidentStatus = async function(incidentId, newStatus) {
    try {
      if (!confirm(`Change status to "${newStatus}"?`)) {
        return;
      }

      // Update via API
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: incidentId,
          status: newStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Reload incidents to reflect the change
      await loadAndDisplayIncidents();

      // Dispatch events to update other pages and sidebar counts
      window.dispatchEvent(new CustomEvent('incidentUpdated', { 
        detail: { id: incidentId, status: newStatus } 
      }));
      
      // Also dispatch incidentAdded to trigger sidebar count update
      window.dispatchEvent(new CustomEvent('incidentAdded'));
    } catch (error) {
      console.error('Error updating incident status:', error);
      alert('Error updating incident status: ' + error.message);
    }
  };

  window.editIncident = async function(incidentId) {
    try {
      const incident = await getIncidentById(incidentId);
      if (!incident) {
        alert('Incident not found');
        return;
      }
      
      const modalEl = document.getElementById("addIncidentModal");
      const formEl = document.getElementById("addIncidentForm");
      if (!modalEl || !formEl) return;
      
      // Prefill fields
      const editIdEl = document.getElementById("editIncidentId");
      if (editIdEl) editIdEl.value = incidentId;
      
      const typeEl = document.getElementById("modalIncidentType");
      if (typeEl) typeEl.value = incident.type || "";
      
      const descEl = document.getElementById("modalDescription");
      if (descEl) descEl.value = incident.description || "";
      
      // Show old photo in preview
      const previewEl = document.getElementById("modalPhotoPreview");
      const previewWrapEl = document.getElementById("modalPhotoPreviewWrap");
      const photoMetaEl = document.getElementById("modalPhotoMeta");
      
      if (incident.photoDataUrl && previewEl && previewWrapEl) {
        previewEl.src = incident.photoDataUrl;
        previewWrapEl.style.display = "block";
        if (photoMetaEl) photoMetaEl.innerHTML = '<i class="bi bi-image text-success me-1"></i>Current photo loaded';
      }
      
      // Update titles
      const modalLabel = document.getElementById("addIncidentModalLabel");
      if (modalLabel) modalLabel.innerHTML = '<i class="bi bi-pencil-fill me-2"></i>Edit Incident Report';
      
      const modalDesc = modalEl.querySelector(".modal-header p");
      if (modalDesc) modalDesc.textContent = "Fill in the details below to update the incident report";
      
      const submitBtn = document.getElementById("modalSubmitIncident");
      if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Incident Report';
      
      const photoInput = document.getElementById("modalPhoto");
      if (photoInput) photoInput.removeAttribute("required");
      
      // Open modal
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    } catch (error) {
      console.error('Error editing incident:', error);
      alert('Error prefilling edit details: ' + error.message);
    }
  };

  window.deleteIncident = async function(incidentId) {
    try {
      if (!confirm('Are you sure you want to permanently delete this incident report? This action cannot be undone.')) {
        return;
      }

      // Delete via API
      const response = await fetch(`../api/incidents.php?id=${encodeURIComponent(incidentId)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Reload incidents to reflect the change
      await loadAndDisplayIncidents();

      // Dispatch event to update sidebar counts
      window.dispatchEvent(new CustomEvent('incidentAdded'));
    } catch (error) {
      console.error('Error deleting incident:', error);
      alert('Error deleting incident: ' + error.message);
    }
  };

})();


