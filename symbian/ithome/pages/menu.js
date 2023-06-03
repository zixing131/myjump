//菜单

var homemenu = ['刷新','签到','退出'];
var newslistmenu = ['刷新','登录','关于','检查新版本','退出'];
var articlemenu = ['登录','查看评论','退出'];
var quanzimenu = ['刷新','登录','关于','检查新版本','退出'];
var quanziatriclemenu = ['登录','查看评论','退出'];

//菜单列表
var menulist = {
    'home':homemenu,
    'newslist':newslistmenu,
    'article':articlemenu,
    'quanzi':quanzimenu,
    'quanziarticle':quanziatriclemenu
}

var menuClick = function()
{
    //console.log('menuClick');
}

var showMenu = function(menutype)
{
    nowmenu = undefined;
    for(var m in menulist)
    {
        if(menutype==m)
        {
            nowmenu = menulist[m];
        }
    }
    var menucontainer = document.getElementById('menucontainer');    
    showById('menu');

}

function menuUp()
{

}
function menuDown()
{

}
