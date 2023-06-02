//启动画面

//启动界面延迟（ms）
var starttimeout=0;

//隐藏软键盘
//menu.hideSoftkeys(); 

window.onload = function() { //应用载入之后开始执行。  
    
    //设置成按键控制 
    if(window.widget && widget.setNavigationEnabled)
    {
        widget.setNavigationEnabled(false); 
    }

	var timer = setTimeout(function() {
		document.body.removeChild(getById('splash')); //关闭启动界面  
        //var mainbody = getById('mainbody');
        //mainbody.style.backgroundColor = '#ffffff'; //修改背景色
        //固定宽高（外面已经设置为100%）
        //mainbody.style.width = window.screen.width;
        //mainbody.style.height = window.screen.height;   
        $(".items").height(window.screen.height-50);
		clearTimeout(timer);
        desktopBind(); 
	}, starttimeout);
};
