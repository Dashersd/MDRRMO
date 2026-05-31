<?php
define('SECURE_ACCESS', true);
require_once '../auth.php';

// Check if user is logged in
checkLogin();

if (getUserRole() === 'admin') {
    header('Location: ../admin-dashboard.php');
    exit();
}

// Handle logout
if (isset($_GET['logout'])) {
    logout();
}
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Activities | MDRRMO Incident Reporting</title>

    <!-- Tab Icon / Favicon -->
    <link rel="icon" type="image/png" href="../assets/icon.png" />
    <link rel="shortcut icon" type="image/png" href="../assets/icon.png" />

    <!-- Bootstrap CSS -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
      crossorigin="anonymous"
    />

    <!-- Bootstrap Icons -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
    />

    <link rel="stylesheet" href="../styles/dashboard.css" />
    <!-- Flaticon UIcons -->
    <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css'>
    <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/3.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css'>
    <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/3.0.0/uicons-bold-rounded/css/uicons-bold-rounded.css'>
    <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/3.0.0/uicons-regular-straight/css/uicons-regular-straight.css'>
  </head>
  <body>
    <!-- Sidebar Overlay for Mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <img src="../assets/icon.png" alt="MDRRMO Logo" style="max-width: 32px; height: auto; margin-right: 0.5rem;" />
          <span id="brandText">BDRRMO STAFF</span>
        </div>
        <button class="sidebar-toggle" id="sidebarToggle">
          <i class="bi bi-list"></i>
        </button>
      </div>
      
      <div class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title" id="navTitle">Navigation</div>
          
          <a href="../bdrrmo-dashboard.php" class="nav-item">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-apps" data-unfilled="fi fi-rr-apps"></i>
            </div>
            <div class="nav-text">Dashboard</div>
          </a>
          
          <a href="organization-chart.php" class="nav-item">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-sitemap" data-unfilled="fi fi-rr-sitemap"></i>
            </div>
            <div class="nav-text">Organization Chart</div>
          </a>
          
          <a href="incidents.php" class="nav-item" id="incidentsLink">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-light-emergency-on" data-unfilled="fi fi-rr-light-emergency-on"></i>
            </div>
            <div class="nav-text">Incidents</div>
            <div class="nav-badge warning" id="incidentCount">0</div>
          </a>
          
          <a href="equipment.php" class="nav-item">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-box" data-unfilled="fi fi-rr-box"></i>
            </div>
            <div class="nav-text">Equipment</div>
          </a>
          
          <a href="activities.php" class="nav-item active">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-calendar-check" data-unfilled="fi fi-rr-calendar-check"></i>
            </div>
            <div class="nav-text">Activities</div>
          </a>
        </div>
      </div>
      
      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <div class="sidebar-footer-title">
          <i class="bi bi-telephone-fill"></i>
          <span>Contact Us</span>
        </div>
        
        <button type="button" class="sidebar-footer-item" id="copyHotlineBtn" data-hotline="09300488682">
          <i class="bi bi-telephone" id="hotlineIcon"></i>
          <div class="sidebar-footer-item-text">
            <div class="sidebar-footer-item-label">Hotline</div>
            <div class="sidebar-footer-item-value" id="hotlineValue">0930 048 8682</div>
          </div>
        </button>
        
        <a href="https://www.facebook.com/lapuyan.mdrrmo" target="_blank" rel="noopener noreferrer" class="sidebar-footer-item">
          <i class="bi bi-facebook"></i>
          <div class="sidebar-footer-item-text">
            <div class="sidebar-footer-item-label">Follow Us</div>
            <div class="sidebar-footer-item-value">Facebook</div>
          </div>
        </a>
        
        <div class="sidebar-footer-divider"></div>
        
        <div class="sidebar-footer-item" style="cursor: default; pointer-events: none;">
          <i class="bi bi-info-circle"></i>
          <div class="sidebar-footer-item-text">
            <div class="sidebar-footer-item-label">Need Help?</div>
            <div class="sidebar-footer-item-value">Contact Support</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content" id="mainContent">
      <!-- Top Navigation -->
      <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div class="container-fluid">
          <button class="btn btn-link d-lg-none" id="mobileMenuToggle">
            <i class="bi bi-list fs-4"></i>
          </button>
          
          <div class="navbar-nav ms-auto">
            <div class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" aria-expanded="false">
                <i class="bi bi-person-circle me-1"></i>
                <span class="badge bg-primary ms-1">BDRRMO STAFF</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="../logout.php"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <main class="container-fluid py-4">
        <!-- Page Header -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h1 class="h3 mb-1 fw-bold">Activities</h1>
                <p class="text-muted mb-0">View system activities and logs</p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" id="btnRefresh">
                  <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Activities Content -->
        <div class="row">
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white border-0">
                <h5 class="mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-calendar-check text-primary"></i> Activity Log
                </h5>
              </div>
              <div class="card-body">
                <!-- Loading State -->
                <div id="activitiesLoading" class="text-center py-5" style="display: none;">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-3 text-muted">Loading activities...</p>
                </div>

                <!-- Empty State -->
                <div id="activitiesEmpty" class="text-center py-5">
                  <div class="mb-4">
                    <i class="bi bi-calendar-event fs-1 text-muted d-block mb-3"></i>
                    <h5 class="fw-semibold mb-2">No Activities Available</h5>
                    <p class="text-muted mb-4">No activities have been logged yet.</p>
                  </div>
                </div>

                <!-- Activities List -->
                <div id="activitiesList" class="activities-list" style="display: none;"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="container pb-4 small text-center text-muted">
        <span class="d-inline-flex align-items-center gap-1">
          <i class="bi bi-info-circle"></i> BDRRMO Staff Dashboard - MDRRMO Information System
        </span>
      </footer>
    </div>

    <!-- Bootstrap JS -->
    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
      crossorigin="anonymous"
    ></script>

    <!-- Image Gallery Modal -->
    <div class="modal fade" id="imageGalleryModal" tabindex="-1" aria-labelledby="imageGalleryModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content border-0 shadow-lg bg-dark overflow-hidden">
          <div class="modal-header border-0 bg-dark">
            <h5 class="modal-title text-white fw-bold" id="imageGalleryModalLabel">
              <i class="bi bi-info-circle me-2"></i>Activity Details
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-0 d-flex flex-column flex-lg-row">
            <!-- Left side: Carousel -->
            <div class="flex-grow-1 position-relative" style="min-height: 400px; background: #000;">
              <div id="galleryCarousel" class="carousel slide h-100" data-bs-ride="carousel">
                <div class="carousel-inner h-100 d-flex align-items-center" id="galleryCarouselInner"></div>
                <button class="carousel-control-prev" type="button" data-bs-target="#galleryCarousel" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#galleryCarousel" data-bs-slide="next">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Next</span>
                </button>
              </div>
              <div class="position-absolute bottom-0 w-100 p-2 text-white text-center" style="background: rgba(0,0,0,0.5);">
                <span id="galleryImageCounter">1 / 1</span>
              </div>
            </div>
            
            <!-- Right side: Info -->
            <div class="bg-light text-dark p-4" style="width: 100%; max-width: 400px; overflow-y: auto;">
              <h4 id="galleryActivityTitle" class="fw-bold mb-2"></h4>
              <p id="galleryActivityDate" class="text-muted small mb-4"></p>
              
              <h6 class="fw-bold text-uppercase text-muted mb-2" style="font-size: 0.8rem;">Description</h6>
              <p id="galleryActivityDesc" class="mb-0 text-secondary" style="white-space: pre-wrap; font-size: 0.95rem;"></p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="../scripts/sidebar-counts.js?v=<?php echo urlencode((string) @filemtime(__DIR__ . '/../scripts/sidebar-counts.js')); ?>"></script>
    <script src="../scripts/dashboard.js?v=<?php echo urlencode((string) @filemtime(__DIR__ . '/../scripts/dashboard.js')); ?>"></script>
    <script src="../scripts/activities.js?v=<?php echo urlencode((string) @filemtime(__DIR__ . '/../scripts/activities.js')); ?>"></script>
    <style>
      .activities-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: clamp(12px, 2vw, 18px);
        padding: clamp(0.25rem, 1vw, 0.75rem);
        align-items: stretch;
      }

      .activity-card-square {
        position: relative;
        width: 100%;
        min-height: 200px;
        background: white;
        border-radius: clamp(8px, 1.5vw, 12px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        overflow: visible;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: row;
        cursor: pointer;
        max-width: 480px;
        box-sizing: border-box;
        align-items: stretch;
      }

      .activity-card-square.hover-lift:hover {
        transform: translateY(clamp(-4px, -1vw, -8px));
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
      }

      .activity-card-image-wrapper {
        position: relative;
        flex: 0 0 clamp(35%, 40%, 45%);
        max-width: 45%;
        min-width: 120px;
        min-height: 180px;
        height: auto;
        align-self: stretch;
        overflow: hidden;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        flex-shrink: 0;
      }

      .activity-card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .activity-card-square:hover .activity-card-image {
        transform: scale(1.1);
      }

      .activity-card-image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }

      .activity-card-image-placeholder i {
        font-size: clamp(2rem, 8vw, 3rem);
        color: #adb5bd;
      }

      .activity-card-status-overlay {
        position: absolute;
        top: clamp(4px, 1vw, 8px);
        right: clamp(4px, 1vw, 8px);
        z-index: 2;
      }

      .activity-status-badge {
        font-size: clamp(0.6rem, 1.5vw, 0.7rem);
        padding: clamp(0.25rem, 0.8vw, 0.35rem) clamp(0.4rem, 1.2vw, 0.6rem);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
      }

      .activity-card-type-overlay {
        position: absolute;
        bottom: clamp(4px, 1vw, 8px);
        left: clamp(4px, 1vw, 8px);
        z-index: 2;
      }

      .activity-type-icon {
        width: clamp(32px, 8vw, 40px);
        height: clamp(32px, 8vw, 40px);
        border-radius: clamp(8px, 2vw, 10px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: clamp(1rem, 3vw, 1.2rem);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        background: linear-gradient(135deg, #0d6efd, #0b5ed7);
      }

      .activity-card-content {
        flex: 1 1 0;
        min-width: 0;
        padding: clamp(8px, 2vw, 14px);
        display: flex;
        flex-direction: column;
        gap: clamp(6px, 1.5vw, 10px);
        background: white;
        min-height: 0;
        position: relative;
        max-width: 100%;
        box-sizing: border-box;
        justify-content: space-between;
        height: auto;
        flex-grow: 1;
      }

      .activity-card-header {
        margin-bottom: clamp(4px, 1.5vw, 8px);
        flex-shrink: 0;
        flex-grow: 0;
      }

      .activity-card-title {
        font-size: clamp(0.8rem, 2.2vw, 0.9rem);
        font-weight: 700;
        color: #212529;
        margin: 0;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .activity-card-time {
        font-size: clamp(0.65rem, 1.8vw, 0.7rem);
        color: #6c757d;
        font-weight: 500;
      }

      .activity-card-description {
        font-size: clamp(0.7rem, 1.9vw, 0.75rem);
        color: #495057;
        margin: 0 0 clamp(8px, 2vw, 10px) 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        flex: 0 1 auto;
        min-height: clamp(3rem, 8vw, 3.5rem);
        max-height: clamp(3rem, 8vw, 3.5rem);
        flex-grow: 0;
      }

      .activity-card-meta {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: clamp(8px, 2vw, 12px);
        margin-bottom: clamp(8px, 2vw, 10px);
        padding-top: clamp(6px, 1.5vw, 8px);
        border-top: 1px solid #e9ecef;
        flex-shrink: 0;
        flex-grow: 0;
        align-items: center;
      }

      .activity-meta-item {
        display: flex;
        align-items: center;
        gap: clamp(4px, 1.5vw, 6px);
        font-size: clamp(0.65rem, 1.8vw, 0.7rem);
        color: #6c757d;
      }

      .activity-meta-item i {
        font-size: clamp(0.7rem, 1.9vw, 0.75rem);
        width: clamp(12px, 3.5vw, 14px);
        flex-shrink: 0;
      }

      .activity-card-actions {
        display: flex !important;
        gap: clamp(6px, 1.5vw, 10px);
        margin-top: auto;
        padding-top: clamp(8px, 1.5vw, 12px);
        border-top: 1px solid #f1f3f5;
        flex-shrink: 0;
        flex-grow: 0;
        min-height: clamp(40px, 10vw, 50px);
        align-items: stretch;
        justify-content: flex-start;
        flex-wrap: nowrap;
        width: 100%;
        max-width: 100%;
        overflow: visible;
        position: relative;
        visibility: visible !important;
        opacity: 1 !important;
        box-sizing: border-box;
      }

      .activity-action-btn {
        flex: 1 1 0;
        min-width: 0;
        max-width: none;
        padding: clamp(0.4rem, 1vw, 0.55rem) clamp(0.5rem, 1.2vw, 0.8rem);
        font-size: clamp(0.65rem, 1.7vw, 0.75rem);
        border-radius: clamp(4px, 1.5vw, 6px);
        transition: all 0.2s ease;
        display: flex !important;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-sizing: border-box;
        visibility: visible !important;
        opacity: 1 !important;
      }

      .activity-action-btn:hover {
        transform: translateY(-1px);
      }

      .activity-action-btn:active {
        transform: translateY(0);
      }

      .activity-action-btn i {
        font-size: clamp(0.7rem, 1.9vw, 0.85rem);
        flex-shrink: 0;
        display: inline-block;
      }

      @media (max-width: 575.98px) {
        .activities-list {
          grid-template-columns: 1fr;
          gap: clamp(10px, 3vw, 14px);
        }

        .activity-card-square {
          min-height: 250px;
          flex-direction: column;
        }

        .activity-card-image-wrapper {
          flex: 0 0 auto;
          max-width: 100%;
          min-height: 120px;
          max-height: 200px;
        }

        .activity-card-content {
          flex: 1 1 auto;
          min-width: 0;
          width: 100%;
          padding: clamp(8px, 2vw, 10px);
          overflow: visible;
          height: auto;
        }

        .activity-card-description {
          min-height: 2.5rem;
          max-height: 2.5rem;
          -webkit-line-clamp: 2;
          margin-bottom: 6px;
        }

        .activity-card-meta {
          flex-direction: column;
          gap: 4px;
          margin-bottom: 6px;
          padding-top: 6px;
        }

        .activity-card-actions {
          gap: clamp(6px, 1.5vw, 8px);
          min-height: 40px;
          flex-wrap: nowrap;
          padding-top: 6px;
          width: 100%;
          max-width: 100%;
        }

        .activity-action-btn {
          padding: 0.4rem 0.5rem;
          flex: 1 1 0 !important;
          min-width: 0 !important;
          max-width: none !important;
          font-size: 0.65rem;
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .activity-action-btn i {
          font-size: 0.75rem;
        }
      }

      @media (min-width: 576px) and (max-width: 767.98px) {
        .activities-list {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .activity-card-square {
          min-height: 220px;
        }

        .activity-card-image-wrapper {
          flex: 0 0 38%;
          max-width: 40%;
          min-height: 180px;
        }

        .activity-card-content {
          flex: 1 1 auto;
          min-width: 0;
          padding: clamp(8px, 2vw, 12px);
          height: auto;
        }

        .activity-card-description {
          min-height: 3rem;
          max-height: 3rem;
        }

        .activity-card-actions {
          gap: clamp(6px, 1.5vw, 8px);
          flex-wrap: nowrap;
        }

        .activity-action-btn {
          flex: 1 1 0 !important;
          min-width: 0 !important;
          max-width: none !important;
          padding: 0.4rem 0.5rem;
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }

      /* Image Preview in Modal */
      .image-preview-item {
        position: relative;
        width: 100px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid #dee2e6;
        cursor: pointer;
      }

      .image-preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-preview-remove {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(220, 53, 69, 0.9);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.2s ease;
      }

      .image-preview-remove:hover {
        background: #dc3545;
        transform: scale(1.1);
      }

      /* Gallery Carousel */
      #galleryCarousel .carousel-item img {
        max-height: 70vh;
        width: auto;
        margin: 0 auto;
        object-fit: contain;
      }

      #galleryCarousel .carousel-control-prev,
      #galleryCarousel .carousel-control-next {
        width: 50px;
        height: 50px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        opacity: 0.7;
      }

      #galleryCarousel .carousel-control-prev:hover,
      #galleryCarousel .carousel-control-next:hover {
        opacity: 1;
      }

      #galleryCarousel .carousel-control-prev {
        left: 20px;
      }

      #galleryCarousel .carousel-control-next {
        right: 20px;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .spinning {
        animation: spin 1s linear;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .activity-images-gallery {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
        }
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
          const icon = item.querySelector('.nav-icon i');
          if (!icon) return;
          const filled = icon.getAttribute('data-filled');
          const unfilled = icon.getAttribute('data-unfilled');
          if (!filled || !unfilled) return;
          icon.className = item.classList.contains('active') ? filled : unfilled;
        });
        
        // Copy hotline to clipboard
        const copyHotlineBtn = document.getElementById('copyHotlineBtn');
        if (copyHotlineBtn) {
          copyHotlineBtn.addEventListener('click', function() {
            const hotline = this.getAttribute('data-hotline');
            const hotlineValue = document.getElementById('hotlineValue');
            const hotlineIcon = document.getElementById('hotlineIcon');
            
            // Copy to clipboard
            navigator.clipboard.writeText(hotline).then(function() {
              // Visual feedback
              const originalText = hotlineValue.textContent;
              const originalIcon = hotlineIcon.className;
              
              hotlineValue.textContent = 'Copied!';
              hotlineIcon.className = 'bi bi-check-circle-fill';
              copyHotlineBtn.style.color = '#198754';
              
              setTimeout(function() {
                hotlineValue.textContent = originalText;
                hotlineIcon.className = originalIcon;
                copyHotlineBtn.style.color = '';
              }, 2000);
            }).catch(function(err) {
              console.error('Failed to copy: ', err);
              // Fallback for older browsers
              const textArea = document.createElement('textarea');
              textArea.value = hotline;
              textArea.style.position = 'fixed';
              textArea.style.opacity = '0';
              document.body.appendChild(textArea);
              textArea.select();
              try {
                document.execCommand('copy');
                const hotlineValue = document.getElementById('hotlineValue');
                const hotlineIcon = document.getElementById('hotlineIcon');
                const originalText = hotlineValue.textContent;
                const originalIcon = hotlineIcon.className;
                
                hotlineValue.textContent = 'Copied!';
                hotlineIcon.className = 'bi bi-check-circle-fill';
                copyHotlineBtn.style.color = '#198754';
                
                setTimeout(function() {
                  hotlineValue.textContent = originalText;
                  hotlineIcon.className = originalIcon;
                  copyHotlineBtn.style.color = '';
                }, 2000);
              } catch (err) {
                console.error('Fallback copy failed: ', err);
              }
              document.body.removeChild(textArea);
            });
          });
        }
      });
    </script>
  </body>
</html>

