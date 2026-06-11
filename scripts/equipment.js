/**
 * Equipment Management JavaScript
 * Handles equipment inventory management and display
 */

(function() {
  'use strict';

  const API_URL = '../api/equipment.php';
  
  // DOM Elements
  const btnRefresh = document.getElementById('btnRefresh');
  const addEquipmentForm = document.getElementById('addEquipmentForm');
  const addEquipmentModal = document.getElementById('addEquipmentModal');
  const equipmentNameInput = document.getElementById('equipmentName');
  const equipmentCountInput = document.getElementById('equipmentCount');
  const equipmentImageInput = document.getElementById('equipmentImage');
  const equipmentImagePreview = document.getElementById('equipmentImagePreview');
  const equipmentImagePreviewContainer = document.getElementById('equipmentImagePreviewContainer');
  const removeEquipmentImageBtn = document.getElementById('removeEquipmentImage');
  const equipmentGrid = document.getElementById('equipmentGrid');
  const equipmentEmpty = document.getElementById('equipmentEmpty');
  const equipmentLoading = document.getElementById('equipmentLoading');
  const totalEquipmentTypes = document.getElementById('totalEquipmentTypes');
  const totalEquipmentCount = document.getElementById('totalEquipmentCount');
  const editEquipmentIdInput = document.getElementById('editEquipmentId');
  const searchEquipmentInput = document.getElementById('searchEquipment');

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    loadAndDisplayEquipment();
    setupEventListeners();
  });

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Refresh button
    if (btnRefresh) {
      btnRefresh.addEventListener('click', function() {
        loadAndDisplayEquipment();
        const icon = btnRefresh.querySelector('i');
        if (icon) {
          icon.classList.add('spinning');
          setTimeout(() => icon.classList.remove('spinning'), 1000);
        }
      });
    }

    // Form submission
    if (addEquipmentForm) {
      addEquipmentForm.addEventListener('submit', handleAddEquipment);
    }

    // Modal reset when shown
    if (addEquipmentModal) {
      addEquipmentModal.addEventListener('show.bs.modal', function(e) {
        if (e.relatedTarget) {
          addEquipmentForm.reset();
          if (editEquipmentIdInput) editEquipmentIdInput.value = '';
          if (equipmentImagePreviewContainer) equipmentImagePreviewContainer.style.display = 'none';
          if (equipmentImagePreview) equipmentImagePreview.src = '';
          if (equipmentImageInput) equipmentImageInput.value = '';
          
          const modalLabel = document.getElementById('addEquipmentModalLabel');
          if (modalLabel) {
            modalLabel.innerHTML = '<i class="bi bi-tool me-2"></i>Add Equipment';
          }

          const submitBtn = addEquipmentForm.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Add Equipment';
          }
        }
      });
    }

    // Handle image upload preview
    if (equipmentImageInput) {
      equipmentImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size must be less than 5MB');
            this.value = '';
            return;
          }
          
          const reader = new FileReader();
          reader.onload = function(event) {
            if (equipmentImagePreview) equipmentImagePreview.src = event.target.result;
            if (equipmentImagePreviewContainer) equipmentImagePreviewContainer.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Handle image removal
    if (removeEquipmentImageBtn) {
      removeEquipmentImageBtn.addEventListener('click', function() {
        if (equipmentImageInput) equipmentImageInput.value = '';
        if (equipmentImagePreview) equipmentImagePreview.src = '';
        if (equipmentImagePreviewContainer) equipmentImagePreviewContainer.style.display = 'none';
      });
    }

    // Handle search filtering
    if (searchEquipmentInput) {
      searchEquipmentInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const cards = equipmentGrid.querySelectorAll('.equipment-card');
        
        cards.forEach(card => {
          const title = card.querySelector('.equipment-card-title').textContent.toLowerCase();
          if (title.includes(searchTerm)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }
  }

  /**
   * Load equipment from database API
   */
  async function loadEquipment() {
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
      console.error('Error loading equipment:', error);
      return [];
    }
  }

  /**
   * Save equipment to database API
   */
  async function saveEquipment(equipment) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipment)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving equipment:', error);
      throw error;
    }
  }

  /**
   * Update equipment in database API
   */
  async function updateEquipment(equipment) {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipment)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  /**
   * Handle add equipment form submission
   */
  async function handleAddEquipment(e) {
    e.preventDefault();
    
    const name = equipmentNameInput.value.trim();
    const count = parseInt(equipmentCountInput.value);

    if (!name || !count || count < 1) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    let imageDataUrl = null;

    // Handle image upload
    if (equipmentImageInput && equipmentImageInput.files && equipmentImageInput.files[0]) {
      const file = equipmentImageInput.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      // Image should already be loaded in preview from the change event
      if (equipmentImagePreview && equipmentImagePreview.src && equipmentImagePreview.src.startsWith('data:')) {
        imageDataUrl = equipmentImagePreview.src;
      }
    }

    // Show loading state
    const submitBtn = addEquipmentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
    }

    try {
      // Check if we are editing or creating new
      const editId = editEquipmentIdInput ? editEquipmentIdInput.value : '';

      if (editId) {
        // Prepare updated equipment data
        const updatedEquipment = {
          id: editId,
          name: name,
          count: count
        };
        
        const previewSrc = equipmentImagePreview ? equipmentImagePreview.src : '';
        updatedEquipment.imageDataUrl = previewSrc ? previewSrc : null;

        await updateEquipment(updatedEquipment);
      } else {
        // Check if equipment with same name already exists
        const allEquipment = await loadEquipment();
        const existing = allEquipment.find(eq => eq.name.toLowerCase() === name.toLowerCase());
        
        if (existing) {
          if (!confirm(`Equipment "${existing.name}" already exists. Update the count instead?`)) {
            if (submitBtn) {
              submitBtn.innerHTML = originalText;
              submitBtn.disabled = false;
            }
            return;
          }
          // Update existing equipment count
          const updatedEquipment = {
            id: existing.id,
            count: existing.count + count
          };
          if (imageDataUrl) {
            updatedEquipment.imageDataUrl = imageDataUrl;
          }
          await updateEquipment(updatedEquipment);
        } else {
          // Create new equipment object
          const newEquipment = {
            id: generateId(),
            name: name,
            count: count,
            imageDataUrl: imageDataUrl,
            createdAt: Date.now()
          };

          // Save to database
          await saveEquipment(newEquipment);
        }
      }

      // Close modal and refresh display
      const bsModal = bootstrap.Modal.getInstance(addEquipmentModal);
      if (bsModal) bsModal.hide();
      
      await loadAndDisplayEquipment();
    } catch (error) {
      alert('Failed to save equipment: ' + error.message);
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return 'equipment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Render equipment grid
   */
  async function renderEquipment() {
    const equipment = await loadEquipment();
    
    if (equipment.length === 0) {
      equipmentGrid.style.display = 'none';
      equipmentEmpty.style.display = 'block';
      equipmentLoading.style.display = 'none';
      updateStats(equipment);
      return;
    }

    equipmentEmpty.style.display = 'none';
    equipmentLoading.style.display = 'none';
    equipmentGrid.style.display = 'grid';

    // Clear existing grid
    equipmentGrid.innerHTML = '';

    // Sort by name
    const sortedEquipment = [...equipment].sort((a, b) => a.name.localeCompare(b.name));

    // Render each equipment card
    sortedEquipment.forEach(item => {
      const card = createEquipmentCard(item);
      equipmentGrid.appendChild(card);
    });

    updateStats(equipment);
  }

  /**
   * Create equipment card element
   */
  function createEquipmentCard(equipment) {
    const card = document.createElement('div');
    card.className = 'equipment-card';
    card.setAttribute('data-equipment-id', equipment.id);

    // Image
    if (equipment.imageDataUrl) {
      const img = document.createElement('img');
      img.className = 'equipment-card-image';
      img.src = equipment.imageDataUrl;
      img.alt = equipment.name;
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => showEquipmentDetails(equipment));
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'equipment-card-placeholder';
      placeholder.style.cursor = 'pointer';
      const icon = document.createElement('i');
      icon.className = 'bi bi-tool';
      placeholder.appendChild(icon);
      placeholder.addEventListener('click', () => showEquipmentDetails(equipment));
      card.appendChild(placeholder);
    }

    // Card body
    const cardBody = document.createElement('div');
    cardBody.className = 'equipment-card-body';

    // Title
    const title = document.createElement('div');
    title.className = 'equipment-card-title';
    title.textContent = equipment.name;
    cardBody.appendChild(title);

    // Count badge
    const countBadge = document.createElement('div');
    countBadge.className = 'equipment-card-count';
    countBadge.textContent = `${equipment.count} ${equipment.count === 1 ? 'item' : 'items'}`;
    cardBody.appendChild(countBadge);

    // Card actions (Edit and Delete)
    const actions = document.createElement('div');
    actions.className = 'equipment-card-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary';
    editBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editEquipment(equipment);
    });
    actions.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteEquipment(equipment.id);
    });
    actions.appendChild(deleteBtn);

    cardBody.appendChild(actions);

    card.appendChild(cardBody);

    return card;
  }

  /**
   * Update statistics
   */
  function updateStats(equipment) {
    const totalTypes = equipment.length;
    const totalCount = equipment.reduce((sum, item) => sum + (item.count || 0), 0);

    if (totalEquipmentTypes) totalEquipmentTypes.textContent = totalTypes;
    if (totalEquipmentCount) totalEquipmentCount.textContent = totalCount;
  }

  /**
   * Load and display equipment
   */
  async function loadAndDisplayEquipment() {
    if (equipmentLoading) equipmentLoading.style.display = 'block';
    try {
      await renderEquipment();
    } catch (error) {
      console.error('Error loading equipment:', error);
      if (equipmentEmpty) equipmentEmpty.style.display = 'block';
      if (equipmentGrid) equipmentGrid.style.display = 'none';
    } finally {
      if (equipmentLoading) equipmentLoading.style.display = 'none';
    }
  }

  /**
   * Show equipment details in modal
   */
  function showEquipmentDetails(equipment) {
    const modalElement = document.getElementById('viewEquipmentModal');
    if (!modalElement) return;

    const imgContainer = document.getElementById('viewEquipmentImageContainer');
    const nameEl = document.getElementById('viewEquipmentName');
    const countEl = document.getElementById('viewEquipmentCount');
    const dateEl = document.getElementById('viewEquipmentDate');

    if (equipment.imageDataUrl) {
      imgContainer.innerHTML = `<img src="${equipment.imageDataUrl}" alt="${equipment.name}" class="img-fluid rounded shadow-sm" style="max-height: 250px; object-fit: contain;">`;
    } else {
      imgContainer.innerHTML = `<div class="py-5 text-muted"><i class="bi bi-tool" style="font-size: 4rem;"></i></div>`;
    }

    nameEl.textContent = equipment.name;
    countEl.textContent = `${equipment.count} ${equipment.count === 1 ? 'item' : 'items'}`;
    
    if (equipment.createdAt) {
      const date = new Date(equipment.createdAt);
      dateEl.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
      dateEl.textContent = 'Unknown';
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  /**
   * Edit equipment - opens the modal in edit mode
   */
  function editEquipment(equipment) {
    if (!addEquipmentModal || !addEquipmentForm) return;

    // Set hidden input
    if (editEquipmentIdInput) {
      editEquipmentIdInput.value = equipment.id;
    }

    // Set other inputs
    if (equipmentNameInput) equipmentNameInput.value = equipment.name;
    if (equipmentCountInput) equipmentCountInput.value = equipment.count;

    // Handle image preview
    if (equipment.imageDataUrl) {
      if (equipmentImagePreview) equipmentImagePreview.src = equipment.imageDataUrl;
      if (equipmentImagePreviewContainer) equipmentImagePreviewContainer.style.display = 'block';
    } else {
      if (equipmentImagePreview) equipmentImagePreview.src = '';
      if (equipmentImagePreviewContainer) equipmentImagePreviewContainer.style.display = 'none';
    }

    // Change modal title and button text
    const modalLabel = document.getElementById('addEquipmentModalLabel');
    if (modalLabel) {
      modalLabel.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Equipment';
    }

    const submitBtn = addEquipmentForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Equipment';
    }

    // Show modal
    const bsModal = new bootstrap.Modal(addEquipmentModal);
    bsModal.show();
  }

  /**
   * Delete equipment
   */
  async function deleteEquipment(id) {
    if (!confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      await loadAndDisplayEquipment();
    } catch (error) {
      alert('Failed to delete equipment: ' + error.message);
    }
  }

})();

