<?php 
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");

require_once("connection.php");

$postjson = json_decode(file_get_contents('php://input'), true);

$user = $postjson['user'] ?? "";
$email = $postjson['email'] ?? "";
$password = $postjson['password'] ?? "";
$cpf = $postjson['cpf'] ?? "";
$dataNasc = isset($postjson['datanasc']) ? DateTime::createFromFormat('d/m/Y', $postjson['datanasc'])->format('Y-m-d') : "";


$res = $pdo->prepare("INSERT INTO usuario(nome, email, senha, cpf, datanasc) VALUES (:user, :email, :password, :cpf, :datanasc)");
$res->bindValue(":user", $user);
$res->bindValue(":email", $email);
$res->bindValue(":password", $password);
$res->bindValue(":cpf", $cpf);
$res->bindValue(":datanasc", $dataNasc);

$success = $res->execute(); // Executa a query de inserção

if ($success) {
    $result = json_encode(array(
        'message' => 'Cadastro bem-sucedido!',
        'success' => true,
    ));
} else {
    $result = json_encode(array(
        'message' => 'Erro ao cadastrar o usuário!',
        'success' => false
    ));
}
echo $result; // Retorna o resultado para o frontend
