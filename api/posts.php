<?php 

include_once('connection.php');

$postjson = json_decode(file_get_contents('php://input'), true);


$query = $pdo->prepare("SELECT * from evento");

$query->execute();

$res = $query->fetchAll(PDO::FETCH_ASSOC);

for ($i=0; $i < count($res); $i++) { 
    foreach ($res[$i] as $key => $value) {  }      

    $dados[] = array(
        'id_evento' => $res[$i]['id_evento'],  
        'route' => $res[$i]['destino'],
        'route_exit' => $res[$i]['local_saida'],
        'images' => [ $res[$i]['imagens'] ], 
        'numSlots' => (int) $res[$i]['n_vagas'],
        'price' => (float) $res[$i]['preco'],
        'exit_date' => $res[$i]['data_de_saida'],
        'return_date' => $res[$i]['data_de_retorno'],
        'review' => (float) $res[$i]['avaliacao'],
        'fav' => false, // valor padrão para frontend controlar
        'theme' => '',  // campos que você pode completar se quiser
        'type' => ''
                         
    );

    }

   if(count($res) > 0){
           $result = json_encode(array('success'=>true, 'result'=>$dados));

       }else{
           $result = json_encode(array('success'=>false, 'result'=>'0'));

       }

echo $result;

?>