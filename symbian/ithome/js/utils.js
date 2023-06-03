//小工具 
Array.prototype.myforEach = function myforEach(val, i) {
	for (var i = 0; i < this.length; i++) {
		val.call(window, this[i], i, this);
	}
};

var leftsoftfunc = undefined;
var rightsoftfunc = undefined;	 
var enterfunc = undefined;	
var leftfunc = undefined;	
var topfunc = undefined;	
var rightfunc = undefined;	
var downfunc = undefined;	
 
function getClass(obj,sClass){ 
	var aResult = []; 
	if('getElementsByClassName' in document){
		aResult = obj.getElementsByClassName(sClass);
	}
	else{  
		var aEle = obj.getElementsByTagName('*'); 
		for( var i=0; i<aEle.length; i++ ){ 
			var str = aEle[i].className; 
			if(str.indexOf(sClass)!=-1){ 
				aResult.push(aEle[i]);
			}
		}
	}
	return aResult;
}

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
	'#':35
}


function UBB(str) { 
	str = str.replace(/\[flash=(\d{2,3}),(\d{2,3})\](.+?)\[\/flash\]/mg,'<embed src="$3" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" wmode="opaque" width="$1" height="$2"></embed>');
	str = str.replace(/\[img\](.+?)\[\/img\]/mg,'<img src="$1" alt="图片" />');
	str = str.replace(/\[img=(.+)\](.+?)\[\/img\]/mg,'<figure><img src="$2" alt="图片" /><figcaption>$1</figcaption></figure>');
	str = str.replace(/\[p\]((.|\n)+?)\[\/p\]/mg,'<p>$1</p>');
	str = str.replace(/\[h2\](.+?)\[\/h2\]/mg,'<h2>$1</h2>');
	str = str.replace(/\[center\](.+?)\[\/center\]/mg,'<span class="UBB_center">$1</span>');
	str = str.replace(/\[b\](.+?)\[\/b\]/mg,'<strong>$1</strong>');
	str = str.replace(/\[a=(.+?)\](.+?)\[\/a\]/mg,'<a href="$2">$1</a>');
	str = str.replace(/\[a\](.+?)\[\/a\]/mg,'<a href="$1">$1</a>');
	str = str.replace(/\[download=(.+)\](.+?)\[\/download\]/mg,'<a href="/download?url=$2">$1</a>');
	str = str.replace(/https/mg,'http'); 
	str = str.replace(/\<pre.*?>(.*?)\<\/pre\>/mg,'<div style="margin:10px;color:darkblue;">$1</div>');//这里是代码展示的，替换为div
	return str;
}
 
function dateline(datetime) {
	return datetime.split('.')[0].replace('T',' ');
}

function humanedate(datetime) {
	datetime = datetime.split('.')[0];
	datetime = datetime.replace(/-/g,'/');
	datetime = datetime.replace('T',' ');  
	var nowtime = new Date();
	var timestamp = new Date(datetime);
	var cha = (nowtime - timestamp)/1000
	 if(cha<180){
        return "刚刚";
    }else if(cha<3600 && timestamp.getDate()==nowtime.getDate()){
        return PrefixInteger(timestamp.getHours(),2)+':'+PrefixInteger(timestamp.getMinutes(),2);
    }else if(cha<86400 && timestamp.getDate()==nowtime.getDate()){
        return PrefixInteger(timestamp.getHours(),2)+':'+PrefixInteger(timestamp.getMinutes(),2);
    }else if(cha<172800 && timestamp.getDate()==nowtime.getDate()-1){
        return "昨天 "+PrefixInteger(timestamp.getHours(),2)+':'+PrefixInteger(timestamp.getMinutes(),2);
    }
	//else if(cha<259200){
    //    return "前天 "+PrefixInteger(timestamp.getHours(),2)+':'+PrefixInteger(timestamp.getMinutes(),2);
    //}
	//else if(cha<345600){
    //    return Math.floor(cha/86400)+" 天前";
    //}
	else{
        return timestamp.getFullYear()+'-'+(timestamp.getMonth()+1)+'-'+timestamp.getDate();
    }
}


function ajax(method, url, data, callback, progress, type) {
	method = method.toUpperCase();
	type = type || 'json';
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (isloading === 0) {
			return;
		};
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				if (type === 'xml') {
					callback(false, xhr.responseXML);
				} else if (type === 'json') {
					try {

						var text = eval('(' + xhr.responseText + ')');
						if (text.error) {
							callback(text.error);
						} else {
							callback(false, text);
						}
					} catch (e) {
						callback(e.message);
					}
				} else {
					callback(false, xhr.responseText);
				}
			} else {
				callback(xhr.status + xhr.responseText);
			}
		}
	};
	if (data) {
		var urlstr = [];
		for (var i in data) {
			urlstr.push(i + '=' + encodeURIComponent(data[i]));
		}

		data = urlstr.join('&');
		if ((method === 'GET' || method === 'DELETE') && data) {
			url += /\?/.test(url) ? '&' + data : '?' + data;
		}
	}
	xhr.open(method, url, true);
	if (method === 'POST') {
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	}
	xhr.send(data);
}
function ajax_delete(url, callback) {
	ajax('DELETE', url, {}, callback, null, 'json');
}
function ajax_get(url, callback, type) {
	ajax('GET', url, {}, callback, null, type);
}
function ajax_post(url, data, callback, progress) {
	ajax('POST', url, data, callback, progress, 'json');
}

function ajax_post2(url, data, callback, progress) {
	ajax('POST', url, data, callback, progress, 'txt');
}

function ajax_put(url, data, callback) {
	ajax('PUT', url, data, callback, null, 'json');
}


//显示菜单之前最后的id
var menubeforeid=undefined;

var isshowfloatplayer = false;

//通过名称获取元素 
function getByName(name) {
	return document.getElementsByName(name);
}

function setTitle(str) { //设置标题栏
	document.getElementById('topic').textContent = str || 'IT之家-新闻资讯';
}

var idlist = ['home','article','comment','newslist','about','menu','quanzi','quanziarticle']
var isshowmenu=false;

function showById(id)
{
	if(id=='menu')
	{
		menubeforeid = lstshowid;
		document.getElementById(id).style.display = 'block';
		lstshowid=id;
		//document.getElementById('app').style.overflow='hidden';
		isshowmenu=true;
		return;
	}
	if((id=='quanzi' || id=='home') && lstshowid=='newslist')
	{
		lstviewtop = getScorllTop(); 
	}
	if(id=='comment' && lstshowid=='article')
	{
		lstarticletop = getScorllTop(); 
	}
	isshowmenu=false;
	
	var mainframe=document.getElementById('mainframe')
	
/* 	if(id=="newslist")
	{
		mainframe.src="pages/newslist.html";
	}else if(id=="quanzi")
	{
		mainframe.src="pages/quanzi.html";
		
	}else if(id == "home")
	{
		mainframe.src="pages/home.html";
	}else{ */
		document.getElementById(id).style.display = 'block';
	//}
	
	lstshowid=id;
	for(var i=0;i<idlist.length;i++)
	{
		var nowid = idlist[i]; 
		if(nowid!=id)
		{
			hideById(nowid);
		}
	}
	if(id=='newslist')
	{
		setScorllTop(lstviewtop); 
	}
	if(id=='article')
	{
		setScorllTop(lstarticletop);
	}
	//document.getElementById('app').style.overflow='visible';
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

function setScorllTop(value)
{
	document.body.scrollTop=value;
}

function getScorllTop()
{
	return document.body.scrollTop;
}

function hideById(id)
{
	var element = document.getElementById(id);
	if(element)
	{ 
		document.getElementById(id).style.display = 'none';
	}
}

var lsttimeout=undefined;
//toast提示
function toast(msg,timeout)
{
	if(!timeout)
	{
		timeout=2000;
	}
	if(lsttimeout)
	{
		clearTimeout(lsttimeout);
	} 
	document.getElementById('toast').style.display='block';
	document.getElementById('toasttext').innerText = msg;
    lsttimeout = setTimeout(function() {
		document.getElementById('toast').style.display='none';
		document.getElementById('toasttext').innerText = '';
	}, timeout);
}

var isloading = false;
//设置加载信息
function setLoading(loadingtext) {
	if (loadingtext) {
		//document.getElementById('app').style.overflow='hidden';
		isloading = true;
		document.getElementById('loading').style.display = 'block';
		document.getElementById('loadingtext').innerText = loadingtext;
	}
	else { 
		//document.getElementById('app').style.overflow='visible';
		isloading = false;
		document.getElementById('loading').style.display = 'none';
		document.getElementById('loadingtext').innerText = ''; 
    }
}

//设置左键名称和函数
function setLeftSoftkeyLabel(name,func)
{ 
    //menu.setLeftSoftkeyLabel(name, func); 
	leftsoftfunc=func;
}

//设置右键名称和函数
function setRightSoftkeyLabel(name,func)
{
	menu.setRightSoftkeyLabel(name, func);
	rightsoftfunc=func;
}

//设置确定函数
function setEnterfunc(func)
{ 
	enterfunc=func; 
} 
function setleftfunc(func)
{ 
	leftfunc=func;
} 
function settopfunc(func)
{ 
	topfunc=func;
} 
function setrightfunc(func)
{ 
	rightfunc=func;
} 
function setdownfunc(func)
{ 
	downfunc=func;
}

function showExit()
{
	alert('exit?');
}

var lste=undefined;
//阻止事件路由
function SetPreventDefault()
{
	if(lste)
	{
		lste.preventDefault();  
	} 
}



function mainbodyscorlldown()
{
	lstdowntime = new Date().getTime();
}

//主页面滚动的时候，要一起动
function mainbodyscorllup()
{
	if(!lstdowntime)
	{
		return;
	}

	var nowtime = new Date().getTime();
	if(nowtime-lstdowntime<500)
	{
		//非长按不触发
		return;
	}
 
	//alert(document.body.scrollTop);
	var items = document.getElementsByClassName('item');  
	var item = getNowScorllItemIndex();
	
	for(var i=0;i<items.length;i++)
	{ 
		if(i==item)
		{
			items[i].className = 'item itemselected';  
			//console.log(items[i],items[i].className)
		} else{
			items[i].className = 'item';  
		}
	}
}

function handleKeydown(e) {
	lste=e; 
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
		}
		else{
			//alert(e.keyCode);
			switch(e.keyCode) {
				case keycodes.ok:
					if(enterfunc){enterfunc();} 
					break;
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
		}
	}

function desktopBind() {  
   
		if(isdesk)
		{ 
			document.addEventListener('keydown', handleKeydown);
		}
		else{   
			document.addEventListener('keypress', handleKeydown);   
			document.addEventListener('keydown', mainbodyscorlldown); 
			document.addEventListener('keyup', mainbodyscorllup); 
		} 
}
