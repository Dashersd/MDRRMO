/**
 * Client Organization Chart JavaScript
 * Read-only version that fetches personnel data from API
 */

(function() {
  'use strict';

  // Determine API URL based on current page location
  const API_URL = window.location.pathname.includes('/client/') 
    ? '../api/organization-personnel.php' 
    : 'api/organization-personnel.php';
  
  // DOM Elements
  const btnRefresh = document.getElementById('btnRefresh');
  const orgChartContainer = document.getElementById('orgChartContainer');
  const orgChartEmpty = document.getElementById('orgChartEmpty');
  const orgChartLoading = document.getElementById('orgChartLoading');
  const orgChart = document.getElementById('orgChart');

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    if (orgChart) {
      loadAndRenderChart();
      setupEventListeners();
    }
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
   * Build hierarchical tree structure
   */
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
          return reportsTo === personIdStr;
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
    if (orgChartLoading) orgChartLoading.style.display = 'block';
    if (orgChartEmpty) orgChartEmpty.style.display = 'none';
    if (orgChartContainer) orgChartContainer.style.display = 'none';
    
    const personnel = await fetchPersonnel();
    
    if (orgChartLoading) orgChartLoading.style.display = 'none';
    
    if (personnel.length === 0) {
      if (orgChartContainer) orgChartContainer.style.display = 'none';
      if (orgChartEmpty) orgChartEmpty.style.display = 'block';
      return;
    }

    const tree = buildHierarchy(personnel);
    
    if (!tree) {
      if (orgChartContainer) orgChartContainer.style.display = 'none';
      if (orgChartEmpty) orgChartEmpty.style.display = 'block';
      return;
    }

    if (orgChartEmpty) orgChartEmpty.style.display = 'none';
    if (orgChartContainer) orgChartContainer.style.display = 'block';

    // Clear existing chart
    if (orgChart) orgChart.innerHTML = '';

    // Render tree
    if (orgChart) renderNode(tree, orgChart, 0, personnel);
  }

  /**
   * Render a node in the chart (read-only, no edit button)
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

    // Photo wrapper
    let photoWrapper = null;
    
    // Photo (if available)
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
  function loadAndRenderChart() {
    renderChart();
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

  // Make loadAndRenderChart available globally for refresh button
  window.loadAndRenderChart = loadAndRenderChart;

})();

