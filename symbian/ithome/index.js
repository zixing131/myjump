
function loaddata()
{
	var maincontent = document.getElementById("maincontent"); 
	if(maincontent)
	{
		maincontent.style.height = window.screen.height-50;  
	}
}
loaddata()

//显示菜单栏
function showMenuBar()
{
	var menubar=document.getElementById("menubar");
	if(menubar)
	{
		menubar.style.display="block";
	}
}
//隐藏菜单栏
function hideMenuBar()
{
	var menubar=document.getElementById("menubar");
	if(menubar)
	{
		menubar.style.display="none";
	}
}


var lastscroll = 0;

window.onscroll = function() {
	var quanzi=document.getElementById("quanzi")
	var newslist = document.getElementById("newslist")
	
  if(!((quanzi&& quanzi.style.display=="block") || (newslist&& newslist.style.display=="block")))
  {
	  return;
  }
  //为了保证兼容性，这里取两个值，哪个有值取哪一个
  //scrollTop就是触发滚轮事件时滚轮的高度
  var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  console.log("滚动距离" + scrollTop);
  if(lastscroll-scrollTop>200 || scrollTop==0)
  { 
	  //向上滚动
	  showMenuBar();
	  lastscroll= scrollTop;
  }
  else if(lastscroll-scrollTop<-200){
	  //向下鼓捣弄
	  lastscroll= scrollTop;
	  hideMenuBar();
  }
  else{
	  
  }
}
