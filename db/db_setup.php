<?php
/**
 * Database Setup and Migration Tool
 * This script initializes the MySQL database and migrates data from users.json.
 */

define('SECURE_ACCESS', true);
require_once __DIR__ . '/../config.php';

echo "<h1>MDRRMO Database Setup</h1>";

try {
    // 1. Establish connection to MySQL server (without selecting a DB first)
    $config = getDatabaseConfig();
    $dsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $config['host'], $config['port']);
    $pdo = new PDO($dsn, 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    echo "✓ Connected to MySQL server.<br>";

    // 2. Create Database
    $dbname = $config['database'];
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database `$dbname` ensured.<br>";
    
    // 3. Reconnect to the specific database
    $pdo->exec("USE `$dbname` ");
    $pdo = getPdoConnection(); // Re-use the config-based connection
    if (!$pdo) {
        throw new Exception("Failed to connect to the new database `$dbname` using config.php credentials.");
    }
    echo "✓ Connected to `$dbname` database.<br>";

    // 4. Create Tables
    echo "✓ Creating tables...<br>";

    // Users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','client') NOT NULL DEFAULT 'client',
        full_name VARCHAR(255) DEFAULT NULL,
        organization VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        status ENUM('pending','approved','active','inactive') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "✓ Users table ensured.<br>";

    // Incidents table
    $pdo->exec("CREATE TABLE IF NOT EXISTS incidents (
        id VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'New',
        reported_by VARCHAR(255) NOT NULL,
        severity VARCHAR(50) DEFAULT NULL,
        lat DECIMAL(10, 8) DEFAULT NULL,
        lng DECIMAL(11, 8) DEFAULT NULL,
        photo_data_url LONGTEXT DEFAULT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT DEFAULT NULL,
        PRIMARY KEY (id),
        INDEX idx_reported_by (reported_by),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "✓ Incidents table ensured.<br>";

    // Organization Personnel table
    $pdo->exec("CREATE TABLE IF NOT EXISTS organization_personnel (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        is_ceo TINYINT(1) NOT NULL DEFAULT 0,
        reports_to INT UNSIGNED DEFAULT NULL,
        photo_data_url LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (reports_to) REFERENCES organization_personnel(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "✓ Organization Personnel table ensured.<br>";

    // 5. Migrate Data from users.json
    $jsonFile = __DIR__ . '/../users.json';
    if (file_exists($jsonFile)) {
        $usersData = json_decode(file_get_contents($jsonFile), true);
        if ($usersData) {
            $count = 0;
            $stmt = $pdo->prepare("INSERT IGNORE INTO users (username, email, password_hash, role, full_name, organization, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($usersData as $u) {
                // Determine appropriate fields
                $pass = $u['password'] ?? '';
                $status = $u['status'] ?? 'active';
                $created = $u['created_at'] ?? date('Y-m-d H:i:s');
                
                $stmt->execute([
                    $u['username'],
                    $u['email'],
                    $pass,
                    $u['role'] ?? 'client',
                    $u['full_name'] ?? $u['username'],
                    $u['organization'] ?? null,
                    $status,
                    $created
                ]);
                if ($stmt->rowCount() > 0) $count++;
            }
            echo "✓ Migrated $count new users from users.json.<br>";
        }
    }

    echo "<h3>Setup Complete!</h3>";
    echo "<p><a href='../index.php'>Go to Dashboard</a> | <a href='test_db.php'>Test Database</a></p>";

} catch (Exception $e) {
    echo "<div style='color:red;'><strong>Error:</strong> " . $e->getMessage() . "</div>";
}
