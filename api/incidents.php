<?php
/**
 * API endpoint for incidents
 * Handles GET (fetch), POST (create), PUT (update), DELETE (delete) operations
 */

define('SECURE_ACCESS', true);
require_once '../auth.php';
require_once '../config.php';

header('Content-Type: application/json');

checkLogin();

$pdo = getPdoConnection();
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$userRole = getUserRole();
$currentUser = getCurrentUser();

switch ($method) {
    case 'GET':
        // Fetch incidents
        try {
            $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            
            $query = 'SELECT id, type, description, status, reported_by, barangay, photo_data_url, photo_data_urls, remarks, created_at, updated_at FROM incidents WHERE 1=1';
            $params = [];
            
            // Privacy Policy: Clients (BDRRMO) can only see incidents in their own barangay
            if ($userRole === 'client') {
                $userData = getUserData();
                $userOrg = $userData['organization'] ?? '';
                if ($userOrg) {
                    $query .= ' AND barangay = :user_org';
                    $params[':user_org'] = $userOrg;
                } else {
                    // Fallback: If no organization is set, only show their own reports
                    $query .= ' AND reported_by = :current_user';
                    $params[':current_user'] = $currentUser;
                }
            }
            
            // Allow filtering by user if provided (for admin filtering by specific user)
            if ($userId) {
                $query .= ' AND reported_by = :reported_by';
                $params[':reported_by'] = $userId;
            }
            
            // Filter by status if provided
            if ($status && $status !== 'All') {
                $query .= ' AND status = :status';
                $params[':status'] = $status;
            }
            
            $query .= ' ORDER BY created_at DESC';
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $incidents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert database format to frontend format
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
                    'reportedBy' => $incident['reported_by'],
                    'barangay' => $incident['barangay'] ?? null,
                    'photoDataUrl' => $incident['photo_data_url'], // Keep for backward compatibility
                    'photoDataUrls' => is_array($photoDataUrls) ? $photoDataUrls : [],
                    'remarks' => $incident['remarks'] ?? null,
                    'createdAt' => (int)$incident['created_at'],
                    'updatedAt' => $incident['updated_at'] ? (int)$incident['updated_at'] : null
                ];
            }, $incidents);
            
            echo json_encode($formattedIncidents);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        // Create new incident (both admin and client can create)
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['type']) || !isset($data['description'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields: type, description']);
                exit();
            }
            
            $id = $data['id'] ?? uniqid('inc_', true);
            $type = $data['type'];
            $description = $data['description'];
            $status = $data['status'] ?? 'New';
            $reportedBy = $data['reportedBy'] ?? $currentUser;
            $barangay = $data['barangay'] ?? null;
            $photoDataUrl = $data['photoDataUrl'] ?? null;
            $photoDataUrls = isset($data['photoDataUrls']) && is_array($data['photoDataUrls']) ? json_encode($data['photoDataUrls']) : null;
            $createdAt = $data['createdAt'] ?? (time() * 1000); // Convert to milliseconds
            
            $stmt = $pdo->prepare('
                INSERT INTO incidents (id, type, description, status, reported_by, barangay, photo_data_url, photo_data_urls, created_at)
                VALUES (:id, :type, :description, :status, :reported_by, :barangay, :photo_data_url, :photo_data_urls, :created_at)
            ');
            
            $stmt->execute([
                ':id' => $id,
                ':type' => $type,
                ':description' => $description,
                ':status' => $status,
                ':reported_by' => $reportedBy,
                ':barangay' => $barangay,
                ':photo_data_url' => $photoDataUrl,
                ':photo_data_urls' => $photoDataUrls,
                ':created_at' => $createdAt
            ]);
            
            echo json_encode(['success' => true, 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Update incident (admin only for status updates)
        if ($userRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Unauthorized: Only admins can update incidents']);
            exit();
        }
        
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required field: id']);
                exit();
            }
            
            $id = $data['id'];
            $updates = [];
            $params = [':id' => $id];
            
            if (isset($data['status'])) {
                $updates[] = 'status = :status';
                $params[':status'] = $data['status'];
            }
            
            if (isset($data['description'])) {
                $updates[] = 'description = :description';
                $params[':description'] = $data['description'];
            }

            if (isset($data['type'])) {
                $updates[] = 'type = :type';
                $params[':type'] = $data['type'];
            }

            if (isset($data['barangay'])) {
                $updates[] = 'barangay = :barangay';
                $params[':barangay'] = $data['barangay'];
            }

            if (isset($data['photoDataUrl'])) {
                $updates[] = 'photo_data_url = :photo_data_url';
                $params[':photo_data_url'] = $data['photoDataUrl'];
            }
            
            if (isset($data['photoDataUrls']) && is_array($data['photoDataUrls'])) {
                $updates[] = 'photo_data_urls = :photo_data_urls';
                $params[':photo_data_urls'] = json_encode($data['photoDataUrls']);
            }
            
            if (isset($data['remarks'])) {
                $updates[] = 'remarks = :remarks';
                $params[':remarks'] = $data['remarks'];
            }
            
            if (!empty($updates)) {
                $updates[] = 'updated_at = :updated_at';
                $params[':updated_at'] = time() * 1000;
                
                $query = 'UPDATE incidents SET ' . implode(', ', $updates) . ' WHERE id = :id';
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                
                echo json_encode(['success' => true]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Delete incident (admin only)
        if ($userRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Unauthorized: Only admins can delete incidents']);
            exit();
        }
        
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required parameter: id']);
                exit();
            }
            
            $stmt = $pdo->prepare('DELETE FROM incidents WHERE id = :id');
            $stmt->execute([':id' => $id]);
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

