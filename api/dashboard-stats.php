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
    $userRole = getUserRole();
    $userData = getUserData();
    $userOrg = $userData['organization'] ?? '';
    
    $whereClause = '';
    $params = [];
    
    if ($userRole === 'client' && $userOrg) {
        $whereClause = ' WHERE barangay = :user_org';
        $params[':user_org'] = $userOrg;
    }
    
    // Total incidents
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM incidents' . $whereClause);
    $stmt->execute($params);
    $totalIncidents = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    // New incidents
    $newWhere = $whereClause ? $whereClause . ' AND status = "New"' : ' WHERE status = "New"';
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM incidents' . $newWhere);
    $stmt->execute($params);
    $newIncidents = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    // Resolved incidents
    $resolvedWhere = $whereClause ? $whereClause . ' AND status = "Resolved"' : ' WHERE status = "Resolved"';
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM incidents' . $resolvedWhere);
    $stmt->execute($params);
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

