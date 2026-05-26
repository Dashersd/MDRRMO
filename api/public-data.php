<?php
/**
 * Public Read-Only API for MDRRMO Landing Page
 * Returns active personnel and incident reports without authentication,
 * while stripping private citizen metadata.
 */

define('SECURE_ACCESS', true);
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    $pdo = getPdoConnection();
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }

    // Ensure organization_personnel table exists
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

    // Ensure incidents table exists
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

    // 1. Fetch Personnels
    $stmtPers = $pdo->query('SELECT id, name, role, is_ceo, reports_to, photo_data_url FROM organization_personnel ORDER BY is_ceo DESC, created_at ASC');
    $personnels = $stmtPers->fetchAll(PDO::FETCH_ASSOC);
    $formattedPersonnels = array_map(function($person) {
        return [
            'id' => (string)$person['id'],
            'name' => $person['name'],
            'role' => $person['role'],
            'isCEO' => (bool)$person['is_ceo'],
            'reportsTo' => $person['reports_to'] ? (string)$person['reports_to'] : null,
            'photoDataUrl' => $person['photo_data_url']
        ];
    }, $personnels);

    // 2. Fetch Incidents (Only approved, dispatched, or resolved)
    $stmtInc = $pdo->query("SELECT id, type, description, status, severity, lat, lng, photo_data_url, created_at FROM incidents WHERE status IN ('Approved', 'Dispatched', 'Resolved') ORDER BY created_at DESC LIMIT 50");
    $incidents = $stmtInc->fetchAll(PDO::FETCH_ASSOC);
    $formattedIncidents = array_map(function($incident) {
        return [
            'id' => $incident['id'],
            'type' => $incident['type'],
            'description' => $incident['description'],
            'status' => $incident['status'],
            'severity' => $incident['severity'],
            'lat' => $incident['lat'] ? (float)$incident['lat'] : null,
            'lng' => $incident['lng'] ? (float)$incident['lng'] : null,
            'photoDataUrl' => $incident['photo_data_url'],
            'createdAt' => (int)$incident['created_at']
        ];
    }, $incidents);

    echo json_encode([
        'success' => true,
        'personnels' => $formattedPersonnels,
        'incidents' => $formattedIncidents
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
