
if(!isbatch)
{

  // 初始化游戏列表
  var GameListHtml = '';
  for (var i = 0; i < GameList.length; i++) {
    var gameName = GameList[i]['name'];
    var jarName = GameList[i]['jarName'];
    var midletClassName = GameList[i]['midletClassName'];
    var picPath = GameList[i]['picPath'];
    var onClickFunc = "openJar('"+jarName+"','"+midletClassName+"');";
    GameListHtml += '<a class="game" href="javascript:void(0)" onclick="'+onClickFunc+'">' +
      '<div>' +
      '<img src="' + picPath + '" width="64px" height="64px" style="margin-top:4px"></img>' +
      '</div>' +
      '<span>' + gameName + '</span>' +
      '</a>';
  }
  document.getElementById('gameListDiv').innerHTML = GameListHtml;

}
  function refreshGameList() {

    if(isbatch){

      JARStore.getAll().then(
        function(files)  {
          var localjars = document.getElementById('localjars');
          localjars.length = 0;
          var gamepanel = document.getElementById("gameListDiv");
 
          gamepanel.innerHTML = '<a class="game" style="" href="javascript:void(0)" onclick="openJar(\'Anyview4.0.jar\',\'com.ismyway.anyview.Anyview\');"> <div> <img src="img/anyview.png" width="64px" height="64px" style="margin-top:4px"></img> </div><span> Anyview </span></a> ';
          for (var i = 0; i < files.length; i++) {
            var f = files[i];
            //console.log(f)
            //console.log(f.jarName);
            //JARStore.loadJAR(f.jarName); 
            try{
              localjars.options.add(new Option(f.jarName));
              addToPanel(f);
            }catch(err)
            {
              console.log(err)
            }
          }
          var gameindex = config01.getValueByKey("gameindex");
          var localjars = document.getElementById('localjars');
          if (gameindex >= files.length) {
            gameindex = files.length - 1;
          }
          localjars.selectedIndex = gameindex;
        },
        function(err){
          alert(err);
        }
      );
  
    }else{
      JARStore.getAll().then(
        function(files){
          var localjars = document.getElementById('localjars');
          localjars.length = 0;
          for (var i = 0; i < files.length; i++) {
            var f = files[i];
            //console.log(f.jarName);
            //JARStore.loadJAR(f.jarName);
            localjars.options.add(new Option(f.jarName));
          }
          var gameindex = config01.getValueByKey("gameindex");
          var localjars = document.getElementById('localjars');
          if (gameindex >= files.length) {
            gameindex = files.length - 1;
          }
          localjars.selectedIndex = gameindex;
        },
        function(err){
          alert(err);
        }
      );
  
    }
   
  }

  function loadLocalJar() {
    
    var localjars = document.getElementById('localjars');
    if (localjars.options.length == 0) {
      alert("请先上传jar!");
      return;
    }
    if (localjars.selectedIndex < 0 || localjars.selectedIndex >= localjars.options.length) {
      alert("请选择jar名称!");
      return;
    }
    var jarname = localjars.options[localjars.selectedIndex].text;
    console.log(jarname);
    openJar(jarname, "", 1);

  }


  function deleteLocalJar() {

    var localjars = document.getElementById('localjars');
    if (localjars.options.length == 0) {
      alert("没有要删除的jar!");
      return;
    }
    if (localjars.selectedIndex < 0 || localjars.selectedIndex >= localjars.options.length) {
      alert("请选择jar名称!");
      return;
    }
    var jarname = localjars.options[localjars.selectedIndex].text;
    console.log(jarname);
    let res = confirm('确定删除 ' + jarname + ' ？');
    if (res) {
      JARStore.deleteJar(jarname).then(
        function() {
          alert(jarname + "删除成功！");
          refreshGameList();

        },
        function(errname) {
          alert(errname + "删除失败！");
        }
      );
    }
  }
  var onUploadFile = function(e) {
    if(isbatch){

  const _files = e.target.files;
  if (_files.length == 0) {
    return;
  }
  var successcount = 0;
  var failcount = 0;
  var allcount = _files.length;
  for(var i=0;i<_files.length;i++)
  {
    const _file = _files[i];
    if (!_file.name.toLowerCase().endsWith('.jar')) {
      //alert("只能上传jar格式!");
      //return;
      failcount++;
      continue;
    }
    //fs.createUniqueFile("/Phone",_file.name,_file);
    const reader = new FileReader();
    reader.readAsArrayBuffer(_file);
    reader.onload = function(readRes) {
      JARStore.installJAR(_file.name, readRes.target.result).then(
        function()  {
          successcount++;
          if(successcount+failcount>=allcount)
          {
            alertSuccess(successcount,failcount);
            refreshGameList();
          } 
        },
        function(errname) {
          failcount++;
          if(successcount+failcount>=allcount)
          {
            alertSuccess(successcount,failcount);
            refreshGameList();
          } 
        }
      );
      document.getElementById("jarFileupload").value = null;
    }
  }
    }
    else{
      const _files = e.target.files;
      if (_files.length == 0) {
        return;
      }
      const _file = _files[0];
      if (!_file.name.toLowerCase().endsWith('.jar')) {
        alert("只能上传jar格式!");
        return;
      }
      //fs.createUniqueFile("/Phone",_file.name,_file);
      const reader = new FileReader();
      reader.readAsArrayBuffer(_file);
      reader.onload = function(readRes) {
        JARStore.installJAR(_file.name, readRes.target.result).then(
          function()  {
            alert(_file.name + "安装成功！");
            refreshGameList();
          },
          function(errname) {
            alert(errname + "安装失败！");
          }
        );
        document.getElementById("jarFileupload").value = null;
      }
    }
   
  }



  function openLocalJar() {
    document.getElementById("jarFileupload").click();
  }

  function openJar(jarname, midletClassName, islocaljar) {
    //var mycheck1=document.getElementById('mycheck1'); 
    //var mycheck2=document.getElementById('mycheck2'); 
    var enginemode=document.getElementById('enginemode'); 
    var href = 'main.html?jars=jar/' + jarname + '&jad=&midletClassName=' + midletClassName;
    if (islocaljar) {
      href = 'main.html?localjar=' + jarname;
    }
    
    href+="&enginemode="+enginemode.options[enginemode.selectedIndex].value; 
    /*
    if(mycheck2.checked)
    {
      href+="&enablexy=1";
    }
    */
    var gamepadSize = document.getElementById('gamepadSize');
    var mvalue = gamepadSize.options[gamepadSize.selectedIndex].value;
    if (mvalue) {
      href += "&gamepadSize=" + mvalue;
      if (gamepadSize.selectedIndex == 0) {
        href += "&gamepad=0";
      } else {
        href += "&gamepad=1";
      }
    }

    var canvasSize = document.getElementById('canvasSize');
    var mvalue = canvasSize.options[canvasSize.selectedIndex].value;
    if (mvalue) {
      href += "&canvasSize=" + mvalue;
    }
    var gameresize = document.getElementById('gameresize');
    var gameresizevalue = gameresize.options[gameresize.selectedIndex].value;
    if (gameresizevalue) {
      href += "&gameresize=" + gameresizevalue;
    }

    var localjars = document.getElementById('localjars');

    config01.setValueByKey("canvasSize", canvasSize.selectedIndex);
    config01.setValueByKey("gamepadSize", gamepadSize.selectedIndex);
    config01.setValueByKey("gameresize", gameresize.selectedIndex);
    config01.setValueByKey("gameindex", localjars.selectedIndex)

    window.location.href = href;
  }


  function processLocalJAD(data) {
    var manifest = {};
  data.replace(/\r\n|\r/g, "\n").replace(/\n /g, "").split("\n").forEach(function(entry) {
    if (entry) {
    var keyEnd = entry.indexOf(":");
    var key = entry.substring(0, keyEnd);
    var val = entry.substring(keyEnd + 1).trim();
    manifest[key] = val;
    }
  });

  return manifest;
  } 
  
function loadFileFromLocalJAR(jar, fileName) { 
  var entry = jar[fileName];
  if (!entry) {
  return null;
  }
  var bytes;
  if (entry.compression_method === 0) {
  bytes = entry.compressed_data;
  } else {
  if (entry.compression_method === 8) {
    bytes = inflate(entry.compressed_data, entry.uncompressed_len);
  } else {
    return null;
  }
  }
  if (!jar.isBuiltIn && fileName.endsWith(".class")) {
  delete jar.directory[fileName];
  }
  return bytes;
}

// 字节流转图片
 function formatByte2Img(data) {
  var blobUrl = ''
  const bytes = new Uint8Array(data)
  const blob = new Blob([bytes], { type: 'image/png' })
  blobUrl = (window.URL || window.webkitURL).createObjectURL(blob)
  return blobUrl
}
function addToPanel(jarfile)
{
  var gamepanel = document.getElementById("gameListDiv");
  if(gamepanel)
  {
    var data=loadFileFromLocalJAR(jarfile.jar,"META-INF/MANIFEST.MF"); 
    var mfdata = new TextDecoder("utf-8").decode(data);
    var jaddata = processLocalJAD(mfdata)
    
      var jarNameMid=jaddata['MIDlet-1'];
    jarName=jarNameMid.substr(0,jarNameMid.indexOf(',')).trim()
    var iconname=jaddata['MIDlet-Icon'];
    if(!iconname)
    { 
      iconname=jarNameMid.split(',')[1].trim();
    }
    if(iconname && iconname.indexOf('/')==0)
    {
      iconname=iconname.substr(1);
    } 
    //console.log(jaddata); 
    var icondata = loadFileFromLocalJAR(jarfile.jar,iconname); 
    var iconurl=formatByte2Img(icondata)

    var htmldata='<a class="game" style="" href="javascript:void(0)" onclick="openJar(\''+jarfile.jarName+'\',0,1);"> <div> <img width="64px" height="64px" style="margin-top:4px" src="'+iconurl+'"></img> </div><span> '+jarName+'</span> </a>'

    gamepanel.innerHTML+=htmldata;
  }
}

function alertSuccess(successcount,failcount){
  alert("安装完成，成功 "+successcount +"个，失败 "+failcount +"个");
}
 
var myconfig = function() {
  var myInfo = {
    canvasSize: 0,
    gamepadSize: 3,
    gameresize: 0,
    gameindex: 0,
    enginemode:1
  };
  if (window.localStorage["my"] === undefined) {
    window.localStorage["my"] = JSON.stringify(myInfo);
  } else {
    var data = JSON.parse(window.localStorage["my"]);
    for (var key in data) {
      myInfo[key] = data[key];
    }
  }
  return {
    //按key从对象中取值
    getValueByKey:function (key) {
      return myInfo[key];
    },
    //将键值对保存到对象中
    setValueByKey:function () {
      for (var i = 0; i < arguments.length; i += 2) {
        myInfo[arguments[i]] = arguments[i + 1];
      }
      //将新的数据序列化到本地保存
      window.localStorage["my"] = JSON.stringify(myInfo);
    }
  }
}

var config01 =new myconfig();

var csize = config01.getValueByKey("canvasSize");
var gsize = config01.getValueByKey("gamepadSize");
var gresize = config01.getValueByKey("gameresize");
var enginemode= config01.getValueByKey("enginemode");
var gamepadSize = document.getElementById('gamepadSize');
var canvasSize = document.getElementById('canvasSize');
var gameresize = document.getElementById('gameresize');
var enginemodeckb = document.getElementById('enginemode');

canvasSize.selectedIndex = csize;
gamepadSize.selectedIndex = gsize;
gameresize.selectedIndex = gresize;
enginemodeckb.selectedIndex = enginemode;

window.addEventListener("load", function() {

  document.getElementById("jarFileupload").addEventListener("change", onUploadFile);
  refreshGameList();

})

function enginemodeOnclick(){
  var enginemodeckb = document.getElementById('enginemode');
  config01.setValueByKey("enginemode", enginemodeckb.selectedIndex); 
} 

function canvasSizeHandleChange(){
  var canvasSize = document.getElementById('canvasSize');
  config01.setValueByKey("canvasSize", canvasSize.selectedIndex);
}
function gamepadSizeHandleChange(){
  var gamepadSize = document.getElementById('gamepadSize');
  config01.setValueByKey("gamepadSize", gamepadSize.selectedIndex);
}
function gameresizeHandleChange(){
  var gameresize = document.getElementById('gameresize');
  config01.setValueByKey("gameresize", gameresize.selectedIndex);
}

function localjarsHandleChange(){
  var localjars = document.getElementById('localjars');
  config01.setValueByKey("gameindex", localjars.selectedIndex);
}
