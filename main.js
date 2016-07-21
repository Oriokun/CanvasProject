//グローバル変数
var maincanvas,backcanvas;//描画用
var maincontext,backcontext;

var toolbox;

var eimi,rootinid,eimi_flag= false;

var canvas_w = 2048,canvas_h = 640;
var subfloorsize = 160;
const basezoom = 100;
//スタイルシートの座標文字列から数値だけ取りだし　数値として返す
var number_check = /[^-^0-9^\.]/g;
function check_stringnum(st){
	var exst = st.split("px");
	return Number(exst[0]);
}

function check_stringnumP(st){
	var exst = st.split("%");
	return Number(exst[0]);
}

//maincanvasを画像化する（未実装）
function canvas_output(){
	var png = mainvanvas.toDataURL();
	return png;
}

//------------------------------------------------------------
// スクロール位置を取得する関数
// ------------------------------------------------------------
function DocumentGetScrollPosition(document_obj){
	return{
		x:document_obj.body.scrollLeft || document_obj.documentElement.scrollLeft,
		y:document_obj.body.scrollTop  || document_obj.documentElement.scrollTop
	};
}


var subx=-1,suby=-1;//サブウィンドウの位置を記録する

var t_plugin;//wacomタブレットプラグイン
const maxtouch = 3;
var data,csx=-1,csy=-1;
var multitouches_now=0;//今のタッチ数(マルチタッチ処理用)
var multitouchXY=[[0,0],[0,0],[0,0]];//マルチタッチ座標取得用

//製作データまとめ
function one_canvasdata(){
	this.passnum = 0;//パスデータで現在，描き進めた番号を記録
	this.action_id = 0;//操作番号
	this.pass = [];//パスデータを記録する配列
	
	this.pass_size = 5;
	this.pass_color = "rgba(0,0,0,1.0)";//結果的に出力される色
	this.hsv = [0,1,0.5];//ベースとなる色(ｈ含めて0.0~1.0で表現)
	this.canvasW;
	this.canvasH;
	//pen,eraser,
	this.mode = 'pen';
}


//操作を一つ戻る
one_canvasdata.prototype.passback = function(){
	var aid = this.action_id - 1;
	if(this.passnum <= 0 || this.action_id <= 0)return;
	for(var pn = this.passnum-1; pn >= 0; pn--){
		if(this.pass[pn].id != aid || pn==0){//別のアクションidまで下ったら戻る動作を終える
			this.action_id--;
			break;
		}else{
			this.passnum--;
		}
	}
	//console.log("pnum:"+this.passnum+" :action_id:"+this.action_id);
	
};

//操作を一つやり直す
//（次の操作番号(action_id)が現在と同じである場合のみ）
one_canvasdata.prototype.repass = function(){
	var aid = this.action_id;
	//console.log("pnum:"+this.passnum+" :action_id:"+this.action_id +":nextid"+ this.pass[this.passnum].id);
	if(this.pass.length < this.passnum && this.pass[this.passnum].id != aid)return;
	for(var pn = this.passnum; pn <= this.pass.length; pn++){
		if(pn == this.pass.length || this.pass[pn].id != aid){//別のアクションidまで進んだら，やめる
			this.action_id++;
			break;
		}else{
			this.passnum++;
		}
	}
	//console.log("pnum:"+this.passnum+" :action_id:"+this.action_id);
	
};

//再描画
one_canvasdata.prototype.redraw = function(context, backcon){
	
	//context.fillStyle = "rgb(255,255,255)";
	//context.fillRect(0,0,0,0);
	context.clearRect(0,0,this.canvasW,this.canvasH);
	
	for(var i = 0;i<this.passnum;i++){
		draw(context,this.pass[i]);
	}
	
	
};

//モード切り替え
one_canvasdata.prototype.modechange = function(mode){
	
	if(mode == 'pen'){
		this.mode = mode;
		//this.pass_color = "rgba(0,0,0,1.0)";
		this.setpasscolor();
	}else
	if(mode == 'eraser'){
		this.mode = mode;
		this.pass_color = "rgba(255,255,255,1.0)";
	}
};

//hsv情報をｒｇｂデータにして設定を更新する
one_canvasdata.prototype.setpasscolor = function(){
	rgb = hsv_to_rgb(this.hsv[0],this.hsv[1],this.hsv[2]);
	this.pass_color = "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1.0)";
	
};

//色設定
function hsv_to_rgb(h,s,v){//h,s,v(0~1)
	var r=v,g=v,b=v;
	
	if (s > 0.0) {
	    h *= 6.0;
	    var i = Math.floor(h);
	    var f = h - i;
	    switch (i) {
	        default:
	        case 0:
	            g *= 1 - s * (1 - f);
	            b *= 1 - s;
	            break;
	        case 1:
	            r *= 1 - s * f;
	            b *= 1 - s;
	            break;
	        case 2:
	            r *= 1 - s;
	            b *= 1 - s * (1 - f);
	            break;
	        case 3:
	            r *= 1 - s;
	            g *= 1 - s * f;
	            break;
	        case 4:
	            r *= 1 - s * (1 - f);
	            g *= 1 - s;
	            break;
	        case 5:
	            g *= 1 - s;
	            b *= 1 - s * f;
	            break;
	    }
	}
	r = Math.round(r*255);
	g = Math.round(g*255);
	b = Math.round(b*255);
		
	return [r,g,b];
}

//準備関数
function preparation(){
	function c_eventhandler(){
		
	}
	//ボタンが押された
	function onMouseDown(event){
		var e,i;
		//touchmoveの場合は，マルチタッチを考慮する必要がある．
		if(event.type == "touchmove"){
			if(event.changedTouches.length<=1)
				e = event.changedTouches[0];
			else{
				multitouches_now = event.touches.length;
				for(i=0;i<event.changedTouches.length && i<maxtouch ;i++){
					multitouchXY[i] = [event.changedTouches[i].clientX, event.changedTouches[i].clientY];
				}
				return;
			}
		}else e = event;
		var extention = 1;//(Number(check_stringnumP(document.body.style.zoom))/100.0;
		var rect = e.target.getBoundingClientRect();
		csx = e.clientX*extention - rect.left;
		csy = e.clientY*extention - rect.top;
		
		//console.log("start :x:"+csx+" :y:"+csy);
		
		var pass = new pass_data([csx,csy,csx,csy],data.pass_size,data.pass_color,data.action_id);
		data.pass[data.passnum] = pass;
		data.passnum++;
		draw(maincontext,pass);
	}
	
	
	//カーソルが移動した
	function onMouseMove(event){
		var e,i;
		//touchmoveの場合は，マルチタッチを考慮する必要がある．
		if(event.type == "touchmove"){
			$('div.testtext').text(event.touches.length + "::");
			if(event.touches.length<=1)
			{
				multitouches_now = event.touches.length;
				e = event.touches[0];
				$('div.testtext').text("シングルタッチ");
			}	
				
			else{
				//マルチタッチ数が変化した時に値の初期化を行う．
				if(multitouches_now != event.touches.length){
					for(i=0;i<event.touches.length && i<maxtouch ;i++){
						multitouchXY[i] = [event.touches[i].clientX, event.touches[i].clientY];
					}
					multitouches_now = event.touches.length;
				}
				//$('div.testtext').text("マルチタッチ");
				var cx,cy;//変化量
				var sxy = DocumentGetScrollPosition(document);
				cx = event.touches[0].clientX - multitouchXY[0][0];
				cy = event.touches[0].clientY - multitouchXY[0][1];
				//alert(cx,cy);
				//$('div.testtext').text(event.touches.length + "::"+cx+".."+cy);
				for(i=0;i<event.touches.length && i<maxtouch ;i++){
					multitouchXY[i] = [event.touches[i].clientX, event.touches[i].clientY];
				}
				window.scroll(sxy['x'] - cx,sxy['y'] - cy);
				return;
			}
			
				
		}else {
			
			$('div.testtext').text("シングルタッチモードです");
			e = event;
		}
		var extention = 1;//Number(check_stringnumP(document.body.style.zoom))/100.0;
		
		var rect = e.target.getBoundingClientRect();
		var ex = e.clientX*extention - rect.left;
		var ey = e.clientY*extention - rect.top;
		

		
		cursorpensize([ex,ey]);
		
		if(csx!=-1 && csy!=-1){
			
			
			var pass = new pass_data([csx,csy,ex,ey],data.pass_size,data.pass_color,data.action_id);
			data.pass[data.passnum] = pass;
			data.passnum++;
			csx = ex;
			csy = ey;

			
			
			draw(maincontext,pass);
			//console.log("x:"+ex+" :y:"+ey);
		}
		
	}
	
	//subフロアをクリックした時のイベント
	function subclick(e){

		var ex = e.offsetX;
		var ey = e.offsetY;
		var psize = 6;
		$('img.colorsv_point')[0].style.top = ey-psize + 'px';
		$('img.colorsv_point')[0].style.left = (ex-subfloorsize/2 - psize) + 'px';
		//console.log("サブウィンドウ座標:"+ex+""+ey);
		data.hsv[1] = (ex)/subfloorsize;
		data.hsv[2] = (subfloorsize - ey)/subfloorsize;
	    data.setpasscolor();
		
	}
	
	
	function onMouseUp(e){
		csx = -1;
		csy = -1;
		
		data.action_id++;
		//console.log("pnum:"+data.passnum+" :action_id:"+data.action_id);
	}
	
	var divname = "#pencursor";
	function cursorpensize(xy){
		//console.log($("#pencursor")[0]);
		var size = Math.round(data.pass_size/2.0);
		$(divname)[0].style.width = (data.pass_size) + 'px';
		$(divname)[0].style.height =(data.pass_size) + 'px';
		$(divname)[0].style.top = (xy[1]-size) + 'px';
		$(divname)[0].style.left =(xy[0]-size) + 'px';
	}
	
	
	//ロードされてから動作する部分．
	window.addEventListener('load',function(){
		t_plugin = document.querySelector('object[type="application/x-wacomtabletplugin"]');
		
		
		document.body.style.zoom = basezoom + "%";
		
		maincanvas = $("#maincanvas")[0];
		maincontext = maincanvas.getContext('2d');
		backcanvas = $("#backcanvas")[0];
		backcontext = backcanvas.getContext('2d');
		
		maincanvas.width = backcanvas.width = canvas_w;
		maincanvas.height= backcanvas.height= canvas_h;
		
		load();
		
		console.log(maincanvas);
		//キャンバスイベント
		var maincanvas_cover = $("#canvascover")[0];
		maincanvas_cover.style.width = maincanvas.width + 'px';
		maincanvas_cover.style.height =maincanvas.height + 'px';
		maincanvas_cover.addEventListener('mousedown',onMouseDown, false);
		maincanvas_cover.addEventListener('mouseup', onMouseUp, false);
		maincanvas_cover.addEventListener('mousemove',onMouseMove, false);
		//モバイル向け
		maincanvas_cover.addEventListener('touchstart',function(e){
				e.preventDefault();
				console.log("f_start");
				onMouseDown(e);
			}, false);
		maincanvas_cover.addEventListener('touchmove',function(e){
				e.preventDefault();
				console.log("f_move");
				onMouseMove(e);
			}, false);
		maincanvas_cover.addEventListener('touchend',function(e){
				e.preventDefault();
				console.log("f_end");
				onMouseUp(e);
			}, false);
		
		$("div.colorsv_pointarea")[0].addEventListener('click',subclick, false);
		
		$('img.colorsv_point')[0].addEventListener('click',function(){console.log("ポインタくりっく");}, false);
		/*
		maincanvas.addEventListener('mousedown',onMouseDown, false);
		maincanvas.addEventListener('mouseup', onMouseUp, false);
		maincanvas.addEventListener('mousemove',onMouseMove, false);
		*/
		$('div.colorh_box').css("background-color","rgb(255,0,0)");
	      
		
		//自作ツールボックスのイベント設定
		toolbox = $('div.subfloor')[0];
		console.log($('input.centerbar'));
		
		$('img.centerbar')[0].addEventListener("dragstart",function(event){
			var t = event.target.parentNode.parentNode;
			var scrollxy = DocumentGetScrollPosition(document);
			//console.log(t.style);
			suby = event.clientY + scrollxy['y'];
			subx = event.clientX + scrollxy['x'];
			
			
		}, false);
		$('img.centerbar')[0].addEventListener("drag",function(event){
			//console.log("mousemove");
			if(suby!=-1 && subx!=-1){
				
				var t = event.target.parentNode.parentNode;
				var scrollxy = DocumentGetScrollPosition(document);
				//console.log('drag'+(t.style.top)+'::'+(t.style.left));
				//console.log((event.clientX+ scrollxy['x']) +"::"+ (event.clientY+scrollxy['y']));
				if(event.clientX==0 && event.clientY==0)return;
				var top = (event.clientY + scrollxy['y'] - suby + check_stringnum(t.style.top)),
					left = (event.clientX + scrollxy['x'] - subx + check_stringnum(t.style.left));
				t.style.top = top +'px';
				t.style.left = left +'px';
			
				suby = event.clientY + scrollxy['y'];
				subx = event.clientX + scrollxy['x'];
				//console.log('dragend'+t.style.top+'::'+t.style.left);
			}
			
		}, false);
		
		//明度彩度指定ポインタのイベント
		//よこ -80~80 縦 -2~-158
		$('img.colorsv_point').draggable({
			containment: 'parent',
			create: function(event,ui){
				//console.log(event.target.parentNode.parentNode);
				//新規変数の追加
				this.otop = -2.0;//座標規準
				this.oleft= -80.0;
				this.size = subfloorsize;//稼働エリアの縦横サイズ
				this.style.left = "-80px";
				this.style.top = "158px";
				
				//console.log(this.style);
				
			},
			start: function(event,ui){
				//console.log(this.otop);
				
			},
			drag: function(event,ui){
				//console.log(ui.position);
				data.hsv[1] = (ui.position.left - this.oleft)/this.size;
				data.hsv[2] = (this.size - (ui.position.top  - this.otop))/this.size;
			    data.setpasscolor();
			}
		});
		//$("div.subfloor").draggable();
		
		/*このドラッグイベントの指定だと，イベントを指定した要素自体も移動してしまう
		$("img.centerbar").draggable({
			create: function(event,ui){
				console.log(event.target.parentNode.parentNode);
			},
			start: function(event,ui){
				console.log("start"+ui);
				var t = event.target.parentNode.parentNode;
				var scrollxy = DocumentGetScrollPosition(document);
				//console.log(t.style);
				suby = event.clientY + scrollxy['y'];
				subx = event.clientX + scrollxy['x'];
					
			},
			drag: function(event,ui){
				console.log("mousemove");
				if(suby!=-1 && subx!=-1){
					
					var t = event.target.parentNode.parentNode;
					var scrollxy = DocumentGetScrollPosition(document);
					//console.log('drag'+(t.style.top)+'::'+(t.style.left));
					//console.log((event.clientX+ scrollxy['x']) +"::"+ (event.clientY+scrollxy['y']));
					if(event.clientX==0 && event.clientY==0)return;
					var top = (event.clientY + scrollxy['y'] - suby + check_stringnum(t.style.top)),
						left = (event.clientX + scrollxy['x'] - subx + check_stringnum(t.style.left));
					t.style.top = top +'px';
					t.style.left = left +'px';
				
					suby = event.clientY + scrollxy['y'];
					subx = event.clientX + scrollxy['x'];
					//console.log('dragend'+t.style.top+'::'+t.style.left);
				}
			}
			
		});
		*/
		
		
		window.addEventListener('keydown',function(e){
			if( (csx==-1 && csy==-1 ) && e.ctrlKey){
				switch(e.keyCode){
				case 89:
					data.repass();
					data.redraw(maincontext);
					break;
				case 90:
					data.passback();
					data.redraw(maincontext);
					break;
				
				}
			}
			
		},false);
		
		
		data = new one_canvasdata();
		data.canvasW = maincanvas.width;
		data.canvasH = maincanvas.height;
		
		
		 $('#slider_r').slider({
			    min: 0,
			    max: h_size,
			    step: 2,
			    value: data.pass_size/100*h_size,
			    // 3スライダーの変化時にテキストボックスの値表示を更新
			    change: function(e, ui) {
			    	$('#num').val(ui.value);
			    	data.pass_size = Math.floor(ui.value/h_size * 100);
			    	if(data.pass_size == 0)data.pass_size = 1;
			     
			    	$('div.slider_r_px')[0].innerHTML = data.pass_size + "px";
			    },
			    // 4スライダーの初期化時に、その値をテキストボックスにも反映
			    create: function(e, ui) {
			    	$('div.slider_r_px')[0].innerHTML = data.pass_size + "px";
			    	$('#num').val($(this).slider('option', 'value'));
			    }
			  });
		 
		 
		 $('#slider_h').slider({
			    min: 0,
			    max: h_size,
			    step: 2,
			    value: 00,
			    // 3スライダーの変化時にテキストボックスの値表示を更新
			    change: function(e, ui) {
			      var h = ui.value/h_size;
			      rgb = hsv_to_rgb(h,1,1);//make_h(ui.value);
			      
			      $('div.colorh_box').css("background-color","rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")");
			      
			      
			      //console.log($('div.colorsv_box'));
			      $('div.colorsv_box')[0].style.background = 
			    		  "linear-gradient(to bottom, rgba(255,255,255,0.0), rgba(0,0,0,1.0))"
							+",linear-gradient(to left, rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+"), rgb(255,255,255)";
			      
			      data.hsv[0] = h;
			      data.setpasscolor();
			      
			    },
			    // 4スライダーの初期化時に、その値をテキストボックスにも反映
			    create: function(e, ui) {
			      $('#num').val($(this).slider('option', 'value'));
			    }
			  });
		 
	},false);
}

var h_size = 240.0;
//値を渡すとRGB値を返す num は0~h_sizeまで
function make_h(num){
	var R=0, G=0, B=0;
	var th = h_size/6;//6分の1サイズ
	var max = 255;
	var k = max/th;//傾き
	//R
	if(num <= th || th*5<=num)R = max;
	else if(num < th*2 )R = max - k*(num-th);
	else if(num > th*4 )R = k*(num-th*4);
	else R = 0;
	//G
	if(th<=num && num<=th*3)G = max;
	else if(num<th )G = k*num;
	else if(num<th*4 )G = max - k*(num -th*3);
	else G = 0;
	//B
	if(th*3 <= num && num <= th*5)B = max;
	else if(num>th*5)B = max - k*(num - th*5);
	else if(num>th*2)B = k*(num-th);
	else B = 0;
	
	
	var res = [Math.round(R),Math.round(G),Math.round(B)];
	console.log(res);
	return res;
}


//オリジナルパスデータ構造
function pass_data(xy,size,color,id){
	this.sx = xy[0];//始点終点
	this.sy = xy[1];
	this.ex = xy[2];
	this.ey = xy[3];
	
	this.size = size;//太さ
	this.color = color;//色
	this.id = id;//id(同一操作には同じid番号が割り振られる．)
}

/*
 * オリジナルパスデータ構造を配列にする
 */
function pass_data_fphp(passs,endid){
	var newpass = [];
	
	for(var i=0;i<endid;i++){
		var ar = new Array(passs[i].sx,passs[i].sy,passs[i].ex,passs[i].ey
				,passs[i].size,passs[i].color,passs[i].id);
		newpass[i] = ar;
	}
	
	return newpass;
}

/*
function makepass(xy,size,color){
	var pass = new pass_data();
	pass.sx = xy[0];
	pass.sy = xy[1];
	pass.ex = xy[2];
	pass.ey = xy[3];
	
	pass.size = size;
	pass.color = color;
	
	return pass;
}*/

//パスデータをcanvasに描画する //flag　trueでパスのアルファ値を利用
function draw(context,pas){
	context.beginPath();
	context.lineWidth = pas.size;
	context.lineCap = 'round';
	context.strokeStyle = pas.color;
	context.moveTo(pas.sx,pas.sy);
	context.lineTo(pas.ex,pas.ey);
	context.stroke();
}

//ボタンから呼び出される関数
function dc_pen(){
	data.modechange("pen");
}

function dc_eraser(){
	data.modechange("eraser");
}

//DLボタンをおした時の処理　ここで裏キャンバスと表キャンバスを合成したキャンバスデータから画像データを取得し，phpでサーバへ送信する準備を行う
function dlcanvas_preparation(){
	var dlcanvas = document.createElement("canvas");
	dlcanvas.width = canvas_w;
	dlcanvas.height= canvas_h;
	var dlcanvascontext = dlcanvas.getContext('2d');
	dlcanvascontext.fillStyle = 'rgb(255,255,255)';
	dlcanvascontext.fillRect(0, 0, canvas_w, canvas_h);
	
	
	var imageb = new Image();
	imageb.src = backcanvas.toDataURL('image/png');
	var imagef = new Image();
	imagef.src = maincanvas.toDataURL('image/png');
	dlcanvascontext.drawImage(imageb,0,0);
	dlcanvascontext.drawImage(imagef,0,0);
	
	var canvasdata = dlcanvas.toDataURL('image/png');
	canvasdata = canvasdata.replace(/^.*,/, '');//先頭のメタデータを省く
	$("input.DLpngpost")[0].value = canvasdata;
}

//描画キャンバスを画像化 バックキャンバスへ転写し，バックキャンバスを画像化したうえで，それをサーバへ送信という手順

function upload(){
	//canvasデータをbase64形式で吐き出し，サーバアップロードする為のvalueへ格納する
	
	var image = new Image();
	image.src = maincanvas.toDataURL('image/png');
	backcontext.drawImage(image,0,0);
	
	$('input.hidden_input')[0].value = backcanvas.toDataURL('image/png');
	
}
/*
 * <form method="post" action="draw_post.php">
					<input type="image" src="picture/export.png" 	onclick="upload();" width="52" height="52">
					<input type="hidden" class="hidden_input" name="postdata0" value="" />
				</form>
 */



//javascriptからAjax postを発生させるバージョン
function upload2(){
	//canvasデータをbase64形式で吐き出し，サーバアップロードする為のvalueへ格納する
	
	var image = new Image();
	image.src = maincanvas.toDataURL('image/png');
	backcontext.drawImage(image,0,0);
	
	$.ajax({
		type:"POST",
		url:"draw_post.php",
		data:{postdata0:backcanvas.toDataURL('image/png') },
		success: function(){
			alert("アップロード完了");
		}
	});
	
	if(eimi_flag==false){
		//エイミ
		eimi = new eimi_element(document.body);
		id = setInterval("eimi.rootin()",32);
		eimi_flag = true;
	}
	
	//仮にこの方法が成功するとして気をつけることは
	//バックキャンバスへの反映はされていなかったり，パスデータがリフレッシュされていないことに違いがある
}

/*パスデータ配列を送信するバージョン
function upload(){
	//saveImage("#maincanvas");
	//データをvalueにセットする
	//セットされた後，post処理によりphp側でセットされた情報を読む？
	console.log($('input.hidden_input')[0]);
	$('input.hidden_input')[0].value = pass_data_fphp(data.pass,data.passnum);//data.pass[data.passnum-1];
}
*/

function load(){
	//サーバから送られてきた画像データを後キャンバスへ描画する
	var image = new Image();
	
	if($('input.oldpassdata')[0]!=null){
		var sp = $('input.oldpassdata')[0].value;
		image.src = sp;
		image.onload = function(){
			backcontext.drawImage(image,0,0);
		}
	}else{
		console.log("サーバから値を取得できませんでした");
	}
	
}

/*
 * サーバからタグへupサれたパスデータを読み取って，文字列を7つ事に分割して，パスデータ構造に置き直す

function load(){
	var sp = $('input.oldpassdata')[0].value.split(",");
	var ocon = 0,passc = 0;//ひとまとまりのデータを再形成する為に取り出した回数を数える
	var xy=[],s,co="",id;
	var old_passs = [];
	//0,1,2,3座標データ 4サイズ 5,6,7,8色データ(バラバラになってる),9あくしょんid
	for(var a in sp){
		switch(ocon){
		case 0:case 1:case 2:case 3:xy[ocon] = sp[a];ocon++;break;
		case 4:s = sp[a];ocon++;break;	
		case 5:case 6:case 7:case 8:co += sp[a];ocon++;break;
		case 9:
			id = sp[a];
			var pass = new pass_data(xy,s,co,id);
			old_passs[passc] = pass;
			passc++;
			ocon=0;
			break;
		}
	}
	
	console.log(old_passs);
}
 */

preparation();
