<?php 
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");

require_once("config.php");

// Pega os dados do POST (formato JSON vindo do React)
$postjson = json_decode(file_get_contents("php://input"));

$user = $postjson['user'] ?? "";
$email = $postjson['email'] ?? "";
$password = $postjson['password'] ?? "";
$cpf = $postjson['cpf'] ?? "";
$dataNasc = $postjson['datanasc'] ?? "";

$sql = "select * from usuario where nome LIKE 'ADMIN' and senha LIKE '123'";

$stmt = $link->prepare($sql);
$stmt->bind_param("ss", $user, $pass);

if($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => $link->error]);
}