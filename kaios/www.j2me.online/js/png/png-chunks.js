(function (crc32) {
	function readChunk (arr, index) {
		var error;
		var nextArrElement = function () {
			return arr[index++];
		};
		var getNextInt32 = function () {
			var int8Arr = new Uint8Array(4);
			int8Arr = int8Arr.map(nextArrElement).reverse();
			var int32Arr = new Int32Array(int8Arr.buffer);
			return int32Arr[0];
		};
		var length = getNextInt32();

		var name = "";
		for (var i = 0; i < 4; i++) {
			name += String.fromCharCode(arr[index++]);
		}

		var data = arr.slice(index, index + length);
		// Include Name
		var crcExpect = crc32.buf(arr.slice(index - 4, index + length));

		index += length;

		var crc = getNextInt32();
		if (crcExpect !== crc) {
			error = new Error('CRC values for ' + name + ' header do not match, PNG file is likely corrupted');
			console.warn(error);
			// throw error;
		}

		return {
			length: length,
			chunkType: name,
			data: data,
			crc: crc,
			error: error
		};
	}

	function getChunks (arr) {
		// https://en.wikipedia.org/wiki/Portable_Network_Graphics
		if (
			arr[0] !== 0x89 &&
			arr[1] !== 0x50 &&
			arr[2] !== 0x4E &&
			arr[3] !== 0x47 &&
			arr[4] !== 0x0D &&
			arr[5] !== 0x0A &&
			arr[6] !== 0x1A &&
			arr[7] !== 0x0A
		) {
			throw new Error('Invalid PNG header');
		}

		var index = 8;
		var chunks = [];
		while (index < arr.length) {
			var chunk = readChunk(arr, index);
			chunks.push(chunk);
			index += chunk.length + 4 * 3;
		}
		if (chunks.length < 1 || chunks[chunks.length - 1].chunkType !== 'IEND') {
			throw new Error('.png file ended prematurely: no IEND header was found');
		}

		return chunks;
	}

	function toPNG (chunks) {
		var getCharCode = function (char) {
			return char.charCodeAt(0);
		};
		var updateChunks = function (chunk) {
			chunk.length = chunk.data.length;
			var crcInt8Arr = new Uint8Array(4 + chunk.length);
			crcInt8Arr.set(Uint8Array.from(chunk.chunkType.split('').map(getCharCode)));
			crcInt8Arr.set(chunk.data, 4);
			chunk.crc = crc32.buf(crcInt8Arr);
		};
		var getInt8ArrFromInt32 = function (num) {
			var lengthArr = new Int32Array(1);
			lengthArr[0] = num;
			var arr = new Int8Array(lengthArr.buffer);
			return arr.reverse();
		};
		// Sets the new length and CRC
		chunks.map(updateChunks);

		var length = 8;
		var index = 0;
		var PNG_HEADER = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
		var getSize = function (accumulator, chunk) {
			accumulator = accumulator.length + 12 || accumulator;
			return accumulator + chunk.length + 12;
		};
		length += chunks.reduce(getSize);

		var output = new Uint8Array(length);

		output.set(PNG_HEADER, index);
		index += 8;

		for (var i = 0; i < chunks.length; i++) {
			var chunk = chunks[i];
			function getData (chunk) {
				var dataInt8Arr = new Uint8Array(12 + chunk.data.length);

				dataInt8Arr.set(getInt8ArrFromInt32(chunk.length));
				dataInt8Arr.set(Uint8Array.from(chunk.chunkType.split('').map(getCharCode)), 4);
				dataInt8Arr.set(chunk.data, 8);
				dataInt8Arr.set(getInt8ArrFromInt32(chunk.crc), 8 + chunk.data.length);
				return dataInt8Arr;
			}
			output.set(getData(chunk), index);
			index += getSize(0, chunk);
		}

		return output;
	}

	window.PNGChunks = {
		getChunks: getChunks,
		toPNG: toPNG,
	};
})(window.CRC32);
