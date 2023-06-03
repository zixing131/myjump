//文章评论

var lastCommentCi = ''

function displayComments(Ci) { //显示评论列表TODO 
	setLoading('正在加载评论...');//显示加载动画 
	url =  'http://cmt.ithome.com/api/comment/getnewscomment?sn='+getCommentSn(document.getElementById('content').className);
	
	if(Ci!=0)
	{
		url=url+'&cid='+Ci;
	}
	ajax_get(url, function(error, data) {
        if(isloading==false)
		{	//取消加载了
			return;
		}
		setLoading();
		if (error) {
			//console.log(error)
			toast("评论加载失败！"+error);
			return;
		}  else {
			var comments = [];
			data.content.clist.myforEach(function(item) {
				var itemM = item.M;
				comments.push('<li><img src="'+getHeadUrl(itemM.Ui)+'" alt="头像" onerror=\"onerror=null;src=\'img/avatar_default_rect.png\'\" />  <div><h3>'+itemM.N+' ('+itemM.SF+')</h3><p><span>'+dateline(itemM.T)+'</span><span>'+itemM.Ta+'</span></p><p>'+itemM.C+'</p></div></li>');
                var itemR = item.R;
                if(itemR)
                {
                    //添加楼中楼
                    for(var i=0;i<itemR.length;i++){
                        itemM = itemR[i];
                        comments.push('<li style="margin-left:40px"><img src="'+getHeadUrl(itemM.Ui)+'" alt="头像" onerror=\"onerror=null;src=\'img/avatar_default_rect.png\'\" />  <div><h3>'+itemM.N+' ('+itemM.SF+')</h3><p><span>'+dateline(itemM.T)+'</span><span>'+itemM.Ta+'</span></p><p>'+itemM.C+'</p></div></li>');
                    }
                } 
				lastCommentCi = item.Ci;
			});
			if(Ci!=0) { //提供了url说明是下一页
				document.getElementById('comments').innerHTML = comments.join('');
			} else {
				document.getElementById('comments').innerHTML = comments.join('');
			}
			//删掉next按钮
			var next_button_comments = document.getElementById('next_button_comments');
			if (next_button_comments) { //原来有next按钮
				next_button_comments.parentNode.removeChild(next_button_comments);
			}
            
			if (data.content.clist.length>0 && data.content.clist[data.content.clist.length-1].M.SF!="1楼") {
				document.getElementById('comments').innerHTML += '<li id="next_button_comments"><a href="javascript:displayComments(\''+lastCommentCi+'\')">下一页</a></li>'; 
			}
			else
			{
				document.getElementById('comments').innerHTML += '<div class="bottom">我们是有底线的</div>';
				
			}  
		    showById('comment');
            setScorllTop(0);
		}
	});
}

