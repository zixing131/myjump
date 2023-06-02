
function ajax(method, url, data, callback, progress, type) {
	method = method.toUpperCase();
	type = type || 'json';
	var xhr = new XMLHttpRequest();  
	xhr.onreadystatechange = function() {  
	
		if (xhr.readyState === 4) {
			
			if (xhr.status === 200) {
				if (type === 'xml') {
					callback(false, xhr.responseXML);
				} else if (type === 'json') {
					try {
						var text = eval('(' + xhr.responseText + ')');
						
						if (text.error) {
							callback(text.error);
						} else {
							callback(false, text);
						}
					} catch(e) {
						callback(e.message);
					}
				} else {
					callback(false, xhr.responseText);
				}
			} else {
				callback(xhr.status + xhr.responseText);
			}
		}
	};
	if (data) {
		var urlstr = [];
		for(var i in data) {
			urlstr.push(i + '=' + encodeURIComponent(data[i]));
		}

		data = urlstr.join('&');
		if ((method === 'GET' || method === 'DELETE') && data) {
			url += /\?/.test(url) ? '&' + data : '?' + data; 
		}
	}
	xhr.open(method, url, true);
	if (method === 'POST') {
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	}
	xhr.send(data);
}
function ajax_delete(url, callback) {
	ajax('DELETE', url, {}, callback, null, 'json');
}
function ajax_get(url, callback, type) {
	ajax('GET', url, {}, callback, null, type);
}
function ajax_post(url, data, callback, progress) {
	ajax('POST', url, data, callback, progress, 'json');
}

function ajax_post2(url, data, callback, progress) {
	
	ajax('POST', url, data, callback, progress, 'txt');
	
}

function ajax_put(url, data, callback) {
	ajax('PUT', url, data, callback, null, 'json');
}

function showMenu(menulist)
{
    $("#menucontainer").empty();
    for(var i=0;i<menulist.length;i++)
    {
        data=menulist[i]
        evt = data.evt
        name = data.name
        html = '<li class="menuitem" tabIndex="'+i+'" onclick="'+evt+'">'+name+'</li>'
        
        $('#menucontainer').append(html)
    }
    var items = document.querySelectorAll('.menuitem');
    $(items[0]).addClass("itemfocus")
}
