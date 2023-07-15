/**
 * Converts given array into string.
 * @param {array} array Array of bytes which is correct UTF8 content.
 */
js2me.GBKToString = function (sourceArray, offset, length) {
	var data = offset ? sourceArray.slice(offset) : sourceArray;
	if (length) {
		data.length = length;
	}
	return Buffer.from(data).toString('ascii');
};
js2me.UTF8ToString = function (sourceArray, offset, length) {
	var data = offset ? sourceArray.slice(offset) : sourceArray;
	if (length) {
		data.length = length;
	}
	return Buffer.from(data).toString('utf8');
};
js2me.stringToUTF8 = function (text) {
	return Array.prototype.slice.call(Buffer.from(text, 'utf8'));
};
js2me.stringToGBK = function (text) {
	return Array.prototype.slice.call(Buffer.from(text, 'ascii'));
};
js2me.bytesToDataURI = function (bytes, offset, length, mime) {
	var data = bytes.slice(offset);
	data.length = length;
	var base64 = Buffer.from(data).toString('base64');
	return 'data:' + mime + ';base64,' + base64;
};

js2me.markUnsafe = function (func) {
	func.isUnsafe = true;
	return func;
};

// setZeroTimeout - L. David Baron <dbaron@dbaron.org>
var setZeroTimeout = (function () {
	var timeouts = [];
	var messageName = "zero-timeout-message";

	// Like setTimeout, but only takes a function argument.  There's
	// no time argument (always zero) and no arguments (you have to
	// use a closure).
	function setZeroTimeout (fn) {
		timeouts.push(fn);
		window.postMessage(messageName, "*");
	}

	function handleMessage (event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation();
			if (timeouts.length > 0) {
				var fn = timeouts.shift();
				fn();
			}
		}
	}

	window.addEventListener("message", handleMessage, true);

	setZeroTimeout.removeListener = function () {
		window.removeEventListener('message', handleMessage, true);
	};

	// Add the one thing we want added to the window object.
	return setZeroTimeout;
})();
