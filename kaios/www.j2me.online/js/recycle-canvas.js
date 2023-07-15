(function () {
	// Safari
	if (String(navigator.vendor).indexOf('Apple') !== 0) {
		return;
	}
	// 10s
	var RECYCLE_TIME = 1e3 * 10;
	var prototype = CanvasRenderingContext2D.prototype;
	var props = [
		'clearRect',
		'fillRect',
		'strokeRect',
		'fillText',
		'strokeText',
		'fill',
		'stroke',
		'drawImage',
		'getImageData',
		'putImageData',
	];
	getImageData = prototype.getImageData;
	putImageData = prototype.putImageData;
	prototype.__recycle = function () {
		var self = this;
		var canvas = this.canvas;
		clearTimeout(canvas.__recycleTimer);
		canvas.__recycleTimer = setTimeout(function () {
			if (canvas.__rendering || canvas.__imageData) {
				return;
			}
			var width = canvas.__saveWidth = canvas.getAttribute('width');
			var height = canvas.__saveHeight = canvas.getAttribute('height');
			canvas.__imageData = getImageData.call(self, 0, 0, Number(width), Number(height));
			canvas.setAttribute('width', '0');
			canvas.setAttribute('height', '0');
		}, RECYCLE_TIME);
	};
	prototype.__restore = function () {
		var canvas = this.canvas;
		clearTimeout(canvas.__recycleTimer);
		if (canvas.__saveWidth) {
			canvas.setAttribute('width', canvas.__saveWidth);
			delete canvas.__saveWidth;
		}
		if (canvas.__saveHeight) {
			canvas.setAttribute('height', canvas.__saveHeight);
			delete canvas.__saveHeight;
		}
		if (canvas.__imageData) {
			putImageData.call(this, canvas.__imageData, 0, 0);
			delete canvas.__imageData;
		}
	};
	props.forEach(function (prop) {
		prototype[prop] = (function (fn) {
			return function () {
				this.__restore();
				this.__recycle();
				if (prop === 'drawImage') {
					var element = arguments[0];
					if (element instanceof HTMLCanvasElement) {
						var context = element.getContext('2d');
						context.__restore();
						context.__recycle();
					}
				}
				return fn.apply(this, arguments);
			};
		})(prototype[prop]);
	});

	var canvasPrototype = HTMLCanvasElement.prototype;
	var canvasProps = ['toDataURL', 'toBlob'];
	canvasProps.forEach(function (prop) {
		canvasPrototype[prop] = (function (fn) {
			return function () {
				var context = this.getContext('2d');
				context.__restore();
				context.__recycle();
				return fn.apply(this, arguments);
			};
		})(prototype[prop]);
	});

	var observer = new MutationObserver(function (list) {
		list.forEach(function (item) {
			item.removedNodes.forEach(function (element) {
				if (element instanceof HTMLCanvasElement) {
					delete element.__rendering;
					element.getContext('2d').__recycle();
				}
			});
			item.addedNodes.forEach(function (element) {
				if (element instanceof HTMLCanvasElement) {
					element.__rendering = true;
					element.getContext('2d').__restore();
				}
			});
		});
	});
	var docReady = function (callback) {
		if (document.readyState === "complete") {
			callback();
		} else {
			document.addEventListener("DOMContentLoaded", callback, false);
		}
	};
	docReady(function () {
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	});
})();
