/**
 * Activities Management JavaScript
 * Handles activity management with multiple image support
 */

(function() {
  'use strict';

  const API_URL = '../api/activities.php';
  
  // DOM Elements
  const btnRefresh = document.getElementById('btnRefresh');
  const addActivityForm = document.getElementById('addActivityForm');
  const addActivityModal = document.getElementById('addActivityModal');
  const activityTitleInput = document.getElementById('activityTitle');
  const activityDateInput = document.getElementById('activityDate');
  const activityDescriptionInput = document.getElementById('activityDescription');
  const activityImagesInput = document.getElementById('activityImages');
  const activityImagesPreview = document.getElementById('activityImagesPreview');
  const activityImagesPreviewContainer = document.getElementById('activityImagesPreviewContainer');
  const activitiesList = document.getElementById('activitiesList');
  const activitiesEmpty = document.getElementById('activitiesEmpty');
  const activitiesLoading = document.getElementById('activitiesLoading');
  const imageGalleryModal = document.getElementById('imageGalleryModal');
  const galleryCarouselInner = document.getElementById('galleryCarouselInner');
  const galleryImageCounter = document.getElementById('galleryImageCounter');
  const searchActivitiesInput = document.getElementById('searchActivities');

  let selectedImages = []; // Store selected images as data URLs
  let allActivities = []; // Store activities in memory for quick access

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    loadAndDisplayActivities();
    setupEventListeners();
  });

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Refresh button
    if (btnRefresh) {
      btnRefresh.addEventListener('click', function() {
        loadAndDisplayActivities();
        const icon = btnRefresh.querySelector('i');
        if (icon) {
          icon.classList.add('spinning');
          setTimeout(() => icon.classList.remove('spinning'), 1000);
        }
      });
    }

    // Form submission
    if (addActivityForm) {
      addActivityForm.addEventListener('submit', handleAddActivity);
    }

    // Modal reset when shown
    if (addActivityModal) {
      addActivityModal.addEventListener('show.bs.modal', function() {
        const editIdEl = document.getElementById('editActivityId');
        if (editIdEl && editIdEl.value) {
          // It's an edit mode, don't reset form!
          return;
        }

        addActivityForm.reset();
        selectedImages = [];
        if (activityImagesPreviewContainer) activityImagesPreviewContainer.style.display = 'none';
        if (activityImagesPreview) activityImagesPreview.innerHTML = '';
        if (activityImagesInput) activityImagesInput.value = '';
        
        // Reset titles for fresh Add
        const modalLabel = document.getElementById('addActivityModalLabel');
        if (modalLabel) modalLabel.innerHTML = '<i class="bi bi-calendar-plus me-2"></i>Add Activity';
        const submitBtn = addActivityForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Add Activity';

        // Set default date/time to current date/time
        if (activityDateInput) {
          const now = new Date();
          // Format: YYYY-MM-DDTHH:mm (datetime-local format)
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          activityDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
      });
    }

    // Handle multiple image uploads
    if (activityImagesInput) {
      activityImagesInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Check file sizes (before compression, we allow larger files as they'll be compressed)
        const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
          alert('Some images exceed 10MB limit. Please select smaller images.');
          this.value = '';
          return;
        }
        
        // Limit number of images to prevent storage issues
        if (files.length > 10) {
          alert('Please select a maximum of 10 images at a time to avoid storage issues.');
          this.value = '';
          return;
        }

        // Clear previous previews
        selectedImages = [];
        if (activityImagesPreview) activityImagesPreview.innerHTML = '';

        // Load and compress all images
        let loadedCount = 0;
        files.forEach((file, index) => {
          // Compress image before storing
          compressImage(file, 1280, 1280, 0.8)
            .then(compressedDataUrl => {
              selectedImages.push(compressedDataUrl);
              addImagePreview(compressedDataUrl, index);
              loadedCount++;
              if (loadedCount === files.length) {
                if (activityImagesPreviewContainer) activityImagesPreviewContainer.style.display = 'block';
              }
            })
            .catch(error => {
              console.error('Error compressing image:', error);
              alert('Error processing image. Please try a different image.');
              loadedCount++;
              if (loadedCount === files.length) {
                if (activityImagesPreviewContainer) activityImagesPreviewContainer.style.display = 'block';
              }
            });
        });
      });
    }

    // Update gallery counter when carousel slides
    const galleryCarousel = document.getElementById('galleryCarousel');
    if (galleryCarousel) {
      galleryCarousel.addEventListener('slid.bs.carousel', function(e) {
        updateGalleryCounter(e.to);
      });
    }

    // Handle search filtering
    if (searchActivitiesInput) {
      searchActivitiesInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const cards = activitiesList.querySelectorAll('.activity-card');
        
        cards.forEach(card => {
          const title = card.querySelector('.activity-title').textContent.toLowerCase();
          const descElement = card.querySelector('.activity-description');
          const desc = descElement ? descElement.textContent.toLowerCase() : '';
          
          if (title.includes(searchTerm) || desc.includes(searchTerm)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }
  }

  /**
   * Compress and resize image to reduce storage size
   */
  function compressImage(file, maxWidth, maxHeight, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = () => {
        img.onload = () => {
          let { width, height } = img;
          // Calculate resize ratio to fit within max dimensions
          const ratio = Math.min(1, maxWidth / width, maxHeight / height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Convert to JPEG with specified quality (smaller than PNG)
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }


  /**
   * Add image preview to preview container
   */
  function addImagePreview(imageDataUrl, index) {
    if (!activityImagesPreview) return;

    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.setAttribute('data-index', index);

    const img = document.createElement('img');
    img.src = imageDataUrl;
    img.alt = 'Preview';
    previewItem.appendChild(img);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'image-preview-remove';
    removeBtn.type = 'button';
    removeBtn.innerHTML = '<i class="bi bi-x"></i>';
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const idx = parseInt(previewItem.getAttribute('data-index'));
      selectedImages.splice(idx, 1);
      previewItem.remove();
      if (selectedImages.length === 0) {
        if (activityImagesPreviewContainer) activityImagesPreviewContainer.style.display = 'none';
        if (activityImagesInput) activityImagesInput.value = '';
      } else {
        // Re-index remaining previews
        updatePreviewIndices();
      }
    });
    previewItem.appendChild(removeBtn);

    activityImagesPreview.appendChild(previewItem);
  }

  /**
   * Update preview indices after removal
   */
  function updatePreviewIndices() {
    const previewItems = activityImagesPreview.querySelectorAll('.image-preview-item');
    previewItems.forEach((item, index) => {
      item.setAttribute('data-index', index);
    });
  }

  /**
   * Load activities from database API
   */
  async function loadActivities() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  }

  /**
   * Save activity to database API
   */
  async function saveActivity(activity) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  }

  /**
   * Handle add activity form submission
   */
  async function handleAddActivity(e) {
    e.preventDefault();
    
    const title = activityTitleInput.value.trim();
    const description = activityDescriptionInput.value.trim();
    const dateValue = activityDateInput.value;
    const editIdEl = document.getElementById('editActivityId');
    const isEdit = editIdEl && editIdEl.value;

    if (!title) {
      alert('Please enter an activity title');
      return;
    }

    if (!dateValue) {
      alert('Please select the date and time when the activity was conducted');
      return;
    }

    // Convert datetime-local value to timestamp
    const selectedDate = new Date(dateValue);
    const createdAt = selectedDate.getTime();

    // Create activity object
    const activityData = {
      title: title,
      description: description || null,
      images: [...selectedImages]
    };

    if (isEdit) {
      activityData.id = editIdEl.value;
    } else {
      activityData.id = generateId();
      activityData.createdAt = createdAt;
    }

    // Show loading state
    const submitBtn = addActivityForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
      
      try {
        if (isEdit) {
          // Update activity via PUT
          const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData)
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
        } else {
          // Save to database via POST
          await saveActivity(activityData);
        }

        // Close modal and refresh display
        const bsModal = bootstrap.Modal.getInstance(addActivityModal);
        if (bsModal) bsModal.hide();
        
        loadAndDisplayActivities();
      } catch (error) {
        alert('Failed to save activity: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Render activities list
   */
  async function renderActivities() {
    const activities = await loadActivities();
    allActivities = activities;
    
    if (activities.length === 0) {
      activitiesList.style.display = 'none';
      activitiesEmpty.style.display = 'block';
      activitiesLoading.style.display = 'none';
      return;
    }

    activitiesEmpty.style.display = 'none';
    activitiesLoading.style.display = 'none';
    activitiesList.style.display = 'grid';

    // Render cards using matching incident horizontal layout
    activitiesList.innerHTML = activities.map(activity => renderActivityCard(activity)).join('');
  }

  /**
   * Render activity card template (rectangular layout, matching incident-card-square)
   */
  function renderActivityCard(activity) {
    const date = new Date(activity.createdAt || Date.now());
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeAgo = getTimeAgo(date);
    const hasImages = activity.images && activity.images.length > 0;
    const firstImage = hasImages ? activity.images[0] : null;

    return `
      <div class="incident-grid-item">
        <div class="activity-card-square hover-lift" onclick="openImageGalleryById('${activity.id}')" style="cursor: pointer;">
          <!-- Image Section -->
          <div class="activity-card-image-wrapper" onclick="event.stopPropagation(); openImageGalleryById('${activity.id}')">
            ${(() => {
              const images = activity.images && activity.images.length > 0 ? activity.images : [];
              if (images.length === 0) {
                return `
                  <div class="activity-card-image-placeholder">
                    <i class="bi bi-calendar4-event"></i>
                  </div>
                `;
              } else if (images.length === 1) {
                return `
                  <img src="${images[0]}" 
                       alt="Activity photo" 
                       class="activity-card-image"
                       loading="lazy">
                `;
              } else {
                let carouselInner = '';
                let carouselIndicators = '';
                images.forEach((url, i) => {
                  carouselIndicators += `<button type="button" data-bs-target="#cardCarouselAct${activity.id}" data-bs-slide-to="${i}" class="${i === 0 ? 'active' : ''}" aria-current="true" aria-label="Slide ${i + 1}" onclick="event.stopPropagation();"></button>`;
                  carouselInner += `
                    <div class="carousel-item ${i === 0 ? 'active' : ''} h-100">
                      <img src="${url}" class="d-block w-100 h-100 activity-card-image" style="object-fit: cover; cursor: pointer;" alt="Activity Photo ${i+1}" onclick="event.stopPropagation(); openImageGalleryById('${activity.id}')">
                    </div>
                  `;
                });
                return `
                  <div id="cardCarouselAct${activity.id}" class="carousel slide h-100 w-100">
                    <div class="carousel-indicators mb-0 pb-1" style="bottom: 0;">
                      ${carouselIndicators}
                    </div>
                    <div class="carousel-inner h-100">
                      ${carouselInner}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#cardCarouselAct${activity.id}" data-bs-slide="prev" onclick="event.stopPropagation();" style="width: 15%; background: linear-gradient(90deg, rgba(0,0,0,0.5) 0%, transparent 100%);">
                      <span class="carousel-control-prev-icon" aria-hidden="true" style="width: 1rem; height: 1rem;"></span>
                      <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#cardCarouselAct${activity.id}" data-bs-slide="next" onclick="event.stopPropagation();" style="width: 15%; background: linear-gradient(270deg, rgba(0,0,0,0.5) 0%, transparent 100%);">
                      <span class="carousel-control-next-icon" aria-hidden="true" style="width: 1rem; height: 1rem;"></span>
                      <span class="visually-hidden">Next</span>
                    </button>
                  </div>
                `;
              }
            })()}
            <!-- Status Badge Overlay -->
            <div class="activity-card-status-overlay">
              <span class="badge bg-success activity-status-badge">Official</span>
            </div>
            <!-- Type Icon Overlay -->
            <div class="activity-card-type-overlay">
              <div class="activity-type-icon">
                <i class="bi bi-calendar-check"></i>
              </div>
            </div>
          </div>
          
          <!-- Content Section -->
          <div class="activity-card-content">
            <!-- Header -->
            <div class="activity-card-header">
              <h6 class="activity-card-title" title="${escapeHtml(activity.title || 'Untitled')}">
                ${escapeHtml(activity.title || 'Untitled')}
              </h6>
              <small class="activity-card-time">${timeAgo}</small>
            </div>
            
            <!-- Description -->
            <p class="activity-card-description" title="${escapeHtml(activity.description || 'No description provided')}">
              ${escapeHtml(activity.description || 'No description provided')}
            </p>
            
            <!-- Metadata -->
            <div class="activity-card-meta">
              <div class="activity-meta-item">
                <i class="bi bi-calendar3"></i>
                <span>${dateStr}</span>
              </div>
              ${activity.images && activity.images.length > 0 ? `
                <div class="activity-meta-item">
                  <i class="bi bi-images"></i>
                  <span>${activity.images.length} ${activity.images.length === 1 ? 'Photo' : 'Photos'}</span>
                </div>
              ` : ''}
            </div>
            
            <!-- Actions -->
            <div class="activity-card-actions" onclick="event.stopPropagation();">
              <button class="btn btn-sm btn-outline-dark activity-action-btn" onclick="event.stopPropagation(); showDownloadOptions('${activity.id}')" title="Download Options">
                <i class="bi bi-download"></i>
              </button>
              ${!window.location.pathname.includes('/bdrrmo/') ? `
              <button class="btn btn-sm btn-outline-warning activity-action-btn" onclick="event.stopPropagation(); editActivity('${activity.id}')" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              ` : ''}
              <button class="btn btn-sm btn-outline-danger activity-action-btn" onclick="event.stopPropagation(); deleteActivity('${activity.id}')" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
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
   * Escape HTML helper
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Global event targets for activity controls
   */
  window.openImageGalleryById = function(activityId) {
    const activity = allActivities.find(x => x.id === activityId);
    if (activity) {
      openImageGallery(activity, 0);
    }
  };

  window.showDownloadOptions = async function(activityId) {
    try {
      const activity = allActivities.find(x => x.id === activityId);
      if (!activity) {
        alert('Activity not found');
        return;
      }
      
      const hasPhotos = activity.images && activity.images.length > 0;
      
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
            border-color: #0d6efd;
            background-color: #f2f7ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.08);
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

      const modalEl = document.createElement('div');
      modalEl.className = 'modal fade';
      modalEl.id = 'downloadOptionsModal';
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
            <div class="modal-header border-0 pb-0" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 1.5rem 1.5rem 1rem;">
              <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2" style="font-size: 1.2rem;">
                <i class="bi bi-download text-primary"></i> Download Options
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4" style="background-color: #fdfdfd;">
              <p class="text-muted small mb-4">Select the format in which you would like to download or print this official activity report.</p>
              
              <div class="d-flex flex-column">
                <div class="download-option-card" onclick="downloadActivityReport('${activityId}', 'print'); bootstrap.Modal.getInstance(document.getElementById('downloadOptionsModal')).hide();">
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
                
                <div class="download-option-card" onclick="downloadActivityReport('${activityId}', 'pdf'); bootstrap.Modal.getInstance(document.getElementById('downloadOptionsModal')).hide();">
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
                
                ${hasPhotos ? `
                <div class="download-option-card" onclick="downloadActivityPhotos('${activityId}'); bootstrap.Modal.getInstance(document.getElementById('downloadOptionsModal')).hide();">
                  <div class="option-icon bg-success bg-opacity-10 text-success">
                    <i class="bi bi-image-fill fs-4"></i>
                  </div>
                  <div class="option-details">
                    <h6>Activity Photos Only</h6>
                    <p>Download the JPG photo evidence.</p>
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
      });
    } catch (error) {
      console.error('Error showing download options:', error);
      alert('Error loading download settings');
    }
  };

  window.downloadActivityPhotos = async function(activityId) {
    try {
      const activity = allActivities.find(x => x.id === activityId);
      if (!activity) {
        alert('Activity not found');
        return;
      }
      if (!activity.images || activity.images.length === 0) {
        alert('No photos available for this activity');
        return;
      }
      // Download each image
      activity.images.forEach((imgUrl, index) => {
        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = `${activity.title || 'activity'}_image_${index + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    } catch (error) {
      console.error('Error downloading activity photos:', error);
      alert('Error downloading photos');
    }
  };

  window.downloadActivityReport = function(activityId, format = 'print') {
    const activity = allActivities.find(x => x.id === activityId);
    if (!activity) {
      alert('Activity not found');
      return;
    }

    const date = new Date(activity.createdAt || Date.now());
    const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print/download the report.');
      return;
    }

    // Build the photo gallery cards dynamically
    let galleryHtml = '';
    if (activity.images && activity.images.length > 0) {
      galleryHtml = `
        <div class="evidence-section">
          <div class="report-section-title">Photo Gallery & Documentation</div>
          <div class="evidence-gallery">
            ${activity.images.map((imgUrl, index) => `
              <div class="evidence-card">
                <div class="evidence-img-container">
                  <img src="${imgUrl}" alt="Activity Image ${index + 1}">
                </div>
                <div class="evidence-caption">Activity Photo ${index + 1}: ${escapeHtml(activity.title)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MDRRMO Activity Log - ${escapeHtml(activity.title || 'Activity')}</title>
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
            border-bottom: 3px double #0d6efd;
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
            color: #0d6efd;
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
            border-left: 4px solid #0d6efd;
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
          .evidence-gallery {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          .evidence-card {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            background: #fff;
            padding: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            page-break-inside: avoid;
          }
          .evidence-img-container {
            width: 100%;
            height: 200px;
            background: #f8f9fa;
            overflow: hidden;
            border-radius: 4px;
          }
          .evidence-img-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .evidence-caption {
            font-size: 0.75rem;
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
          <div class="no-print" style="background-color: #0d6efd; color: white; text-align: center; padding: 12px; font-weight: bold; font-size: 0.9rem; font-family: sans-serif; border-radius: 4px; margin-bottom: 20px;">
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
            <div class="report-title">Official Activity Log</div>
          </div>

          <!-- Details Grid -->
          <table class="metadata-table">
            <tr>
              <th>Log Reference ID</th>
              <td>${escapeHtml(activity.id)}</td>
              <th>Activity Title</th>
              <td><strong>${escapeHtml(activity.title || 'Untitled')}</strong></td>
            </tr>
            <tr>
              <th>Date Conducted</th>
              <td>${escapeHtml(dateStr)}</td>
              <th>Log Agency</th>
              <td>MDRRMO Lapuyan (Operations)</td>
            </tr>
            <tr>
              <th>Created By</th>
              <td>${escapeHtml(activity.createdBy || 'Operations Admin')}</td>
              <th>Geotag Status</th>
              <td>Verified Official Conducting Log</td>
            </tr>
          </table>

          <!-- Narrative / Logs -->
          <div class="report-section-title">Activity Description & Log Summary</div>
          <div class="report-description">${escapeHtml(activity.description || 'No description or summary logs documented for this activity.')}</div>

          <!-- Evidence Gallery -->
          ${galleryHtml}

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line"></div>
              <h5 class="signature-title">Prepared By</h5>
              <p class="signature-sub">Conducting Officer / Log Recorder</p>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <h5 class="signature-title">Attested By</h5>
              <p class="signature-sub">MDRRMO Disaster Chief / Administrator</p>
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
  };

  window.editActivity = function(activityId) {
    const activity = allActivities.find(x => x.id === activityId);
    if (!activity) {
      alert('Activity not found');
      return;
    }

    const editIdEl = document.getElementById('editActivityId');
    if (editIdEl) editIdEl.value = activityId;

    if (activityTitleInput) activityTitleInput.value = activity.title || '';
    if (activityDescriptionInput) activityDescriptionInput.value = activity.description || '';
    
    if (activityDateInput && activity.createdAt) {
      const date = new Date(activity.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      activityDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Populate images preview
    selectedImages = [...(activity.images || [])];
    if (activityImagesPreview) {
      activityImagesPreview.innerHTML = '';
      selectedImages.forEach((imgUrl, index) => {
        addImagePreview(imgUrl, index);
      });
      if (activityImagesPreviewContainer) {
        activityImagesPreviewContainer.style.display = selectedImages.length > 0 ? 'block' : 'none';
      }
    }

    // Update title and button text
    const modalLabel = document.getElementById('addActivityModalLabel');
    if (modalLabel) modalLabel.innerHTML = '<i class="bi bi-pencil-fill me-2"></i>Edit Activity Log';
    
    const submitBtn = addActivityForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Activity';

    // Show modal
    const bsModal = bootstrap.Modal.getOrCreateInstance(addActivityModal);
    bsModal.show();
  };

  window.deleteActivity = async function(activityId) {
    if (!confirm('Are you sure you want to permanently delete this activity log? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}?id=${encodeURIComponent(activityId)}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const res = await response.json();
      if (res.error) {
        throw new Error(res.error);
      }
      // Refresh list
      loadAndDisplayActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity: ' + error.message);
    }
  };

  /**
   * Open image gallery modal
   */
  function openImageGallery(activity, startIndex = 0) {
    const modalEl = document.getElementById('imageGalleryModal');
    const carouselInner = document.getElementById('galleryCarouselInner');
    const imageCounter = document.getElementById('galleryImageCounter');
    
    if (!modalEl || !carouselInner) return;

    // Clear carousel
    carouselInner.innerHTML = '';
    
    const carouselEl = document.getElementById('galleryCarousel');
    let indicatorsEl = document.getElementById('galleryCarouselIndicators');
    
    // Create indicators container if it doesn't exist
    if (!indicatorsEl && carouselEl) {
      indicatorsEl = document.createElement('div');
      indicatorsEl.id = 'galleryCarouselIndicators';
      indicatorsEl.className = 'carousel-indicators';
      // Insert right before the inner content
      carouselEl.insertBefore(indicatorsEl, carouselInner);
    }
    
    if (indicatorsEl) {
      indicatorsEl.innerHTML = '';
    }

    const images = activity.images || [];

    if (images.length === 0) {
      // Add a nice centered placeholder when there are no images
      const item = document.createElement('div');
      item.className = 'carousel-item active h-100 d-flex flex-column align-items-center justify-content-center text-center p-4';
      
      const icon = document.createElement('i');
      icon.className = 'bi bi-calendar2-event text-white-50 mb-3';
      icon.style.fontSize = '4rem';
      item.appendChild(icon);
      
      const text = document.createElement('div');
      text.className = 'text-white-50 fw-semibold';
      text.textContent = 'No images uploaded for this activity';
      item.appendChild(text);
      
      carouselInner.appendChild(item);
    } else {
      // Add carousel items for all images
      images.forEach((imageUrl, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-item h-100' + (index === startIndex ? ' active' : '');
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'd-block w-100 h-100';
        img.style.objectFit = 'contain';
        img.alt = `Activity image ${index + 1}`;
        item.appendChild(img);

        carouselInner.appendChild(item);
        
        // Add indicator
        if (indicatorsEl && images.length > 1) {
          const indicator = document.createElement('button');
          indicator.type = 'button';
          indicator.setAttribute('data-bs-target', '#galleryCarousel');
          indicator.setAttribute('data-bs-slide-to', index.toString());
          if (index === startIndex) {
            indicator.className = 'active';
            indicator.setAttribute('aria-current', 'true');
          }
          indicator.setAttribute('aria-label', `Slide ${index + 1}`);
          indicatorsEl.appendChild(indicator);
        }
      });
    }

    // Show/hide controls based on image count
    const prevBtn = modalEl.querySelector('.carousel-control-prev');
    const nextBtn = modalEl.querySelector('.carousel-control-next');
    
    if (images.length > 1) {
      if (prevBtn) prevBtn.style.setProperty('display', 'flex', 'important');
      if (nextBtn) nextBtn.style.setProperty('display', 'flex', 'important');
      if (imageCounter) imageCounter.style.setProperty('display', 'block', 'important');
    } else {
      if (prevBtn) prevBtn.style.setProperty('display', 'none', 'important');
      if (nextBtn) nextBtn.style.setProperty('display', 'none', 'important');
      if (imageCounter) imageCounter.style.setProperty('display', 'none', 'important');
    }

    // Populate info
    const titleEl = document.getElementById('galleryActivityTitle');
    const dateEl = document.getElementById('galleryActivityDate');
    const descEl = document.getElementById('galleryActivityDesc');

    if (titleEl) titleEl.textContent = activity.title || '';
    if (dateEl) {
      const dateObj = new Date(activity.createdAt);
      dateEl.innerHTML = `<i class="bi bi-clock me-1"></i> ${dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`;
    }
    if (descEl) {
      if (activity.description) {
        descEl.textContent = activity.description;
        descEl.classList.remove('text-muted', 'fst-italic');
      } else {
        descEl.textContent = 'No description provided.';
        descEl.classList.add('text-muted', 'fst-italic');
      }
    }

    // Update counter
    updateGalleryCounter(startIndex);

    // Show modal safely using Bootstrap Modal instance manager
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }

  /**
   * Update gallery image counter
   */
  function updateGalleryCounter(currentIndex) {
    const carouselInner = document.getElementById('galleryCarouselInner');
    const imageCounter = document.getElementById('galleryImageCounter');
    if (!carouselInner || !imageCounter) return;

    const items = carouselInner.querySelectorAll('.carousel-item');
    const total = items.length;
    
    // Check if the single item is our calendar placeholder
    const hasPlaceholder = total === 1 && items[0].querySelector('.bi-calendar2-event') !== null;

    if (total <= 1 || hasPlaceholder) {
      imageCounter.textContent = '';
      imageCounter.style.setProperty('display', 'none', 'important');
    } else {
      imageCounter.textContent = `${(currentIndex || 0) + 1} / ${total}`;
      imageCounter.style.setProperty('display', 'block', 'important');
    }
  }

  /**
   * Load and display activities
   */
  async function loadAndDisplayActivities() {
    if (activitiesLoading) activitiesLoading.style.display = 'block';
    try {
      await renderActivities();
    } catch (error) {
      console.error('Error loading activities:', error);
      if (activitiesEmpty) activitiesEmpty.style.display = 'block';
      if (activitiesList) activitiesList.style.display = 'none';
    } finally {
      if (activitiesLoading) activitiesLoading.style.display = 'none';
    }
  }

})();

