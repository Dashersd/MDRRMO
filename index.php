<?php
define('SECURE_ACCESS', true);
require_once 'auth.php';

// Check if user is logged in
$isUserLoggedIn = isLoggedIn();
$userRole = '';
$username = '';
$displayName = '';

if ($isUserLoggedIn) {
    $userRole = getUserRole();
    $username = getCurrentUser();
    $userData = getUserData();
    $displayName = $userData['full_name'] ?? $username;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MDRRMO | Lapuyan Geotagged Emergency Portal</title>

    <!-- Tab Icon / Favicon -->
    <link rel="icon" type="image/png" href="assets/icon.png" />
    <link rel="shortcut icon" type="image/png" href="assets/icon.png" />

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">



    <!-- Custom Homepage CSS -->
    <link rel="stylesheet" href="styles/homepage.css">
</head>
<body>

    <!-- Sticky Glassmorphic Top Navigation -->
    <nav class="navbar navbar-expand-lg homepage-navbar fixed-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="#home">
                <img src="assets/icon.png" class="navbar-brand-logo me-2" alt="MDRRMO Logo">
                <span class="navbar-brand-text">MDRRMO <span>LAPUYAN</span></span>
            </a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
                <i class="bi bi-list fs-3 text-dark"></i>
            </button>
            <div class="collapse navbar-collapse" id="navbarContent">
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
                    <li class="nav-item">
                        <a class="nav-link active" href="#home">HOME</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#about">ABOUT</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#personnels">PERSONNELS</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#equipment">EQUIPMENT</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#reports">REPORTS</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#activities">ACTIVITIES</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#contact">CONTACT</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Section 1: HOME (Hero & Dynamic Weather / Alert Status) -->
    <section id="home" class="hero-section">
        <div class="container">
            <div class="row align-items-center g-5">
                <div class="col-lg-7">
                    <div class="hero-badge">
                        <i class="bi bi-shield-fill-check"></i>
                        <span>Lapuyan Municipal Safety and Resiliency Portal</span>
                    </div>
                    <h1 class="hero-title">Preparedness Saves Lives. <br><span>24/7 Response</span> at Your Service.</h1>
                    <p class="hero-description">Welcome to Municipal Disaster Risk Reduction and Management Office of Lapuyan (MDRRMO) <br><br><strong>#SulongParaSaKaligtasan</strong></p>
                </div>
                
                <!-- Dynamic Status & Weather Widget Block -->
                <div class="col-lg-5">


                    <!-- Weather Status Card -->
                    <div class="weather-card">
                        <div class="weather-header">
                            <div>
                                <h4 class="mb-0 text-white font-heading" id="heroTime">--:--:--</h4>
                                <span class="small text-white-50" id="heroDate">Loading clock...</span>
                            </div>
                            <div class="weather-info">
                                <div class="d-flex align-items-center gap-2">
                                    <h2 class="weather-temp mb-0" id="weatherTemp">29°C</h2>
                                    <span id="weatherIconContainer">
                                        <svg class="weather-icon-svg" viewBox="0 0 64 64">
                                            <!-- Sun and Cloud SVG -->
                                            <circle cx="32" cy="24" r="12" fill="#ffb703" />
                                            <path d="M46,38a8,8,0,0,0-8-8,9.88,9.88,0,0,0-3.1.5A11,11,0,1,0,16,40a7,7,0,0,0,7,7H45A8,8,0,0,0,46,38Z" fill="#e2e8f0" />
                                        </svg>
                                    </span>
                                </div>
                                <p class="weather-condition small text-white-50 mb-0" id="weatherCondition">Scattered Clouds</p>
                            </div>
                        </div>
                        
                        <div class="weather-metrics">
                            <div class="weather-metric-item">
                                <span class="weather-metric-label">Rain Threat</span>
                                <span class="weather-metric-value text-success" id="weatherRain">None</span>
                            </div>
                            <div class="weather-metric-item">
                                <span class="weather-metric-label">Humidity</span>
                                <span class="weather-metric-value" id="weatherHumidity">82%</span>
                            </div>
                            <div class="weather-metric-item">
                                <span class="weather-metric-label">Wind</span>
                                <span class="weather-metric-value" id="weatherWind">12 km/h</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: ABOUT MDRRMO -->
    <section id="about" class="homepage-section alt-bg">
        <div class="container">
            <div class="section-title-area">
                <span class="section-subtitle">Who We Are</span>
                <h2 class="section-title">About MDRRMO Lapuyan</h2>
                <p class="text-muted max-width-600 mx-auto">The Municipal Disaster Risk Reduction and Management Office of Lapuyan commits to building disaster-resilient and secure communities through comprehensive planning, coordination, and emergency response capabilities.</p>
            </div>

            <div class="row g-4 mb-5">
                <div class="col-md-6 col-lg-4">
                    <div class="about-card">
                        <div class="about-card-icon">
                            <i class="bi bi-shield-exclamation"></i>
                        </div>
                        <h4 class="about-card-title">1. Disaster Preparedness</h4>
                        <p class="text-muted small">We conduct regular seminars, earthquake and fire drills, and equip citizens and local barangays with safety protocols and disaster responsive capabilities.</p>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="about-card">
                        <div class="about-card-icon">
                            <i class="bi bi-truck"></i>
                        </div>
                        <h4 class="about-card-title">2. Response & Rescue</h4>
                        <p class="text-muted small">Operating a 24/7 dispatch hub, our certified responders manage emergency rescues, evacuations, and relief efforts in times of calamities.</p>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="about-card">
                        <div class="about-card-icon">
                            <i class="bi bi-heart-pulse"></i>
                        </div>
                        <h4 class="about-card-title">3. Prevention & Mitigation</h4>
                        <p class="text-muted small">We map local flood patterns, evaluate landslide-prone areas, and clear drainage systems to minimize disaster effects across Lapuyan.</p>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- Section 3: PERSONNELS -->
    <section id="personnels" class="homepage-section">
        <div class="container">
            <div class="section-title-area">
                <span class="section-subtitle">Our Team</span>
                <h2 class="section-title">Official MDRRMO Responders</h2>
                <p class="text-muted max-width-600 mx-auto">Meet our leadership, certified responders, and rescue personnel who coordinate emergency efforts to secure Lapuyan. Roster updates in real time based on the Admin Organizational Chart.</p>
            </div>


            <!-- Director Card Block (CEO) -->
            <div class="ceo-wrapper" id="ceoRosterContainer">
                <!-- CEO / Director profile card dynamically loaded here -->
            </div>

            <!-- Personnel Roster Grid -->
            <div class="row justify-content-center" id="personnelRosterGrid">
                <!-- Personnel cards dynamically loaded here -->
            </div>
        </div>
    </section>

    <!-- Section 3.5: EQUIPMENT INVENTORY -->
    <section id="equipment" class="homepage-section alt-bg">
        <div class="container">
            <div class="section-title-area">
                <span class="section-subtitle">Resource Readiness</span>
                <h2 class="section-title">Emergency Equipment Inventory</h2>
                <p class="text-muted max-width-600 mx-auto">MDRRMO Lapuyan maintains a state-of-the-art rescue and disaster response inventory. Below is our real-time equipment status, managed dynamically from our administrator dashboard.</p>
            </div>



            <!-- Dynamic Equipment Grid -->
            <div class="row g-4 justify-content-center" id="publicEquipmentGrid">
                <!-- Equipment cards dynamically loaded here -->
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-danger" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Retrieving equipment inventory...</p>
                </div>
            </div>
        </div>
    </section>
    <!-- Section 4: REPORTS -->
    <section id="reports" class="homepage-section">
        <div class="container">
            <div class="section-title-area">
                <span class="section-subtitle">Public Emergency Feed</span>
                <h2 class="section-title">Real-Time Reports</h2>
                <p class="text-muted max-width-600 mx-auto">This public incident feed displays active emergencies reported in Lapuyan. Data updates dynamically in real time based on the active incidents logged by administrators.</p>
            </div>

            <div class="d-flex align-items-center justify-content-between mb-4">
                <h4 class="mb-0 font-heading fw-bold">Recent Feed Alerts</h4>
                <span class="badge bg-danger rounded-pill px-3 py-2 fs-6" id="totalIncidentsCount">0</span>
            </div>

            <div class="row" id="publicIncidentsFeed">
                <!-- Incident feed cards dynamically loaded here in a beautiful grid -->
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-danger" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Retrieving live reports feed...</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 4.5: ACTIVITY LOG -->
    <section id="activities" class="homepage-section alt-bg">
        <div class="container">
            <div class="section-title-area">
                <span class="section-subtitle">Drills & Training Logs</span>
                <h2 class="section-title">Activity Log</h2>
                <p class="text-muted max-width-600 mx-auto">MDRRMO Lapuyan regularly conducts training seminars, fire/earthquake simulation drills, and community safety courses. Follow our dynamic activities log managed from our dashboard.</p>
            </div>

            <div class="d-flex align-items-center justify-content-between mb-4">
                <h4 class="mb-0 font-heading fw-bold"><i class="bi bi-calendar-check text-primary me-2"></i>Recent Activity Feed</h4>
                <span class="badge bg-danger rounded-pill px-3 py-2 fs-6" id="totalActivitiesCount">0</span>
            </div>

            <div class="row" id="publicActivitiesGrid">
                <!-- Activity cards dynamically loaded here in a beautiful grid -->
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-danger" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Retrieving community logs feed...</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 5: CONTACT -->
    <section id="contact" class="homepage-section">
        <div class="container">
            <div class="section-title-area">
                <span class="section-subtitle">Emergency Contacts</span>
                <h2 class="section-title">Get in Touch</h2>
                <p class="text-muted max-width-600 mx-auto">Do you have an emergency to report? Access our 24/7 hotlines. Click on any contact card below to copy the number directly to your clipboard.</p>
            </div>

            <div class="row justify-content-center">
                <!-- Click to Copy Directory -->
                <div class="col-12">
                    <h4 class="mb-4 font-heading text-center">24/7 Hotline Roster</h4>
                    <div class="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4 justify-content-center">
                        <div class="col">
                            <div class="contact-hotline-card h-100" data-number="09300488682">
                                <div class="contact-icon-wrap">
                                    <i class="bi bi-telephone-fill"></i>
                                </div>
                                <div>
                                    <span class="contact-label">MDRRMO HOTLINE</span>
                                    <h5 class="contact-number">0930 048 8682</h5>
                                </div>
                                <i class="bi bi-clipboard-plus copy-indicator"></i>
                            </div>
                        </div>

                        <div class="col">
                            <div class="contact-hotline-card h-100" data-number="09985986817">
                                <div class="contact-icon-wrap">
                                    <i class="bi bi-shield-fill"></i>
                                </div>
                                <div>
                                    <span class="contact-label">LAPUYAN PNP (POLICE)</span>
                                    <h5 class="contact-number">0998 598 6817</h5>
                                </div>
                                <i class="bi bi-clipboard-plus copy-indicator"></i>
                            </div>
                        </div>

                        <div class="col">
                            <div class="contact-hotline-card h-100" data-number="09488221100">
                                <div class="contact-icon-wrap">
                                    <i class="bi bi-fire"></i>
                                </div>
                                <div>
                                    <span class="contact-label">LAPUYAN FIRE STATION</span>
                                    <h5 class="contact-number">0948 822 1100</h5>
                                </div>
                                <i class="bi bi-clipboard-plus copy-indicator"></i>
                            </div>
                        </div>

                        <div class="col">
                            <div class="contact-hotline-card h-100" data-number="09300840430">
                                <div class="contact-icon-wrap">
                                    <i class="bi bi-heart-pulse-fill"></i>
                                </div>
                                <div>
                                    <span class="contact-label">RURAL HEALTH UNIT (RHU)</span>
                                    <h5 class="contact-number">0930 084 0430</h5>
                                </div>
                                <i class="bi bi-clipboard-plus copy-indicator"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="homepage-footer">
        <div class="container">
            <div class="row g-4 justify-content-between">
                <div class="col-lg-4">
                    <img src="assets/icon.png" class="footer-brand-logo" alt="MDRRMO Logo">
                    <h5 class="text-white mt-2 mb-3 font-heading fw-bold">MDRRMO LAPUYAN</h5>
                    <p class="footer-desc">Welcome to Municipal Disaster Risk Reduction and Management Office of Lapuyan (MDRRMO)<br><br>#SulongParaSaKaligtasan</p>
                </div>
                <div class="col-sm-6 col-md-4 col-lg-3">
                    <h5 class="font-heading">Quick Shortcuts</h5>
                    <ul class="footer-links">
                        <li><a href="#home">HOME</a></li>
                        <li><a href="#about">ABOUT</a></li>
                        <li><a href="#personnels">PERSONNELS</a></li>
                        <li><a href="#equipment">EQUIPMENT</a></li>
                        <li><a href="#reports">REPORTS</a></li>
                        <li><a href="#activities">ACTIVITIES</a></li>
                        <li><a href="#contact">CONTACT</a></li>
                    </ul>
                </div>
                <div class="col-sm-6 col-md-4 col-lg-4">
                    <h5 class="font-heading">Office Information</h5>
                    <div class="info-block mb-3">
                        <i class="bi bi-geo-alt info-icon"></i>
                        <div class="info-text">
                            <h5 class="text-white mb-1">MDRRMO HQ</h5>
                            <p>Municipal Hall Compound, Lapuyan, Zamboanga del Sur, Philippines</p>
                        </div>
                    </div>
                    <div class="social-links mt-4">
                        <a href="https://www.facebook.com/lapuyan.mdrrmo" target="_blank" class="social-btn" title="Follow us on Facebook"><i class="bi bi-facebook"></i></a>
                    </div>
                </div>
            </div>

            <div class="footer-bottom">
                <p class="mb-0">© 2026 MDRRMO Lapuyan MDRRMO Information System. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Personnel Details Modal -->
    <div id="personnelDetailsModal" class="modal fade" tabindex="-1" aria-hidden="true" style="z-index: 1080;">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-header border-0 bg-danger text-white p-4">
                    <h5 class="modal-title font-heading fw-bold" id="personnelModalTitle">Personnel Profile</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="text-center bg-light border-bottom" id="personnelModalImgContainer" style="height: 300px; overflow: hidden;">
                        <!-- Image goes here -->
                    </div>
                    <div class="p-4">
                        <h3 class="font-heading fw-bold mb-1" id="personnelModalName">--</h3>
                        <p class="text-danger fw-semibold mb-4" id="personnelModalRole" style="font-size: 1.1rem;">--</p>
                        
                        <div class="row g-3">
                            <div class="col-12">
                                <span class="text-muted d-block small uppercase fw-bold" style="font-size:0.75rem; letter-spacing:0.5px;">ORGANIZATION</span>
                                <span class="fw-semibold text-dark">MDRRMO Lapuyan</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 bg-light p-3">
                    <button type="button" class="btn btn-secondary px-4 rounded-pill" data-bs-dismiss="modal">Close Profile</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Incident Details Modal -->
    <div id="incidentDetailsModal" class="modal fade" tabindex="-1" aria-hidden="true" style="z-index: 1080;">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-header border-0 bg-danger text-white p-4">
                    <h5 class="modal-title font-heading fw-bold" id="incidentModalTitle">Incident Information</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="row g-0">
                        <div class="col-md-6 bg-dark d-flex align-items-center justify-content-center" id="incidentModalImgContainer" style="min-height: 350px; overflow: hidden;">
                            <!-- Image goes here -->
                        </div>
                        <div class="col-md-6 p-4 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <span class="badge status-badge" id="incidentModalStatus">--</span>
                                </div>
                                <h3 class="font-heading fw-bold mb-1 text-dark" id="incidentModalType">--</h3>
                                <span class="small text-muted d-block mb-3" id="incidentModalDate"><i class="bi bi-calendar-event me-1"></i>--</span>
                                <hr>
                                <h6 class="fw-bold text-dark mb-2">Report Description:</h6>
                                <p class="text-muted small" id="incidentModalDescription" style="line-height: 1.6; max-height: 180px; overflow-y: auto;">--</p>
                            </div>
                            

                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 bg-light p-3">
                    <button type="button" class="btn btn-secondary px-4 rounded-pill" data-bs-dismiss="modal">Close Details</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Activity Details Modal -->
    <div id="activityDetailsModal" class="modal fade" tabindex="-1" aria-hidden="true" style="z-index: 1080;">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-header border-0 bg-danger text-white p-4">
                    <h5 class="modal-title font-heading fw-bold" id="activityModalTitle">Activity Logs</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="row g-0">
                        <div class="col-md-6 bg-dark d-flex align-items-center justify-content-center" id="activityModalImgContainer" style="min-height: 350px; overflow: hidden;">
                            <!-- Image goes here -->
                        </div>
                        <div class="col-md-6 p-4 d-flex flex-column justify-content-between">
                            <div>
                                <h3 class="font-heading fw-bold mb-1 text-dark" id="activityModalTitleText">--</h3>
                                <span class="small text-muted d-block mb-3" id="activityModalDate"><i class="bi bi-calendar-event me-1"></i>--</span>
                                <hr>
                                <h6 class="fw-bold text-dark mb-2">Description / Log:</h6>
                                <p class="text-muted small" id="activityModalDescription" style="line-height: 1.6; max-height: 220px; overflow-y: auto;">--</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 bg-light p-3">
                    <button type="button" class="btn btn-secondary px-4 rounded-pill" data-bs-dismiss="modal">Close Logs</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Equipment Details Modal -->
    <div id="equipmentDetailsModal" class="modal fade" tabindex="-1" aria-hidden="true" style="z-index: 1080;">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-header border-0 bg-danger text-white p-4">
                    <h5 class="modal-title font-heading fw-bold" id="equipmentModalTitle">Equipment Details</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="row g-0">
                        <div class="col-md-6 bg-dark d-flex align-items-center justify-content-center" id="equipmentModalImgContainer" style="min-height: 350px; overflow: hidden;">
                            <!-- Image goes here -->
                        </div>
                        <div class="col-md-6 p-4 d-flex flex-column justify-content-between">
                            <div>
                                <h3 class="font-heading fw-bold mb-1 text-dark" id="equipmentModalName">--</h3>
                                <div class="d-flex align-items-center gap-2 mb-3">
                                    <span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 fw-semibold" style="font-size:0.85rem;" id="equipmentModalStatus">Operational</span>
                                    <span class="badge bg-danger rounded-pill px-3 py-1 fw-bold" style="font-size:0.85rem;" id="equipmentModalQty">QTY: --</span>
                                </div>
                                <hr>
                                <div class="row g-3 mt-1">
                                    <div class="col-12">
                                        <span class="text-muted d-block small uppercase fw-bold" style="font-size:0.75rem; letter-spacing:0.5px;">ORGANIZATION</span>
                                        <span class="fw-semibold text-dark">MDRRMO Lapuyan</span>
                                    </div>
                                    <div class="col-12 border-top pt-3 mt-3">
                                        <span class="text-muted d-block small uppercase fw-bold" style="font-size:0.75rem; letter-spacing:0.5px;">RESOURCE STATUS</span>
                                        <span class="fw-semibold text-muted small" style="line-height:1.5;">This emergency response resource is certified operational and readily dispatchable for active municipal disaster mitigations and rescue missions.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 bg-light p-3">
                    <button type="button" class="btn btn-secondary px-4 rounded-pill" data-bs-dismiss="modal">Close Details</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>



    <!-- Custom Homepage Script -->
    <script src="scripts/homepage.js?v=<?php echo time(); ?>"></script>

</body>
</html>
