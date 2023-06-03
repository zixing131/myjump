function replaceHttpsUrl(url)
{
	return url.replace("https://","http://");
}
 
//小工具
var leftsoftfunc = function()
{
	leftmenuclick();
};

var rightsoftfunc = function()
{
	rightmenuclick();
};
var enterfunc =  function()
{
	if (!menuOpen) {
		var items = document.querySelectorAll('.itemfocus');
		if(items.length>0)
		{
			$(items[0]).click();
		} 
    }
    else {
        menuOpen = false;
        restoreMenuState();
        $("#menu").css('display', 'none');
        var items = document.querySelectorAll('.itemfocus');
        if(items.length>0)
        {
            $(items[0]).click();
        } 
    }  
};
var leftfunc =   function()
{
	tab(-1);
};
var topfunc =  function()
{
	nav(-1);
};
var rightfunc =  function()
{
	tab(1);
};
var downfunc = function()
{
	nav(1);
};

//最后显示的id
var lstshowid = 'home1';

var keycodes = {
	'ok':63557,
	'up':63497,
	'down':63498,
	'left':63495,
	'right':63496,
	'delete':8,
	'call':63586,
	'1':49,
	'2':50,
	'3':51,
	'4':52,
	'5':53,
	'6':54,
	'7':55,
	'8':56,
	'9':57,
	'0':48,
	'*':42,
	'#':35,
}

//显示菜单之前最后的id
var menubeforeid=undefined;

var isshowfloatplayer = false;
//通过id获取元素
function getById(id) {
	return document.getElementById(id);
}

//通过名称获取元素
function getByName(name) {
	return document.getElementsByName(name);
}


var idlist = ['home1','home2','home3','player','playlist','about','floatplayer','menu']
function showById(id)
{
	if(id=='menu')
	{
		menubeforeid = lstshowid;
		document.getElementById(id).style.display = 'block';
		lstshowid=id;
		return;
	}
	document.getElementById(id).style.display = 'block';
	lstshowid=id;
	for(var i=0;i<idlist.length;i++)
	{
		var nowid = idlist[i];
		if(nowid == 'floatplayer')
		{
			//悬浮播放器
			if(isshowfloatplayer==false)
			{
				hideById(nowid);
			}
		}
		else if(nowid!=id)
		{
			hideById(nowid);
		}
	}
}

//返回上一个页面
function showLstId()
{
	showById(lstshowid);
}

//获取当前所在页面
function getNowId() {
	return lstshowid;
}


function hideById(id)
{
	document.getElementById(id).style.display = 'none';
}

var lsttimeout=undefined;
//toast提示
function toast(msg)
{
	if(lsttimeout)
	{
		clearTimeout(lsttimeout);
	} 
	getById('toast').style.display='block';
	getById('toasttext').innerText = msg;
    lsttimeout = setTimeout(function() {
		getById('toast').style.display='none';
		getById('toasttext').innerText = '';
	},2000);
}
//设置左键名称和函数
function setLeftSoftkeyLabel(name,func)
{
    menu.setLeftSoftkeyLabel(name, func); 
	leftsoftfunc=func;
}
//menu.showSoftkeys()
//设置右键名称和函数
function setRightSoftkeyLabel(name,func)
{
	menu.setRightSoftkeyLabel(name, func);
	rightsoftfunc=func;
}
setRightSoftkeyLabel("右键",rightmenuclick)
setLeftSoftkeyLabel("左键",leftmenuclick)

function showExit()
{
	alert('exit?');
}

var desktopBind = function() { 
	//if(isDesktop()==true)
	//{ 
		//e.preventDefault();
		var handleKeydown = function(e) {    
			//alert(e.key)
			if(isdesk)
			{
				var event = e || window.event;
				//alert(event.key)
				switch(event.key) {
					case 'Q':
					case 'q':
					case 'SoftLeft':
						if(leftsoftfunc){leftsoftfunc();}
						break;
					case 'E':
					case 'e':
					case 'SoftRight':
						if(rightsoftfunc){rightsoftfunc();}
						break; 
					case 'Enter':
						if(enterfunc){enterfunc();}
						break;
					case 'ArrowUp':
						if(topfunc){topfunc();}
						break;
					case 'ArrowDown':
						if(downfunc){downfunc();}
						break;
					case 'ArrowRight':
						if(rightfunc){rightfunc();}
						break;
					case 'ArrowLeft':
						if(leftfunc){leftfunc();}
						break;
				}
				event.preventDefault();
			}
			else{
				//alert(e.keyCode);
				switch(e.keyCode) {
					case keycodes.ok:
						if(enterfunc){enterfunc();}
					case keycodes.left:
						if(leftfunc){leftfunc();}
						break;
					case keycodes.right:
						if(rightfunc){rightfunc();}
						break;
					case keycodes.up:
						if(topfunc){topfunc();}
						break;
					case keycodes.down:
						if(downfunc){downfunc();}
						break;
				}
				e.preventDefault();
			}
		} 
		if(isdesk)
		{ 
			document.addEventListener('keydown', handleKeydown);
		}
		else{
			document.addEventListener('keypress', handleKeydown);   
		}
	//}
}
