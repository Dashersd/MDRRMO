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
    <title>Equipment Inventory | MDRRMO Information System</title>

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
          

          <a href="incidents.php" class="nav-item" id="incidentsLink">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-light-emergency-on" data-unfilled="fi fi-rr-light-emergency-on"></i>
            </div>
            <div class="nav-text">Incidents</div>
            <div class="nav-badge warning" id="incidentCount">0</div>
          </a>
          
          <a href="equipment.php" class="nav-item active">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-box" data-unfilled="fi fi-rr-box"></i>
            </div>
            <div class="nav-text">Equipment</div>
          </a>
          
          <a href="activities.php" class="nav-item">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-calendar-check" data-unfilled="fi fi-rr-calendar-check"></i>
            </div>
            <div class="nav-text">Activities</div>
          </a>
        </div>
      </div>
      
    </div>
    
    <!-- Main Content -->
    <div class="main-content" id="mainContent">
      <!-- Top Navigation -->
      <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm position-relative">
        <div class="container-fluid">
          <button class="btn btn-link d-lg-none" id="mobileMenuToggle">
            <i class="bi bi-list fs-4"></i>
          </button>
          
          <!-- Centered Title -->
          <div class="position-absolute start-50 translate-middle-x d-none d-lg-block">
            <span class="navbar-text welcome-text fw-bold" style="font-size: 1.1rem; color: #dc3545;">
              MDRRMO LAPUYAN
            </span>
          </div>
          
          <!-- Mobile Title -->
          <div class="d-lg-none mx-auto">
            <span class="navbar-text welcome-text fw-bold" style="font-size: 1rem; color: #dc3545;">
              MDRRMO LAPUYAN
            </span>
          </div>
          
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
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 class="h3 mb-1 fw-bold">Equipment Inventory</h1>
                <p class="text-muted mb-0">View active equipment and search resources</p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" id="btnRefresh">
                  <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="row mb-4">
          <!-- Total Equipment Types -->
          <div class="col-xl-6 col-md-6 mb-4">
            <div class="card border-0 shadow-sm h-100 stats-card hover-lift">
              <div class="card-body p-4">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <div class="stats-icon-wrapper bg-primary bg-opacity-10">
                    <i class="bi bi-tools text-primary fs-3"></i>
                  </div>
                  <div class="text-end">
                    <div class="text-muted small text-uppercase fw-semibold mb-1">Equipment Types</div>
                    <h2 class="mb-0 fw-bold" id="totalEquipmentTypes">0</h2>
                  </div>
                </div>
                <div class="mt-2">
                  <small class="text-muted">
                    <i class="bi bi-list-ul me-1"></i>
                    Different equipment categories
                  </small>
                </div>
              </div>
            </div>
          </div>

          <!-- Overall Total Equipment -->
          <div class="col-xl-6 col-md-6 mb-4">
            <div class="card border-0 shadow-sm h-100 stats-card hover-lift">
              <div class="card-body p-4">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <div class="stats-icon-wrapper bg-success bg-opacity-10">
                    <i class="bi bi-box-seam text-success fs-3"></i>
                  </div>
                  <div class="text-end">
                    <div class="text-muted small text-uppercase fw-semibold mb-1">Total Available Items</div>
                    <h2 class="mb-0 fw-bold" id="totalEquipmentCount">0</h2>
                  </div>
                </div>
                <div class="mt-2">
                  <small class="text-muted">
                    <i class="bi bi-calculator me-1"></i>
                    Total items in active inventory
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment Controls & Content -->
        <div class="row">
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white border-0 pt-4">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <h5 class="mb-0 d-flex align-items-center gap-2 fw-bold text-dark">
                    <i class="bi bi-tools text-primary"></i> Resource Directory
                  </h5>
                  <!-- Search controls -->
                  <div class="d-flex gap-2 flex-wrap flex-grow-1 flex-md-grow-0">
                    <div class="input-group search-input-group">
                      <span class="input-group-text bg-white border-end-0">
                        <i class="bi bi-search text-muted"></i>
                      </span>
                      <input type="text" id="searchEquipment" class="form-control border-start-0" placeholder="Search equipment...">
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <!-- Loading State -->
                <div id="equipmentLoading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-3 text-muted">Loading active inventory...</p>
                </div>

                <!-- Empty State -->
                <div id="equipmentEmpty" class="text-center py-5" style="display: none;">
                  <div class="mb-4">
                    <i class="bi bi-toolbox fs-1 text-muted d-block mb-3"></i>
                    <h5 class="fw-semibold mb-2">No Equipment Found</h5>
                    <p class="text-muted mb-0">No equipment items are currently matching your filters.</p>
                  </div>
                </div>

                <!-- Equipment Grid -->
                <div id="equipmentGrid" class="equipment-grid" style="display: none;"></div>
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

    <!-- View Equipment Modal -->
    <div class="modal fade" id="viewEquipmentModal" tabindex="-1" aria-labelledby="viewEquipmentModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0 bg-primary text-white">
            <h5 class="modal-title fw-bold" id="viewEquipmentModalLabel">
              <i class="bi bi-info-circle me-2"></i>Resource Details
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-0 text-center">
            <div id="viewEquipmentImageContainer" class="bg-light p-3" style="border-bottom: 1px solid #dee2e6;">
              <!-- Image will be injected here -->
            </div>
            <div class="p-4 text-start">
              <h4 id="viewEquipmentName" class="fw-bold mb-3 text-dark"></h4>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted"><i class="bi bi-boxes me-2"></i>Total Available Quantity:</span>
                <span id="viewEquipmentCount" class="badge bg-primary fs-6 rounded-pill"></span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted"><i class="bi bi-clock-history me-2"></i>Registered On:</span>
                <span id="viewEquipmentDate" class="text-dark fw-semibold"></span>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <script src="../scripts/sidebar-counts.js?v=<?php echo urlencode((string) @filemtime(__DIR__ . '/../scripts/sidebar-counts.js')); ?>"></script>
    <script src="../scripts/dashboard.js?v=<?php echo urlencode((string) @filemtime(__DIR__ . '/../scripts/dashboard.js')); ?>"></script>
    <script src="../scripts/bdrrmo-equipment.js?v=<?php echo urlencode((string) @filemtime(__DIR__ . '/../scripts/bdrrmo-equipment.js')); ?>"></script>
    <style>
      /* Stats Card Styles */
      .stats-card {
        transition: all 0.3s ease;
        border-left: 4px solid transparent;
      }
      
      .stats-card.hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
      }
      
      .stats-icon-wrapper {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      
      .stats-card:hover .stats-icon-wrapper {
        transform: scale(1.1);
      }

      /* Control Inputs */
      .search-input-group {
        max-width: 250px;
      }
      .search-input-group .form-control:focus {
        border-color: #ced4da;
        box-shadow: none;
      }
      .equipment-sort-select {
        width: auto;
        min-width: 200px;
      }

      /* Equipment Grid Styles */
      .equipment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.25rem;
        padding: 1rem 0;
      }

      .equipment-card {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        cursor: pointer;
      }

      .equipment-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(13, 110, 253, 0.15);
        border-color: #0d6efd;
      }

      .equipment-card-image {
        width: 100%;
        height: 140px;
        object-fit: cover;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }

      .equipment-card-placeholder {
        width: 100%;
        height: 140px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .equipment-card-placeholder i {
        font-size: 2.5rem;
        color: #adb5bd;
      }

      .equipment-card-body {
        padding: 1rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .equipment-card-title {
        font-weight: 700;
        font-size: 0.95rem;
        color: #212529;
        margin-bottom: 0.75rem;
        line-height: 1.3;
      }

      .equipment-card-count {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.85rem;
        background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
        color: white;
        border-radius: 18px;
        font-weight: 600;
        font-size: 0.85rem;
        width: fit-content;
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
        .search-input-group,
        .equipment-sort-select {
          max-width: 100%;
          width: 100%;
        }

        .equipment-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        .equipment-card-image,
        .equipment-card-placeholder {
          height: 120px;
        }

        .equipment-card-placeholder i {
          font-size: 2rem;
        }

        .equipment-card-body {
          padding: 0.85rem;
        }

        .equipment-card-title {
          font-size: 0.9rem;
        }

        .equipment-card-count {
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
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
            
            navigator.clipboard.writeText(hotline).then(function() {
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
            });
          });
        }
      });
    </script>
  </body>
</html>
