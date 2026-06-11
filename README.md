# MDRRMO Geotagged Incident Reporting System

A premium, responsive, state-of-the-art web-based portal for the **Municipal Disaster Risk Reduction and Management Office (MDRRMO) Lapuyan**. The system serves as a public safety hub and an administrative geotagged incident management platform.

---

## 🌟 Core Features

### 1. Premium Public Homepage (`index.php`)
A 100% pure public safety information board tailored for citizens.
- **Zero Portal Distractions:** All dashboard access, login, and portal buttons have been removed from the public page to ensure a clean public bulletin board.
- **Dynamic Threat Alert Engine:** Automatically evaluates the highest threat severity in the active dispatches from the database. It pulses in Green (Normal), Yellow (Active Monitoring/Yellow Alert), Orange (High Severity), or Red (Critical Red Alert) with localized safety notices.
- **Dynamic Weather & Clock:** A high-end real-time digital clock coupled with interactive weather telemetry widgets.
- **Official Roster Directory:** Displays active responders and leadership, updated in real time. It features customized profile dimensions ensuring full face visibility (no cropping).
- **No Map on Homepage:** To ensure a clean, modern, and high-performance user experience, there is no map on the public homepage. Public emergency dispatches are displayed in a clean, responsive three-column card grid featuring geotagged locations, status indicators, and modal popups.
- **High-Fidelity Detail Modals:** Clicking any personnel or incident card launches a details overlay. Media files inside the modal utilize containment wrappers to prevent image cropping.
- **Click-to-Copy Directory:** A beautiful directory of emergency contact hotlines with clipboard-copy indicators.

### 2. Multi-Role Secured Dashboards
Admin and BDRRMO staff operations are fully isolated behind standard authentication interfaces:
- **Admin Dashboard (`admin-dashboard.php`):** Full administration suite to approve or decline incident reports submitted by BDRRMO staff, dispatch responders, manage user accounts, update rosters, and log real-time geotagged emergency events. Admin can download full PDF incident reports.
- **BDRRMO Staff Dashboard (`bdrrmo-dashboard.php`):** Interactive reporting hub for registered staff to submit geotagged incident requests with photo uploads. Staff can view the status of their submitted reports (Approved/Declined). The Active Users card has been removed from the BDRRMO dashboard — user management is an Admin-only concern.
- **Interactive Maps (Internal):** Leaflet maps are kept inside secure panels for precise dispatch coordinates and incident plot rendering.

### 3. Incident Approval Workflow
BDRRMO staff submit incident reports which are queued for Admin review:
- **BDRRMO** submits an incident → appears in Admin's pending queue.
- **Admin** reviews and selects **Approve** or **Decline**.
- BDRRMO staff sees the updated status (Approved / Declined) on their Incidents page.
- Incident view modals use a **wide (`modal-lg`) layout** with full-size photo display (380px) across both Admin and BDRRMO views for a comfortable reading experience.

### 4. Admin-Controlled Account Management
- **Self-registration (`signup.php`) is disabled.** Visiting the URL automatically redirects to the login page.
- All BDRRMO staff accounts are created exclusively by the **Admin** via the User Management panel (`admin/users.php`).
- The "Sign up here" link has been removed from the login page.

---

## 🔐 Authentication & Roles

| Role | Default Username | Default Password |
|---|---|---|
| Admin | `admin` | `mdrrmo2024` |
| BDRRMO Staff | `client` | `client2024` |

- **Security Protocols:** Session-based validation, automatic unauthenticated page guards, and secure password hashing using PHP's `password_hash()`.
- **Account Creation:** Admin-only via `admin/users.php`. Public self-registration is disabled.

---

## 📂 File Structure

```text
├── index.php                          # Pure public landing portal / information board
├── login.php                          # Secured dashboard portal entrance
├── logout.php                         # Session destruction and redirect handler
├── signup.php                         # DISABLED — redirects to login.php (admin manages accounts)
├── incidents.php                      # Public-facing incident view page
├── admin-dashboard.php                # Core Admin operation center
├── bdrrmo-dashboard.php               # Secured BDRRMO Staff reporting portal
├── auth.php                           # Session-based authentication helper library
├── config.php                         # Global database connection and configuration file
├── create-admin.php                   # One-time admin account creation utility
├── debug-admin.php                    # Admin session/auth debugging utility
├── mdrrmo_information_system.sql      # Full database dump / backup
├── .env                               # Environment variables (DB credentials, ports)
├── .htaccess                          # Apache rewrite rules and access control
├── xampp-setup.md                     # Walkthrough detailing local Apache/MariaDB setup
│
├── api/
│   ├── public-data.php                # Secure public reader GET endpoint
│   ├── incidents.php                  # Core incident creation & modification API
│   ├── organization-personnel.php     # Organizational chart responder API
│   ├── activities.php                 # Activities & drills data API
│   ├── equipment.php                  # Equipment inventory data API
│   └── dashboard-stats.php            # Dashboard summary statistics API
│
├── admin/
│   ├── incidents.php                  # Admin incidents management & approval page
│   ├── organization-chart.php         # Admin organization & roster chart page
│   ├── equipment.php                  # Admin equipment inventory page
│   ├── activities.php                 # Admin activity & drill logs page
│   └── users.php                      # Admin user management panel (create/edit/delete accounts)
│
├── bdrrmo/
│   ├── incidents.php                  # Staff incident submission & status view page
│   └── activities.php                 # Staff activities & drills page
│
├── db/
│   ├── db_setup.php                   # Automated schema, tables & user migration script
│   └── db_connect.php                 # Database connection bootstrap
│
├── assets/
│   └── icon.png                       # Official brand identity logo
│
├── scripts/
│   ├── homepage.js                    # Clock, detail modals, copy logic, and roster engines
│   ├── login.js                       # Login form handling
│   ├── signup.js                      # Signup form handling (kept but page is disabled)
│   ├── dashboard.js                   # Legacy dashboard layout scripts
│   ├── admin-dashboard.js             # Admin dashboard logic & wide incident view modal
│   ├── admin-incidents.js             # Admin incidents management, approval, and PDF download
│   ├── bdrrmo-dashboard.js            # BDRRMO staff dashboard logic & wide incident view modal
│   ├── bdrrmo-incidents.js            # BDRRMO staff incident submission & status view logic
│   ├── incidents.js                   # Public incidents view logic
│   ├── add-incident-modal.js          # Reusable upload-incident modal component
│   ├── organization-chart.js          # Organization chart shared logic
│   ├── activities.js                  # Activities page logic
│   ├── equipment.js                   # Equipment inventory logic
│   ├── users.js                       # User management logic
│   └── sidebar-counts.js              # Sidebar notification badge counts
│
└── styles/
    ├── homepage.css                   # Custom styling for public interface
    ├── dashboard.css                  # Administrative panel styling tokens
    ├── incidents.css                  # Incidents page styles
    ├── login.css                      # Login page styles
    └── signup.css                     # Signup page styles
```

---

## 🚀 Setup & Local Deployment

### 1. Requirements
* Windows OS with XAMPP (Apache + MariaDB/MySQL).
* PHP 8.0 or higher.

### 2. Installation Steps
1. **Link or Place the Folder:** Create a junction link so Apache can serve the project. Run the following command in **Command Prompt as Administrator**:
   ```cmd
   mklink /J "C:\xampp\htdocs\MDRRMO" "C:\Users\NITRO V15\OneDrive\Documents\MDRRMO Information System"
   ```
2. **Start Services:** Start **Apache** and **MySQL** from your XAMPP Control Panel.
3. **Configure Environment:** Open the `.env` file in the project root and verify the database credentials match your local setup (defaults: `DB_HOST=127.0.0.1`, `DB_USERNAME=root`, `DB_PASSWORD=` *(empty)*, `DB_DATABASE=mdrrmo_information_system`).
4. **Initialize Database:** Visit **[http://localhost/MDRRMO/db/db_setup.php](http://localhost/MDRRMO/db/db_setup.php)** to automatically create the schema, tables, and seed default users.
5. **Create Admin Account *(if needed)*:** If the admin user was not seeded, visit **[http://localhost/MDRRMO/create-admin.php](http://localhost/MDRRMO/create-admin.php)** once to create it, then delete or restrict access to that file.

---

## 🌐 Local Access Portals

Use the links below to access the different parts of the system when running locally on XAMPP:

### Public Gateways
* **Official Homepage (Citizen Info Board):** [http://localhost/MDRRMO/index.php](http://localhost/MDRRMO/index.php)
* **Secure Login Entrance:** [http://localhost/MDRRMO/login.php](http://localhost/MDRRMO/login.php)

> ⚠️ **Registration is disabled.** All BDRRMO staff accounts are created by the Admin via the [User Management Panel](http://localhost/MDRRMO/admin/users.php).

### Secured Dashboards (Requires Session)
* **Admin Command Center:** [http://localhost/MDRRMO/admin-dashboard.php](http://localhost/MDRRMO/admin-dashboard.php)
* **BDRRMO Staff Dashboard:** [http://localhost/MDRRMO/bdrrmo-dashboard.php](http://localhost/MDRRMO/bdrrmo-dashboard.php)

### Administrative Panel Suite (`admin/`)
* **Incidents Manager & Approval:** [http://localhost/MDRRMO/admin/incidents.php](http://localhost/MDRRMO/admin/incidents.php)
* **Organization & Roster Chart:** [http://localhost/MDRRMO/admin/organization-chart.php](http://localhost/MDRRMO/admin/organization-chart.php)
* **Equipment Inventory:** [http://localhost/MDRRMO/admin/equipment.php](http://localhost/MDRRMO/admin/equipment.php)
* **Activity & Drill Logs:** [http://localhost/MDRRMO/admin/activities.php](http://localhost/MDRRMO/admin/activities.php)
* **User Management Panel:** [http://localhost/MDRRMO/admin/users.php](http://localhost/MDRRMO/admin/users.php)

### BDRRMO Staff Suite (`bdrrmo/`)
* **Submit & View Incident Reports:** [http://localhost/MDRRMO/bdrrmo/incidents.php](http://localhost/MDRRMO/bdrrmo/incidents.php)
* **Activities & Drills:** [http://localhost/MDRRMO/bdrrmo/activities.php](http://localhost/MDRRMO/bdrrmo/activities.php)

---

## 📋 Recent Changes

| Change | Description |
|---|---|
| **Signup Disabled** | `signup.php` now redirects to `login.php`. Accounts are created by Admin only. |
| **BDRRMO Incident Workflow** | BDRRMO staff submit incidents → Admin approves or declines → Status visible to BDRRMO. |
| **Wide Incident View Modal** | Incident detail popups use `modal-lg` (~800px) with 380px photo display across Admin and BDRRMO. |
| **Upload Button** | Admin incident submit button renamed to **"Upload Incident Report"** with upload icon. |
| **Active Users Card Removed** | The Total Users / Active / Pending card has been removed from the BDRRMO dashboard. |
| **JS Files Renamed** | `client-dashboard.js`, `client-incidents.js`, `client-organization-chart.js` → `bdrrmo-*.js`. |
