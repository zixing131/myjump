//文章内容
//记录最后的top
var lstarticletop=0;
//文章回车键，默认为发表评论或者登录
function articleEnterKey()
{
    //console.log('articleEnterKey');
    displayComments(0);
}

//显示文章正文
function displayArticle(item) {
	alert('displayArticle');
	lstviewtop = getScorllTop();
	setLoading('加载文章中...'); 
	item = JSON.parse(unescape(item)) 
	url = 'http://api.ithome.com/json/newscontent/' + item.newsid
	
	ajax_get(url, function (error, data) {
		if(isloading==false)
		{ 
			//已取消加载
			return;
		}
		if (error) {
			//console.log(error)
			toast("文章加载失败！");
		} else {
			setTitle(item.title);
			document.getElementById('dateline').textContent = dateline(item.postdate);
			document.getElementById('author').textContent = data.newssource + '(' + data.newsauthor + ')';
			document.getElementById('comment_num').innerHTML = '<a href="javascript:displayComments(0)">' + item.commentcount + '评</a>';
			document.getElementById('content').innerHTML = UBB(data.detail);
			document.getElementById('content').className = item.newsid;
			showById('article');  
			setScorllTop(0);
		} 
		setLoading();
	});
}
