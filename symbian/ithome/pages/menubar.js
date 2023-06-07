function ClickMenu(id)
{ 
		if(id=="newslist")
		{
			document.getElementById("nav1img").src="./img/nav_ithome_hover.png";
			document.getElementById("nav2img").src="./img/nav_quan.png";
			document.getElementById("nav3img").src="./img/nav_me.png";
			document.getElementById("nav1text").className="navtextclassclick";
			document.getElementById("nav2text").className="navtextclass";
			document.getElementById("nav3text").className="navtextclass";
			
		}else if(id=="quanzi")
		{
			document.getElementById("nav1img").src="./img/nav_ithome.png";
			document.getElementById("nav2img").src="./img/nav_quan_hover.png";
			document.getElementById("nav3img").src="./img/nav_me.png";
			document.getElementById("nav1text").className="navtextclass";
			document.getElementById("nav2text").className="navtextclassclick";
			document.getElementById("nav3text").className="navtextclass";
			
			
		}else if(id == "home")
		{
			document.getElementById("nav1img").src="./img/nav_ithome.png";
			document.getElementById("nav2img").src="./img/nav_quan.png";
			document.getElementById("nav3img").src="./img/nav_me_hover.png";
			document.getElementById("nav1text").className="navtextclass";
			document.getElementById("nav2text").className="navtextclass";
			document.getElementById("nav3text").className="navtextclassclick";
			
		}else{
			document.getElementById(id).style.display = 'block';
		}
	
	showById(id);
}
