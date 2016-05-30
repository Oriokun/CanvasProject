<?php 
//ファイルから情報を読み取り，タグに情報を移す処理
	//const PASS_SIZE = 7;//パスデータの一塊のサイズ
	//print_r($_POST["postdata0"]);
	$order_no = "passdata";
	$filepass = "./tmp/".$order_no.".txt";
	/*
	 * 
	 * 
	 * $filepass = "/tmp/".$order_no.".txt";
	
	$file = fopen($filepass,"rb",true) or die('ファイルを開けませんでした！');
	flock($file, LOCK_SH);
	while($fileline = fgetcsv($file,20000000,"\t")){
		foreach($filelines as $fline){
			$value = $value."".$fline."\n";
		}
	}fclose($file);
	 * 
	 */
	
	
	//print_r(filepass);
	$filelines = file($filepass);
	$value = "";
	foreach($filelines as $fline){
		$value = $value."".$fline."\n";
	}
	//print_r($value);
	//<input type="hidden" class="hidden_input" name="postdata0" value="" />
	//javascriptから読み込む為に情報をタグへ埋め込む
	print "<input type=\"hidden\" class =\"oldpassdata\" value=\"".$value."\">";
?>