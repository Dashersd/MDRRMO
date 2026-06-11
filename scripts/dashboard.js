(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const form = $("#incidentForm");
  const photoInput = $("#photo");
  const photoMeta = $("#photoMeta");
  const photoPreview = $("#photoPreview");
  const photoPlaceholder = $("#photoPlaceholder");
  const latEl = $("#lat");
  const lngEl = $("#lng");
  const mapNote = $("#locationNote");
  const useMyLocationBtn = $("#btnUseMyLocation");
  const clearLocationBtn = $("#btnClearLocation");
  const listEl = $("#incidentList");
  const filterStatus = $("#filterStatus");
  const exportBtn = $("#btnExportAll");
  const clearAllBtn = $("#btnClearAll");
  const clockBadge = $("#clockBadge");

  // Add image modal to the DOM
  const modalHTML = `
    <div id="imageModal" class="modal fade" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="imageModalLabel">Incident Photo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <img id="modalImage" src="" alt="Incident Photo" class="img-fluid rounded">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" id="downloadModalImage">Download</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert modal into the DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Determine API URL based on current page location
  const isSubdirectory = window.location.pathname.split('/').filter(p => p).length > 1;
  const API_URL = isSubdirectory ? '../api/incidents.php' : 'api/incidents.php';
  
  let incidents = [];
  
  // Load incidents from database on initialization
  (async function() {
    incidents = await loadIncidents();
    if (listEl) {
      renderList();
    }
  })();

  let locationMap, locationMarker;
  let clockInterval = null;

  // Only initialize clock if the element exists
  if (clockBadge) {
    initClock();
  }
  // Only initialize map if Leaflet is available and the element exists
  // Safely check for Leaflet without causing reference errors
  const hasLeaflet = (function () {
    try {
      return typeof window.L !== "undefined" && window.L !== null;
    } catch (e) {
      return false;
    }
  })();

  if (hasLeaflet && document.getElementById("locationMap")) {
    initLocationMap();
  }
  if (listEl) {
    renderList();
  }

  function initClock() {
    // Double check that clockBadge exists before proceeding
    const badge = document.getElementById("clockBadge");
    if (!badge) {
      // Clear interval if it was set and element doesn't exist
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
      return;
    }

    updateClock();
    // Store interval ID so we can clear it if needed
    clockInterval = setInterval(function () {
      const badgeCheck = document.getElementById("clockBadge");
      if (badgeCheck) {
        updateClock();
      } else {
        // Element was removed, clear interval
        if (clockInterval) {
          clearInterval(clockInterval);
          clockInterval = null;
        }
      }
    }, 15_000);
  }

  function updateClock() {
    // Always check for element existence before accessing
    const badge = document.getElementById("clockBadge");
    if (!badge) {
      return;
    }
    const now = new Date();
    badge.textContent = now.toLocaleString();
  }

  function initLocationMap() {
    try {
      // Safely check if Leaflet is available
      let L;
      try {
        L = window.L;
        if (typeof L === "undefined" || L === null) {
          console.warn(
            "Leaflet is not loaded. Map functionality will not be available."
          );
          return;
        }
      } catch (e) {
        console.warn("Leaflet is not available");
        return;
      }

      const mapElement = document.getElementById("locationMap");
      if (!mapElement) {
        return;
      }

      // Now safely use L
      locationMap = L.map("locationMap");
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap",
      }).addTo(locationMap);

      // Default to Philippines center
      locationMap.setView([12.8797, 121.774], 5);

      // Add click event to set location
      locationMap.on("click", (e) => {
        setLocation(e.latlng.lat, e.latlng.lng, "map-click");
      });

      // Automatically recalculate Leaflet map dimensions when modal is displayed
      document.addEventListener('shown.bs.modal', function(e) {
        if (e.target.id === 'addIncidentModal' && locationMap) {
          setTimeout(() => {
            locationMap.invalidateSize();
          }, 150);
        }
      });
    } catch (error) {
      console.warn("Error initializing location map:", error);
      // Silently fail - map functionality is optional
    }
  }

  function setLocation(lat, lng, source = "") {
    if (latEl) latEl.value = Number(lat).toFixed(6);
    if (lngEl) lngEl.value = Number(lng).toFixed(6);
    if (mapNote) {
      mapNote.textContent = `Location set ${source ? "via " + source : ""}`;
    }

    // Update map view and marker (only if Leaflet is available and map is initialized)
    try {
      if (locationMap) {
        // Safely get L
        let L;
        try {
          L = window.L;
          if (typeof L === "undefined" || L === null) {
            return; // Leaflet not available
          }
        } catch (e) {
          return; // Leaflet not available
        }

        locationMap.setView([lat, lng], 14);

        // Remove existing marker if any
        if (locationMarker) {
          locationMap.removeLayer(locationMarker);
        }

        // Add new marker
        locationMarker = L.marker([lat, lng]).addTo(locationMap);
      }
    } catch (error) {
      console.warn("Error updating map location:", error);
      // Silently fail - map functionality is optional
    }
  }

  function clearLocation() {
    if (latEl) latEl.value = "";
    if (lngEl) lngEl.value = "";
    if (mapNote) mapNote.textContent = "No location yet";

    // Clear map marker
    if (locationMarker && locationMap) {
      locationMap.removeLayer(locationMarker);
      locationMarker = null;
    }
  }

  if (useMyLocationBtn) {
    useMyLocationBtn.addEventListener("click", async () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported in this browser.");
        return;
      }
      useMyLocationBtn.disabled = true;
      useMyLocationBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Locating...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation(latitude, longitude, "gps");
          useMyLocationBtn.disabled = false;
          useMyLocationBtn.innerHTML =
            '<i class="bi bi-crosshair"></i> Use my location';
        },
        (err) => {
          alert("Unable to get location: " + err.message);
          useMyLocationBtn.disabled = false;
          useMyLocationBtn.innerHTML =
            '<i class="bi bi-crosshair"></i> Use my location';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  if (clearLocationBtn) {
    clearLocationBtn.addEventListener("click", clearLocation);
  }

  if (photoInput) {
    photoInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      previewPhoto(file);
      tryExtractExif(file);
    });
  }

  function previewPhoto(file) {
    const reader = new FileReader();
    reader.onload = () => {
      photoPreview.src = reader.result;
      photoPreview.classList.remove("d-none");
      photoPlaceholder.classList.add("d-none");
    };
    reader.readAsDataURL(file);
  }

  function tryExtractExif(file) {
    photoMeta.textContent = "Reading EXIF...";
    EXIF.getData(file, function () {
      const lat = EXIF.getTag(this, "GPSLatitude");
      const latRef = EXIF.getTag(this, "GPSLatitudeRef");
      const lng = EXIF.getTag(this, "GPSLongitude");
      const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
      const make = EXIF.getTag(this, "Make");
      const model = EXIF.getTag(this, "Model");
      const dateTime =
        EXIF.getTag(this, "DateTimeOriginal") || EXIF.getTag(this, "DateTime");

      let exifInfo = [];
      if (make || model) exifInfo.push([make, model].filter(Boolean).join(" "));
      if (dateTime) exifInfo.push(String(dateTime));

      if (lat && lng && latRef && lngRef) {
        const latDec = dmsToDd(lat, latRef);
        const lngDec = dmsToDd(lng, lngRef);
        setLocation(latDec, lngDec, "photo EXIF");
        photoMeta.textContent = `EXIF: ${exifInfo.join(
          " • "
        )} • Lat ${latDec.toFixed(6)}, Lng ${lngDec.toFixed(6)}`;
      } else {
        photoMeta.textContent = `No GPS EXIF found${
          exifInfo.length ? " • " + exifInfo.join(" • ") : ""
        }`;
      }
    });
  }

  function dmsToDd(dms, ref) {
    // dms is array of rationals: [deg, min, sec]
    const [d, m, s] = dms.map((v) =>
      typeof v === "number" ? v : v.numerator / v.denominator
    );
    let dd = d + m / 60 + s / 3600;
    if (ref === "S" || ref === "W") dd *= -1;
    return dd;
  }

  /**
   * Load incidents from database API
   */
  async function loadIncidents() {
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
      console.error('Error loading incidents:', error);
      return [];
    }
  }

  /**
   * Save incident to database via API
   */
  async function saveIncidentToDatabase(incident) {
    try {
      // Get current user (try multiple methods)
      const currentUser = window.CURRENT_USER || 
                         document.body.getAttribute('data-current-user') || 
                         '';
      
      // Add reportedBy field if not present
      if (!incident.reportedBy && currentUser) {
        incident.reportedBy = currentUser;
      }
      
      // Determine API URL based on current page location
      // If we're in a subdirectory (client/ or admin/), go up one level
      const isSubdirectory = window.location.pathname.split('/').filter(p => p).length > 1;
      const API_URL = isSubdirectory ? '../api/incidents.php' : 'api/incidents.php';
      
      // Save to database via API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incident)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Use the ID from API response if provided
      if (result.id) {
        incident.id = result.id;
      }
      
      return result;
    } catch (error) {
      console.error('Error saving incident to database:', error);
      throw error;
    }
  }

  function uid() {
    return (
      "inc_" +
      Math.random().toString(36).slice(2, 9) +
      Date.now().toString(36).slice(-4)
    );
  }

  function serializeFormToIncident() {
    const type = $("#incidentType").value;
    const description = $("#description").value.trim();
    const file = photoInput.files && photoInput.files[0];
    if (!file) throw new Error("Photo missing");
    
    // Get current user (try multiple methods)
    const currentUser = window.CURRENT_USER || 
                       document.body.getAttribute('data-current-user') || 
                       '';
    
    // Persist a lightweight resized image (canvas) to reduce storage impact
    return resizeImageToDataURL(file, 1280, 1280).then((dataUrl) => ({
      id: uid(),
      type,
      description,
      status: "New",
      reportedBy: currentUser,
      createdAt: Date.now(),
      photoDataUrl: dataUrl,
    }));
  }

  function resizeImageToDataURL(file, maxW, maxH) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(1, maxW / width, maxH / height);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderList() {
    if (!listEl) return;
    const statusFilter = filterStatus ? filterStatus.value : "All";
    const items = incidents
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((x) => statusFilter === "All" || x.status === statusFilter);
    listEl.innerHTML = items.map(renderIncidentCard).join("");
  }

  function renderIncidentCard(inc) {
    const date = new Date(inc.createdAt).toLocaleString();
    const badgeClass = statusToBadge(inc.status);

    // Check if the current user is an admin by inspecting the path
    const isAdmin = window.location.pathname.includes('admin-dashboard.php') || 
                    window.location.pathname.includes('/admin/');

    const adminButtons = isAdmin ? `
									<button class="btn btn-outline-primary" data-action="dispatch" data-id="${inc.id}"><i class="bi bi-truck"></i> Dispatch</button>
									<button class="btn btn-outline-success" data-action="resolve" data-id="${inc.id}"><i class="bi bi-check2-circle"></i> Resolve</button>
									<button class="btn btn-outline-danger" data-action="cancel" data-id="${inc.id}"><i class="bi bi-x-circle"></i> Cancel</button>
    ` : '';

    const adminDeleteButton = isAdmin ? `
									<button class="btn btn-outline-danger" data-action="delete" data-id="${inc.id}"><i class="bi bi-trash"></i></button>
    ` : '';

    return `
			<div class="card incident-card shadow-sm">
				<div class="row g-0">
														<div class="col-4 col-sm-3">
										<img src="${inc.photoDataUrl}" alt="${inc.type} photo" class="w-100 h-100 incident-image-clickable" style="object-fit:cover;min-height:100%;cursor:pointer;" data-image="${inc.photoDataUrl}" data-title="${inc.type}"/>
									</div>
					<div class="col-8 col-sm-9">
						<div class="card-body py-2">
							<div class="d-flex align-items-center justify-content-between">
								<div class="d-flex align-items-center gap-2">
									<i class="bi ${typeToIcon(inc.type)}"></i>
									<strong>${escapeHtml(inc.type)}</strong>
								</div>
								<span class="badge ${badgeClass} status-badge">${inc.status}</span>
							</div>
							<div class="small text-muted">${date}</div>
							<p class="mb-2 mt-1">${escapeHtml(inc.description)}</p>
							<div class="d-flex flex-wrap gap-2">
								<div class="btn-group btn-group-sm" role="group">
									${adminButtons}
								</div>
								<div class="btn-group btn-group-sm" role="group">
									<button class="btn btn-outline-dark" data-action="download" data-id="${inc.id}"><i class="bi bi-download"></i> Photo</button>
									<button class="btn btn-outline-dark" data-action="copy" data-id="${inc.id}"><i class="bi bi-clipboard"></i> Copy</button>
									${adminDeleteButton}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
  }

  function typeToIcon(type) {
    switch (type) {
      case "Fire":
        return "bi-fire";
      case "Flood":
        return "bi-droplet";
      case "Road Accident":
        return "bi-car-front";
      case "Medical":
        return "bi-heart-pulse";
      case "Landslide":
        return "bi-triangle";
      case "Earthquake":
        return "bi-activity";
      case "Power Outage":
        return "bi-lightning";
      default:
        return "bi-exclamation-octagon";
    }
  }

  function statusToBadge(status) {
    switch (status) {
      case "New":
        return "text-bg-secondary";
      case "Dispatched":
        return "text-bg-primary";
      case "Resolved":
        return "text-bg-success";
      case "Cancelled":
        return "text-bg-danger";
      default:
        return "text-bg-secondary";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  if (listEl) {
    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      switch (action) {
        case "view":
          viewOnMap(id);
          break;
        case "dispatch":
          updateStatus(id, "Dispatched");
          break;
        case "resolve":
          updateStatus(id, "Resolved");
          break;
        case "cancel":
          updateStatus(id, "Cancelled");
          break;
        case "delete":
          deleteIncident(id);
          break;
        case "download":
          downloadPhoto(id);
          break;
        case "copy":
          copyIncident(id);
          break;
      }
    });
  }

  function viewOnMap(id) {
    alert("GPS location is no longer available for incidents.");
  }

  async function updateStatus(id, status) {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          status: status
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Reload incidents from database
      incidents = await loadIncidents();
      renderList();
      
      // Dispatch event to update sidebar counts
      window.dispatchEvent(new CustomEvent("incidentAdded"));
    } catch (error) {
      console.error('Error updating incident status:', error);
      alert('Failed to update incident status: ' + error.message);
    }
  }

  async function deleteIncident(id) {
    if (!confirm("Delete this incident?")) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Reload incidents from database
      incidents = await loadIncidents();
      renderList();
      
      // Dispatch event to update sidebar counts
      window.dispatchEvent(new CustomEvent("incidentAdded"));
    } catch (error) {
      console.error('Error deleting incident:', error);
      alert('Failed to delete incident: ' + error.message);
    }
  }

  function downloadPhoto(id) {
    const inc = incidents.find((x) => x.id === id);
    if (!inc) return;
    const a = document.createElement("a");
    a.href = inc.photoDataUrl;
    a.download = `${inc.type}_${id}.jpg`;
    a.click();
  }

  async function copyIncident(id) {
    const inc = incidents.find((x) => x.id === id);
    if (!inc) return;
    const text = [
      `Type: ${inc.type}`,
      `Status: ${inc.status}`,
      `When: ${new Date(inc.createdAt).toLocaleString()}`,
      `Description: ${inc.description}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch (_) {
      alert("Copy failed");
    }
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", renderList);
  }

  // Add event listener for image clicks
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("incident-image-clickable")) {
      const imageSrc = e.target.getAttribute("data-image");
      const imageTitle = e.target.getAttribute("data-title");

      // Update modal content
      document.getElementById("modalImage").src = imageSrc;
      document.getElementById("imageModalLabel").textContent = imageTitle;

      // Show modal
      const modal = new bootstrap.Modal(document.getElementById("imageModal"));
      modal.show();
    }
  });

  // Handle download button in modal
  document
    .getElementById("downloadModalImage")
    .addEventListener("click", () => {
      const imageSrc = document.getElementById("modalImage").src;
      const a = document.createElement("a");
      a.href = imageSrc;
      a.download = `incident_photo_${Date.now()}.jpg`;
      a.click();
    });

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(incidents, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `incidents_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (!incidents.length) return;
      if (!confirm("Clear ALL incidents?")) return;
      incidents.splice(0, incidents.length);
      saveIncidents();
      renderList();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      try {
        const inc = await serializeFormToIncident();
        
        // Save to database
        const dbResult = await saveIncidentToDatabase(inc);
        if (dbResult && dbResult.id) {
          inc.id = dbResult.id; // Use database ID if provided
        }
        
        // Reload incidents from database to get the latest data
        incidents = await loadIncidents();
        
        form.reset();
        if (photoPreview) photoPreview.classList.add("d-none");
        if (photoPlaceholder) photoPlaceholder.classList.remove("d-none");
        clearLocation();
        form.classList.remove("was-validated");
        renderList();
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent("incidentAdded"));
      } catch (err) {
        alert(err.message || "Failed to add incident");
      }
    });
  }

  const btnResetForm = $("#btnResetForm");
  if (btnResetForm) {
    btnResetForm.addEventListener("click", () => {
      form.reset();
      photoPreview.classList.add("d-none");
      photoPlaceholder.classList.remove("d-none");
      clearLocation();
      form.classList.remove("was-validated");
    });
  }
})();

// Initialize Bootstrap dropdowns
document.addEventListener("DOMContentLoaded", function () {
  // Manual dropdown functionality - use multiple selectors to ensure we find the dropdown
  const dropdownSelectors = [
    ".dropdown-toggle",
    "#mainContent nav .nav-link.dropdown-toggle",
    "#mainContent > nav > div > div.navbar-nav > div.nav-item > a.nav-link",
  ];

  let dropdownToggles = [];
  dropdownSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (!dropdownToggles.includes(el)) {
        dropdownToggles.push(el);
      }
    });
  });

  // If still not found, try the specific path (accounting for button)
  if (dropdownToggles.length === 0) {
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      const nav = mainContent.querySelector("nav");
      if (nav) {
        const navLink = nav.querySelector(".nav-link.dropdown-toggle");
        if (navLink) {
          dropdownToggles.push(navLink);
        }
      }
    }
  }

  // Additional fallback: try finding dropdown using the specific path #mainContent > nav > div > div > div > ul
  if (dropdownToggles.length === 0) {
    const dropdownMenu = document.querySelector(
      "#mainContent > nav > div > div > div > ul"
    );
    if (dropdownMenu) {
      const dropdownContainer =
        dropdownMenu.closest(".dropdown") ||
        dropdownMenu.closest(".nav-item.dropdown");
      if (dropdownContainer) {
        const toggle = dropdownContainer.querySelector(".dropdown-toggle");
        if (toggle) {
          dropdownToggles.push(toggle);
        }
      }
    }
  }

  dropdownToggles.forEach(function (toggle) {
    // Remove any existing listeners by cloning
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    newToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Find the dropdown menu (ul element) within the same dropdown container
      const dropdownContainer =
        this.closest(".dropdown") || this.closest(".nav-item.dropdown");
      if (!dropdownContainer) {
        return;
      }

      const dropdownMenu = dropdownContainer.querySelector(".dropdown-menu");
      if (!dropdownMenu) {
        return;
      }

      // Check current state
      const isOpen = dropdownMenu.classList.contains("show");

      // Close all other dropdowns first
      document.querySelectorAll(".dropdown-menu.show").forEach(function (menu) {
        if (menu !== dropdownMenu) {
          menu.classList.remove("show");
        }
      });

      // Toggle current dropdown
      if (!isOpen) {
        dropdownMenu.classList.add("show");
      } else {
        dropdownMenu.classList.remove("show");
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown-menu.show").forEach(function (menu) {
        menu.classList.remove("show");
      });
    }
  });

  // Sidebar functionality
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const brandText = document.getElementById("brandText");
  const navTitle = document.getElementById("navTitle");

  // Toggle sidebar
  function toggleSidebar() {
    if (!sidebar || !mainContent) return;
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");

    // Store sidebar state in localStorage
    const isCollapsed = sidebar.classList.contains("collapsed");
    localStorage.setItem("sidebarCollapsed", isCollapsed);

    if (isCollapsed) {
      if (brandText) brandText.style.display = "none";
      if (navTitle) navTitle.style.display = "none";
    } else {
      if (brandText) brandText.style.display = "inline";
      if (navTitle) navTitle.style.display = "block";
    }
  }

  // Initialize sidebar state from localStorage
  function initializeSidebarState() {
    if (!sidebar || !mainContent) return;
    const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (isCollapsed) {
      sidebar.classList.add("collapsed");
      mainContent.classList.add("expanded");
      if (brandText) brandText.style.display = "none";
      if (navTitle) navTitle.style.display = "none";
    } else {
      // Default to expanded state
      sidebar.classList.remove("collapsed");
      mainContent.classList.remove("expanded");
      if (brandText) brandText.style.display = "inline";
      if (navTitle) navTitle.style.display = "block";
    }
  }

  // Mobile menu toggle
  function toggleMobileMenu() {
    if (!sidebar || !sidebarOverlay) return;
    sidebar.classList.toggle("show");
    sidebarOverlay.classList.toggle("show");
  }

  // Event listeners
  if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidebar);
  if (mobileMenuToggle)
    mobileMenuToggle.addEventListener("click", toggleMobileMenu);
  if (sidebarOverlay)
    sidebarOverlay.addEventListener("click", toggleMobileMenu);

  // Close mobile menu on window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      if (sidebar) sidebar.classList.remove("show");
      if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    }
  });

  // Update incident count in sidebar (delegated to sidebar-counts.js)
  // This function is kept for backward compatibility but will be overridden by sidebar-counts.js
  async function updateSidebarCounts() {
    // Reload incidents from database to ensure we have the latest data
    const incidentsData = await loadIncidents();
    
    const incidentCount = document.getElementById("incidentCount");
    const totalIncidents = document.getElementById("totalIncidents");
    const newIncidents = document.getElementById("newIncidents");
    const resolvedIncidents = document.getElementById("resolvedIncidents");

    // Only update if sidebar-counts.js hasn't already updated it
    if (incidentCount && !window.sidebarCountsLoaded) {
      const pendingCount = incidentsData.filter(inc => {
        const status = (inc.status || 'New').toLowerCase().trim();
        return status === 'new' || status === 'pending';
      }).length;
      incidentCount.textContent = pendingCount;
    }
    
    // Update other dashboard-specific elements
    if (totalIncidents) totalIncidents.textContent = incidentsData.length;
    if (newIncidents)
      newIncidents.textContent = incidentsData.filter(
        (i) => (i.status || 'New').toLowerCase() === 'new'
      ).length;
    if (resolvedIncidents)
      resolvedIncidents.textContent = incidentsData.filter(
        (i) => (i.status || '').toLowerCase() === 'resolved'
      ).length;
  }

  // Update user count for admin
  function updateUserCount() {
    const userCount = document.getElementById("userCount");
    const activeUsers = document.getElementById("activeUsers");
    if (userCount || activeUsers) {
      fetch("users.php?action=count")
        .then((response) => response.json())
        .then((data) => {
          if (userCount) userCount.textContent = data.count || 0;
          if (activeUsers) activeUsers.textContent = data.count || 0;
        })
        .catch(() => {
          if (userCount) userCount.textContent = "0";
          if (activeUsers) activeUsers.textContent = "0";
        });
    }
  }

  // Initialize sidebar state and counts
  initializeSidebarState();
  
  // Use sidebar-counts.js if available, otherwise use local function
  if (window.updateSidebarCounts && typeof window.updateSidebarCounts === 'function') {
    window.updateSidebarCounts();
  } else {
    updateSidebarCounts();
    updateUserCount();
  }

  // Refresh button
  const btnRefresh = document.getElementById("btnRefresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", function () {
      // Use sidebar-counts.js if available, otherwise use local functions
      if (window.updateSidebarCounts && typeof window.updateSidebarCounts === 'function') {
        window.updateSidebarCounts();
      } else {
        updateSidebarCounts();
      }
      
      if (window.updateUserCount && typeof window.updateUserCount === 'function') {
        window.updateUserCount();
      } else {
        updateUserCount();
      }
      
      // Small delay before reload to ensure updates are saved
      setTimeout(function() {
        location.reload();
      }, 100);
    });
  }
});

// Expose a globally shared function to show incident details in a standardized, premium layout
window.showIncidentDetailsModal = function(incident, options = {}) {
    const isAdmin = options.isAdmin || false;

    const date = new Date(incident.createdAt || Date.now()).toLocaleString();
    
    // Status text colors
    let statusColorClass = "text-secondary";
    const status = (incident.status || 'New').toLowerCase();
    if (status === 'resolved' || status === 'approved') statusColorClass = "text-success";
    if (status === 'cancelled' || status === 'declined' || status === 'rejected') statusColorClass = "text-danger";
    if (status === 'dispatched') statusColorClass = "text-primary";
    
    // Default single image
    let images = incident.photoDataUrls && incident.photoDataUrls.length > 0 ? incident.photoDataUrls : [incident.photoDataUrl || ''];
    // Filter out empties
    images = images.filter(img => img);
    
    // Carousel inner items
    let carouselIndicators = '';
    let carouselInner = '';
    
    if (images.length === 0) {
        carouselInner = `
            <div class="carousel-item active h-100">
                <div class="d-flex align-items-center justify-content-center h-100 text-white-50 flex-column" style="background-color: #212529;">
                    <i class="bi bi-image display-1 mb-3"></i>
                    <p>No image provided</p>
                </div>
            </div>`;
    } else if (images.length === 1) {
        carouselInner = `
            <div class="carousel-item active h-100">
                <img src="${images[0]}" class="d-block w-100 h-100" style="object-fit: cover; cursor: zoom-in;" alt="Incident Photo" onclick="window.open(this.src, '_blank')">
            </div>`;
    } else {
        images.forEach((img, idx) => {
            const activeClass = idx === 0 ? 'active' : '';
            carouselIndicators += `<button type="button" data-bs-target="#incidentImageCarousel" data-bs-slide-to="${idx}" class="${activeClass}" aria-current="true" aria-label="Slide ${idx + 1}"></button>`;
            carouselInner += `
                <div class="carousel-item ${activeClass} h-100">
                    <img src="${img}" class="d-block w-100 h-100" style="object-fit: cover; cursor: zoom-in;" alt="Incident Photo ${idx + 1}" onclick="window.open(this.src, '_blank')">
                </div>`;
        });
    }

    let carouselControls = '';
    if (images.length > 1) {
        carouselControls = `
            <div class="carousel-indicators">
                ${carouselIndicators}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#incidentImageCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#incidentImageCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        `;
    }

    // Action buttons
    let actionButtons = '';
    if (isAdmin) {
        if (status === 'new' || status === 'pending') {
            actionButtons = `
                <button type="button" class="btn btn-outline-danger fw-bold px-4" id="btnRejectIncident" data-id="${incident.id}">
                    <i class="bi bi-x-lg me-2"></i>Decline
                </button>
                <button type="button" class="btn btn-success fw-bold px-4" id="btnApproveIncident" data-id="${incident.id}">
                    <i class="bi bi-check-lg me-2"></i>Approve
                </button>
            `;
        } else {
            actionButtons = `
                <button type="button" class="btn btn-primary px-4 me-2" onclick="window.print()">
                    <i class="bi bi-printer me-2"></i>Print
                </button>
                <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${incident.id}" id="btnDeleteIncidentModal">
                    <i class="bi bi-trash"></i> Delete
                </button>
            `;
        }
    } else {
        // BDRRMO Action buttons
        if (status === 'new' || status === 'pending') {
           actionButtons = `
                <button type="button" class="btn btn-primary px-4 me-2" onclick="window.print()">
                    <i class="bi bi-printer me-2"></i>Print
                </button>
                <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${incident.id}" id="btnDeleteIncidentModal">
                    <i class="bi bi-trash"></i> Delete
                </button>
            `;
        } else {
            actionButtons = `
                <button type="button" class="btn btn-primary px-4 me-2" onclick="window.print()">
                    <i class="bi bi-printer me-2"></i>Print
                </button>
            `;
        }
    }
    
    // Type icon
    let iconClass = 'bi-exclamation-octagon';
    const typeStr = (incident.type || '').toLowerCase();
    if (typeStr.includes('fire')) iconClass = 'bi-fire text-danger';
    else if (typeStr.includes('flood')) iconClass = 'bi-water text-info';
    else if (typeStr.includes('accident')) iconClass = 'bi-car-front text-warning';
    else if (typeStr.includes('medical')) iconClass = 'bi-heart-pulse text-danger';
    else if (typeStr.includes('landslide')) iconClass = 'bi-triangle text-warning';
    else if (typeStr.includes('earthquake')) iconClass = 'bi-activity text-danger';
    else if (typeStr.includes('power')) iconClass = 'bi-lightning text-warning';
    else if (typeStr.includes('tree')) iconClass = 'bi-tree text-success';
    else iconClass = 'bi-exclamation-triangle text-warning';

    // Helper escape
    const escapeHtml = (s) => String(s||'').replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

    const rejectionRemarkHTML = incident.remark && (status === 'declined' || status === 'rejected') ? `
        <div class="alert alert-danger mt-3 mb-0" role="alert">
            <h6 class="alert-heading fw-bold mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>Reason for Rejection:</h6>
            <p class="mb-0 small">${escapeHtml(incident.remark)}</p>
        </div>
    ` : '';

    const modalHtml = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <!-- Header (Red) -->
                <div class="modal-header border-0 bg-danger text-white p-4">
                    <h5 class="modal-title font-heading fw-bold">Incident Details</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                
                <!-- Body (Split Layout) -->
                <div class="modal-body p-0">
                    <div class="row g-0">
                        <!-- Left Column: Carousel -->
                        <div class="col-md-6 bg-dark position-relative" style="min-height: 400px;">
                            <div id="incidentImageCarousel" class="carousel slide h-100">
                                <div class="carousel-inner h-100">
                                    ${carouselInner}
                                </div>
                                ${carouselControls}
                            </div>
                        </div>
                        
                        <!-- Right Column: Details -->
                        <div class="col-md-6 p-4 d-flex flex-column justify-content-between bg-white">
                            <div>
                                <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                                    <div class="bg-light rounded-circle p-3 me-3">
                                        <i class="bi ${iconClass} fs-3"></i>
                                    </div>
                                    <div>
                                        <h4 class="mb-1 fw-bold text-dark">${escapeHtml(incident.type)}</h4>
                                        <div class="fw-bold ${statusColorClass}">${escapeHtml(incident.status)}</div>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <h6 class="text-muted fw-bold mb-2 text-uppercase" style="font-size: 0.8rem; letter-spacing: 1px;">Report Details</h6>
                                    
                                    <div class="d-flex mb-2">
                                        <div class="text-muted me-2" style="width: 20px;"><i class="bi bi-geo-alt"></i></div>
                                        <div class="fw-medium text-dark">${escapeHtml(incident.barangay || 'Unknown Barangay')}</div>
                                    </div>
                                    
                                    <div class="d-flex mb-2">
                                        <div class="text-muted me-2" style="width: 20px;"><i class="bi bi-calendar-event"></i></div>
                                        <div class="fw-medium text-dark">${date}</div>
                                    </div>
                                    
                                    <div class="d-flex mb-3">
                                        <div class="text-muted me-2" style="width: 20px;"><i class="bi bi-person"></i></div>
                                        <div class="fw-medium text-dark">${escapeHtml(incident.reportedBy || 'System User')}</div>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <h6 class="text-muted fw-bold mb-2 text-uppercase" style="font-size: 0.8rem; letter-spacing: 1px;">Description</h6>
                                    <p class="text-dark" style="line-height: 1.6; white-space: pre-line;">${escapeHtml(incident.description)}</p>
                                    ${rejectionRemarkHTML}
                                </div>
                            </div>
                            
                            <div class="mt-auto border-top pt-3 text-end d-flex justify-content-end gap-2 flex-wrap">
                                ${actionButtons}
                                <button type="button" class="btn btn-secondary px-4 fw-bold" data-bs-dismiss="modal">Close Logs</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    let modalEl = document.getElementById('unifiedIncidentModal');
    if (modalEl) {
        modalEl.remove();
    }
    
    modalEl = document.createElement('div');
    modalEl.id = 'unifiedIncidentModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML = modalHtml;
    
    document.body.appendChild(modalEl);
    
    // Attach event listeners for Actions inside modal
    const btnApprove = modalEl.querySelector('#btnApproveIncident');
    const btnReject = modalEl.querySelector('#btnRejectIncident');
    const btnDelete = modalEl.querySelector('#btnDeleteIncidentModal');
    
    if (btnApprove) {
        btnApprove.addEventListener('click', () => {
            if(window.updateIncidentStatus) {
                window.updateIncidentStatus(incident.id, 'Approved', 'skip_confirm');
            } else if (window.updateStatus) {
                window.updateStatus(incident.id, 'Approved', 'skip_confirm');
            }
            bootstrap.Modal.getInstance(modalEl).hide();
        });
    }
    
    if (btnReject) {
        btnReject.addEventListener('click', () => {
            const remark = prompt('Please enter a reason for rejecting this report:');
            if (remark !== null && remark.trim() !== '') {
                if(window.updateIncidentStatus) {
                    window.updateIncidentStatus(incident.id, 'Declined', remark);
                } else if (window.updateStatus) {
                    window.updateStatus(incident.id, 'Declined', remark);
                }
                bootstrap.Modal.getInstance(modalEl).hide();
            } else if (remark !== null) {
                alert("A reason is required to reject a report.");
            }
        });
    }
    
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            if(confirm("Are you sure you want to delete this incident?")) {
                if(window.deleteIncidentAPI) {
                    window.deleteIncidentAPI(incident.id);
                } else if (window.deleteIncident) {
                    window.deleteIncident(incident.id);
                }
                bootstrap.Modal.getInstance(modalEl).hide();
            }
        });
    }

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
    });
};
