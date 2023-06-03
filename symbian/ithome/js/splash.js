//启动画面

//启动界面延迟（ms）
var starttimeout=100;
if(menu.hideSoftkey)
{
	menu.hideSoftkeys();
}  
//隐藏软键盘
//menu.hideSoftkeys(); 
function load() { //应用载入之后开始执行。    
    //设置成按键控制 
	if(widget && widget.setNavigationEnabled)
	{
		widget.setNavigationEnabled(false); 
	}
	var timer = setTimeout(function() { 
        try{
		document.body.removeChild(document.getElementById('splash')); //关闭启动界面  
		 
        var mainbody = document.getElementById('mainbody');
        mainbody.style.backgroundColor = '#eee'; //修改背景色

        //固定宽高（外面已经设置为100%）
        //mainbody.style.width = window.screen.width;
        //mainbody.style.height = window.screen.height;  
        
		clearTimeout(timer);
        desktopBind();
        loadnewslist(0);//加载新闻列表
        }catch(err)
        {
            alert(err)
        }
	}, starttimeout);
};
load();
