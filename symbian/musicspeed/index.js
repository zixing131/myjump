var menuOpen = false, total = 0, page = 1,tab_location=1;
$(function () {
    load(); 
});
function load() {
    page = 1;
    total = 0;
    $('.items').empty();
    $('#softkey-left').text('菜单');
    $('#softkey-center').text('');
    $('#softkey-right').text('播放器');
    loadData(); 
}

function loadData()
{
    if(tab_location==1)
    {
        loadNews() 
    }
    else if(tab_location==2)
    {
        loadRecommend() 
    }
    else if(tab_location==3)
    {
        loadNeweast() 
    }
    else if(tab_location==0)
    {
        loadUser() 
    }
}
//最新
function loadNeweast() {
    var url = 'http://music.163.com/api/v2/banner/get';
    var content = {clientType:'pc'};
    ajax_post2(url, content,function(s,result){  
    result=JSON.parse(result)
    if (result.code == 200) {
        var arr = result.banners;
        for (var index = 0; index < arr.length; index++) {
            var desc =  arr[index].typeTitle , id = arr[index].encodeId;
            var html = '<div class="item" onclick="clickitem('+total+')" tabIndex="' + total + '" data-id="' + id + '"><img class="ver" src="' + replaceHttpsUrl(arr[index].imageUrl) + '?param=210y75&quality=100" />' 
            + '</p><p class="desc">' + desc + '</p></div>';
            $('.items').append(html);
            total++;
        } 
        var items = document.querySelectorAll('.item');
        $(items[0]).addClass("itemfocus")
        
    }
    else {
        alert('获取数据失败' + result.message);
    } 
    }); 
}
function convertToWan(num)
{
    if(num>=10000)
    { 
       return  (num/10000).toFixed (1)+"万";
    }
    return num
}

//推荐
function loadRecommend() {
    var url = 'http://music.163.com/api/personalized/playlist';
    var content = {limit:'10'};
    ajax_post2(url, content,function(s,result){  
    result=JSON.parse(result)
    if (result.code == 200) {
        var arr = result.result;
        for (var index = 0; index < arr.length; index++) {
            var name = arr[index].name;
            var trackCount=arr[index].trackCount;
            trackCount=trackCount+"首"
            var playCount=arr[index].playCount;
            playCount = convertToWan(playCount)
            var id= arr[index].id;
            
            var html = '<div class="item" onclick="clickitem('+total+')" tabIndex="' + total + '" data-id="' + id + '"><img class="pic" src="' + replaceHttpsUrl(arr[index].picUrl) + '?param=75y75&quality=100" />' 
            + '</p><p class="playCount">' + playCount + '</p> <div class="divright"> <div class="divrighttext"> '+name+' </div> <div class="divrightcount"> '+trackCount+' </div>  </div> </div>';
            $('.items').append(html);
            total++;
        } 
        var items = document.querySelectorAll('.item');
        $(items[0]).addClass("itemfocus")
        
    }
    else {
        alert('获取数据失败' + result.message);
    } 
    });
   
}
//用户
function loadUser()
{

}
//动态
function loadNews() {
    var url = 'http://music.163.com/api/v2/banner/get';
    var content = {clientType:'pc'};
    ajax_post2(url, content,function(s,result){  
    result=JSON.parse(result)
    if (result.code == 200) {
        var arr = result.banners;
        for (var index = 0; index < arr.length; index++) {
            var desc =  arr[index].typeTitle , id = arr[index].encodeId;
            var html = '<div class="item" onclick="clickitem('+total+')" tabIndex="' + total + '" data-id="' + id + '"><img class="ver" src="' + replaceHttpsUrl(arr[index].imageUrl) + '?param=210y75&quality=100" />' 
            + '</p><p class="desc">' + desc + '</p></div>';
            $('.items').append(html);
            total++;
        } 
        var items = document.querySelectorAll('.item');
        $(items[0]).addClass("itemfocus")
        
    }
    else {
        alert('获取数据失败' + result.message);
    } 
    });
   
}

function clickitem(index)
{
    var items = document.querySelectorAll('.item');
    for(var i =0;i<items.length;i++)
    {
        if(i==index)
        {
            $(items[i]).addClass("itemfocus")
        }
        else{
            $(items[i]).removeClass("itemfocus")
        }
    } 
    //$(items[index]).click()
    items[index].focus()
}

function refreshList()
{
    alert("refreshList")
}

function exitEvent()
{
    alert("exitEvent")
}

function aboutEvent()
{
    alert("aboutEvent")
}
function searchList()
{
    alert("searchList")
}

function searchSong()
{
    alert("searchSong")
}

const mainMenuList = [
    {name:"1.刷新",evt:"refreshList()"},
    {name:"2.搜索歌单",evt:"searchList()"},
    {name:"3.搜索歌曲",evt:"searchSong()"},
    {name:"4.关于",evt:"aboutEvent()"},
    {name:"5.退出",evt:"exitEvent()"}, 
]


function selectType() {
    var child = $(document.activeElement).children();
    var index = $(document.activeElement).attr('data-index');
    var total = child.length;
    if (typeof index != 'undefined') {
        index = parseInt(index);
        index++;
    }
    else
        index = 0;
    if (index >= total) index = 0;
    $(child).removeClass('select');
    $(child[index]).addClass('select');
    var scrollLeft = $(child[index]).width() * index;
    document.activeElement.scroll(scrollLeft, 0);
    var id = $(child[index]).attr('data-id');
    $(document.activeElement).attr('data-id', id);
    $(document.activeElement).attr('data-index', index);
}

var leftstate =""
var centerstate =""
var rightstate =""

function saveMenuState()
{
    leftstate = $('#softkey-left').text()
    centerstate = $('#softkey-center').text()
    rightstate = $('#softkey-right').text()
}

function restoreMenuState()
{
    $('#softkey-left').text(leftstate)
    $('#softkey-center').text(centerstate)
    $('#softkey-right').text(rightstate)
}

function leftmenuclick()
{
    if (!menuOpen) {
        menuOpen = true;
        saveMenuState();
        $('#softkey-left').text('选择');
        $('#softkey-center').text('');
        $('#softkey-right').text('返回');
        showMenu(mainMenuList);
        $("#menu").css('display', 'block');
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
}
function rightmenuclick()
{  
    if(menuOpen)
    {
        menuOpen = false;
        restoreMenuState();
        $("#menu").css('display', 'none');
    }else{

    } 
}

function getCurrIndex(items)
{
    for(var i =0;i<items.length;i++)
    {  
        if($(items[i]).hasClass("itemfocus"))
        {
            return i;
        }
    } 
    return -1;
}

var tab_location = 1;
function nav(move) {
    if (menuOpen === true) { 
       
        var items = document.querySelectorAll('.menuitem');
        var cur = getCurrIndex(items);
        var next = cur+move;
        if(next>=items.length)
        {
            next=0;
        }
        if(next<0)
        {
            next = items.length-1;
        } 
        for(var i =0;i<items.length;i++)
        {
            if(next==i)
            {
                $(items[i]).addClass("itemfocus")
            }
            else{
                $(items[i]).removeClass("itemfocus")
            }
        } 
    }
    else {
        var items = document.querySelectorAll('.item');
        var cur = getCurrIndex(items);
        var next = cur+move;
        if(next>=items.length)
        {
            next=0;
        }
        if(next<0)
        {
            next = items.length-1;
        } 
        for(var i =0;i<items.length;i++)
        {
            if(next==i)
            {
                $(items[i]).addClass("itemfocus")
            }
            else{
                $(items[i]).removeClass("itemfocus")
            }
        }   

        //$(".items")[0].scrollTo(0 , items[next].offsetTop) 
        ScrollInto($(".items")[0],items[next])
    }
}

function ScrollInto(father,view)
{    
    view.scrollIntoViewIfNeeded();
    //father.scrollTo(0 , view.offsetTop) 
    return;
    var fatherBox = father.getBoundingClientRect()
    var viewBox = view.getBoundingClientRect()
    console.log(fatherBox,viewBox)
    
    if(viewBox.y>0 && viewBox.y+viewBox.height<fatherBox.height)
    {
        view.focus()
        return;
    }

    isup=0

    if(viewBox.y<=0)
    {
        isup=1
    }
    if(isup)
    {
        father.scrollTo(0 , view.offsetTop) 
    }
    else{
        father.scrollTo(0 , view.offsetTop-(fatherBox.height - viewBox.height-50))
    }
    view.focus()
}

function tab(move) {
    if (menuOpen === false) {
        var currentIndex = parseInt($('.focustab').attr('tabIndex'));
        var next = currentIndex + move;
        if (next > 3) next = 0;
        if (next < 0) next = 3
        var items = $('.tab')[0].querySelectorAll('li');
        var targetElement = items[next];
        if (targetElement) {
            $('.focustab').attr("class", "");
            targetElement.className = "focustab";
            tab_location = next;
            load();
        }
    }
}
function tabClick(index)
{ 
    var next = index; 
    var items = $('.tab')[0].querySelectorAll('li');
    var targetElement = items[next];
    if (targetElement) {
        $('.focustab').attr("class", "");
        targetElement.className = "focustab";
        tab_location = next;
        load();
    }
}