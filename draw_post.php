<?php 
	const PASS_SIZE = 7;//パスデータの一塊のサイズ
	//print_r($_POST["postdata0"]);
	
	
	$order_no = "passdata";
	//$filepass = "tmp/".$order_no.".txt";
	$filepass = "./tmp/".$order_no.".txt";
	
	$file = fopen($filepass,"wb",true) or die('書き込みファイルを開けませんでした！');

	fwrite($file,$_POST["postdata0"]."\n\n");//書き込み
	
	fclose($file);
	
	//最初のページをそのまま再描画
	include('index.html');
	//print "<iframe src=\"index.html\" target=\"_top\"></iframe>";
?>