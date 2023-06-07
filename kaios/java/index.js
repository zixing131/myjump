

mainmenulist = [
    ["安装JAR",'installJar',],
    ["关于",'about',],
    ["退出",'exit'],
]

var onUploadFile = function(e){
    const _files = e.target.files;
    if (_files.length == 0) {
        return;
    }
    const _file = _files[0];  
    if(!_file.name.toLowerCase().endsWith('.jar'))
    {
        alert("只能上传jar格式!");
        return;
    }
    //fs.createUniqueFile("/Phone",_file.name,_file);
    const reader = new FileReader();
    reader.readAsArrayBuffer(_file);
    reader.onload = function(readRes){
        JARStore.installJAR(_file.name,readRes.target.result).then
        (
            ()=>{ 
                alert(_file.name+"安装成功！"); 
                refreshGameList();
        },  
            (errname)=>{
                alert(errname+"安装失败！"); 
            }
            );	
    document.getElementById("jarFileupload").value= null;
    }    
}

function loadMenu()
{
    var menuitems = document.getElementById("menuitems")
    if(menuitems)
    {
        var menus = [];

        for(var i=0;i<mainmenulist.length;i++)
        {
            var nowitem = mainmenulist[i];
            var title = nowitem[0];
            var actionnow = nowitem[1];
            menus.push(' <div class="menuitem" focusable onclick="'+actionnow+'()" >' + title + '</div>');
            
        }
        menuitems.innerHTML = menus.join('');
    }
} 

function installJar()
{
    document.getElementById("jarFileupload").click();
    var menu = document.getElementById("menu");
    menu.style.display="none"; 
    restoreMenuName();
}

function refreshGameList()
    {
        JARStore.getAll().then(
            (files)=>{ 
                var applist=document.getElementById('applist'); 
                var listapp = [];
                for(var i=0;i<files.length;i++)
                {
                    var f=files[i];
                    //console.log(f.jarName);
                    //JARStore.loadJAR(f.jarName);
                    listapp.push(' <div class="menuitem" focusable>' + f.jarName + '</div>');
                } 
                applist.innerHTML = listapp.join('');
            },
            (err)=>{
                alert(err);
            }
        );
    }

function loadLocalJar()
{
    
    var localjars=document.getElementById('localjars');
    if(localjars.options.length==0)
    {
        alert("请先上传jar!");
        return;
    }
    if(localjars.selectedIndex<0 || localjars.selectedIndex>=localjars.options.length)
    {
        alert("请选择jar名称!");
        return;
    }
    var jarname = localjars.options[localjars.selectedIndex].text;
    console.log(jarname);
    openJar(jarname,"",1);
    
}

window.addEventListener("load", () => { 
    document.getElementById("jarFileupload").addEventListener("change", onUploadFile); 
    refreshGameList(); 
})

function about()
{ 
    var menu = document.getElementById("menu");
    menu.style.display="none";  
    showDialog("关于","kaios版本的j2me模拟器客户端  made by zixing！",closeDialog,closeDialog); 
}

function nav(d)
{
    var alertDialog = document.getElementById("alertDialog");
    if(alertDialog && alertDialog.style.display!="none")
    {
        var alerttext=document.getElementById("alerttext");
        var scrdata = d*20;
        alerttext.scrollTop+=scrdata;
    }

}

var lastEventLeft=undefined;
var lastEventRight=undefined;
var lastEventCenter=undefined;

//当前左右按键定义的函数
var nowEventLeft=lastEventLeft; 
var nowEventRight=lastEventRight;
var nowEventCenter=lastEventCenter;

//显示提示框
function showDialog(title,content,acceptevent,cancelevent)
{
    var alertheader=document.getElementById("alertheader")
    var alerttext=document.getElementById("alerttext")
    alertheader.innerText=title;
    alerttext.innerText = content;
    saveMenuName();
    setLeftKeyName("确定");
    setCenterKeyName("");
    setRightKeyName("取消"); 


    var alertDialog = document.getElementById("alertDialog")
    alertDialog.style.display = "block";

    saveEvent();

    nowEventLeft = acceptevent;
    nowEventRight = cancelevent; 
    nowEventCenter = acceptevent;

}

function saveEvent()
{
    lastEventLeft=nowEventLeft;
    lastEventRight=nowEventRight;
    lastEventCenter=nowEventCenter;
}
function restoreEvent()
{
    nowEventLeft=lastEventLeft; 
    nowEventRight=lastEventRight;
    nowEventCenter=lastEventCenter;
}
function closeDialog()
{
    var alertheader=document.getElementById("alertheader")
    var alerttext=document.getElementById("alerttext")
    alertheader.innerText="";
    alerttext.innerText = "";
    var alertDialog = document.getElementById("alertDialog")
    alertDialog.style.display = "none";    
    restoreMenuName(); 
    restoreEvent();
}

function tab(d)
{

}

function setLeftKeyName(name)
{
    var element = document.getElementById("softkeyleft")
    if(element)
    {
        element.innerText = name;
    }
}


function setCenterKeyName(name)
{
    var element = document.getElementById("softkeycenter")
    if(element)
    { 
        element.innerText = name;
    }
}

function setRightKeyName(name)
{
    var element = document.getElementById("softkeyright")
    if(element)
    { 
        element.innerText = name;
    }
}

var lastleft="";
var lastcenter="";
var lastright="";
function saveMenuName()
{
    var softkeyleft = document.getElementById("softkeyleft")
    
    var softkeycenter = document.getElementById("softkeycenter")
    
    var softkeyright = document.getElementById("softkeyright")

    lastleft=softkeyleft.innerText;
    lastcenter=softkeycenter.innerText;
    lastright=softkeyright.innerText;
     
}

function restoreMenuName()
{
    var softkeyleft = document.getElementById("softkeyleft")
    
    var softkeycenter = document.getElementById("softkeycenter")
    
    var softkeyright = document.getElementById("softkeyright")

    softkeyleft.innerText = lastleft;
    softkeycenter.innerText = lastcenter;
    softkeyright.innerText =lastright;
     
}


function softleft()
{
    if(nowEventLeft)
    {
        nowEventLeft();
        return;
    }
    var menu = document.getElementById("menu");
    if(menu)
    {
        if(menu.style.display=="block")
        { 
            menu.style.display="none"; 
            restoreMenuName();
            var fc = document.getElementsByClassName("focus");
            if(fc && fc.length>0)
            {
                fc[0].click();
            }
        }
        else {
            loadMenu();
            saveMenuName();
            menu.style.display="block";    
            focusable.requestFocus(document.getElementsByClassName('menuitem')[0])
            setLeftKeyName("选择");
            setCenterKeyName("");
            setRightKeyName("返回"); 

        }
    }
}

function softcenter()
{
    if(nowEventCenter)
    {
        nowEventCenter();
        return;
    }
}

function exit(){
    var menu = document.getElementById("menu");
        menu.style.display="none";  
        
    showDialog("确认","是否确认退出？",()=>{
        alert("退出应用!");
        closeDialog();
    },()=>{closeDialog()});
}

function softright()
{
    if(nowEventRight)
    {
        nowEventRight();
        return;
    }
    var menu = document.getElementById("menu");
    if(menu)
    {
        if(menu.style.display=="block")
        {
            restoreMenuName();
            menu.style.display="none";
        }
        else{
            exit();
        }
    }
}

function handleKeydown(e) {
    if (e.key != "EndCall" && e.key != "Backspace") {
        //e.preventDefault();//清除默认行为（滚动屏幕等） 
    } 
    switch (e.key) {
        case 'ArrowUp':
            nav(-1);
            break;
        case 'ArrowDown':
            nav(1);
            break;
        case 'ArrowRight':
            tab(1);
            break;
        case 'ArrowLeft':
            tab(-1);
            break;
        case 'Enter': 

            break;
        case 'Backspace': 
            break;
        case 'Q':
        case 'SoftLeft':
            softleft()
            break;
        case 'E':
        case 'SoftRight':
            softright()
            break;
    }
}

window.addEventListener('keydown', handleKeydown);
