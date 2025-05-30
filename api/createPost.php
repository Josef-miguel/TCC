<?php 
require_once("connection.php");
$table = 'evento';

$postjson = json_decode(file_get_contents('php://input'), true);

$title = $postjson['titulo'];
$route = @$postjson['destino'];
$description = @$postjson['descricao'];
$route_exit = @$postjson['local_saida'];
$images = json_encode(@$postjson['imagens']);
$numSlots = @$postjson['n_vagas'];
$price = @$postjson['preco'];
$exit_date = @$postjson['data_de_saida'];
$return_date = @$postjson['data_de_retorno'];
$trip_type = @$postjson['id_tag'];

$res = $pdo->prepare("INSERT INTO $table SET 
    titulo = :titulo,
    destino = :destino,
    descricao = :descricao,
    local_saida = :local_saida,
    imagens = :imagens,
    n_vagas = :n_vagas,
    preco = :preco,
    data_de_saida = :data_de_saida,
    data_de_retorno = :data_de_retorno,
    id_tag = :id_tag
");


$res->bindValue(":titulo", $title);
$res->bindValue(":destino", $route);
$res->bindValue(":descricao", $description);
$res->bindValue(":local_saida", $route_exit);
$res->bindValue(":imagens", $images); // se for array
$res->bindValue(":n_vagas", $numSlots);
$res->bindValue(":preco", $price);
$res->bindValue(":data_de_saida", $exit_date);
$res->bindValue(":data_de_retorno", $return_date);
$res->bindValue(":id_tag", $trip_type);


$res->execute();

echo json_encode(['message'=>'Salvo com sucesso!', 'success'=>true, 'result' => "foi"]);

?>