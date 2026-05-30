<?php
define('SECURE_ACCESS', true);
require_once 'config.php';

echo "<!DOCTYPE html><html><head><title>Database Diagnostic</title></head><body>";
echo "<h1>Database Diagnostics</h1>";
echo "<pre>";

echo "1. Checking if .env file exists and is readable:\n";
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    echo "  - File .env exists.\n";
    if (is_readable($envPath)) {
        echo "  - File .env is readable!\n";
        $content = file_get_contents($envPath);
        echo "  - File .env size: " . strlen($content) . " bytes\n";
    } else {
        echo "  - WARNING: File .env exists but is NOT readable by PHP due to server security permissions.\n";
    }
} else {
    echo "  - WARNING: File .env does NOT exist in this directory.\n";
}

echo "\n2. Resolved database configuration by PHP:\n";
$config = getDatabaseConfig();
// Hide password characters for security but show if it is empty or set
$maskedConfig = $config;
if (!empty($maskedConfig['password'])) {
    $maskedConfig['password'] = substr($maskedConfig['password'], 0, 2) . str_repeat('*', strlen($maskedConfig['password']) - 2);
} else {
    $maskedConfig['password'] = '[EMPTY]';
}
print_r($maskedConfig);

echo "\n3. Testing connection to MySQL...\n";
$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $config['host'],
    $config['port'],
    $config['database']
);

try {
    // Attempt standard connection with 2-second timeout
    $options = $config['options'];
    $options[PDO::ATTR_TIMEOUT] = 2;
    $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
    echo "  - SUCCESS: Connected to the database successfully!\n";
} catch (PDOException $e) {
    echo "  - ERROR: Connection failed: " . $e->getMessage() . "\n";
}

echo "</pre>";
echo "</body></html>";
