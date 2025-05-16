<?php

include_once("connection.php");

header('Content-Type: application/json'); // Importante para o React Native entender o retorno

$res = $pdo->prepare("SELECT * FROM evento");
$res->execute();

$data = $res->fetchAll(PDO::FETCH_ASSOC);

if ($data) {
    $eventos = array_map(function ($evento) {
        return array(
            'id' => (int) $evento['id_evento'],
            'title' => $evento['titulo'],
            'description' => $evento['descricao'],
            'route' => $evento['destino'],
            'route_exit' => $evento['local_saida'],
            'images' => [ $evento['imagens'] ], // em array!
            'numSlots' => (int) $evento['n_vagas'],
            'price' => (float) $evento['preco'],
            'exit_date' => $evento['data_de_saida'],
            'return_date' => $evento['data_de_retorno'],
            'review' => (float) $evento['avaliacao'],
            'fav' => false, // valor padrão para frontend controlar
            'theme' => '',  // campos que você pode completar se quiser
            'type' => ''
        );
    }, $data);

    echo json_encode([
        'message' => 'Posts carregados com sucesso!',
        'success' => true,
        'data' => $eventos
    ]);
} else {
    echo json_encode([
        'message' => 'Nenhum evento encontrado!',
        'success' => false,
        'data' => []
    ]);
}
