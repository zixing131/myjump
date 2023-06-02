$(function () {
	
	/** 获取歌单详情 */
	function loadPlayListDetail(playListId){
		var url = "http://music.163.com/api/v6/playlist/detail";
		var params = {id:playListId,n:100000};
		ajax_post(url,params,function(result){
			var  playlist=JSON.parse(result).playlist;
		
			var name = playlist.name; // 歌单名称
			var coverImgUrl = playlist.coverImgUrl;// 歌单头像地址
			var creator = playlist.creator;// 歌单创建者对象
			var creatorNickName = creator.nickname; // 创建者昵称
			var avatarUrl = creator.avatarUrl;  // 创建者头像地址
			var tracks = playlist.tracks;// 歌曲列表对象
			
			$.each(tracks,function(i,musicObject){
				
			});
		})
	}
	
})