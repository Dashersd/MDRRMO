<?php
define('SECURE_ACCESS', true);
require_once '../auth.php';

// Check if user is logged in and is admin
checkLogin();

if (getUserRole() !== 'admin') {
    header('Location: ../bdrrmo-dashboard.php');
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
    <title>Organization Chart | MDRRMO Information System</title>

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
          <span id="brandText">MDRRMO Admin</span>
        </div>
        <button class="sidebar-toggle" id="sidebarToggle">
          <i class="bi bi-list"></i>
        </button>
      </div>
      
      <div class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title" id="navTitle">Navigation</div>
          
          <a href="../admin-dashboard.php" class="nav-item">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-apps" data-unfilled="fi fi-rr-apps"></i>
            </div>
            <div class="nav-text">Dashboard</div>
          </a>
          
          <a href="organization-chart.php" class="nav-item active">
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
          
          <a href="activities.php" class="nav-item">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-calendar-check" data-unfilled="fi fi-rr-calendar-check"></i>
            </div>
            <div class="nav-text">Activities</div>
          </a>
          
          <a href="users.php" class="nav-item">
            <div class="nav-icon">
              <i data-filled="fi fi-sr-users" data-unfilled="fi fi-br-users"></i>
            </div>
            <div class="nav-text">Users</div>
            <div class="nav-badge primary" id="userCount">0</div>
          </a>
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
                <?php echo htmlspecialchars(getCurrentUser()); ?>
                <span class="badge bg-danger ms-1">Admin</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#adminProfileModal"><i class="bi bi-person me-2"></i>Profile Settings</a></li>
                <li><hr class="dropdown-divider"></li>
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
                <h1 class="h3 mb-1">Organization Chart</h1>
                <p class="text-muted mb-0">View and manage organizational structure</p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" id="btnRefresh">
                  <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
                <button class="btn btn-primary" id="btnAddPersonnel" data-bs-toggle="modal" data-bs-target="#addPersonnelModal">
                  <i class="bi bi-person-plus"></i> Add Personnel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Organization Chart Content -->
        <div class="row">
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white border-0">
                <h5 class="mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-diagram-3 text-primary"></i> Organizational Structure
                </h5>
              </div>
              <div class="card-body">
                <!-- Loading State -->
                <div id="orgChartLoading" class="text-center py-5" style="display: none;">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-3 text-muted">Loading organization chart...</p>
                </div>

                <!-- Empty State -->
                <div id="orgChartEmpty" class="text-center py-5">
                  <div class="mb-4">
                    <i class="bi bi-people fs-1 text-muted d-block mb-3"></i>
                    <h5 class="fw-semibold mb-2">No Personnel Added Yet</h5>
                    <p class="text-muted mb-4">Start building your organization chart by adding personnel members.</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addPersonnelModal">
                      <i class="bi bi-person-plus me-1"></i> Add First Personnel
                    </button>
                  </div>
                </div>

                <!-- Organization Chart Container -->
                <div id="orgChartContainer" style="display: none;">
                  <div id="orgChart" class="org-chart-wrapper"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="container pb-4 small text-center text-muted">
        <span class="d-inline-flex align-items-center gap-1">
          <i class="bi bi-info-circle"></i> MDRRMO Admin Dashboard - MDRRMO Information System
        </span>
      </footer>
    </div>

    <!-- Admin Profile Modal -->
    <div class="modal fade" id="adminProfileModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Admin Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form method="POST" action="users.php">
            <div class="modal-body">
              <input type="hidden" name="action" value="update_profile">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" name="username" value="<?php echo htmlspecialchars($_SESSION['user_data']['username'] ?? ''); ?>" required minlength="3" pattern="[a-zA-Z0-9_]+">
              </div>
              <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" name="full_name" value="<?php echo htmlspecialchars($_SESSION['user_data']['full_name'] ?? ''); ?>" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" name="email" value="<?php echo htmlspecialchars($_SESSION['user_data']['email'] ?? ''); ?>" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Organization</label>
                <input type="text" class="form-control" name="organization" value="<?php echo htmlspecialchars($_SESSION['user_data']['organization'] ?? ''); ?>" required>
              </div>
              <div class="mb-3">
                <label class="form-label">New Password</label>
                <div class="input-group">
                  <input type="password" class="form-control" name="password" id="orgchartProfilePassword" minlength="6" placeholder="Enter new password">
                  <button class="btn btn-outline-secondary" type="button" onclick="const p=document.getElementById('orgchartProfilePassword');const i=this.querySelector('i');if(p.type==='password'){p.type='text';i.classList.replace('bi-eye','bi-eye-slash');}else{p.type='password';i.classList.replace('bi-eye-slash','bi-eye');}">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
                <small class="text-muted">Minimum 6 characters. Leave blank to keep current password.</small>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Profile</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Bootstrap JS -->
    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
      crossorigin="anonymous"
    ></script>

    <!-- Add Personnel Modal -->
    <div class="modal fade" id="addPersonnelModal" tabindex="-1" aria-labelledby="addPersonnelModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0 bg-primary text-white">
            <h5 class="modal-title fw-bold" id="addPersonnelModalLabel">
              <i class="bi bi-person-plus me-2"></i>Add Personnel
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="addPersonnelForm">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label for="personnelName" class="form-label fw-semibold">Full Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="personnelName" required placeholder="Enter full name">
              </div>
              
              <div class="mb-3">
                <label for="personnelRole" class="form-label fw-semibold">Role/Position <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="personnelRole" required placeholder="e.g., CEO, Manager, Director">
              </div>
              
              <div class="mb-3">
                <label for="personnelPhoto" class="form-label fw-semibold">Profile Picture</label>
                <input type="file" class="form-control" id="personnelPhoto" accept="image/*">
                <small class="text-muted d-block mt-1">Upload a profile picture (optional). JPG, PNG, or GIF formats.</small>
                
                <!-- Photo Preview -->
                <div class="mt-3 text-center" id="photoPreviewContainer" style="display: none;">
                  <img id="photoPreview" src="" alt="Preview" class="img-thumbnail" style="max-width: 150px; max-height: 150px; border-radius: 50%; object-fit: cover;">
                  <div class="mt-2">
                    <button type="button" class="btn btn-sm btn-outline-danger" id="removePhoto">
                      <i class="bi bi-x-circle me-1"></i> Remove Photo
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <div class="form-check mb-2">
                  <input class="form-check-input" type="checkbox" id="isCEO">
                  <label class="form-check-label" for="isCEO">
                    <strong>Top-level executive (CEO/Boss)</strong>
                  </label>
                </div>
                <small class="text-muted d-block">Check this if this person is the top executive and doesn't report to anyone.</small>
              </div>
              
              <div class="mb-0" id="reportsToContainer">
                <label for="personnelReportsTo" class="form-label fw-semibold">Reports To</label>
                <select class="form-select" id="personnelReportsTo">
                  <option value="">Select supervisor...</option>
                </select>
                <small class="text-muted d-block mt-1">Select who this person reports to in the organization.</small>
              </div>
            </div>
            <div class="modal-footer border-0 bg-light d-flex justify-content-between">
              <button type="button" class="btn btn-danger d-none" id="btnDeletePersonnel">
                <i class="bi bi-trash me-1"></i> Delete
              </button>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-check-circle me-1"></i> Add Personnel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Personnel Modal -->
    <div class="modal fade" id="viewPersonnelModal" tabindex="-1" aria-labelledby="viewPersonnelModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0 bg-primary text-white">
            <h5 class="modal-title fw-bold" id="viewPersonnelModalLabel">
              <i class="bi bi-person-badge me-2"></i>Personnel Details
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-0 text-center">
            <div id="viewPersonnelImageContainer" class="bg-light p-4" style="border-bottom: 1px solid #dee2e6;">
              <!-- Image will be injected here -->
            </div>
            <div class="p-4 text-center">
              <h4 id="viewPersonnelName" class="fw-bold mb-1 text-dark"></h4>
              <p id="viewPersonnelRole" class="text-primary fw-semibold mb-3 fs-5"></p>
              <div id="viewPersonnelReportToContainer" class="d-flex justify-content-center align-items-center mb-2" style="display: none !important;">
                <span class="text-muted"><i class="bi bi-diagram-3 me-2"></i>Reports To:</span>
                <span id="viewPersonnelReportTo" class="ms-2 text-dark fw-medium"></span>
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
    <script src="../scripts/organization-chart.js?v=<?php echo urlencode((string) @filemtime(__DIR__ . '/../scripts/organization-chart.js')); ?>"></script>
    <style>
      /* Organization Chart Styles */
      .org-chart-wrapper {
        padding: 2rem 1rem;
        overflow-x: auto;
        overflow-y: visible;
        min-height: 400px;
      }

      .org-node {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        margin: 0 auto;
        padding: 0 0.35rem;
      }

      .org-node-card {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 0.75rem 0.5rem;
        min-width: 130px;
        max-width: 130px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        position: relative;
        z-index: 2;
      }

      .org-node-edit-btn {
        position: absolute;
        top: 0.3rem;
        right: 0.3rem;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        color: #495057;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .org-node-edit-btn:hover {
        background: #0d6efd;
        color: white;
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
      }

      .org-node-ceo .org-node-edit-btn {
        background: rgba(255, 255, 255, 0.25);
        color: white;
      }

      .org-node-ceo .org-node-edit-btn:hover {
        background: rgba(255, 255, 255, 0.4);
        transform: scale(1.1);
      }

      .org-node-edit-btn i {
        font-size: 0.7rem;
      }

      .org-node-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        border-color: #0d6efd;
      }

      .org-node-ceo {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        border-color: #dc3545;
        color: white;
        box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
      }

      .org-node-ceo:hover {
        box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
      }

      .org-node-photo-wrapper {
        width: 50px;
        height: 50px;
        margin: 0 auto 0.5rem auto;
        position: relative;
      }

      .org-node-photo {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        object-position: top;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .org-node-ceo .org-node-photo {
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .org-node-photo-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .org-node-ceo .org-node-photo-placeholder {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
      }

      .org-node-photo-placeholder i {
        font-size: 1.5rem;
        color: #6c757d;
      }

      .org-node-ceo .org-node-photo-placeholder i {
        color: rgba(255, 255, 255, 0.9);
      }

      .org-node-name {
        font-weight: 700;
        font-size: 0.8rem;
        margin-bottom: 0.2rem;
        text-align: center;
        line-height: 1.2;
      }

      .org-node-role {
        font-size: 0.65rem;
        opacity: 0.85;
        text-align: center;
        font-weight: 500;
        line-height: 1.2;
      }

      .org-node-ceo .org-node-name,
      .org-node-ceo .org-node-role {
        color: white;
      }

      .org-node[data-level="0"] .org-node-card {
        min-width: 150px;
        max-width: 150px;
        padding: 1rem 0.75rem;
      }

      .org-node[data-level="0"] .org-node-photo-wrapper {
        width: 65px;
        height: 65px;
      }

      .org-node[data-level="0"] .org-node-photo-placeholder i {
        font-size: 2rem;
      }

      .org-children {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        margin-top: 1.5rem;
        position: relative;
        padding-top: 1rem;
      }

      .org-children::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #dee2e6;
      }

      .org-children::after {
        content: '';
        position: absolute;
        top: -1.5rem;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 2.5rem;
        background: #dee2e6;
      }

      .org-child-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        flex: 1;
        padding-top: 1rem;
      }

      /* Vertical line going down from each child */
      .org-child-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 1rem;
        background: #dee2e6;
        z-index: 1;
      }

      /* Horizontal connector lines */
      /* First child: line from center to right edge */
      .org-child-wrapper:first-child:not(:only-child)::after {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        right: 0;
        height: 2px;
        background: #dee2e6;
        z-index: 1;
      }

      /* Last child (but not first): line from left edge to center */
      .org-child-wrapper:last-child:not(:first-child):not(:only-child)::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 50%;
        height: 2px;
        background: #dee2e6;
        z-index: 1;
      }

      /* Middle children: line from left edge to right edge (spans full width) */
      .org-child-wrapper:not(:first-child):not(:last-child)::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #dee2e6;
        z-index: 1;
      }

      /* Only child: no horizontal line */
      .org-child-wrapper:only-child::after {
        display: none;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .org-chart-wrapper {
          padding: 1rem 0.5rem;
        }

        .org-node-card {
          min-width: 160px;
          max-width: 180px;
          padding: 1rem 1.25rem;
        }

        .org-node-photo-wrapper {
          width: 60px;
          height: 60px;
          margin-bottom: 0.75rem;
        }

        .org-node-photo-placeholder i {
          font-size: 2rem;
        }

        .org-node-name {
          font-size: 1rem;
        }

        .org-node-role {
          font-size: 0.85rem;
        }

        .org-children {
          flex-direction: column;
          align-items: center;
        }

        .org-child-wrapper {
          width: 100%;
          margin-bottom: 1.5rem;
        }

        .org-child-wrapper::after,
        .org-child-wrapper::before {
          display: none;
        }

        .org-children::before {
          display: none;
        }
      }

      /* Modal improvements */
      #addPersonnelModal .modal-content {
        border-radius: 12px;
        overflow: hidden;
      }

      #addPersonnelModal .modal-header {
        padding: 1.5rem;
      }

      #addPersonnelModal .modal-body {
        padding: 1.5rem;
      }

      #addPersonnelModal .form-label {
        margin-bottom: 0.5rem;
        color: #495057;
      }

      #addPersonnelModal .form-control,
      #addPersonnelModal .form-select {
        border-radius: 8px;
        border: 1.5px solid #dee2e6;
        padding: 0.625rem 0.875rem;
        transition: all 0.2s ease;
      }

      #addPersonnelModal .form-control:focus,
      #addPersonnelModal .form-select:focus {
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
      }

      #addPersonnelModal .form-check-input {
        margin-top: 0.25rem;
      }

      #addPersonnelModal .form-check-label {
        margin-left: 0.5rem;
        cursor: pointer;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .spinning {
        animation: spin 1s linear;
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
      });
    </script>
  </body>
</html>
