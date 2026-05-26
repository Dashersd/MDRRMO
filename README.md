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
- **Map-Free Public Reports Feed:** Per request, the public incident feed is entirely **map-free** to maintain a clean card grid presentation. It showcases incident details, severities, coordinates, and dispatcher statuses in a responsive three-column grid.
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
1. Place the project folder inside your webroot or host locally.
2. Initialize the MySQL database named `geotagged` using the setup schema under `db/db_setup.php`.
3. Configure the `.env` settings to match your local database credentials.
4. Launch your local server (e.g. `php -S localhost:8000`) and open the browser.
