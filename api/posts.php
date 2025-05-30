<?php 
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

include_once('connection.php');

try {
    $query = $pdo->prepare("SELECT * FROM evento");
    $query->execute();
    $res = $query->fetchAll(PDO::FETCH_ASSOC);

    $dados = [];

    foreach ($res as $row) {
        $dados[] = [
            'id_evento' => $row['id_evento'],
            'title' => $row['titulo'],
            'route' => $row['destino'],
            'description' => $row['descricao'],
            'route_exit' => $row['local_saida'],
            'images' => [trim($row['imagens'])],
            'numSlots' => (int) $row['n_vagas'],
            'price' => (float) $row['preco'],
            'exit_date' => $row['data_de_saida'],
            'return_date' => $row['data_de_retorno'],
            'review' => (float) $row['avaliacao'],
            'fav' => false,
            'theme' => '',
            'type' => ''
        ];
    }

    echo json_encode([
        'success' => true,
        'result' => $dados
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
