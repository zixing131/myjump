//关于

//当前版本
var nowversion = '0.0.3.0'

var info = { //应用属性
	appname: 'IT之家s60v3客户端',
	version: nowversion,
	summary: '“IT之家”是业内领先的IT资讯和数码产品类网站。IT之家快速精选泛科技新闻，分享即时的IT业界动态和紧跟潮流的数码产品资讯，提供给力的PC和手机技术文章、丰富的系统应用美化资源，以及享不尽的智能阅读。',
	thanks: '感谢塞班s60v3吧吧群(群号:140369358)的小伙伴们一直以来的支持~',
	website: 'www.ithome.com'
};

document.getElementById('aboutdiv').innerHTML = '<h3>'+info.appname+'</h3><p>版本：'+info.version+'</p><p>简介：'+info.summary+'</p><p>感谢：'+info.thanks+'</p><p>官方网站：'+info.website+'</p>';
