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
    $stmtInc = $pdo->query("
        SELECT i.id, i.type, i.description, i.status, i.photo_data_url, i.photo_data_urls, i.barangay, i.reported_by, u.full_name as reporter_name, i.created_at 
        FROM incidents i 
        LEFT JOIN users u ON i.reported_by = u.id 
        WHERE i.status IN ('Approved', 'Dispatched', 'Resolved') 
        ORDER BY i.created_at DESC 
        LIMIT 50
    ");
    $incidents = $stmtInc->fetchAll(PDO::FETCH_ASSOC);
    $formattedIncidents = array_map(function($incident) {
        $photoDataUrls = [];
        if (!empty($incident['photo_data_urls'])) {
            $photoDataUrls = json_decode($incident['photo_data_urls'], true);
        }
        return [
            'id' => $incident['id'],
            'type' => $incident['type'],
            'description' => $incident['description'],
            'status' => $incident['status'],
            'barangay' => $incident['barangay'] ?? null,
            'reportedBy' => $incident['reported_by'] ?? null,
            'reporterName' => $incident['reporter_name'] ?? ($incident['barangay'] ? $incident['barangay'] : 'Unknown Reporter'),
            'photoDataUrl' => $incident['photo_data_url'],
            'photoDataUrls' => is_array($photoDataUrls) ? $photoDataUrls : [],
            'createdAt' => (int)$incident['created_at']
        ];
    }, $incidents);

    // 3. Fetch Equipment (All)
    $stmtEquip = $pdo->query('SELECT id, name, count, image_data_url FROM equipment ORDER BY name ASC');
    $equipment = $stmtEquip->fetchAll(PDO::FETCH_ASSOC);
    $formattedEquipment = array_map(function($item) {
        return [
            'id' => $item['id'],
            'name' => $item['name'],
            'count' => (int)$item['count'],
            'imageDataUrl' => $item['image_data_url']
        ];
    }, $equipment);

    // 4. Fetch Activities (All)
    $stmtActiv = $pdo->query('SELECT id, title, description, images, created_at FROM activities ORDER BY created_at DESC LIMIT 50');
    $activities = $stmtActiv->fetchAll(PDO::FETCH_ASSOC);
    $formattedActivities = array_map(function($activity) {
        $images = $activity['images'] ? json_decode($activity['images'], true) : [];
        return [
            'id' => $activity['id'],
            'title' => $activity['title'],
            'description' => $activity['description'],
            'images' => is_array($images) ? $images : [],
            'createdAt' => (int)$activity['created_at']
        ];
    }, $activities);

    echo json_encode([
        'success' => true,
        'personnels' => $formattedPersonnels,
        'incidents' => $formattedIncidents,
        'equipment' => $formattedEquipment,
        'activities' => $formattedActivities
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
