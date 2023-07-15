(function () {
	js2me.chooseFile = function (callback) {
		var input = document.createElement('input');
		input.type = 'file';
		input.style = 'position:absolute;visibility:hidden;z-index:-999;width:0;height:0;top:0;left:0;';
		input.addEventListener('change', function (event) {
			callback(event.target.files);
		});
		input.click();
	};
})();
