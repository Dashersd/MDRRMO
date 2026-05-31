<?php
/**
 * API endpoint for admin dashboard statistics
 * Returns JSON data for dashboard metrics
 */

define('SECURE_ACCESS', true);
require_once '../auth.php';

header('Content-Type: application/json');

// Check if user is logged in
checkLogin();

try {
    $pdo = getPdoConnection();
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Get total users count (regardless of approval status)
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM users');
    $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    // Get inactive users count
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM users WHERE status IN ("pending", "inactive") OR status IS NULL OR status = ""');
    $stmt->execute();
    $inactiveUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    // Get approved/active users count
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM users WHERE status IN ("approved", "active")');
    $stmt->execute();
    $activeUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    // For incidents/reports, we'll use localStorage data on client-side
    // But we can prepare the structure here for future database integration
    
    // Get incidents stats
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM incidents');
    $totalIncidents = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM incidents WHERE status = "New"');
    $newIncidents = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    $stmt = $pdo->query('SELECT COUNT(*) as total FROM incidents WHERE status = "Resolved"');
    $resolvedIncidents = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    $stats = [
        'users' => [
            'total' => (int)$totalUsers,
            'inactive' => (int)$inactiveUsers,
            'active' => (int)$activeUsers
        ],
        'incidents' => [
            'total' => (int)$totalIncidents,
            'new' => (int)$newIncidents,
            'resolved' => (int)$resolvedIncidents
        ],
        'timestamp' => time()
    ];
    
    echo json_encode($stats);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

