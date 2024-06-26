
//DES加密
function encryptByDES(message, key){
    var keyHex = CryptoJS.enc.Utf8.parse(key);
    var encrypted = CryptoJS.DES.encrypt(message, keyHex, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
    });
    return encrypted.ciphertext.toString();
}
//DES加密
function decryptByDES(ciphertext, key){
    var keyHex = CryptoJS.enc.Utf8.parse(key);
    var decrypted = CryptoJS.DES.decrypt({
        ciphertext: CryptoJS.enc.Hex.parse(ciphertext)
    }, keyHex, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    var result_value = decrypted.toString(CryptoJS.enc.Utf8);
    return result_value;
}

//获取登陆的url
function getLoginUrl(userhash)
{
	var urlhead = 'http://my.ruanmei.com/api/User/Login?userHash=';
	var urlend = '&extra=4|ithome_symbian'; // ithome_android
	
	return urlhead+userhash+urlend;
	
}

function getCommentParam(newsid,data)
{ 
	userhash = widget.preferenceForKey('userhash');
	nickname = widget.preferenceForKey('nickname');
	devicename = 'Symbian'; 
	str = {
		'userhash':userhash,
		'newsid':newsid,
		'commentNick':nickname,
		'commentContent':data,
		'parentCommentID':0,
		'ppcid':0,
		'type':'comment',
		'ver':'765',
		'ServerDontDecode':true,
		'client':8,
		'device':devicename,
		'notify':false
	};
	//str='u='+username+'&p='+password+'&newsid='+newsid+'&commentNick='+nickname+'&commentContent='+data+'&parentCommentID=0&ppcid=0&type=comment&ver=765&ServerDontDecode=true&client=8&device='+devicename;
	return str;
}

function getUserDataUrl(userhash)
{
	var urlhead = 'http://my.ruanmei.com/api/User/Get?userHash=';
	var urlend = '&extra=4|ithome_symbian&appver=765&device=symbian'; // ithome_android
	return urlhead+userhash+urlend;
}

function getMd5(str)
{
	return CryptoJS.MD5(str).toString();
}

function getUserHash(username,pwd)
{
	pwd = CryptoJS.MD5(pwd).toString();
	user = username+'\f'+pwd;
	var bArr2 = '(#i@x*l%'; 
    var encryptd = m49914a2(user,bArr2);
	
	var hash = fmtBytes(str2UTF8(hexCharCodeToStr(CryptoJS.enc.Base64.parse(encryptd).toString())));
	// //console.log(hash);
    return hash;
}

function getCommentSn(newsid)
{ 
	var bArr2 = '(#i@x*l%'; 
    var encryptd = m49914a2(newsid,bArr2);
	 
	var hash = fmtBytes(str2UTF8(hexCharCodeToStr(CryptoJS.enc.Base64.parse(encryptd).toString())));
	// //console.log(hash);
    return hash;
}

 function PrefixInteger(num, n) {
		return (Array(n).join(0) + num).slice(-n);
	}
		
function getHeadUrl(Ui)
{
	var url1 = 'http://avatar.ithome.com/avatars/';
	var url2='_60.jpg'; 
	var ret = '';
	Ui = PrefixInteger(Ui,9); 
	ret = Ui[0]+Ui[1]+Ui[2]+'/'+Ui[3]+Ui[4]+'/'+Ui[5]+Ui[6]+'/'+Ui[7]+Ui[8];	
	//alert(url1+ret+url2);
	return url1+ret+url2;
}

function m49921c(str)
{
    var bArr2 = '(#i@x*l%'; 
	
	var encryptd = m49914a2(str,bArr2);
	var hash = fmtBytes(str2UTF8(hexCharCodeToStr(CryptoJS.enc.Base64.parse(encryptd).toString())));
 
	return hash;
}

function m49912a(str,str2)
{
	return m49914a(str,str2,false);
}

function m49914a(str,str2,z)
{
	le = str.length;
	if (le < 8) {
		i = 8 - le;
	} else {
		var i2 = le % 8;
		i = i2 != 0 ? 8 - i2 : 0;
	}
	
	var str3 = str;
	for (var i3 = 0; i3 < i; i3++) {
		str3 = str3 + String.fromCharCode(0);
	}
	return encryptByDES2(str3,str2);
}

function m49914a2(str,str2,z)
{
	str = str +''; 
	i=0;
	le = str.length; 
	if (le < 8) {
		i = 8 - le; 
	} else {
		var i2 = le % 8;
		i = i2 != 0 ? 8 - i2 : 0; 
	}  
	var str3 = str;
	
	for (var i3 = 0; i3 < i; i3++) {
		str3 = str3 + String.fromCharCode(0);
	}  
	return encryptByDES2(str3,str2);
}
 

function encryptByDES2(message, key) {
    var keyHex = CryptoJS.enc.Utf8.parse(key);
    var encrypted = CryptoJS.DES.encrypt(message, keyHex, {
        iv: keyHex,
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
    });   
    return encrypted.toString();
}

function get_next(time_str) {
    if(time_str.indexOf('.')>=0)
	{
		time_str = time_str.split('.')[0];
	}
	time_str = time_str.replace(/-/g,'/');
	time_str = time_str.replace('T',' ');
	var timestamp = Date.parse(time_str);
	var bArr2 = 'w^s(1#a@'; 
    var encryptd = m49914a2(timestamp.toString(),bArr2); 
	var hash = fmtBytes(str2UTF8(hexCharCodeToStr(CryptoJS.enc.Base64.parse(encryptd).toString()))); 
    return hash;
}

function hexCharCodeToStr(hex) { 
    var arr = hex.split("");
    var out = "";
    for (var i = 0; i < arr.length / 2; i++) {
      var tmp = "0x" + arr[i * 2] + arr[i * 2 + 1];
      var charValue = String.fromCharCode(tmp);
      out += charValue;
    }
    return out;
}

function fmtBytes(arg5) {
    var v1 = "";
    for (var v0 = 0; v0 < arg5.length; ++v0) {
        var v2 = (arg5[v0] & 255).toString(16);
        if (v2.length == 1) {
            v1 = v1 + "0" + v2;
        } else {
            v1 = v1 + v2;
        }
    }
    return v1;
}

function str2UTF8(str){
    var bytes = new Array(); 
    var len,c; 
    len = str.length; 
    for(var i = 0; i < len; i++){
        c = str.charCodeAt(i);
        var s = parseInt(c).toString(2); 
        bytes.push(c & 0xFF);
    }
    return bytes;
}

