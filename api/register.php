<?php 
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");

require_once("connection.php");

// Pega os dados do POST (formato JSON vindo do React)
$postjson = json_decode(file_get_contents("php://input"));

$user = $postjson->user ?? "";
$email = $postjson->email ?? "";
$password = $postjson->password ?? "";
$cpf = $postjson->cpf ?? "";
$dataNasc = isset($postjson->datanasc) ? (new DateTime($postjson->datanasc))->format('Y-m-d') : "";

// Prepara a query
$res = $pdo->prepare("INSERT INTO usuario(nome, email, senha, cpf, datanasc) VALUES (:user, :email, :password, :cpf, :datanasc)");

// Vincula os parâmetros corretamente
$res->bindValue(":user", $user);
$res->bindValue(":email", $email);
$res->bindValue(":password", $password);
$res->bindValue(":cpf", $cpf);
$res->bindValue(":datanasc", $dataNasc);

// Executa a query
if ($res->execute()) {
    $result = json_encode(array(
        'message' => 'Usuário cadastrado com sucesso!',
        'success' => true,
    ));
} else {
    $result = json_encode(array(
        'message' => 'Erro ao cadastrar usuário.',
        'success' => false
    ));
}

echo $result;
