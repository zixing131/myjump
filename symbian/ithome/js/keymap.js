//键盘映射

function leftSoftkeyEvent(){
    if(isloading)
    {
        return;
    }
    //console.log('leftkeyEvent');
    var nowid = getNowId();
    if(nowid in menulist)
    {
        showMenu(nowid);
    } 
    else if(nowid=='menu')
    {
        menuClick();
        showById(menubeforeid);
    }
}

function rightSoftkeyEvent(){
    //console.log('rightkeyEvent');
    if(isloading)
    {
        setLoading();
        return;
    }
    var nowid = getNowId();
    if(nowid in ['home','newslist','quanzi'])
    { 
        showExit();
    }
    else if(nowid=="article")
    { 
        showById('newslist'); 
        setScorllTop(lstviewtop); 
    }
    else if(nowid=="quanziarticle")
    { 
        showById('quanzi');
    }
    else if(nowid=='menu')
    { 
        showById(menubeforeid);
    }
    else if(nowid=="comment" )
    {
        showById('article');
    }
}

function enterkeyEvent(){ 
    if(isloading)
    {
        return;
    }
    //console.log('enter');
    var nowid = getNowId();
    if(nowid=="home")
    {
        homeEnterKey();
    }
    else if(nowid=="article")
    {
        articleEnterKey();
    }
    else if(nowid=="newslist")
    {
        newslistEnter();
    }
    else if(nowid=='menu')
    {
        menuClick();
        showById(menubeforeid);
    }
}

function LeftkeyEvent(){
    if(isloading)
    {
        return;
    }
    //console.log('left'); 
    var nowid = getNowId();
    if(nowid=="newslist")
    {
        //pass 
        //showById('home3');
    }
    else if(nowid=="quanzi" )
    {
        showById('newslist');
    }
    else if(nowid=="home" )
    {
        showById('quanzi');
    } 
}

function  TopkeyEvent(){
    if(isloading)
    {
        return;
    }
    //console.log('top(up)'); 
    var nowid = getNowId();
    if(nowid=="home")
    {
        
    }
    else if(nowid=="newslist" )
    {
        newslistUp();
    }
    else if(nowid=="quanzi" )
    {
        
    } 
    else if(nowid=='menu')
    {
        menuUp();
    }
}

function  RightkeyEvent(){
    try{ 
    if(isloading)
    {
        return;
    }
    //console.log('right'); 
    var nowid = getNowId(); 
    if(nowid=="newslist")
    {
        showById('quanzi');
    }
    else if(nowid=="quanzi" )
    {
        showById('home');
    }
    else if(nowid=="home" )
    {
        //showById('home1');
    }
    }catch(err)
    {
        alert(err)
    }
}

function  DownkeyEvent(){
    if(isloading)
    {
        return;
    }
    //console.log('down'); 
    var nowid = getNowId();
    if(nowid=="home")
    {
        
    }
    else if(nowid=="newslist")
    {
        newslistDown();
    }
    else if(nowid=="quanzi" )
    {
        
    } 
    else if(nowid=='menu')
    {
        menuDown();
    }
} 

setLeftSoftkeyLabel("leftkey",leftSoftkeyEvent);
setRightSoftkeyLabel("rightkey",rightSoftkeyEvent);
setEnterfunc(enterkeyEvent);
setleftfunc(LeftkeyEvent);
settopfunc(TopkeyEvent);
setrightfunc(RightkeyEvent);
setdownfunc(DownkeyEvent);
