(() => {
    "use strict";

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // Global variables
    let publicIncidents = [];
    let publicPersonnel = [];
    let publicEquipment = [];
    let publicActivities = [];

    // Initialize UI elements on DOM Content Loaded
    document.addEventListener("DOMContentLoaded", () => {
        initNavbarScroll();
        initActiveSectionObserver();
        initClock();
        initWeather();
        initCopyToClipboard();
        initImageModal();

        // Equipment Search Filter
        const searchInput = $("#equipmentSearchInput");
        if (searchInput) {
            searchInput.addEventListener("input", () => {
                renderEquipmentGrid(searchInput.value.trim());
            });
        }

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

    // 4. Dynamic Weather System (Lapuyan, Zamboanga del Sur - 7.6258, 123.1892)
    function initWeather() {
        fetchWeatherData();
        // Fetch weather telemetry every 5 minutes
        setInterval(fetchWeatherData, 300000);
    }

    async function fetchWeatherData() {
        const defaultWeather = {
            temperature_2m: 29.0,
            relative_humidity_2m: 82,
            precipitation: 0.0,
            rain: 0.0,
            weather_code: 2, // Partly cloudy default
            wind_speed_10m: 12.0
        };

        try {
            // Call Open-Meteo API (Keyless and highly reliable)
            const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=7.6258&longitude=123.1892&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m");
            if (!res.ok) {
                throw new Error("Failed to fetch weather telemetry");
            }
            const data = await res.json();
            if (data && data.current) {
                const currentWeather = data.current;
                // Save state to localStorage for offline cache capability
                localStorage.setItem("mdrrmo_weather_cache", JSON.stringify({
                    weather: currentWeather,
                    timestamp: Date.now()
                }));
                updateWeatherWidget(currentWeather);
                return;
            }
        } catch (error) {
            console.warn("Weather API fetch failed, loading offline telemetry cache:", error);
        }

        // Offline / Cache fallback mechanism
        try {
            const cachedData = localStorage.getItem("mdrrmo_weather_cache");
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                // Allow cached weather if it is under 6 hours old, otherwise fall back to favorable baseline defaults
                if (Date.now() - parsed.timestamp < 21600000) {
                    updateWeatherWidget(parsed.weather);
                    return;
                }
            }
        } catch (cacheError) {
            console.error("Failed to parse weather cache:", cacheError);
        }

        // Favorable fallback if API is offline and cache is absent or stale
        updateWeatherWidget(defaultWeather);
    }

    function updateWeatherWidget(current) {
        const tempEl = $("#weatherTemp");
        const conditionEl = $("#weatherCondition");
        const iconContainerEl = $("#weatherIconContainer");
        const rainEl = $("#weatherRain");
        const humidityEl = $("#weatherHumidity");
        const windEl = $("#weatherWind");

        if (tempEl) {
            tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
        }
        if (humidityEl) {
            humidityEl.textContent = `${current.relative_humidity_2m}%`;
        }
        if (windEl) {
            windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
        }

        // Map Rain/Precipitation Threat
        if (rainEl) {
            const rainVal = current.rain ?? current.precipitation ?? 0.0;
            rainEl.className = "weather-metric-value"; // Reset classes
            if (rainVal === 0) {
                rainEl.textContent = "None";
                rainEl.classList.add("text-success");
            } else if (rainVal <= 2.0) {
                rainEl.textContent = "Light Rain";
                rainEl.classList.add("text-info");
            } else if (rainVal <= 8.0) {
                rainEl.textContent = "Moderate Rain";
                rainEl.classList.add("text-warning");
            } else {
                rainEl.textContent = "Heavy Rain Alert";
                rainEl.classList.add("text-danger");
                rainEl.style.animation = "blink 1.5s infinite";
            }
        }

        // Map Weather Code to description and gorgeous inline vector SVG
        const code = current.weather_code ?? 0;
        let condText = "Scattered Clouds";
        let iconSvg = `
            <svg class="weather-icon-svg" viewBox="0 0 64 64">
                <circle cx="32" cy="24" r="12" fill="#ffb703" />
                <path d="M46,38a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,40a7,7,0,0,0,7,7H45A8,8,0,0,0,46,38Z" fill="#e2e8f0" />
            </svg>
        `; // Default fallback: Partly Cloudy SVG

        if (code === 0) {
            condText = "Clear Sky";
            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="16" fill="#ffb703" />
                    <line x1="32" y1="8" x2="32" y2="0" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="32" y1="56" x2="32" y2="64" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="8" y1="32" x2="0" y2="32" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="56" y1="32" x2="64" y2="32" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="15" y1="15" x2="9" y2="9" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="49" y1="49" x2="55" y2="55" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="15" y1="49" x2="9" y2="55" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                    <line x1="49" y1="15" x2="55" y2="9" stroke="#ffb703" stroke-width="4" stroke-linecap="round" />
                </svg>
            `;
        } else if (code === 1) {
            condText = "Mainly Clear";
            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <circle cx="32" cy="24" r="12" fill="#ffb703" />
                    <path d="M46,38a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,40a7,7,0,0,0,7,7H45A8,8,0,0,0,46,38Z" fill="#e2e8f0" />
                </svg>
            `;
        } else if (code === 2) {
            condText = "Partly Cloudy";
            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <circle cx="32" cy="24" r="12" fill="#ffb703" />
                    <path d="M46,38a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,40a7,7,0,0,0,7,7H45A8,8,0,0,0,46,38Z" fill="#e2e8f0" />
                </svg>
            `;
        } else if (code === 3) {
            condText = "Overcast";
            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <path d="M46,38a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,40a7,7,0,0,0,7,7H45A8,8,0,0,0,46,38Z" fill="#cbd5e1" />
                    <path d="M36,28a6,6,0,0,0-6-6,7.41,7.41,0,0,0-2.3.4A8.25,8.25,0,1,0,14,30a5.25,5.25,0,0,0,5.25,5.25H35A6,6,0,0,0,36,28Z" fill="#94a3b8" opacity="0.8" transform="translate(4, 4)" />
                </svg>
            `;
        } else if (code === 45 || code === 48) {
            condText = "Foggy";
            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <path d="M46,28a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,30a7,7,0,0,0,7,7H45A8,8,0,0,0,46,28Z" fill="#94a3b8" opacity="0.7" />
                    <line x1="12" y1="44" x2="52" y2="44" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
                    <line x1="18" y1="52" x2="46" y2="52" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
                </svg>
            `;
        } else if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
            // Rain / Drizzle / Showers
            if (code >= 51 && code <= 55) condText = "Drizzle";
            else if (code === 56 || code === 57 || code === 66 || code === 67) condText = "Freezing Rain";
            else if (code === 61 || code === 80) condText = "Light Rain";
            else if (code === 63 || code === 81) condText = "Moderate Rain";
            else condText = "Heavy Rain";

            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <path d="M46,32a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,34a7,7,0,0,0,7,7H45A8,8,0,0,0,46,32Z" fill="#cbd5e1" />
                    <line x1="22" y1="46" x2="18" y2="54" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
                    <line x1="32" y1="46" x2="28" y2="54" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
                    <line x1="42" y1="46" x2="38" y2="54" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
                </svg>
            `;
        } else if (code === 95 || code === 96 || code === 99) {
            condText = "Thunderstorms";
            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <path d="M46,32a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,34a7,7,0,0,0,7,7H45A8,8,0,0,0,46,32Z" fill="#475569" />
                    <polygon points="30,42 24,52 32,52 28,62 38,48 30,48" fill="#eab308" />
                </svg>
            `;
        } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
            condText = "Snowy";
            iconSvg = `
                <svg class="weather-icon-svg" viewBox="0 0 64 64">
                    <path d="M46,32a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,34a7,7,0,0,0,7,7H45A8,8,0,0,0,46,32Z" fill="#cbd5e1" />
                    <circle cx="22" cy="48" r="2.5" fill="#f8fafc" />
                    <circle cx="32" cy="52" r="2.5" fill="#f8fafc" />
                    <circle cx="42" cy="48" r="2.5" fill="#f8fafc" />
                </svg>
            `;
        }

        if (conditionEl) {
            conditionEl.textContent = condText;
        }
        if (iconContainerEl) {
            iconContainerEl.innerHTML = iconSvg;
        }
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
                publicEquipment = data.equipment || [];
                publicActivities = data.activities || [];

                // Render components
                renderRosterGrid();
                renderIncidentsSection();
                renderEquipmentGrid();
                renderActivitiesSection();
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

                const totalActivitiesCount = $("#totalActivitiesCount");
                if (totalActivitiesCount) {
                    totalActivitiesCount.textContent = publicActivities.length;
                }
            }
        } catch (e) {
            console.error("Error fetching public MDRRMO data:", e);
        }
    }

    // 5b. Compute and update page emergency status dynamically based on unresolved reports
    function updateEmergencyAlertStatus() {
        const pulseRing = $("#alertPulseRing");
        const pulseCore = $("#alertPulseCore");
        const statusText = $("#alertStatusText");
        const statusDesc = $("#alertStatusDesc");

        if (!pulseRing || !pulseCore || !statusText || !statusDesc) return;

        // Find active un-resolved reports
        const activeAlerts = publicIncidents.filter(inc => inc.status !== 'Resolved' && inc.status !== 'Cancelled');
        const count = activeAlerts.length;

        // Remove all previous level classes
        pulseRing.className = "alert-pulse-ring";
        pulseCore.className = "alert-pulse-core";
        statusText.className = "alert-status-text";

        if (count >= 5) {
            pulseRing.classList.add("level-red-ring");
            pulseCore.classList.add("level-red");
            statusText.classList.add("text-level-red");
            statusText.textContent = "RED ALERT ACTIVE";
            statusDesc.textContent = `Critical emergency dispatches active. ${count} reported situations require extreme caution. Response units are operational.`;
        } else if (count >= 3) {
            pulseRing.classList.add("level-red-ring");
            pulseCore.classList.add("level-red");
            statusText.classList.add("text-level-red");
            statusText.textContent = "ORANGE ALERT ACTIVE";
            statusDesc.textContent = `Multiple incidents active. Rescue squads actively managing ${count} emergency scenes. Track announcements.`;
        } else if (count >= 1) {
            pulseRing.classList.add("level-yellow-ring");
            pulseCore.classList.add("level-yellow");
            statusText.classList.add("text-level-yellow");
            statusText.textContent = "YELLOW ALERT STATUS";
            statusDesc.textContent = `Incident alerts logged. ${count} scene(s) currently monitored by rescue teams.`;
        } else {
            // Safe / Normal
            pulseRing.classList.add("level-green-ring");
            pulseCore.classList.add("level-green");
            statusText.classList.add("text-level-green");
            statusText.textContent = "NORMAL STATUS";
            statusDesc.textContent = "Weather is favorable. Monitoring routines are active. No warnings issued.";
        }
    }

    // 6. Build hierarchical tree structure for Organization Chart
    function buildRosterHierarchy(personnel) {
        if (personnel.length === 0) return null;

        // Find root (CEO or top-level personnel without reportsTo)
        let root = personnel.find(p => p.isCEO === true);
        if (!root) {
            root = personnel.find(p => !p.reportsTo);
        }
        if (!root) return null;

        const rootIdStr = root.id.toString();

        // Normalize: link orphans to the root
        const normalized = personnel.map(p => {
            if (p.id.toString() !== rootIdStr && !p.isCEO && !p.reportsTo) {
                return { ...p, reportsTo: rootIdStr };
            }
            return p;
        });

        function buildTree(personId) {
            const personIdStr = personId.toString();
            const person = normalized.find(p => p.id.toString() === personIdStr);
            if (!person) return null;

            const children = normalized
                .filter(p => p.reportsTo && p.reportsTo.toString() === personIdStr)
                .map(child => buildTree(child.id))
                .filter(Boolean)
                .sort((a, b) => a.name.localeCompare(b.name));

            return {
                ...person,
                children: children.length > 0 ? children : undefined
            };
        }

        return buildTree(root.id);
    }

    // Render Roster Organization Chart
    function renderRosterGrid() {
        const chartWrapper = $("#homepageOrgChart");
        if (!chartWrapper) return;

        chartWrapper.innerHTML = "";

        if (publicPersonnel.length === 0) {
            chartWrapper.innerHTML = `<div class="text-center text-muted py-5">No organization chart profiles listed.</div>`;
            return;
        }

        const tree = buildRosterHierarchy(publicPersonnel);
        if (!tree) {
            chartWrapper.innerHTML = `<div class="text-center text-muted py-5">Unable to construct organization structure.</div>`;
            return;
        }

        // Render the tree starting at Level 0
        renderRosterNode(tree, chartWrapper, 0);
    }

    // Render a single node in the organization chart recursively
    function renderRosterNode(node, container, level) {
        const nodeElement = document.createElement("div");
        nodeElement.className = "org-node";
        nodeElement.setAttribute("data-level", level);

        // Node card using the premium homepage personnel card style
        const cardHtml = renderPersonnelCard(node);
        
        // Create card element
        const cardWrapper = document.createElement("div");
        cardWrapper.style.display = "inline-block";
        cardWrapper.style.position = "relative";
        cardWrapper.style.zIndex = "2";
        cardWrapper.innerHTML = cardHtml;
        
        nodeElement.appendChild(cardWrapper.firstElementChild);

        // Render children if present
        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement("div");
            childrenContainer.className = "org-children";

            node.children.forEach(child => {
                const childWrapper = document.createElement("div");
                childWrapper.className = "org-child-wrapper";
                renderRosterNode(child, childWrapper, level + 1);
                childrenContainer.appendChild(childWrapper);
            });

            nodeElement.appendChild(childrenContainer);
        }

        container.appendChild(nodeElement);
    }

    function renderPersonnelCard(p) {
        const photoSrc = p.photoDataUrl ? p.photoDataUrl : '';
        const imgBlock = photoSrc 
            ? `<img src="${photoSrc}" alt="${escapeHtml(p.name)}" class="personnel-img" />`
            : `<div class="personnel-placeholder-img"><i class="bi bi-person-fill"></i><span class="small">No Photo</span></div>`;

        const isCeo = p.isCEO === true;
        const ceoClass = isCeo ? 'org-node-ceo-card' : '';

        return `
            <div class="personnel-card team-member-card ${ceoClass}" data-id="${p.id}" style="cursor: pointer;">
                <div class="personnel-img-wrap">
                    ${imgBlock}
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
                    <img src="${inc.photoDataUrl}" alt="${escapeHtml(inc.type)}" class="personnel-img incident-image-clickable" data-image="${inc.photoDataUrl}" data-title="${escapeHtml(inc.type)}" style="cursor: pointer; transition: all 0.3s ease; width:100%; height:100%; object-fit:cover;" />
                   </div>`
                : `<div class="personnel-placeholder-img bg-light d-flex align-items-center justify-content-center border-bottom text-muted" style="height: 180px;">
                    <i class="bi bi-image fs-1 text-secondary"></i>
                   </div>`;

            col.innerHTML = `
                <div class="personnel-card incident-report-card h-100 d-flex flex-column justify-content-between" data-id="${inc.id}" style="border-left: 5px solid #dc3545; cursor: pointer;">
                    <div>
                        ${thumbnail}
                        <div class="p-4">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <h5 class="personnel-name mb-0 font-heading fw-bold" style="font-size: 1.1rem;">
                                    <i class="bi ${typeToIcon(inc.type)} me-1 text-primary"></i>
                                    ${escapeHtml(inc.type)}
                                </h5>
                                ${inc.status !== 'Approved' ? `<span class="status-badge status-${inc.status}">${inc.status}</span>` : ''}
                            </div>
                            <span class="small text-muted d-block mb-3"><i class="bi bi-calendar-event me-1"></i>${date}</span>
                            <p class="text-muted small mb-0" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">${escapeHtml(inc.description)}</p>
                        </div>
                    </div>
                </div>
            `;
            feedContainer.appendChild(col);
        });
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
                const mDate = document.getElementById("incidentModalDate");
                const mDescription = document.getElementById("incidentModalDescription");
                const mImgContainer = document.getElementById("incidentModalImgContainer");

                if (mTitle) mTitle.textContent = `Incident Detail: ${inc.type}`;
                if (mType) mType.textContent = inc.type;
                if (mDate) mDate.innerHTML = `<i class="bi bi-calendar-event me-1"></i>Reported: ${date}`;
                if (mDescription) mDescription.textContent = inc.description;
                
                if (mStatus) {
                    if (inc.status === 'Approved') {
                        mStatus.style.display = 'none';
                    } else {
                        mStatus.style.display = 'inline-block';
                        mStatus.className = `badge status-badge status-${inc.status}`;
                        mStatus.textContent = inc.status;
                    }
                }

                if (mImgContainer) {
                    mImgContainer.innerHTML = inc.photoDataUrl
                        ? `<img src="${inc.photoDataUrl}" alt="${escapeHtml(inc.type)}" style="width: 100%; height: 100%; object-fit: contain;" />`
                        : `<div class="d-flex align-items-center justify-content-center h-100 text-white-50"><i class="bi bi-image display-1"></i></div>`;
                }

                const bootstrapModal = new bootstrap.Modal(document.getElementById("incidentDetailsModal"));
                bootstrapModal.show();
            });

            // 9d. Interactive click to view full details of Activity cards
            document.addEventListener("click", (e) => {
                const card = e.target.closest(".activity-log-card");
                if (!card) return;

                const id = card.getAttribute("data-id");
                const activity = publicActivities.find(x => x.id === id);
                if (!activity) return;

                const date = new Date(activity.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });

                const mTitle = document.getElementById("activityModalTitle");
                const mTitleText = document.getElementById("activityModalTitleText");
                const mDate = document.getElementById("activityModalDate");
                const mDescription = document.getElementById("activityModalDescription");
                const mImgContainer = document.getElementById("activityModalImgContainer");

                if (mTitle) mTitle.textContent = `Activity Logs: ${activity.title}`;
                if (mTitleText) mTitleText.textContent = activity.title;
                if (mDate) mDate.innerHTML = `<i class="bi bi-calendar-event me-1"></i>Conducted: ${date}`;
                if (mDescription) mDescription.textContent = activity.description || "No detailed log was provided.";
                
                if (mImgContainer) {
                    const firstImage = activity.images && activity.images.length > 0 ? activity.images[0] : null;
                    mImgContainer.innerHTML = firstImage
                        ? `<img src="${firstImage}" alt="${escapeHtml(activity.title)}" style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;" class="incident-image-clickable" data-image="${firstImage}" data-title="${escapeHtml(activity.title)}" />`
                        : `<div class="d-flex align-items-center justify-content-center h-100 text-white-50"><i class="bi bi-image display-1"></i></div>`;
                }

                const bootstrapModal = new bootstrap.Modal(document.getElementById("activityDetailsModal"));
                bootstrapModal.show();
            });

            // 9e. Interactive click to view full details of Equipment cards
            document.addEventListener("click", (e) => {
                const card = e.target.closest(".equipment-item-card");
                if (!card) return;

                const id = card.getAttribute("data-id");
                const item = publicEquipment.find(x => x.id === id);
                if (!item) return;

                const mTitle = document.getElementById("equipmentModalTitle");
                const mName = document.getElementById("equipmentModalName");
                const mQty = document.getElementById("equipmentModalQty");
                const mImgContainer = document.getElementById("equipmentModalImgContainer");

                if (mTitle) mTitle.textContent = `Equipment Details: ${item.name}`;
                if (mName) mName.textContent = item.name;
                if (mQty) mQty.textContent = `QTY: ${item.count}`;
                
                if (mImgContainer) {
                    const firstImage = item.imageDataUrl ? item.imageDataUrl : null;
                    mImgContainer.innerHTML = firstImage
                        ? `<img src="${firstImage}" alt="${escapeHtml(item.name)}" style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;" class="incident-image-clickable" data-image="${firstImage}" data-title="${escapeHtml(item.name)}" />`
                        : `<div class="d-flex align-items-center justify-content-center h-100 text-white-50"><i class="bi bi-tools display-1"></i></div>`;
                }

                const bootstrapModal = new bootstrap.Modal(document.getElementById("equipmentDetailsModal"));
                bootstrapModal.show();
            });
        }

    // 6b. Render Equipment Grid
    function renderEquipmentGrid(filterText = "") {
        const gridContainer = $("#publicEquipmentGrid");
        const typesCountEl = $("#totalEquipTypesCount");
        const itemsCountEl = $("#totalEquipItemsCount");
        
        if (!gridContainer) return;
        
        const query = filterText.toLowerCase().trim();
        const filteredEquipment = publicEquipment.filter(item => 
            item.name.toLowerCase().includes(query)
        );
        
        // Update stats
        if (typesCountEl) typesCountEl.textContent = publicEquipment.length;
        if (itemsCountEl) {
            const totalCount = publicEquipment.reduce((acc, curr) => acc + curr.count, 0);
            itemsCountEl.textContent = totalCount;
        }

        gridContainer.innerHTML = "";

        if (filteredEquipment.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-search display-4 d-block mb-3 text-secondary"></i>
                    No matching equipment found in inventory.
                </div>
            `;
            return;
        }

        filteredEquipment.forEach(item => {
            const col = document.createElement("div");
            col.className = "col-sm-6 col-md-4 col-lg-3 mb-4";
            
            const photoSrc = item.imageDataUrl ? item.imageDataUrl : '';
            const imgBlock = photoSrc 
                ? `<img src="${photoSrc}" alt="${escapeHtml(item.name)}" class="personnel-img" style="height: 100%; width: 100%; object-fit: cover;" />`
                : `<div class="personnel-placeholder-img text-muted"><i class="bi bi-tools fs-2 mb-2"></i><span class="small">No Photo</span></div>`;

            col.innerHTML = `
                <div class="personnel-card equipment-item-card h-100 d-flex flex-column justify-content-between" data-id="${item.id}" style="cursor: pointer;">
                    <div>
                        <div class="personnel-img-wrap" style="height: 180px; overflow: hidden; position: relative;">
                            ${imgBlock}
                            <span class="badge bg-danger rounded-pill px-3 py-2" style="position: absolute; bottom: 12px; right: 12px; font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">QTY: ${item.count}</span>
                        </div>
                        <div class="p-3 text-center">
                            <h5 class="personnel-name text-dark font-heading fw-bold mb-0" style="font-size: 1.05rem; line-height: 1.4;">${escapeHtml(item.name)}</h5>
                            <span class="text-danger small fw-bold font-heading mt-2 d-inline-block">View Details <i class="bi bi-arrow-right-short fs-5 align-middle"></i></span>
                        </div>
                    </div>
                </div>
            `;
            gridContainer.appendChild(col);
        });
    }

    // 7b. Render Activities Grid
    function renderActivitiesSection() {
        const gridContainer = $("#publicActivitiesGrid");
        if (!gridContainer) return;

        gridContainer.innerHTML = "";

        if (publicActivities.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-info-circle display-4 d-block mb-3 text-secondary"></i>
                    No training drills or seminars logged yet.
                </div>
            `;
            return;
        }

        publicActivities.forEach(activity => {
            const date = new Date(activity.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
            const col = document.createElement("div");
            col.className = "col-sm-6 col-md-4 mb-4";
            
            const photoSrc = activity.images && activity.images.length > 0 ? activity.images[0] : '';
            const imgBlock = photoSrc
                ? `<img src="${photoSrc}" alt="${escapeHtml(activity.title)}" class="personnel-img" style="height: 100%; width: 100%; object-fit: cover;" />`
                : `<div class="personnel-placeholder-img text-muted"><i class="bi bi-calendar4-event fs-1 mb-2"></i><span class="small">No Photo</span></div>`;

            col.innerHTML = `
                <div class="personnel-card activity-log-card h-100 d-flex flex-column justify-content-between" data-id="${activity.id}" style="cursor: pointer;">
                    <div>
                        <div class="personnel-img-wrap" style="height: 180px; overflow: hidden; position: relative;">
                            ${imgBlock}
                            <span class="badge bg-danger rounded-pill px-3 py-1" style="position: absolute; top: 12px; left: 12px; font-size: 0.75rem; font-weight: 600;"><i class="bi bi-bookmark-star-fill me-1"></i>Official Activity</span>
                        </div>
                        <div class="p-4">
                            <h5 class="personnel-name text-dark font-heading fw-bold text-start mb-2" style="font-size: 1.15rem; line-height: 1.4;">${escapeHtml(activity.title)}</h5>
                            <span class="small text-muted d-block mb-3 text-start"><i class="bi bi-calendar-event me-1"></i>${date}</span>
                            <p class="text-muted small mb-0 text-start" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.6;">${escapeHtml(activity.description)}</p>
                        </div>
                    </div>
                    <div class="p-4 pt-0 border-top-0 d-flex justify-content-start">
                        <span class="text-danger small fw-bold font-heading">Read Full Details <i class="bi bi-arrow-right-short fs-5 align-middle"></i></span>
                    </div>
                </div>
            `;
            gridContainer.appendChild(col);
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
