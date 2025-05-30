<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With'); 
header('Content-Type: application/json; charset=utf-8');

$server = "localhost";
$user = "root";
$password = "";
$db = "tcc";

try {
    $pdo = new PDO("mysql:host=$server;dbname=$db;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Configura erro para exceção
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao conectar com o banco!',
        'error' => $e->getMessage()
    ]);
    exit; // Para a execução do script caso haja erro
}
