<?php
    $server = "localhost";
    $user = "root";
    $password = "";
    $db = "tcc";

    try {   
        $link = new mysqli($server, $user, $password, $db);

        if($link->connect_error){
            throw new Exception("Connection failed: " . $link->connect_error);
        }
    }
    catch (Exception $e){
        error_log($e->getMessage());
        die("Could not connect to the database.");
    }
