(() => {
    "use strict";

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // Global variables
    let publicIncidents = [];
    let publicPersonnel = [];

    // Initialize UI elements on DOM Content Loaded
    document.addEventListener("DOMContentLoaded", () => {
        initNavbarScroll();
        initActiveSectionObserver();
        initClock();
        initCopyToClipboard();
        initImageModal();

        // Initial Data Fetch
        fetchPublicData();
        // Poll every 30 seconds for real-time updates
        setInterval(fetchPublicData, 30000);
    });

    // 1. Sticky Navbar Transition
    function initNavbarScroll() {
        const navbar = $(".homepage-navbar");
        if (!navbar) return;

        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        });
    }

    // 2. Navbar Intersection Observer for Highlight Active Page Link
    function initActiveSectionObserver() {
        const sections = $$("section[id]");
        const navLinks = $$(".homepage-navbar .nav-link");

        const options = {
            root: null,
            rootMargin: "-20% 0px -60% 0px",
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute("id");
                    navLinks.forEach(link => {
                        link.classList.remove("active");
                        if (link.getAttribute("href") === `#${id}`) {
                            link.classList.add("active");
                        }
                    });
                }
            });
        }, options);

        sections.forEach(section => observer.observe(section));
    }

    // 3. Dynamic Clock System
    function initClock() {
        const clockTime = $("#heroTime");
        const clockDate = $("#heroDate");

        function update() {
            const now = new Date();
            if (clockTime) {
                clockTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
            if (clockDate) {
                clockDate.textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            }
        }
        update();
        setInterval(update, 1000);
    }



    // 5. Fetch Database Data (AJAX)
    async function fetchPublicData() {
        try {
            const response = await fetch("api/public-data.php");
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            if (data.success) {
                publicPersonnel = data.personnels || [];
                publicIncidents = data.incidents || [];

                // Render components
                renderRosterGrid();
                renderIncidentsSection();
                updateEmergencyAlertStatus();

                // Update dynamic counts on the page
                const activeRespondersCount = $("#activeRespondersCount");
                if (activeRespondersCount && publicPersonnel.length > 0) {
                    activeRespondersCount.textContent = publicPersonnel.length;
                }

                const totalIncidentsCount = $("#totalIncidentsCount");
                if (totalIncidentsCount) {
                    // count non-cancelled incidents
                    const activeCount = publicIncidents.filter(inc => inc.status !== 'Cancelled').length;
                    totalIncidentsCount.textContent = activeCount;
                }
            }
        } catch (e) {
            console.error("Error fetching public MDRRMO data:", e);
        }
    }

    // 5b. Compute and update page emergency status dynamically based on unresolved report severities
    function updateEmergencyAlertStatus() {
        const pulseRing = $("#alertPulseRing");
        const pulseCore = $("#alertPulseCore");
        const statusText = $("#alertStatusText");
        const statusDesc = $("#alertStatusDesc");

        if (!pulseRing || !pulseCore || !statusText || !statusDesc) return;

        // Find active un-resolved reports
        const activeAlerts = publicIncidents.filter(inc => inc.status !== 'Resolved' && inc.status !== 'Cancelled');
        
        let maxSeverity = "None";
        if (activeAlerts.length > 0) {
            // Find highest severity: Critical > High > Moderate > Low
            const severities = activeAlerts.map(a => a.severity);
            if (severities.includes("Critical")) {
                maxSeverity = "Critical";
            } else if (severities.includes("High")) {
                maxSeverity = "High";
            } else if (severities.includes("Moderate")) {
                maxSeverity = "Moderate";
            } else {
                maxSeverity = "Low";
            }
        }

        // Remove all previous level classes
        pulseRing.className = "alert-pulse-ring";
        pulseCore.className = "alert-pulse-core";
        statusText.className = "alert-status-text";

        if (maxSeverity === "Critical") {
            pulseRing.classList.add("level-red-ring");
            pulseCore.classList.add("level-red");
            statusText.classList.add("text-level-red");
            statusText.textContent = "RED ALERT ACTIVE";
            statusDesc.textContent = `Critical emergency dispatches active. ${activeAlerts.length} reported situations require extreme caution. Response units are operational.`;
        } else if (maxSeverity === "High") {
            pulseRing.classList.add("level-red-ring");
            pulseCore.classList.add("level-red");
            statusText.classList.add("text-level-red");
            statusText.textContent = "ORANGE ALERT ACTIVE";
            statusDesc.textContent = `High-severity conditions. Rescue squads actively managing ${activeAlerts.length} emergency scenes. Track announcements.`;
        } else if (maxSeverity === "Moderate") {
            pulseRing.classList.add("level-yellow-ring");
            pulseCore.classList.add("level-yellow");
            statusText.classList.add("text-level-yellow");
            statusText.textContent = "YELLOW ALERT STATUS";
            statusDesc.textContent = `Moderate weather warnings or incidents registered. ${activeAlerts.length} scenes currently monitored by rescue teams.`;
        } else if (maxSeverity === "Low") {
            pulseRing.classList.add("level-yellow-ring");
            pulseCore.classList.add("level-yellow");
            statusText.classList.add("text-level-yellow");
            statusText.textContent = "ACTIVE MONITORING";
            statusDesc.textContent = `Minor incident alerts logged. Standard patrols monitoring local conditions. General areas safe for transit.`;
        } else {
            // Safe / Normal
            pulseRing.classList.add("level-green-ring");
            pulseCore.classList.add("level-green");
            statusText.classList.add("text-level-green");
            statusText.textContent = "NORMAL STATUS";
            statusDesc.textContent = "Weather is favorable. Monitoring routines are active. No warnings issued.";
        }
    }

    // 6. Render Personnel Organizational Grid
    function renderRosterGrid() {
        const ceoContainer = $("#ceoRosterContainer");
        const gridContainer = $("#personnelRosterGrid");

        if (!ceoContainer || !gridContainer) return;

        // Clear previous cards
        ceoContainer.innerHTML = "";
        gridContainer.innerHTML = "";

        // Find CEO
        const ceo = publicPersonnel.find(p => p.isCEO === true);
        if (ceo) {
            ceoContainer.innerHTML = renderPersonnelCard(ceo);
        } else {
            ceoContainer.innerHTML = `<div class="text-center text-muted small py-3">Leadership team vacancy</div>`;
        }

        // Filter other personnel
        const filteredList = publicPersonnel.filter(p => p.isCEO !== true);

        if (filteredList.length === 0) {
            gridContainer.innerHTML = `<div class="col-12 text-center text-muted py-5">No roster profiles listed in this category.</div>`;
            return;
        }

        filteredList.forEach(person => {
            const col = document.createElement("div");
            col.className = "col-sm-6 col-md-4 col-lg-3 mb-4";
            col.innerHTML = renderPersonnelCard(person);
            gridContainer.appendChild(col);
        });
    }

    function renderPersonnelCard(p) {
        const photoSrc = p.photoDataUrl ? p.photoDataUrl : '';
        const imgBlock = photoSrc 
            ? `<img src="${photoSrc}" alt="${escapeHtml(p.name)}" class="personnel-img" />`
            : `<div class="personnel-placeholder-img"><i class="bi bi-person-fill"></i><span class="small">No Photo</span></div>`;

        const badge = p.isCEO ? `<span class="personnel-ceo-badge">Director</span>` : '';

        return `
            <div class="personnel-card team-member-card" data-id="${p.id}" style="cursor: pointer;">
                <div class="personnel-img-wrap">
                    ${imgBlock}
                    ${badge}
                </div>
                <div class="personnel-body">
                    <h5 class="personnel-name">${escapeHtml(p.name)}</h5>
                    <p class="personnel-role">${escapeHtml(p.role)}</p>
                </div>
            </div>
        `;
    }

    // 7. Render Incidents Feed as a beautiful full-width card grid
    function renderIncidentsSection() {
        const feedContainer = $("#publicIncidentsFeed");
        if (!feedContainer) return;

        // Clear feed
        feedContainer.innerHTML = "";

        const validIncidents = publicIncidents.filter(inc => inc.status !== 'Cancelled');

        if (validIncidents.length === 0) {
            feedContainer.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-info-circle display-4 d-block mb-3 text-secondary"></i>
                    No active incident reports in the system.
                </div>
            `;
            return;
        }

        validIncidents.forEach((inc) => {
            const date = new Date(inc.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            
            const col = document.createElement("div");
            col.className = "col-sm-6 col-md-4 mb-4";
            
            const thumbnail = inc.photoDataUrl 
                ? `<div class="personnel-img-wrap" style="height: 180px; overflow: hidden; position: relative;">
                    <img src="${inc.photoDataUrl}" alt="${escapeHtml(inc.type)}" class="personnel-img incident-image-clickable" data-image="${inc.photoDataUrl}" data-title="${escapeHtml(inc.type)} - ${inc.severity}" style="cursor: pointer; transition: all 0.3s ease; width:100%; height:100%; object-fit:cover;" />
                   </div>`
                : `<div class="personnel-placeholder-img bg-light d-flex align-items-center justify-content-center border-bottom text-muted" style="height: 180px;">
                    <i class="bi bi-image fs-1 text-secondary"></i>
                   </div>`;

            col.innerHTML = `
                <div class="personnel-card incident-report-card h-100 d-flex flex-column justify-content-between" data-id="${inc.id}" style="border-left: 5px solid ${severityColor(inc.severity)}; cursor: pointer;">
                    <div>
                        ${thumbnail}
                        <div class="p-4">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <h5 class="personnel-name mb-0 font-heading fw-bold" style="font-size: 1.1rem;">
                                    <i class="bi ${typeToIcon(inc.type)} me-1 text-primary"></i>
                                    ${escapeHtml(inc.type)}
                                </h5>
                                <span class="status-badge status-${inc.status}">${inc.status}</span>
                            </div>
                            <span class="small text-muted d-block mb-3"><i class="bi bi-calendar-event me-1"></i>${date}</span>
                            <p class="text-muted small mb-0" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">${escapeHtml(inc.description)}</p>
                        </div>
                    </div>
                    <div class="p-4 pt-0 border-top-0 d-flex align-items-center justify-content-between">
                        <span class="small text-muted fw-semibold">Severity: <span style="color: ${severityColor(inc.severity)}; font-weight:700;">${inc.severity}</span></span>
                        ${inc.lat != null && inc.lng != null 
                            ? `<span class="small text-success" style="font-size:0.75rem;"><i class="bi bi-geo-alt-fill text-danger me-1"></i>Geotagged</span>`
                            : ''
                        }
                    </div>
                </div>
            `;
            feedContainer.appendChild(col);
        });
    }

    function severityColor(sev) {
        switch(sev) {
            case 'Low': return '#2ec4b6';
            case 'Moderate': return '#ffb703';
            case 'High': return '#fb8500';
            case 'Critical': return '#e63946';
            default: return '#94a3b8';
        }
    }

    // 8. Clipboard Contact Action Utility
    function initCopyToClipboard() {
        const cards = $$(".contact-hotline-card");
        cards.forEach(card => {
            const num = card.getAttribute("data-number");
            if (!num) return;

            // Set up visual tooltip block
            const tooltip = document.createElement("div");
            tooltip.className = "copy-tooltip";
            tooltip.textContent = "Copied to clipboard!";
            card.appendChild(tooltip);

            card.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(num);
                    tooltip.classList.add("show");
                    setTimeout(() => {
                        tooltip.classList.remove("show");
                    }, 2000);
                } catch (e) {
                    console.warn("Clipboard access failed:", e);
                }
            });
        });
    }

    // 9. Standard High Fidelity Image Modal Zoom
    function initImageModal() {
        const modalHtml = `
            <div id="homepageImageModal" class="modal fade" tabindex="-1" aria-hidden="true" style="z-index: 1100;">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header border-0 pb-0" style="position: absolute; right: 15px; top: 15px; z-index: 10;">
                            <button type="button" class="btn-close bg-white p-2 rounded-circle shadow-sm" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center p-2 bg-dark rounded overflow-hidden">
                            <img id="homepageModalImage" src="" alt="Zoom" class="img-fluid rounded" style="max-height: 80vh;">
                            <h5 id="homepageModalTitle" class="text-white mt-3 font-heading mb-0"></h5>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHtml);

            document.addEventListener("click", (e) => {
                const img = e.target.closest(".incident-image-clickable");
                if (!img) return;

                const src = img.getAttribute("data-image");
                const title = img.getAttribute("data-title");

                const modalImg = document.getElementById("homepageModalImage");
                const modalTitle = document.getElementById("homepageModalTitle");

                if (modalImg && modalTitle) {
                    modalImg.src = src;
                    modalTitle.textContent = title || "Incident Photo";

                    const bootstrapModal = new bootstrap.Modal(document.getElementById("homepageImageModal"));
                    bootstrapModal.show();
                }
            });

            // 9b. Interactive click to view full details of Personnel cards
            document.addEventListener("click", (e) => {
                const card = e.target.closest(".team-member-card");
                if (!card) return;

                const id = card.getAttribute("data-id");
                const person = publicPersonnel.find(p => p.id === id);
                if (!person) return;

                const modalTitle = document.getElementById("personnelModalTitle");
                const modalName = document.getElementById("personnelModalName");
                const modalRole = document.getElementById("personnelModalRole");
                const modalReportsTo = document.getElementById("personnelModalReportsTo");
                const imgContainer = document.getElementById("personnelModalImgContainer");

                if (modalTitle) modalTitle.textContent = `${person.isCEO ? 'Director' : 'Personnel'} Profile`;
                if (modalName) modalName.textContent = person.name;
                if (modalRole) modalRole.textContent = person.role;

                if (modalReportsTo) {
                    if (person.reportsTo) {
                        const leader = publicPersonnel.find(p => p.id === person.reportsTo);
                        modalReportsTo.textContent = leader ? leader.name : "MDRRMO Chief";
                    } else {
                        modalReportsTo.textContent = person.isCEO ? "N/A (Top Executive)" : "MDRRMO Director";
                    }
                }

                if (imgContainer) {
                    imgContainer.innerHTML = person.photoDataUrl
                        ? `<img src="${person.photoDataUrl}" alt="${escapeHtml(person.name)}" style="width: 100%; height: 100%; object-fit: contain; background-color: #f1f5f9;" />`
                        : `<div class="d-flex align-items-center justify-content-center h-100 text-muted bg-light"><i class="bi bi-person-fill display-1"></i></div>`;
                }

                const bootstrapModal = new bootstrap.Modal(document.getElementById("personnelDetailsModal"));
                bootstrapModal.show();
            });

            // 9c. Interactive click to view full details of Incident cards
            document.addEventListener("click", (e) => {
                // If they clicked on the image directly, let the zoom modal handle it
                if (e.target.classList.contains("incident-image-clickable")) return;

                const card = e.target.closest(".incident-report-card");
                if (!card) return;

                const id = card.getAttribute("data-id");
                const inc = publicIncidents.find(x => x.id === id);
                if (!inc) return;

                const date = new Date(inc.createdAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });

                const mTitle = document.getElementById("incidentModalTitle");
                const mType = document.getElementById("incidentModalType");
                const mStatus = document.getElementById("incidentModalStatus");
                const mSeverity = document.getElementById("incidentModalSeverity");
                const mDate = document.getElementById("incidentModalDate");
                const mDescription = document.getElementById("incidentModalDescription");
                const mImgContainer = document.getElementById("incidentModalImgContainer");
                const mGpsBlock = document.getElementById("incidentModalGpsBlock");
                const mCoordinates = document.getElementById("incidentModalCoordinates");

                if (mTitle) mTitle.textContent = `Incident Detail: ${inc.type}`;
                if (mType) mType.textContent = inc.type;
                if (mDate) mDate.innerHTML = `<i class="bi bi-calendar-event me-1"></i>Reported: ${date}`;
                if (mDescription) mDescription.textContent = inc.description;
                
                if (mStatus) {
                    mStatus.className = `badge status-badge status-${inc.status}`;
                    mStatus.textContent = inc.status;
                }
                if (mSeverity) {
                    const sevColor = severityColor(inc.severity);
                    mSeverity.style.backgroundColor = sevColor + '15';
                    mSeverity.style.color = sevColor;
                    mSeverity.style.border = `1px solid ${sevColor}30`;
                    mSeverity.textContent = `Severity: ${inc.severity}`;
                }

                if (mImgContainer) {
                    mImgContainer.innerHTML = inc.photoDataUrl
                        ? `<img src="${inc.photoDataUrl}" alt="${escapeHtml(inc.type)}" style="width: 100%; height: 100%; object-fit: contain;" />`
                        : `<div class="d-flex align-items-center justify-content-center h-100 text-white-50"><i class="bi bi-image display-1"></i></div>`;
                }

                if (mGpsBlock && mCoordinates) {
                    if (inc.lat != null && inc.lng != null) {
                        mGpsBlock.style.display = "block";
                        mCoordinates.textContent = `Latitude: ${Number(inc.lat).toFixed(6)} | Longitude: ${Number(inc.lng).toFixed(6)}`;
                    } else {
                        mGpsBlock.style.display = "none";
                    }
                }

                const bootstrapModal = new bootstrap.Modal(document.getElementById("incidentDetailsModal"));
                bootstrapModal.show();
            });
        }

    // Helper functions
    function typeToIcon(type) {
        switch (type) {
            case "Fire": return "bi-fire";
            case "Flood": return "bi-droplet";
            case "Road Accident": return "bi-car-front";
            case "Medical": return "bi-heart-pulse";
            case "Landslide": return "bi-triangle";
            case "Earthquake": return "bi-activity";
            case "Power Outage": return "bi-lightning";
            default: return "bi-exclamation-octagon";
        }
    }

    function escapeHtml(s) {
        if (!s) return "";
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();
