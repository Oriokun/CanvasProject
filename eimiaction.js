var base_div_name = "eimi_base";

var element_list = [//描画順序
		"leftarm",
		"rightarm",
		"body",
		"head",
		"tale"
];


var pic_head=[
	"picture/eimi/facel.png",
	"picture/eimi/facef.png",
	"picture/eimi/facer.png"
];

var pic_left=[
	"picture/eimi/arm_l1.png",      
];

var pic_right=[
	"picture/eimi/arm_r0_1.png",
	"picture/eimi/arm_r0.png",
	"picture/eimi/arm_r1_0.png",
	"picture/eimi/arm_r2_0.png",
	"picture/eimi/arm_r2_1.png",
	"picture/eimi/arm_r3.png",
];

var pic_body=[
     "picture/eimi/body.png",
];

var pic_tale=[
     "picture/eimi/tale0.png",
     "picture/eimi/tale1.png",
     "picture/eimi/tale2.png",
     "picture/eimi/tale1.png",
];

function eimi_element(base){
	this.parentelement = base;
	this.elements = [];
	this.timer = 0;
	
	this.base_element = document.createElement("div");
	this.base_element.setAttribute('name',base_div_name);
	//this.base_element.setAttribute('style',"width:100px; height:100px;");
	this.base_element.style.position = "absolute";
	this.base_element.style.left = "1500px";
	this.base_element.style.top = "520px";
	this.base_element.style.width = "139px";//縮小サイズ
	this.base_element.style.height= "191px";
	
	for(var a in element_list){
		this.elements[element_list[a]] = document.createElement("img");
		this.elements[element_list[a]].setAttribute('name',element_list[a]);
		this.elements[element_list[a]].style.position = "absolute";
		this.elements[element_list[a]].style.width = "100%";
		this.elements[element_list[a]].style.height= "100%";
		this.base_element.appendChild(this.elements[element_list[a]]);
	}
	
	this.elements["head"].setAttribute('src',pic_head[0]);
	this.elements["leftarm"].setAttribute('src',pic_left[0]);
	this.elements["rightarm"].setAttribute('src',pic_right[0]);
	this.elements["body"].setAttribute('src',pic_body[0]);
	this.elements["tale"].setAttribute('src',pic_tale[0]);
	
	this.parentelement.appendChild(this.base_element);
	this.talei = 0;
	this.talespeed = 12;
	this.righti = 0;
	this.armspeed = 6;
	this.mode = 0;
	this.mode_arm = 1;
	this.mode_head = 1;//0左 1真ん中 2右
	this.mode_tale = 1;
	
	//this.base_element.style.visibility = "hidden";
}
eimi_element.prototype.hiddenswitch = function(st){
	this.base_element.style.visibility = st;
}


eimi_element.prototype.rootin = function(){
	this.timer++;
	//console.log(this.timer);
	if(this.timer % 60 == 0){
		this.mode = Math.floor(Math.random()*7);
	}
	
	
	switch(this.mode){
	case 0://右を向いてしっぽを振る
		this.mode_head = 2;
		this.mode_tale = 1;
		this.tale_speed = 12;
		this.arm_speed = 8;
		this.mode_arm = 0;//手を止める
		break;
	case 1://左を向いてしっぽを振る
		this.mode_head = 0;
		this.mode_tale = 1;
		this.tale_speed = 12;
		this.arm_speed = 10;
		this.mode_arm = 0;//手を止める
		break;
	case 2://正面で全力フリフリ
		this.mode_head = 1;
		this.mode_tale = 1;
		this.tale_speed = 6;
		this.arm_speed = 3;
		this.mode_arm = 4;
		break;
		
	case 3://
		this.mode_arm = 1;
		break;
	case 4://
		this.mode_arm = 2;
		break;
	case 5://
		this.mode_arm = 3;
		break;
	case 6://
		this.mode_tale = 0;
		break;
	}
	
	
	if(this.mode_tale == 1 && this.timer%this.tale_speed == 0){
		
		if(this.talei==3)this.talei=0; else this.talei++;
		this.elements["tale"].setAttribute('src',pic_tale[this.talei]);
	}
	
	switch(this.mode_head){
	case 0:this.elements["head"].setAttribute('src',pic_head[0]);break;
	case 1:this.elements["head"].setAttribute('src',pic_head[1]);break;
	case 2:this.elements["head"].setAttribute('src',pic_head[2]);break;
	
	}
	
	switch(this.mode_arm){
	case 1://上に伸ばしてカキカキ
		if(this.timer%this.armspeed==0){
			this.righti++;
			if(this.righti%2==0)this.elements["rightarm"].setAttribute('src',pic_right[0]);
			else this.elements["rightarm"].setAttribute('src',pic_right[1]);
		}
	break;
	case 2://右にカキカキ
		if(this.timer%this.armspeed==0){
			this.righti++;
			if(this.righti%2==0)this.elements["rightarm"].setAttribute('src',pic_right[4]);
			else this.elements["rightarm"].setAttribute('src',pic_right[3]);
		}
	break;
	case 3://上下にカキカキ
		if(this.timer%this.armspeed==0){
			this.righti++;
			if(this.righti%2==0)this.elements["rightarm"].setAttribute('src',pic_right[1]);
			else this.elements["rightarm"].setAttribute('src',pic_right[2]);
		}
	break;
	case 4://正面
		if(this.timer%this.armspeed==0){
			this.righti++;
			this.elements["rightarm"].setAttribute('src',pic_right[5]);
		}
	break;
	
	}
	
}
