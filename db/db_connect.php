<?php
/**
 * Simple database connection helper
 * Can be included in scripts that need easy access to $pdo
 */

if (!defined('SECURE_ACCESS')) {
    define('SECURE_ACCESS', true);
}

require_once __DIR__ . '/../config.php';

$pdo = getPdoConnection();

if (!$pdo) {
    error_log("Failed to connect to database in db_connect.php");
    if (str_ends_with($_SERVER['PHP_SELF'], 'db_connect.php')) {
        die("Database connection failed.");
    }
}
