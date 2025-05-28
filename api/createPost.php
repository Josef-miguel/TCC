<?php 
require_once("connection.php");
$table = 'evento';

$postjson = json_decode(file_get_contents('php://input'), true);

$route = @$postjson['route'];
$title = @$postjson['tile'];
$description = @$postjson['description'];
$route_exit = @$postjson['route_exit'];
$images = json_encode(@$postjson['images']);
$numSlots = @$postjson['numSlots'];
$price = @$postjson['price'];
$exit_date = @$postjson['exit_date'];
$return_date = @$postjson['return_date'];
$review = @$postjson['review'];

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
    avaliacao = :avaliacao
");


$res->bindValue(":titulo", $route);
$res->bindValue(":destino", $title);
$res->bindValue(":descricao", $description);
$res->bindValue(":local_saida", $route_exit);
$res->bindValue(":imagens", json_encode($images)); // se for array
$res->bindValue(":n_vagas", $numSlots);
$res->bindValue(":preco", $price);
$res->bindValue(":data_de_saida", $exit_date);
$res->bindValue(":data_de_retorno", $return_date);
$res->bindValue(":avaliacao", $review);


$res->execute();

$result = json_encode(array('mensagem'=>'Salvo com sucesso!', 'sucesso'=>true));

echo $result;

?>