<?php
  require_once("HTTP/Request.php");
    $topicId = $_GET['topicId'];
    // $request = new HTTP_Request('http://localhost:8080/kiezatlas/rpc/');
    $request = new HTTP_Request('http://www.kiezatlas.de:8080/rpc/');
    $body = '{"method": "getGeoObjectInfo", "params": ["'.$topicId.'"]}';
    $request->addHeader("Content-Type", "application/json");
    $request->setBody($body);
    $request->setMethod(HTTP_REQUEST_METHOD_POST);
    $request->sendRequest();
    $geoObjectInfo = $request->getResponseBody();
    //  $result = str_replace('\"', "", $result);
    $geoObjectInfo = utf8_encode($geoObjectInfo);
  echo $geoObjectInfo;
?>
