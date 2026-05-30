/**
 * BDRRMO Equipment Management JavaScript
 * Handles read-only equipment directory display, search, and details modal
 */

(function() {
  'use strict';

  const API_URL = '../api/equipment.php';
  let allEquipment = []; // Store loaded resources in memory
  
  // DOM Elements
  const btnRefresh = document.getElementById('btnRefresh');
  const searchInput = document.getElementById('searchEquipment');
  const equipmentGrid = document.getElementById('equipmentGrid');
  const equipmentEmpty = document.getElementById('equipmentEmpty');
  const equipmentLoading = document.getElementById('equipmentLoading');
  const totalEquipmentTypes = document.getElementById('totalEquipmentTypes');
  const totalEquipmentCount = document.getElementById('totalEquipmentCount');

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    loadAndDisplayEquipment();
    setupEventListeners();
  });

  /**
   * Setup event listeners for filtering and refreshing
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

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', filterAndRender);
    }
  }

  /**
   * Fetch equipment list from backend API
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
   * Load and render equipment directory
   */
  async function loadAndDisplayEquipment() {
    if (equipmentLoading) equipmentLoading.style.display = 'block';
    if (equipmentGrid) equipmentGrid.style.display = 'none';
    if (equipmentEmpty) equipmentEmpty.style.display = 'none';

    try {
      allEquipment = await loadEquipment();
      updateStats(allEquipment);
      filterAndRender();
    } catch (error) {
      console.error('Error updating view:', error);
      if (equipmentEmpty) equipmentEmpty.style.display = 'block';
    } finally {
      if (equipmentLoading) equipmentLoading.style.display = 'none';
    }
  }

  /**
   * Client-side search and sorting dispatcher
   */
  function filterAndRender() {
    let filtered = [...allEquipment];

    // Search filter
    if (searchInput) {
      const query = searchInput.value.toLowerCase().trim();
      if (query) {
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query)
        );
      }
    }

    // Default alphabetical sort for clean viewing
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderGrid(filtered);
  }

  /**
   * Render equipment grid to DOM
   */
  function renderGrid(items) {
    if (!equipmentGrid) return;
    
    equipmentGrid.innerHTML = '';

    if (items.length === 0) {
      equipmentGrid.style.display = 'none';
      if (equipmentEmpty) equipmentEmpty.style.display = 'block';
      return;
    }

    if (equipmentEmpty) equipmentEmpty.style.display = 'none';
    equipmentGrid.style.display = 'grid';

    items.forEach(item => {
      const card = createEquipmentCard(item);
      equipmentGrid.appendChild(card);
    });
  }

  /**
   * Create single equipment card element with HSL shadows and interactions
   */
  function createEquipmentCard(item) {
    const card = document.createElement('div');
    card.className = 'equipment-card';
    card.setAttribute('data-equipment-id', item.id);
    card.addEventListener('click', () => showEquipmentDetails(item));

    // Image/Icon Header
    if (item.imageDataUrl) {
      const img = document.createElement('img');
      img.className = 'equipment-card-image';
      img.src = item.imageDataUrl;
      img.alt = item.name;
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'equipment-card-placeholder';
      const icon = document.createElement('i');
      icon.className = 'bi bi-tools';
      placeholder.appendChild(icon);
      card.appendChild(placeholder);
    }

    // Card Details Body
    const cardBody = document.createElement('div');
    cardBody.className = 'equipment-card-body';

    // Title
    const title = document.createElement('div');
    title.className = 'equipment-card-title';
    title.textContent = item.name;
    cardBody.appendChild(title);

    // Quantity Badge
    const countBadge = document.createElement('div');
    countBadge.className = 'equipment-card-count';
    countBadge.innerHTML = `<i class="bi bi-box-seam me-1"></i> ${item.count} ${item.count === 1 ? 'item' : 'items'}`;
    cardBody.appendChild(countBadge);

    card.appendChild(cardBody);
    return card;
  }

  /**
   * Aggregate stats dashboard panel
   */
  function updateStats(items) {
    const totalTypes = items.length;
    const totalCount = items.reduce((sum, item) => sum + (item.count || 0), 0);

    if (totalEquipmentTypes) totalEquipmentTypes.textContent = totalTypes;
    if (totalEquipmentCount) totalEquipmentCount.textContent = totalCount;
  }

  /**
   * Open high-fidelity read-only details modal
   */
  function showEquipmentDetails(item) {
    const modalElement = document.getElementById('viewEquipmentModal');
    if (!modalElement) return;

    const imgContainer = document.getElementById('viewEquipmentImageContainer');
    const nameEl = document.getElementById('viewEquipmentName');
    const countEl = document.getElementById('viewEquipmentCount');
    const dateEl = document.getElementById('viewEquipmentDate');

    if (item.imageDataUrl) {
      imgContainer.innerHTML = `<img src="${item.imageDataUrl}" alt="${item.name}" class="img-fluid rounded shadow-sm" style="max-height: 250px; object-fit: contain;">`;
    } else {
      imgContainer.innerHTML = `<div class="py-5 text-muted"><i class="bi bi-tools" style="font-size: 4rem;"></i></div>`;
    }

    nameEl.textContent = item.name;
    countEl.textContent = `${item.count} ${item.count === 1 ? 'item' : 'items'}`;
    
    if (item.createdAt) {
      const date = new Date(item.createdAt);
      dateEl.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
      dateEl.textContent = 'Unknown';
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

})();
