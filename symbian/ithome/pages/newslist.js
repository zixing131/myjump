//新闻列表

//记录最后的top
var lstviewtop=0;
var lastnewsTime=0;
//新闻区域高度
document.getElementById('listinnewslist').style.height=window.screen.height-43;

function loadnewslist(hash)
{     
	if(!hash)
	{
		hash=0; 
	} 
	setScorllTop(0);
    setLoading('加载新闻列表中...'); 
	urlstart='http://api.ithome.com/json/listpage/news/';
	if(hash==0)
	{
		urlstart = 'http://api.ithome.com/json/newslist/news?r='+(new Date().getTime());
	}
	ajax_get(urlstart + hash, function (error, data) { 
		if(isloading==false)
		{	//取消加载了
			return;
		}
		setLoading();
		if (error) {
			//console.log(error)
			toast("新闻列表加载失败！"+error);
			return;
		} else {
			try{ 
			var articles = [];
			if (data.toplist) {
				data.toplist.myforEach(function (item) {
					articles.push('<li class="item" ><div class="divclick" onclick="displayArticle(\'' + escape(JSON.stringify(item)) + '\')">' + '<img  src="' + item.image.replace('https://', 'http://') + '" alt="图片" ></img>' + '<div><h3 style="color:red">[置顶]' + item.title + '</h3><p><span>' + humanedate(item.postdate) + '</span><span>' + item.commentcount + ' 评</span></p></div></div></li>');
					 
				});
			}

			data.newslist.myforEach(function (item) {
				articles.push('<li class="item" ><div class="divclick"  onclick="displayArticle(\'' + escape(JSON.stringify(item)) + '\')">' + '<img  src="' + item.image.replace('https://', 'http://') + '" alt="图片" ></img>' + '<div><h3>' + item.title + '</h3><p><span>' + humanedate(item.postdate) + '</span><span>' + item.commentcount + ' 评</span></p></div></div></li>');
				
				lastnewsTime = item.orderdate;
			});
			
			//一页只显示这么多
			document.getElementById('listinnewslist').innerHTML = articles.join('');

			//删掉next按钮
			var next_button = document.getElementById('next_button');
			if (next_button) { //原来有next按钮
				next_button.parentNode.removeChild(next_button);
			}

			if (data.newslist.length > 0) {
				document.getElementById('listinnewslist').innerHTML += '<li class="item" id="next_button"><div class="divclick"  onclick="loadnewslist(\'' + get_next(lastnewsTime) + '\')">下一页</div></li>';
			} 
			else {
				document.getElementById('listinnewslist').innerHTML += '<div class="bottom">我们是有底线的</div>';
			}

			document.getElementById('listinnewslist').innerHTML += '<div style="height:40px"></div>'; 
			
			showById('newslist');  
		}catch(err)
		{
			alert(err)
			toast("新闻列表加载失败！"+err);
		}
		}
	});
}

function getNowScorllItemIndex()
{
	var items = getClass(document,'item');  
	var top = document.body.scrollTop;
	//console.log('top',top);
	for(var i=0;i<items.length;i++)
	{
		var t=items[i];
		//console.log('t.offsetTop - top ',top - t.offsetTop  ,t.offsetTop)
		if(top - t.offsetTop  < 0)
		{ 
			return i;
		}
	}
}

var lstdowntime=undefined;
function selectByIndex(index)
{
	var items = getClass(document,'item');  
	for(var i=0;i<items.length;i++)
		{ 
			if(i==index)
			{
				items[i].className = 'item itemselected';  
			} 
			else{
				items[i].className = 'item';  
			}
		} 
}

//window.addEventListener('scroll', mainbodyscorll,true);

var nownewsindex=0; 

function getFocusIndex()
{
	var items = getClass(document,'item');  
	for(var i=0;i<items.length;i++)
	{
		var t=items[i];
		if(t.className.indexOf('itemselected')>-1)
		{
			return i;
		} 
	} 
	return -1;
}


function getFocusItem()
{
	var items = getClass(document,'item');  
	for(var i=0;i<items.length;i++)
	{
		var t=items[i];
		if(t.className.indexOf('itemselected')>-1)
		{
			return t;
		} 
	} 
	return undefined;
}

function newslistEnter()
{
	try{
	var item = getFocusItem(); 
	if(item)
	{
		var t=getClass(item,'divclick')[0]; 
		var e = document.createEvent("MouseEvents");
		e.initEvent("click", true, true);
		t.dispatchEvent(e);
	}
}catch(err)
{
	alert(err);
}
}

function newslistDown()
{
	try{

		//SetPreventDefault();
		var currentIndex =  getFocusIndex();  
		
		var items = getClass(document,'item');  
		var next = currentIndex + 1;
		if(currentIndex==-1 || next==-1)
		{
			if(nownewsindex>=0 && nownewsindex<items.length)
			{
				next = nownewsindex;
			}
			else{
				next = 0;
			}
		}
		
		if(currentIndex>=0 && currentIndex<items.length)
		{
			var nowElement = items[currentIndex];
			if(nowElement)
			{
				nowElement.className = 'item';
			}
		}
		if(next>=0 && next<items.length)
		{ 
			var targetElement = items[next];
			if(targetElement)
			{
				nownewsindex=next;  
				document.body.scrollTop =  targetElement.offsetTop - window.screen.height + 43 * 3 ;  
				targetElement.className = 'item itemselected';  
			}
		} 
		}catch(err)
		{
			alert(err)
		}

}

function newslistUp()
{
	try{

		//SetPreventDefault();
		var currentIndex =  getFocusIndex();  
		
		var items = getClass(document,'item'); 
		var next = currentIndex - 1;
		if(currentIndex==-1 || next==-1)
		{	
			if(nownewsindex>=0 && nownewsindex<items.length)
			{
				next = nownewsindex;
			}
			else{
				next = 0;
			}
		}
		
		if(currentIndex>=0 && currentIndex<items.length)
		{
			var nowElement = items[currentIndex];
			if(nowElement)
			{
				nowElement.className = 'item';
			}
		}
		if(next>=0 && next<items.length)
		{ 
			var targetElement = items[next];
			if(targetElement)
			{
				nownewsindex=next;  
				document.body.scrollTop =  targetElement.offsetTop - window.screen.height + 43 + 95 + 50;  
				targetElement.className = 'item itemselected';  
			}
		} 
		}catch(err)
		{
			alert(err)
		}
	
}
