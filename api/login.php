<?php

include_once("connection.php");

$postjson = json_decode(file_get_contents('php://input'), true);

$user = $postjson['user'] ?? "";
$password = $postjson['password'] ?? "";

$res = $pdo->prepare("SELECT * FROM usuario WHERE nome=:user");
$res->bindValue(":user", $user);
$res->execute();

$data = $res->fetch(PDO::FETCH_ASSOC);

if ($data && $password) {
    $result = json_encode(array(
        'message' => 'Conexão bem-sucedida!',
        'success' => true,
        'data' => array(
            'id' => $data['id_usuario'],
            'user' => $data['nome']
        )
    ));
} else {
    $result = json_encode(array(
        'message' => 'Usuario ou senha invzlidos!',
        'success' => false
    ));
}


echo $result;
