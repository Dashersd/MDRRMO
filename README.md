# MDRRMO Geotagged Incident Reporting System

A premium, responsive, state-of-the-art web-based portal for the **Municipal Disaster Risk Reduction and Management Office (MDRRMO) Lapuyan**. The system serves as a public safety hub and an administrative geotagged incident management platform.

---

## 🌟 Core Features

### 1. Premium Public Homepage (`index.php`)
A 100% pure public safety information board tailored for citizens. 
- **Zero Portal Distractions:** All dashboard access, login, signup, and portal buttons have been removed from the public page to ensure a clean public bulletin board.
- **Dynamic Threat Alert Engine:** Automatically evaluates the highest threat severity in the active dispatches from the database. It pulses in Green (Normal), Yellow (Active Monitoring/Yellow Alert), Orange (High Severity), or Red (Critical Red Alert) with localized safety notices.
- **Dynamic Weather & Clock:** A high-end real-time digital clock coupled with interactive weather telemetry widgets.
- **Official Roster Directory:** Displays active responders and leadership, updated in real time. It features customized profile dimensions ensuring full face visibility (no cropping).
- **No Map on Homepage:** To ensure a clean, modern, and high-performance user experience, there is no map on the public homepage. Public emergency dispatches are displayed in a clean, responsive three-column card grid featuring geotagged locations, status indicators, and modal popups.
- **High-Fidelity Detail Modals:** Clicking any personnel or incident card launches a details overlay. Media files inside the modal utilize containment wrappers to prevent image cropping.
- **Click-to-Copy Directory:** A beautiful directory of emergency contact hotlines with clipboard-copy indicators.

### 2. Multi-Role Secured Dashboards
Admin and responder operations are fully isolated behind standard authentication interfaces:
- **Admin Dashboard (`admin-dashboard.php`):** Full administration suite to dispatch responders, manage user roles, update rosters, and log real-time geotagged emergency events.
- **Client Dashboard (`client-dashboard.php`):** Interactive reporting hub for registered responders to send geotagged incident requests with photo uploads.
- **Interactive Maps (Internal):** Leaflet maps are kept inside secure panels for precise dispatch coordinates and incident plot rendering.

---

## 🔐 Authentication & Roles

- **Admin Account:** `admin` / `mdrrmo2024`
- **Client Account:** `client` / `client2024`
- **Security Protocols:** Session-based validation, automatic unauthenticated page guards, and secure password hashing using PHP's `password_hash()`.

---

## 📂 File Structure

```text
├── index.php                     # Pure public landing portal / information board
├── login.php                     # Secured dashboard portal entrance
├── signup.php                    # Public user registration page
├── admin-dashboard.php           # Core Admin operation center
├── client-dashboard.php          # Secured client reporting portal
├── auth.php                      # Session-based authentication helper library
├── config.php                    # Global database connection and configuration file
├── xampp-setup.md                # Walkthrough detailing local Apache/MariaDB setup
│
├── api/
│   ├── public-data.php           # Secure public reader GET endpoint (hides reporter private data)
│   ├── incidents.php             # Core incident creation & modification API
│   └── organization-personnel.php# Organizational chart responder API
│
├── assets/
│   └── icon.png                  # Official brand identity logo
│
├── scripts/
│   ├── homepage.js               # Clock, detail modals, copy logic, and roster engines
│   └── dashboard.js              # Dashboard layout scripts
│
└── styles/
    ├── homepage.css              # Custom styling for public interface
    └── dashboard.css             # Administrative panel styling tokens
```

---

## 🚀 Setup & Local Deployment

### 1. Requirements
* Windows OS with XAMPP (Apache + MariaDB/MySQL).
* PHP 8.0 or higher.

### 2. Installation Steps
1. **Link or Place the Folder:** Move the project folder to `C:\xampp\htdocs\MDRRMO` or run the following command in cmd as Administrator:
   ```cmd
   mklink /J "C:\xampp\htdocs\MDRRMO" "C:\Users\NITRO V15\OneDrive\Documents\MDRRMO"
   ```
2. **Start Services:** Start **Apache** and **MySQL** from your XAMPP Control Panel.
3. **Configure Settings:** Verify the `.env` settings match your local database credentials (default: username `root` with no password).
4. **Initialize Database:** Visit **[http://localhost/MDRRMO/db/db_setup.php](http://localhost/MDRRMO/db/db_setup.php)** to automatically set up the schema, tables, and migrate users.

---

## 🌐 Local Access Portals

Use the links below to access the different parts of the system when running locally on XAMPP:

### Public Gateways
* **Official Homepage (Citizen Info Board):** [http://localhost/MDRRMO/index.php](http://localhost/MDRRMO/index.php)
* **Secure Login Entrance:** [http://localhost/MDRRMO/login.php](http://localhost/MDRRMO/login.php)
* **Responder Registration (Signup):** [http://localhost/MDRRMO/signup.php](http://localhost/MDRRMO/signup.php)

### Secured Dashboards (Requires Session)
* **Admin Command Center:** [http://localhost/MDRRMO/admin-dashboard.php](http://localhost/MDRRMO/admin-dashboard.php)
* **Responder Dashboard:** [http://localhost/MDRRMO/client-dashboard.php](http://localhost/MDRRMO/client-dashboard.php)

### Administrative Panel Suite (`admin/`)
* **Incidents Manager:** [http://localhost/MDRRMO/admin/incidents.php](http://localhost/MDRRMO/admin/incidents.php)
* **Organization & Roster Chart:** [http://localhost/MDRRMO/admin/organization-chart.php](http://localhost/MDRRMO/admin/organization-chart.php)
* **Equipment Inventory:** [http://localhost/MDRRMO/admin/equipment.php](http://localhost/MDRRMO/admin/equipment.php)
* **Activity & Drill Logs:** [http://localhost/MDRRMO/admin/activities.php](http://localhost/MDRRMO/admin/activities.php)
* **User Management Panel:** [http://localhost/MDRRMO/admin/users.php](http://localhost/MDRRMO/admin/users.php)

### Responder Operations Suite (`client/`)
* **My Incident Logs:** [http://localhost/MDRRMO/client/incidents.php](http://localhost/MDRRMO/client/incidents.php)
* **View Roster Chart:** [http://localhost/MDRRMO/client/organization-chart.php](http://localhost/MDRRMO/client/organization-chart.php)
* **Activities & Drills:** [http://localhost/MDRRMO/client/activities.php](http://localhost/MDRRMO/client/activities.php)

