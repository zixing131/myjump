/**
 * HiDPI Canvas Polyfill (1.0.10)
 *
 * Author: Jonathan D. Johnson (http://jondavidjohn.com)
 * Homepage: https://github.com/jondavidjohn/hidpi-canvas-polyfill
 * Issue Tracker: https://github.com/jondavidjohn/hidpi-canvas-polyfill/issues
 * License: Apache-2.0
*/
(function (window) {
	var pixelRatio = (function () {
		var canvas = document.createElement('canvas');
		canvas.height = canvas.width = 0;
		var context = canvas.getContext('2d');
		var backingStore = context.backingStorePixelRatio ||
			context.webkitBackingStorePixelRatio ||
			context.mozBackingStorePixelRatio ||
			context.msBackingStorePixelRatio ||
			context.oBackingStorePixelRatio ||
			context.backingStorePixelRatio || 1;
		return (window.devicePixelRatio || 1) / backingStore;
	})();

	function hidpiContext (context) {
		if (pixelRatio === 1) {
			return;
		}
		var forEach = function (obj, func) {
			for (var p in obj) {
				if (obj.hasOwnProperty(p)) {
					func(obj[p], p);
				}
			}
		};

		var ratioArgs = {
			fillRect: 'all',
			clearRect: 'all',
			strokeRect: 'all',
			moveTo: 'all',
			lineTo: 'all',
			arc: [0, 1, 2],
			arcTo: 'all',
			bezierCurveTo: 'all',
			isPointinPath: 'all',
			isPointinStroke: 'all',
			quadraticCurveTo: 'all',
			rect: 'all',
			translate: 'all',
			createRadialGradient: 'all',
			createLinearGradient: 'all',
			setTransform: [4, 5]
		};

		forEach(ratioArgs, function (value, key) {
			context[key] = (function (_super) {
				return function () {
					var args = Array.prototype.slice.call(arguments);

					if (value === 'all') {
						args = args.map(function (a) {
							return a * pixelRatio;
						});
					} else if (Array.isArray(value)) {
						for (var i = 0; i < value.length; i++) {
							args[value[i]] *= pixelRatio;
						}
					}
					return _super.apply(this, args);
				};
			})(context[key]);
		});

		context.stroke = (function (_super) {
			return function () {
				this.lineWidth *= pixelRatio;
				_super.apply(this, arguments);
				this.lineWidth /= pixelRatio;
			};
		})(context.stroke);

		context.fillText = (function (_super) {
			return function () {
				var args = Array.prototype.slice.call(arguments);

				args[1] *= pixelRatio;
				args[2] *= pixelRatio;
				if (args[3]) {
					args[3] *= pixelRatio;
				}

				// Safari 重新设置部分属性会导致其他值恢复默认，需获取原始值
				var font = this.__font__ || this.font;
				this.font = font.replace(
					/(\d+\.?\d*)(px|em|rem|pt)/g,
					function (w, m, u) {
						return (m * pixelRatio) + u;
					}
				);

				_super.apply(this, args);

				this.font = font;
			};
		})(context.fillText);

		context.strokeText = (function (_super) {
			return function () {
				var args = Array.prototype.slice.call(arguments);

				args[1] *= pixelRatio; // x
				args[2] *= pixelRatio; // y
				if (args[3]) {
					args[3] *= pixelRatio;
				}

				// Safari 重新设置部分属性会导致其他值恢复默认，需获取原始值
				var font = this.__font__ || this.font;
				this.font = font.replace(
					/(\d+\.?\d*)(px|em|rem|pt)/g,
					function (w, m, u) {
						return (m * pixelRatio) + u;
					}
				);
				_super.apply(this, args);

				this.font = font;
			};
		})(context.strokeText);

		context.drawImage = (function (_super) {
			return function () {
				var element = arguments[0];
				if (element && element.__hidpi__) {
					var args = Array.prototype.slice.call(arguments);
					_super.apply(this, args.map(function (a) {
						return typeof a === 'number' ? a * pixelRatio : a;
					}));
					return;
				}
				this.scale(pixelRatio, pixelRatio);
				_super.apply(this, arguments);
				this.scale(1 / pixelRatio, 1 / pixelRatio);
			};
		})(context.drawImage);
	}

	window.hidpi = function (canvas) {
		canvas.getContext = function () {
			if (!this.__context2d__) {
				this.__context2d__ = HTMLCanvasElement.prototype.getContext.call(this, '2d');
				hidpiContext(this.__context2d__);
				var width = this.width;
				this.width *= pixelRatio;
				Object.defineProperty(this, 'width', {
					get () {
						return width;
					},
					set (value) {
						width = value;
						this.setAttribute('width', String(width * pixelRatio));
					}
				});
				var height = this.height;
				this.height *= pixelRatio;
				Object.defineProperty(this, 'height', {
					get () {
						return height;
					},
					set (value) {
						height = value;
						this.setAttribute('height', String(height * pixelRatio));
					}
				});
			}
			return this.__context2d__;
		};
		canvas.__hidpi__ = true;
	};
})(window);
