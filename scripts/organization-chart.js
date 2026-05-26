/**
 * Organization Chart JavaScript
 * Handles personnel management and hierarchical chart display
 */

(function() {
  'use strict';

  // Determine API URL based on current page location
  const API_URL = window.location.pathname.includes('/admin/') 
    ? '../api/organization-personnel.php' 
    : 'api/organization-personnel.php';
  
  // DOM Elements
  const btnRefresh = document.getElementById('btnRefresh');
  const addPersonnelForm = document.getElementById('addPersonnelForm');
  const addPersonnelModal = document.getElementById('addPersonnelModal');
  const addPersonnelModalLabel = document.getElementById('addPersonnelModalLabel');
  const addPersonnelSubmitBtn = addPersonnelForm ? addPersonnelForm.querySelector('button[type="submit"]') : null;
  const personnelNameInput = document.getElementById('personnelName');
  const personnelRoleInput = document.getElementById('personnelRole');
  const personnelPhotoInput = document.getElementById('personnelPhoto');
  const photoPreview = document.getElementById('photoPreview');
  const photoPreviewContainer = document.getElementById('photoPreviewContainer');
  const removePhotoBtn = document.getElementById('removePhoto');
  const isCEOCheckbox = document.getElementById('isCEO');
  const personnelReportsToSelect = document.getElementById('personnelReportsTo');
  const reportsToContainer = document.getElementById('reportsToContainer');
  const btnDeletePersonnel = document.getElementById('btnDeletePersonnel');
  
  let editingPersonnelId = null; // Track which personnel is being edited
  const orgChartContainer = document.getElementById('orgChartContainer');
  const orgChartEmpty = document.getElementById('orgChartEmpty');
  const orgChartLoading = document.getElementById('orgChartLoading');
  const orgChart = document.getElementById('orgChart');

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    loadAndRenderChart();
    setupEventListeners();
  });

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Refresh button
    if (btnRefresh) {
      btnRefresh.addEventListener('click', function() {
        loadAndRenderChart();
        const icon = btnRefresh.querySelector('i');
        if (icon) {
          icon.classList.add('spinning');
          setTimeout(() => icon.classList.remove('spinning'), 1000);
        }
      });
    }

    // CEO checkbox toggle
    if (isCEOCheckbox) {
      isCEOCheckbox.addEventListener('change', async function() {
        if (this.checked) {
          if (reportsToContainer) reportsToContainer.style.display = 'none';
          if (personnelReportsToSelect) personnelReportsToSelect.value = '';
        } else {
          if (reportsToContainer) reportsToContainer.style.display = 'block';
          await updateReportsToDropdown();
        }
      });
    }

    // Form submission
    if (addPersonnelForm) {
      addPersonnelForm.addEventListener('submit', handleAddPersonnel);
    }

    // Update dropdown when modal is shown
    if (addPersonnelModal) {
      addPersonnelModal.addEventListener('show.bs.modal', async function(e) {
        // Check if this is an edit action (triggered by edit button)
        const editButton = e.relatedTarget;
        if (editButton && editButton.hasAttribute('data-personnel-id')) {
          // Edit mode
          editingPersonnelId = editButton.getAttribute('data-personnel-id');
          await loadPersonnelForEdit(editingPersonnelId);
          if (addPersonnelModalLabel) addPersonnelModalLabel.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Personnel';
          if (addPersonnelSubmitBtn) addPersonnelSubmitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Personnel';
          if (btnDeletePersonnel) btnDeletePersonnel.classList.remove('d-none');
        } else {
          // Add mode
          editingPersonnelId = null;
          await updateReportsToDropdown();
          if (addPersonnelForm) addPersonnelForm.reset();
          if (reportsToContainer) reportsToContainer.style.display = 'block';
          if (isCEOCheckbox) isCEOCheckbox.checked = false;
          if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
          if (personnelPhotoInput) personnelPhotoInput.value = '';
          if (addPersonnelModalLabel) addPersonnelModalLabel.innerHTML = '<i class="bi bi-person-plus me-2"></i>Add Personnel';
          if (addPersonnelSubmitBtn) addPersonnelSubmitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Add Personnel';
          if (btnDeletePersonnel) btnDeletePersonnel.classList.add('d-none');
        }
      });
    }

    // Handle delete button click
    if (btnDeletePersonnel) {
      btnDeletePersonnel.addEventListener('click', handleDeletePersonnelClick);
    }

    // Handle photo upload preview with resize/compress
    if (personnelPhotoInput) {
      personnelPhotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 10 * 1024 * 1024) { // 10MB hard limit before resize
            alert('Image size must be less than 10MB');
            this.value = '';
            return;
          }

          const reader = new FileReader();
          reader.onload = function(event) {
            // Resize & compress via canvas before storing
            const img = new Image();
            img.onload = function() {
              const MAX_SIZE = 300; // max width or height in pixels
              let w = img.width;
              let h = img.height;
              if (w > h) {
                if (w > MAX_SIZE) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
              } else {
                if (h > MAX_SIZE) { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
              }
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              if (photoPreview) {
                photoPreview.src = compressedDataUrl;
                photoPreview.removeAttribute('data-removed');
              }
              if (photoPreviewContainer) photoPreviewContainer.style.display = 'block';
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Handle photo removal
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', function() {
        if (personnelPhotoInput) personnelPhotoInput.value = '';
        if (photoPreview) photoPreview.src = '';
        if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
        // Mark photo as removed (set to empty string to clear it on save)
        if (photoPreview) photoPreview.setAttribute('data-removed', 'true');
      });
    }
  }

  /**
   * Fetch personnel from API
   */
  async function fetchPersonnel() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch personnel data');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching personnel:', error);
      return [];
    }
  }

  /**
   * Load personnel from API (backward compatibility wrapper)
   */
  async function loadPersonnel() {
    return await fetchPersonnel();
  }

  /**
   * Load personnel data for editing
   */
  async function loadPersonnelForEdit(personnelId) {
    const personnel = await fetchPersonnel();
    const person = personnel.find(p => p.id === personnelId || p.id.toString() === personnelId.toString());
    
    if (!person) {
      alert('Personnel not found');
      return;
    }

    // Populate form fields
    if (personnelNameInput) personnelNameInput.value = person.name;
    if (personnelRoleInput) personnelRoleInput.value = person.role;
    if (isCEOCheckbox) {
      isCEOCheckbox.checked = person.isCEO;
      if (person.isCEO) {
        if (reportsToContainer) reportsToContainer.style.display = 'none';
        if (personnelReportsToSelect) personnelReportsToSelect.value = '';
      } else {
        if (reportsToContainer) reportsToContainer.style.display = 'block';
        updateReportsToDropdown();
        if (personnelReportsToSelect && person.reportsTo) {
          personnelReportsToSelect.value = person.reportsTo.toString();
        }
      }
    }

    // Load photo if available
    if (person.photoDataUrl) {
      if (photoPreview) {
        photoPreview.src = person.photoDataUrl;
        photoPreview.removeAttribute('data-removed');
      }
      if (photoPreviewContainer) photoPreviewContainer.style.display = 'block';
    } else {
      if (photoPreview) {
        photoPreview.src = '';
        photoPreview.removeAttribute('data-removed');
      }
      if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
    }
    if (personnelPhotoInput) personnelPhotoInput.value = '';
  }

  /**
   * Handle add/edit personnel form submission
   */
  async function handleAddPersonnel(e) {
    e.preventDefault();
    
    const name = personnelNameInput.value.trim();
    const role = personnelRoleInput.value.trim();
    const isCEO = isCEOCheckbox.checked;
    const reportsTo = isCEO ? null : personnelReportsToSelect.value;
    let photoDataUrl = null;

    if (!name || !role) {
      alert('Please fill in all required fields');
      return;
    }

    let existingPerson = null;
    if (editingPersonnelId) {
      const personnel = await fetchPersonnel();
      existingPerson = personnel.find(p => p.id === editingPersonnelId || p.id.toString() === editingPersonnelId.toString());
      if (!existingPerson) {
        alert('Personnel not found');
        return;
      }
      // Keep existing photo if new one not uploaded
      photoDataUrl = existingPerson.photoDataUrl;
    }

    // Handle photo upload - get from preview (already loaded when user selects file)
    if (personnelPhotoInput && personnelPhotoInput.files && personnelPhotoInput.files[0]) {
      const file = personnelPhotoInput.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      
      // Photo should already be loaded in preview from the change event
      if (photoPreview && photoPreview.src && photoPreview.src.startsWith('data:')) {
        photoDataUrl = photoPreview.src;
        photoPreview.removeAttribute('data-removed');
      }
    } else if (photoPreview && photoPreview.getAttribute('data-removed') === 'true') {
      // Photo was explicitly removed
      photoDataUrl = null;
    } else if (editingPersonnelId && photoPreview && photoPreview.src && photoPreview.src.startsWith('data:')) {
      // If editing and preview has new data URL, use it
      photoDataUrl = photoPreview.src;
    }

    // Check if CEO already exists (only for new personnel or if changing to CEO)
    if (isCEO) {
      const personnel = await fetchPersonnel();
      const existingCEO = personnel.find(p => p.isCEO && (p.id !== editingPersonnelId && p.id.toString() !== editingPersonnelId.toString()));
      if (existingCEO) {
        if (!confirm(`A CEO already exists (${existingCEO.name}). Replace with this person?`)) {
          return;
        }
      }
    }

    // Disable submit button during save
    if (addPersonnelSubmitBtn) {
      addPersonnelSubmitBtn.disabled = true;
      const originalText = addPersonnelSubmitBtn.innerHTML;
      addPersonnelSubmitBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Saving...';
    }

    try {
      const payload = {
        name: name,
        role: role,
        isCEO: isCEO,
        reportsTo: reportsTo || null,
        photoDataUrl: photoDataUrl
      };

      let response;
      if (editingPersonnelId) {
        // Update existing personnel
        payload.id = editingPersonnelId;
        response = await fetch(API_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new personnel
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save personnel');
      }

      // Close modal and refresh chart
      const bsModal = bootstrap.Modal.getInstance(addPersonnelModal);
      if (bsModal) bsModal.hide();
      
      editingPersonnelId = null;
      await loadAndRenderChart();
    } catch (error) {
      console.error('Error saving personnel:', error);
      alert('Error saving personnel: ' + error.message);
    } finally {
      // Re-enable submit button
      if (addPersonnelSubmitBtn) {
        addPersonnelSubmitBtn.disabled = false;
        addPersonnelSubmitBtn.innerHTML = editingPersonnelId 
          ? '<i class="bi bi-check-circle me-1"></i> Update Personnel'
          : '<i class="bi bi-check-circle me-1"></i> Add Personnel';
      }
    }
  }

  /**
   * Update reports to dropdown
   */
  async function updateReportsToDropdown() {
    if (!personnelReportsToSelect) return;
    
    const personnel = await fetchPersonnel();
    personnelReportsToSelect.innerHTML = '<option value="">Select supervisor...</option>';
    
    // Exclude the person being edited (can't report to themselves)
    personnel.forEach(person => {
      const personId = person.id.toString();
      const editingId = editingPersonnelId ? editingPersonnelId.toString() : null;
      if (personId !== editingId) {
        const option = document.createElement('option');
        option.value = personId;
        option.textContent = `${person.name} - ${person.role}`;
        personnelReportsToSelect.appendChild(option);
      }
    });
  }

  function buildHierarchy(personnel) {
    if (personnel.length === 0) return null;

    // Find root (CEO or top-level personnel without reportsTo)
    let root = personnel.find(p => p.isCEO);
    
    // If no CEO, find someone who doesn't report to anyone
    if (!root) {
      root = personnel.find(p => !p.reportsTo);
    }
    
    if (!root) return null;

    const rootIdStr = root.id.toString();

    // Normalize personnel: if they are not the root node and have no reportsTo,
    // automatically link them to the root node (CEO) so they don't disappear.
    const normalizedPersonnel = personnel.map(p => {
      if (p.id.toString() !== rootIdStr && !p.isCEO && !p.reportsTo) {
        return { ...p, reportsTo: rootIdStr };
      }
      return p;
    });

    // Build tree recursively
    function buildTree(personId) {
      const personIdStr = personId.toString();
      const person = normalizedPersonnel.find(p => p.id.toString() === personIdStr || p.id === personId);
      if (!person) return null;

      const children = normalizedPersonnel
        .filter(p => {
          const reportsTo = p.reportsTo ? p.reportsTo.toString() : null;
          return reportsTo === personIdStr || reportsTo === personId;
        })
        .map(child => buildTree(child.id))
        .filter(Boolean)
        .sort((a, b) => {
          // Sort by name for consistent display
          return a.name.localeCompare(b.name);
        });

      return {
        ...person,
        children: children.length > 0 ? children : undefined
      };
    }

    return buildTree(root.id);
  }

  /**
   * Render organizational chart
   */
  async function renderChart() {
    const personnel = await fetchPersonnel();
    
    if (personnel.length === 0) {
      if (orgChartContainer) orgChartContainer.style.display = 'none';
      if (orgChartEmpty) orgChartEmpty.style.display = 'block';
      if (orgChartLoading) orgChartLoading.style.display = 'none';
      return;
    }

    const tree = buildHierarchy(personnel);
    
    if (!tree) {
      if (orgChartContainer) orgChartContainer.style.display = 'none';
      if (orgChartEmpty) orgChartEmpty.style.display = 'block';
      if (orgChartLoading) orgChartLoading.style.display = 'none';
      return;
    }

    if (orgChartEmpty) orgChartEmpty.style.display = 'none';
    if (orgChartLoading) orgChartLoading.style.display = 'none';
    if (orgChartContainer) orgChartContainer.style.display = 'block';

    // Clear existing chart
    if (orgChart) orgChart.innerHTML = '';

    // Render tree
    if (orgChart) renderNode(tree, orgChart, 0, personnel);
  }

  /**
   * Render a node in the chart
   */
  function renderNode(node, container, level, allPersonnel) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'org-node';
    nodeElement.setAttribute('data-level', level);
    
    // Node card
    const card = document.createElement('div');
    card.className = 'org-node-card';
    if (node.isCEO) {
      card.classList.add('org-node-ceo');
    }

    // Edit button
    const editButton = document.createElement('button');
    editButton.className = 'org-node-edit-btn';
    editButton.setAttribute('type', 'button');
    editButton.setAttribute('data-bs-toggle', 'modal');
    editButton.setAttribute('data-bs-target', '#addPersonnelModal');
    editButton.setAttribute('data-personnel-id', node.id);
    editButton.setAttribute('title', 'Edit Personnel');
    const editIcon = document.createElement('i');
    editIcon.className = 'bi bi-pencil';
    editButton.appendChild(editIcon);
    card.appendChild(editButton);

    // Photo wrapper
    let photoWrapper = null;
    
    if (node.photoDataUrl) {
      photoWrapper = document.createElement('div');
      photoWrapper.className = 'org-node-photo-wrapper';
      photoWrapper.style.cursor = 'pointer';
      const photo = document.createElement('img');
      photo.className = 'org-node-photo';
      photo.src = node.photoDataUrl;
      photo.alt = node.name;
      photoWrapper.appendChild(photo);
      card.appendChild(photoWrapper);
    } else {
      // Placeholder icon if no photo
      photoWrapper = document.createElement('div');
      photoWrapper.className = 'org-node-photo-wrapper';
      photoWrapper.style.cursor = 'pointer';
      const placeholder = document.createElement('div');
      placeholder.className = 'org-node-photo-placeholder';
      const icon = document.createElement('i');
      icon.className = 'bi bi-person-fill';
      placeholder.appendChild(icon);
      photoWrapper.appendChild(placeholder);
      card.appendChild(photoWrapper);
    }

    if (photoWrapper) {
      photoWrapper.addEventListener('click', function() {
        showPersonnelDetails(node, allPersonnel);
      });
    }

    // Name
    const name = document.createElement('div');
    name.className = 'org-node-name';
    name.textContent = node.name;
    card.appendChild(name);

    // Role
    const role = document.createElement('div');
    role.className = 'org-node-role';
    role.textContent = node.role;
    card.appendChild(role);

    nodeElement.appendChild(card);

    // Children container
    if (node.children && node.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'org-children';

      node.children.forEach((child, index) => {
        const childWrapper = document.createElement('div');
        childWrapper.className = 'org-child-wrapper';

        renderNode(child, childWrapper, level + 1, allPersonnel);
        childrenContainer.appendChild(childWrapper);
      });

      nodeElement.appendChild(childrenContainer);
    }

    container.appendChild(nodeElement);
  }

  /**
   * Load and render chart
   */
  async function loadAndRenderChart() {
    if (orgChartLoading) orgChartLoading.style.display = 'block';
    await renderChart();
  }

  /**
   * Show personnel details in modal
   */
  function showPersonnelDetails(person, allPersonnel) {
    const modalElement = document.getElementById('viewPersonnelModal');
    if (!modalElement) return;

    const imgContainer = document.getElementById('viewPersonnelImageContainer');
    const nameEl = document.getElementById('viewPersonnelName');
    const roleEl = document.getElementById('viewPersonnelRole');
    const reportToContainer = document.getElementById('viewPersonnelReportToContainer');
    const reportToEl = document.getElementById('viewPersonnelReportTo');

    if (person.photoDataUrl) {
      imgContainer.innerHTML = `<img src="${person.photoDataUrl}" alt="${person.name}" class="img-thumbnail rounded-circle shadow-sm" style="width: 150px; height: 150px; object-fit: cover; object-position: top; border: 4px solid white;">`;
    } else {
      imgContainer.innerHTML = `<div class="mx-auto rounded-circle shadow-sm d-flex align-items-center justify-content-center bg-white" style="width: 150px; height: 150px; border: 4px solid white;"><i class="bi bi-person-fill text-muted" style="font-size: 5rem;"></i></div>`;
    }

    nameEl.textContent = person.name;
    roleEl.textContent = person.role;
    
    if (person.reportsTo) {
      const reportsToPerson = allPersonnel.find(p => p.id.toString() === person.reportsTo.toString());
      if (reportsToPerson) {
        reportToEl.textContent = `${reportsToPerson.name} (${reportsToPerson.role})`;
        reportToContainer.style.setProperty('display', 'flex', 'important');
      } else {
        reportToContainer.style.setProperty('display', 'none', 'important');
      }
    } else {
      reportToContainer.style.setProperty('display', 'none', 'important');
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  /**
   * Delete personnel via API
   */
  async function handleDeletePersonnelClick() {
    if (!editingPersonnelId) return;

    if (!confirm('Are you sure you want to delete this personnel member? This action cannot be undone.')) {
      return;
    }

    try {
      if (btnDeletePersonnel) {
        btnDeletePersonnel.disabled = true;
        btnDeletePersonnel.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Deleting...';
      }

      const response = await fetch(`${API_URL}?id=${editingPersonnelId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete personnel');
      }

      // Close modal and refresh chart
      const bsModal = bootstrap.Modal.getInstance(addPersonnelModal);
      if (bsModal) bsModal.hide();
      
      editingPersonnelId = null;
      await loadAndRenderChart();
    } catch (error) {
      console.error('Error deleting personnel:', error);
      alert('Error deleting personnel: ' + error.message);
    } finally {
      if (btnDeletePersonnel) {
        btnDeletePersonnel.disabled = false;
        btnDeletePersonnel.innerHTML = '<i class="bi bi-trash me-1"></i> Delete';
      }
    }
  }

})();

