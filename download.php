<?php
//ファイルから情報を読み取り，タグに情報を移す処理
//const PASS_SIZE = 7;//パスデータの一塊のサイズ
//print_r($_POST["postdata0"]);
	/*
	$order_no = "passdata";
	$filepass = "/tmp/".$order_no.".txt";

	$filelines = file($filepass);
	$value = "";
	foreach($filelines as $fline){
		$value = $value."".$fline."\n";
	}
	*/
	$value = $_POST["DLpng"];
	//取り込んだ画像をpngへエンコード
	$result = base64_decode($value);
	$image = imagecreatefromstring($result);
	
	header("Content-Type: image/png");
	header("Cache-control: no-cache");
	header('Content-Disposition: attachementl; filename="canvas.png"');
	imagepng($image);
	imagedestroy($image);

?>