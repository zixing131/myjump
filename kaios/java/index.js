

mainmenulist = [ 
	["启动JAR",'openJar',],
	["刷新列表",'refreshGameList',],
    ["安装JAR",'installJar',],
	["删除JAR",'deleteJar',],
    ["关于",'about',],
    ["退出",'exit'],
]

function myopenJar(jarname,midletClassName)
			{
				
				href='main.html?localjar='+jarname; 
				href+="&gamepad=0";
				
				window.location.href = href;
			}
function openJar()
{
	if(nowfocus)
	{ 
		var jarname = nowfocus.children[1].innerText;
		var jarmid = nowfocus.children[2].innerText;
		if(jarmid==null || jarmid=="")
		{
			showDialog("提示","jar文件损坏！",closeDialog,closeDialog);    
			return;
		} 
		myopenJar(jarname,jarmid);
	}
	else{
		
			showDialog("提示","请先选择一个jar！",closeDialog,closeDialog);     
	}
}

function deleteJar()
{
	
	if(nowfocus)
	{ 
		var jarname = nowfocus.children[1].innerText;
		JARStore.deleteJar(jarname).then
		(
			()=>{ 
				showDialog("提示",jarname+"删除成功！",closeDialog,closeDialog);   
				refreshGameList();
		},  
			(errname)=>{
				showDialog("提示",errname+"删除失败！",closeDialog,closeDialog);     
			}
			); 
		}  
	else{
		showDialog("提示","请先选择一个jar！",closeDialog,closeDialog);    
	}
}

var onUploadFile = function(e){
    const _files = e.target.files;
    if (_files.length == 0) {
        return;
    }
    const _file = _files[0];  
    if(!_file.name.toLowerCase().endsWith('.jar'))
    {
		showDialog("提示","只能上传jar格式!",closeDialog,closeDialog);   
        return;
    }
    //fs.createUniqueFile("/Phone",_file.name,_file);
    const reader = new FileReader();
    reader.readAsArrayBuffer(_file);
    reader.onload = function(readRes){
        JARStore.installJAR(_file.name,readRes.target.result).then
        (
            ()=>{ 
				showDialog("提示",_file.name+"安装成功！",closeDialog,closeDialog);  
                refreshGameList();
        },  
            (errname)=>{
					showDialog("提示",errname+"安装失败！",closeDialog,closeDialog);   
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
	
	var applist=document.getElementById("applist");
	var menuitems=applist.getElementsByClassName('menuitem');
	for(var i=0;i<menuitems;i++)
	{
		menuitems[i].removeAttribute("focusable")
	} 
} 

function installJar()
{
    document.getElementById("jarFileupload").click();
    var menu = document.getElementById("menu");
    menu.style.display="none"; 
    restoreMenuName();
}

function processJAD2(data) {
  var dts={}
  data.replace(/\r\n|\r/g, "\n").replace(/\n /g, "").split("\n").forEach(function(entry) {
    if (entry) {
      var keyEnd = entry.indexOf(":");
      var key = entry.substring(0, keyEnd);
      var val = entry.substring(keyEnd + 1).trim();
      dts[key] = val;
    }
  });
  return dts;
} 

var nowfocus=undefined; 
function disableAppList()
{
	var applist=document.getElementById('applist'); 
	
	nowfocus = applist.getElementsByClassName("focus")[0];
	
	var listitems=applist.getElementsByClassName("listitem");
	
	for(var i=0;i<listitems.length;i++)
	{
		listitems[i].removeAttribute("focusable")
	}
}
function enableApplist()
{
	var applist=document.getElementById('applist'); 
	var listitems=applist.getElementsByClassName("listitem");
	for(var i=0;i<listitems.length;i++)
	{
		listitems[i].setAttribute("focusable","")
	}
	if(nowfocus)
	{
		focusable.requestFocus(nowfocus)
	}
}

function refreshGameList()
    {
        JARStore.getAll().then(
            (files)=>{ 
                var applist=document.getElementById('applist'); 
                var listapp = [];
                for(var i=0;i<files.length;i++)
                {
					var res=files[i];
					try{
                    
                    //console.log(f.jarName);
                    //JARStore.loadJAR(f.jarName);
					var mffile = res.jar['META-INF/MANIFEST.MF'];
					mfdata=''
					switch(mffile.compression_method) {
					  case 0:
					    mfdata= mffile.compressed_data;
						break;
					  case 8:
					    mfdata = inflate(mffile.compressed_data, mffile.uncompressed_len);
						break;
					}
					mfdata=new TextDecoder('utf-8').decode(mfdata);
					console.log(mfdata);
					var dts=processJAD2(mfdata);
					var a=dts['MIDlet-1']; 
					var a=a.split(',');
					var name = a[0].trim(); 
					var jarmid=a[2].trim();
					
					var jaricon = a[1].trim();
					if(jaricon.indexOf("/")==0)
					{
						jaricon = jaricon.substring(1);
					}
					
					var iconfile = res.jar[jaricon];
					if(iconfile==undefined)
					{
						iconfile =  res.jar[dts['MIDlet-Icon'].trim()];
					}
					var iconfiledata=''
					switch(iconfile.compression_method) {
					  case 0:
					    iconfiledata= iconfile.compressed_data;
						break;
					  case 8:
					    iconfiledata = new Uint8Array(inflate(iconfile.compressed_data, iconfile.uncompressed_len));
						break;
					}
					var bytes = iconfiledata;
					var blob = new Blob([bytes], { type: "image/png" });
					var url = URL.createObjectURL(blob);  
                    listapp.push(' <div class="listitem" focusable> <image class="jaricon" src="'+url+'"></image> <div id="jarname" style="display:none">'+res.jarName+'</div> <div id="jarmid" style="display:none">'+jarmid+'</div> <div class="listtext">' + name + '</div></div>');
					}catch(err)
					{
						url=""
						listapp.push(' <div class="listitem" focusable> <image class="jaricon" src="'+url+'"></image> <div id="jarname" style="display:none">'+res.jarName+'</div> <div id="jarmid" style="display:none"></div> <div class="listtext">' + res.jarName + '[文件损坏]</div></div>');
						console.log(err)
					}
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
		showDialog("提示","请先上传jar!",closeDialog,closeDialog);   
        return;
    }
    if(localjars.selectedIndex<0 || localjars.selectedIndex>=localjars.options.length)
    {
		
		showDialog("提示","请选择jar名称!",closeDialog,closeDialog);  
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

var lastleft=[];
var lastcenter=[];
var lastright=[];
function saveMenuName()
{ 
    var softkeyleft = document.getElementById("softkeyleft")
    
    var softkeycenter = document.getElementById("softkeycenter")
    
    var softkeyright = document.getElementById("softkeyright")

    lastleft.push(softkeyleft.innerText);
    lastcenter.push(softkeycenter.innerText);
    lastright.push(softkeyright.innerText);
     
}

function restoreMenuName()
{
    var softkeyleft = document.getElementById("softkeyleft")
    
    var softkeycenter = document.getElementById("softkeycenter")
    
    var softkeyright = document.getElementById("softkeyright")

	var p = lastleft.pop();
	if(p){
		softkeyleft.innerText = p;
		softkeycenter.innerText = lastcenter.pop();
		softkeyright.innerText =lastright.pop(); 
	}
     
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
			enableApplist();
        }
        else {
			
            loadMenu();
			disableAppList();
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
    
    showDialog("确认","是否确认退出？",()=>{ 
        closeDialog();
		window.close();
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
			enableApplist();
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
