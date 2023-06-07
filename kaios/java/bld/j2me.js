/*
 * Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** @const */ var release = false;
/** @const */ var profile = 0;
/** @const */ var profileFormat = "PLAIN";
/** @const */ var asmJsTotalMemory = 2 * 1024 * 1024 * 1024;
/*
 * Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var jsGlobal = (function () { return this || (1, eval)('this'); })();
var inBrowser = typeof pc2line === "undefined";
if (!jsGlobal.flagsOf) {
    jsGlobal.flagsOf = function () {
        return 0;
    };
}
if (!jsGlobal.performance) {
    jsGlobal.performance = {};
}
if (!jsGlobal.performance.now) {
    jsGlobal.performance.now = typeof dateNow !== 'undefined' ? dateNow : Date.now;
}
var J2ME;
(function (J2ME) {
    function isIdentifierStart(c) {
        return (c === '$') || (c === '_') || (c === '\\') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    }
    J2ME.isIdentifierStart = isIdentifierStart;
    function isIdentifierPart(c) {
        return (c === '$') || (c === '_') || (c === '\\') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || ((c >= '0') && (c <= '9'));
    }
    J2ME.isIdentifierPart = isIdentifierPart;
    function isIdentifierName(s) {
        if (!isIdentifierStart(s[0])) {
            return false;
        }
        for (var i = 1; i < s.length; i++) {
            if (!isIdentifierPart(s[i])) {
                return false;
            }
        }
        return true;
    }
    J2ME.isIdentifierName = isIdentifierName;
    function isObject(value) {
        return typeof value === "object" || typeof value === 'function';
    }
    J2ME.isObject = isObject;
    function isNullOrUndefined(value) {
        return value == undefined;
    }
    J2ME.isNullOrUndefined = isNullOrUndefined;
    var Debug;
    (function (Debug) {
        function error(message) {
            console.error(message);
			//throw new Error(message);
        }
        Debug.error = error;
        function assert(condition, message) {
            if (!message) {
                message = "Assertion failed with no message!!!";
            }
            if (condition === "") {
                condition = true;
            }
            if (!condition) {
                Debug.error(message.toString());
            }
        }
        Debug.assert = assert;
        function assertUnreachable(msg) {
            var location = new Error().stack.split('\n')[1];
            throw new Error("Reached unreachable location " + location + msg);
        }
        Debug.assertUnreachable = assertUnreachable;
        function abstractMethod(message) {
            Debug.assert(false, "Abstract Method " + message);
        }
        Debug.abstractMethod = abstractMethod;
        /**
         * Ensures that the object is not in dictionary mode. To use this, you'll need a
         * special build of SpiderMonkey, ask mbx.
         */
        function assertNonDictionaryModeObject(object) {
            Debug.assert((flagsOf(object) & 1) === 0, "Object is in dictionary mode.");
        }
        Debug.assertNonDictionaryModeObject = assertNonDictionaryModeObject;
        function unexpected(message) {
            Debug.assert(false, "Unexpected: " + message);
        }
        Debug.unexpected = unexpected;
    })(Debug = J2ME.Debug || (J2ME.Debug = {}));
    function getTicks() {
        return performance.now();
    }
    J2ME.getTicks = getTicks;
    var ArrayUtilities;
    (function (ArrayUtilities) {
        var assert = Debug.assert;
        ArrayUtilities.EMPTY_ARRAY = [];
        function makeArrays(length) {
            var arrays = [];
            for (var i = 0; i < length; i++) {
                arrays.push(new Array(i));
            }
            return arrays;
        }
        ArrayUtilities.makeArrays = makeArrays;
        /**
         * Pops elements from a source array into a destination array. This avoids
         * allocations and should be faster. The elements in the destination array
         * are pushed in the same order as they appear in the source array:
         *
         * popManyInto([1, 2, 3], 2, dst) => dst = [2, 3]
         */
        function popManyInto(src, count, dst) {
            release || assert(src.length >= count, "bad length in popManyInto");
            for (var i = count - 1; i >= 0; i--) {
                dst[i] = src.pop();
            }
            dst.length = count;
        }
        ArrayUtilities.popManyInto = popManyInto;
        function pushMany(dst, src) {
            for (var i = 0; i < src.length; i++) {
                dst.push(src[i]);
            }
        }
        ArrayUtilities.pushMany = pushMany;
        function pushUnique(array, value) {
            for (var i = 0, j = array.length; i < j; i++) {
                if (array[i] === value) {
                    return i;
                }
            }
            array.push(value);
            return array.length - 1;
        }
        ArrayUtilities.pushUnique = pushUnique;
        function unique(array) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                pushUnique(result, array[i]);
            }
            return result;
        }
        ArrayUtilities.unique = unique;
        /**
         * You'd hope that new Array() triggers different heuristics about how and when it should fall back
         * to dictionary mode. I've experienced ION bailouts from non-dense new Arrays(), hence this helper
         * method.
         */
        function makeDenseArray(length, value) {
            var array = new Array(length);
            for (var i = 0; i < length; i++) {
                array[i] = value;
            }
            return array;
        }
        ArrayUtilities.makeDenseArray = makeDenseArray;
        /**
         * Resizes a Int32Array to have the given length.
         */
        function ensureInt32ArrayLength(array, length) {
            if (array.length >= length) {
                return array;
            }
            var newLength = Math.max(array.length + length, ((array.length * 3) >> 1) + 1);
            var newArray = new Int32Array(newLength);
            newArray.set(array);
            return newArray;
        }
        ArrayUtilities.ensureInt32ArrayLength = ensureInt32ArrayLength;
    })(ArrayUtilities = J2ME.ArrayUtilities || (J2ME.ArrayUtilities = {}));
    var ObjectUtilities;
    (function (ObjectUtilities) {
        function createMap() {
            return Object.create(null);
        }
        ObjectUtilities.createMap = createMap;
    })(ObjectUtilities = J2ME.ObjectUtilities || (J2ME.ObjectUtilities = {}));
    var FunctionUtilities;
    (function (FunctionUtilities) {
        function makeForwardingGetter(target) {
            return new Function("return this[\"" + target + "\"]");
        }
        FunctionUtilities.makeForwardingGetter = makeForwardingGetter;
        function makeForwardingSetter(target) {
            return new Function("value", "this[\"" + target + "\"] = value;");
        }
        FunctionUtilities.makeForwardingSetter = makeForwardingSetter;
        function makeDebugForwardingSetter(target, checker) {
            return function (value) {
                Debug.assert(checker(value, 0), "Unexpected value for target " + target);
                this[target] = value;
            };
        }
        FunctionUtilities.makeDebugForwardingSetter = makeDebugForwardingSetter;
    })(FunctionUtilities = J2ME.FunctionUtilities || (J2ME.FunctionUtilities = {}));
    var StringUtilities;
    (function (StringUtilities) {
        var assert = Debug.assert;
        /**
         * Returns a reasonably sized description of the |value|, to be used for debugging purposes.
         */
        function toSafeString(value) {
            if (typeof value === "string") {
                return "\"" + value + "\"";
            }
            if (typeof value === "number" || typeof value === "boolean") {
                return String(value);
            }
            if (value instanceof Array) {
                return "[] " + value.length;
            }
            return typeof value;
        }
        StringUtilities.toSafeString = toSafeString;
        function escapeString(str) {
            if (str !== undefined) {
                str = str.replace(/[^\w$]/gi, "$"); /* No dots, colons, dashes and /s */
                if (/^\d/.test(str)) {
                    str = '$' + str;
                }
            }
            return str;
        }
        StringUtilities.escapeString = escapeString;
        function quote(s) {
            return "\"" + s + "\"";
        }
        StringUtilities.quote = quote;
        var _encoding = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_';
        var arrays = [null, new Array(1), new Array(2), new Array(3), new Array(4), new Array(5), new Array(6)];
        function variableLengthEncodeInt32(n) {
            var e = _encoding;
            var bitCount = (32 - Math.clz32(n));
            release || assert(bitCount <= 32, "variableLengthEncoding: " + bitCount);
            var l = Math.ceil(bitCount / 6);
            var a = arrays[l];
            // Encode length followed by six bit chunks.
            a[0] = e[l];
            for (var i = l - 1, j = 1; i >= 0; i--) {
                var offset = (i * 6);
                a[j++] = e[(n >> offset) & 0x3F];
            }
            var s = a.join("");
            return s;
        }
        StringUtilities.variableLengthEncodeInt32 = variableLengthEncodeInt32;
        function toEncoding(n) {
            return _encoding[n];
        }
        StringUtilities.toEncoding = toEncoding;
        var _concat3array = new Array(3);
        /**
         * The concatN() functions concatenate multiple strings in a way that
         * avoids creating intermediate strings, unlike String.prototype.concat().
         *
         * Note that these functions don't have identical behaviour to using '+',
         * because they will ignore any arguments that are |undefined| or |null|.
         * This usually doesn't matter.
         */
        function concat3(s0, s1, s2) {
            _concat3array[0] = s0;
            _concat3array[1] = s1;
            _concat3array[2] = s2;
            return _concat3array.join('');
        }
        StringUtilities.concat3 = concat3;
    })(StringUtilities = J2ME.StringUtilities || (J2ME.StringUtilities = {}));
    var HashUtilities;
    (function (HashUtilities) {
        // Copyright (c) 2011 Gary Court
        //
        // Permission is hereby granted, free of charge, to any person obtaining
        // a copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to
        // permit persons to whom the Software is furnished to do so, subject to
        // the following conditions:
        //
        // The above copyright notice and this permission notice shall be
        // included in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
        // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
        // IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
        // CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
        // TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
        // SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        // https://github.com/garycourt/murmurhash-js
        function hashBytesTo32BitsMurmur(data, offset, length) {
            var l = length, h = 0x12345678 ^ l, i = offset, k;
            while (l >= 4) {
                k =
                    (data[i]) |
                        (data[++i] << 8) |
                        (data[++i] << 16) |
                        (data[++i] << 24);
                k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
                k ^= k >>> 24;
                k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
                h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;
                l -= 4;
                ++i;
            }
            switch (l) {
                case 3: h ^= data[i + 2] << 16;
                case 2: h ^= data[i + 1] << 8;
                case 1:
                    h ^= data[i];
                    h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
            }
            h ^= h >>> 13;
            h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
            h ^= h >>> 15;
            return h >>> 0;
        }
        HashUtilities.hashBytesTo32BitsMurmur = hashBytesTo32BitsMurmur;
        // end of imported section
        function hashBytesTo32BitsAdler(data, offset, length) {
            var a = 1;
            var b = 0;
            var end = offset + length;
            for (var i = offset; i < end; ++i) {
                a = (a + (data[i] & 0xff)) % 65521;
                b = (b + a) % 65521;
            }
            return (b << 16) | a;
        }
        HashUtilities.hashBytesTo32BitsAdler = hashBytesTo32BitsAdler;
    })(HashUtilities = J2ME.HashUtilities || (J2ME.HashUtilities = {}));
    (function (Numbers) {
        Numbers[Numbers["MaxU16"] = 65535] = "MaxU16";
        Numbers[Numbers["MaxI16"] = 32767] = "MaxI16";
        Numbers[Numbers["MinI16"] = -32768] = "MinI16";
    })(J2ME.Numbers || (J2ME.Numbers = {}));
    var Numbers = J2ME.Numbers;
    var IntegerUtilities;
    (function (IntegerUtilities) {
        var sharedBuffer = new ArrayBuffer(24);
        IntegerUtilities.i32 = new Int32Array(sharedBuffer);
        IntegerUtilities.f32 = new Float32Array(sharedBuffer);
        IntegerUtilities.f64 = new Float64Array(sharedBuffer);
        function bitCount(i) {
            i = i - ((i >> 1) & 0x55555555);
            i = (i & 0x33333333) + ((i >> 2) & 0x33333333);
            return (((i + (i >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
        }
        IntegerUtilities.bitCount = bitCount;
        function ones(i) {
            i = i - ((i >> 1) & 0x55555555);
            i = (i & 0x33333333) + ((i >> 2) & 0x33333333);
            return ((i + (i >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
        }
        IntegerUtilities.ones = ones;
        function toHEX(i) {
            var i = (i < 0 ? 0xFFFFFFFF + i + 1 : i);
            return "0x" + ("00000000" + i.toString(16)).substr(-8);
        }
        IntegerUtilities.toHEX = toHEX;
        /**
         * Polyfill imul.
         */
        if (!Math.imul) {
            Math.imul = function imul(a, b) {
                var ah = (a >>> 16) & 0xffff;
                var al = a & 0xffff;
                var bh = (b >>> 16) & 0xffff;
                var bl = b & 0xffff;
                // the shift by 0 fixes the sign on the high part
                // the final |0 converts the unsigned value into a signed value
                return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
            };
        }
        /**
         * Polyfill clz32.
         */
        if (!Math.clz32) {
            Math.clz32 = function clz32(i) {
                i |= (i >> 1);
                i |= (i >> 2);
                i |= (i >> 4);
                i |= (i >> 8);
                i |= (i >> 16);
                return 32 - IntegerUtilities.ones(i);
            };
        }
    })(IntegerUtilities = J2ME.IntegerUtilities || (J2ME.IntegerUtilities = {}));
    (function (LogLevel) {
        LogLevel[LogLevel["Error"] = 1] = "Error";
        LogLevel[LogLevel["Warn"] = 2] = "Warn";
        LogLevel[LogLevel["Debug"] = 4] = "Debug";
        LogLevel[LogLevel["Log"] = 8] = "Log";
        LogLevel[LogLevel["Info"] = 16] = "Info";
        LogLevel[LogLevel["All"] = 31] = "All";
    })(J2ME.LogLevel || (J2ME.LogLevel = {}));
    var LogLevel = J2ME.LogLevel;
    var IndentingWriter = (function () {
        function IndentingWriter(suppressOutput, out) {
            if (suppressOutput === void 0) { suppressOutput = false; }
            this._tab = " ";
            this._padding = "";
            this._suppressOutput = suppressOutput;
            this._out = out || IndentingWriter.stdout;
            this._outNoNewline = out || IndentingWriter.stdoutNoNewline;
        }
        IndentingWriter.prototype.write = function (str, writePadding) {
            if (str === void 0) { str = ""; }
            if (writePadding === void 0) { writePadding = false; }
            if (!this._suppressOutput) {
                this._outNoNewline((writePadding ? this._padding : "") + str);
            }
        };
        IndentingWriter.prototype.writeLn = function (str) {
            if (str === void 0) { str = ""; }
            if (!this._suppressOutput) {
                this._out(this._padding + str);
            }
        };
        IndentingWriter.prototype.writeTimeLn = function (str) {
            if (str === void 0) { str = ""; }
            if (!this._suppressOutput) {
                this._out(this._padding + performance.now().toFixed(2) + " " + str);
            }
        };
        IndentingWriter.prototype.writeComment = function (str) {
            var lines = str.split("\n");
            if (lines.length === 1) {
                this.writeLn("// " + lines[0]);
            }
            else {
                this.writeLn("/**");
                for (var i = 0; i < lines.length; i++) {
                    this.writeLn(" * " + lines[i]);
                }
                this.writeLn(" */");
            }
        };
        IndentingWriter.prototype.writeLns = function (str) {
            var lines = str.split("\n");
            for (var i = 0; i < lines.length; i++) {
                this.writeLn(lines[i]);
            }
        };
        IndentingWriter.prototype.errorLn = function (str) {
            if (IndentingWriter.logLevel & 1 /* Error */) {
                this.boldRedLn(str);
            }
        };
        IndentingWriter.prototype.warnLn = function (str) {
            if (IndentingWriter.logLevel & 2 /* Warn */) {
                this.yellowLn(str);
            }
        };
        IndentingWriter.prototype.debugLn = function (str) {
            if (IndentingWriter.logLevel & 4 /* Debug */) {
                this.purpleLn(str);
            }
        };
        IndentingWriter.prototype.logLn = function (str) {
            if (IndentingWriter.logLevel & 8 /* Log */) {
                this.writeLn(str);
            }
        };
        IndentingWriter.prototype.infoLn = function (str) {
            if (IndentingWriter.logLevel & 16 /* Info */) {
                this.writeLn(str);
            }
        };
        IndentingWriter.prototype.yellowLn = function (str) {
            this.colorLn(IndentingWriter.YELLOW, str);
        };
        IndentingWriter.prototype.greenLn = function (str) {
            this.colorLn(IndentingWriter.GREEN, str);
        };
        IndentingWriter.prototype.boldRedLn = function (str) {
            this.colorLn(IndentingWriter.BOLD_RED, str);
        };
        IndentingWriter.prototype.redLn = function (str) {
            this.colorLn(IndentingWriter.RED, str);
        };
        IndentingWriter.prototype.purpleLn = function (str) {
            this.colorLn(IndentingWriter.PURPLE, str);
        };
        IndentingWriter.prototype.colorLn = function (color, str) {
            if (!this._suppressOutput) {
                if (!inBrowser) {
                    this._out(this._padding + color + str + IndentingWriter.ENDC);
                }
                else {
                    this._out(this._padding + str);
                }
            }
        };
        IndentingWriter.prototype.redLns = function (str) {
            this.colorLns(IndentingWriter.RED, str);
        };
        IndentingWriter.prototype.colorLns = function (color, str) {
            var lines = str.split("\n");
            for (var i = 0; i < lines.length; i++) {
                this.colorLn(color, lines[i]);
            }
        };
        IndentingWriter.prototype.enter = function (str) {
            if (!this._suppressOutput) {
                this._out(this._padding + str);
            }
            this.indent();
        };
        IndentingWriter.prototype.leaveAndEnter = function (str) {
            this.leave(str);
            this.indent();
        };
        IndentingWriter.prototype.leave = function (str) {
            this.outdent();
            if (!this._suppressOutput) {
                this._out(this._padding + str);
            }
        };
        IndentingWriter.prototype.indent = function () {
            this._padding += this._tab;
        };
        IndentingWriter.prototype.outdent = function () {
            if (this._padding.length > 0) {
                this._padding = this._padding.substring(0, this._padding.length - this._tab.length);
            }
        };
        IndentingWriter.prototype.writeArray = function (arr, detailed, noNumbers) {
            if (detailed === void 0) { detailed = false; }
            if (noNumbers === void 0) { noNumbers = false; }
            detailed = detailed || false;
            for (var i = 0, j = arr.length; i < j; i++) {
                var prefix = "";
                if (detailed) {
                    if (arr[i] === null) {
                        prefix = "null";
                    }
                    else if (arr[i] === undefined) {
                        prefix = "undefined";
                    }
                    else {
                        prefix = arr[i].constructor.name;
                    }
                    prefix += " ";
                }
                var number = noNumbers ? "" : ("" + i).padRight(' ', 4);
                this.writeLn(number + prefix + arr[i]);
            }
        };
        IndentingWriter.PURPLE = '\033[94m';
        IndentingWriter.YELLOW = '\033[93m';
        IndentingWriter.GREEN = '\033[92m';
        IndentingWriter.RED = '\033[91m';
        IndentingWriter.BOLD_RED = '\033[1;91m';
        IndentingWriter.ENDC = '\033[0m';
        IndentingWriter.logLevel = 31 /* All */;
        IndentingWriter.stdout = inBrowser ? console.info.bind(console) : print;
        IndentingWriter.stdoutNoNewline = inBrowser ? console.info.bind(console) : putstr;
        IndentingWriter.stderr = inBrowser ? console.error.bind(console) : printErr;
        return IndentingWriter;
    })();
    J2ME.IndentingWriter = IndentingWriter;
    var BitSets;
    (function (BitSets) {
        var assert = Debug.assert;
        BitSets.ADDRESS_BITS_PER_WORD = 5;
        BitSets.BITS_PER_WORD = 1 << BitSets.ADDRESS_BITS_PER_WORD;
        BitSets.BIT_INDEX_MASK = BitSets.BITS_PER_WORD - 1;
        function getSize(length) {
            return ((length + (BitSets.BITS_PER_WORD - 1)) >> BitSets.ADDRESS_BITS_PER_WORD) << BitSets.ADDRESS_BITS_PER_WORD;
        }
        function toBitString(on, off) {
            var self = this;
            on = on || "1";
            off = off || "0";
            var str = "";
            for (var i = 0; i < length; i++) {
                str += self.get(i) ? on : off;
            }
            return str;
        }
        function toString(names) {
            var self = this;
            var set = [];
            for (var i = 0; i < length; i++) {
                if (self.get(i)) {
                    set.push(names ? names[i] : i);
                }
            }
            return set.join(", ");
        }
        var Uint32ArrayBitSet = (function () {
            function Uint32ArrayBitSet(length) {
                this.size = getSize(length);
                this.count = 0;
                this.dirty = 0;
                this.length = length;
                this.bits = new Uint32Array(this.size >> BitSets.ADDRESS_BITS_PER_WORD);
            }
            Uint32ArrayBitSet.prototype.recount = function () {
                if (!this.dirty) {
                    return;
                }
                var bits = this.bits;
                var c = 0;
                for (var i = 0, j = bits.length; i < j; i++) {
                    var v = bits[i];
                    v = v - ((v >> 1) & 0x55555555);
                    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
                    c += ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
                }
                this.count = c;
                this.dirty = 0;
            };
            Uint32ArrayBitSet.prototype.set = function (i) {
                var n = i >> BitSets.ADDRESS_BITS_PER_WORD;
                var old = this.bits[n];
                var b = old | (1 << (i & BitSets.BIT_INDEX_MASK));
                this.bits[n] = b;
                this.dirty |= old ^ b;
            };
            Uint32ArrayBitSet.prototype.setAll = function () {
                var bits = this.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    bits[i] = 0xFFFFFFFF;
                }
                this.count = this.size;
                this.dirty = 0;
            };
            Uint32ArrayBitSet.prototype.assign = function (set) {
                this.count = set.count;
                this.dirty = set.dirty;
                this.size = set.size;
                for (var i = 0, j = this.bits.length; i < j; i++) {
                    this.bits[i] = set.bits[i];
                }
            };
            Uint32ArrayBitSet.prototype.nextSetBit = function (from, to) {
                if (from === to) {
                    return -1;
                }
                var bits = this.bits;
                for (var i = from; i < to; i++) {
                    var word = bits[i >> BitSets.ADDRESS_BITS_PER_WORD];
                    if (((word & 1 << (i & BitSets.BIT_INDEX_MASK))) !== 0) {
                        return i;
                    }
                }
            };
            Uint32ArrayBitSet.prototype.clear = function (i) {
                var n = i >> BitSets.ADDRESS_BITS_PER_WORD;
                var old = this.bits[n];
                var b = old & ~(1 << (i & BitSets.BIT_INDEX_MASK));
                this.bits[n] = b;
                this.dirty |= old ^ b;
            };
            Uint32ArrayBitSet.prototype.get = function (i) {
                var word = this.bits[i >> BitSets.ADDRESS_BITS_PER_WORD];
                return ((word & 1 << (i & BitSets.BIT_INDEX_MASK))) !== 0;
            };
            Uint32ArrayBitSet.prototype.clearAll = function () {
                var bits = this.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    bits[i] = 0;
                }
                this.count = 0;
                this.dirty = 0;
            };
            Uint32ArrayBitSet.prototype._union = function (other) {
                var dirty = this.dirty;
                var bits = this.bits;
                var otherBits = other.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    var old = bits[i];
                    var b = old | otherBits[i];
                    bits[i] = b;
                    dirty |= old ^ b;
                }
                this.dirty = dirty;
            };
            Uint32ArrayBitSet.prototype.intersect = function (other) {
                var dirty = this.dirty;
                var bits = this.bits;
                var otherBits = other.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    var old = bits[i];
                    var b = old & otherBits[i];
                    bits[i] = b;
                    dirty |= old ^ b;
                }
                this.dirty = dirty;
            };
            Uint32ArrayBitSet.prototype.subtract = function (other) {
                var dirty = this.dirty;
                var bits = this.bits;
                var otherBits = other.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    var old = bits[i];
                    var b = old & ~otherBits[i];
                    bits[i] = b;
                    dirty |= old ^ b;
                }
                this.dirty = dirty;
            };
            Uint32ArrayBitSet.prototype.negate = function () {
                var dirty = this.dirty;
                var bits = this.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    var old = bits[i];
                    var b = ~old;
                    bits[i] = b;
                    dirty |= old ^ b;
                }
                this.dirty = dirty;
            };
            Uint32ArrayBitSet.prototype.forEach = function (fn) {
                release || assert(fn, "bad fn in forEach");
                var bits = this.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    var word = bits[i];
                    if (word) {
                        for (var k = 0; k < BitSets.BITS_PER_WORD; k++) {
                            if (word & (1 << k)) {
                                fn(i * BitSets.BITS_PER_WORD + k);
                            }
                        }
                    }
                }
            };
            Uint32ArrayBitSet.prototype.toArray = function () {
                var set = [];
                var bits = this.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    var word = bits[i];
                    if (word) {
                        for (var k = 0; k < BitSets.BITS_PER_WORD; k++) {
                            if (word & (1 << k)) {
                                set.push(i * BitSets.BITS_PER_WORD + k);
                            }
                        }
                    }
                }
                return set;
            };
            Uint32ArrayBitSet.prototype.equals = function (other) {
                if (this.size !== other.size) {
                    return false;
                }
                var bits = this.bits;
                var otherBits = other.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    if (bits[i] !== otherBits[i]) {
                        return false;
                    }
                }
                return true;
            };
            Uint32ArrayBitSet.prototype.contains = function (other) {
                if (this.size !== other.size) {
                    return false;
                }
                var bits = this.bits;
                var otherBits = other.bits;
                for (var i = 0, j = bits.length; i < j; i++) {
                    if ((bits[i] | otherBits[i]) !== bits[i]) {
                        return false;
                    }
                }
                return true;
            };
            Uint32ArrayBitSet.prototype.isEmpty = function () {
                this.recount();
                return this.count === 0;
            };
            Uint32ArrayBitSet.prototype.clone = function () {
                var set = new Uint32ArrayBitSet(this.length);
                set._union(this);
                return set;
            };
            return Uint32ArrayBitSet;
        })();
        BitSets.Uint32ArrayBitSet = Uint32ArrayBitSet;
        Uint32ArrayBitSet.prototype.toString = toString;
        Uint32ArrayBitSet.prototype.toBitString = toBitString;
    })(BitSets = J2ME.BitSets || (J2ME.BitSets = {}));
    function parseManifest(fileContents) {
        var manifest = {};
        var matches;
        var reg = /([A-Za-z0-9\-_]+):\s([^\n\r$]+)/g;
        while ((matches = reg.exec(fileContents)) !== null) {
            manifest[matches[1]] = matches[2];
        }
        return manifest;
    }
    J2ME.parseManifest = parseManifest;
})(J2ME || (J2ME = {}));
/**
 * Extend builtin prototypes.
 *
 * TODO: Go through the code and remove all references to these.
 */
(function () {
    function extendBuiltin(prototype, property, value) {
        if (!prototype[property]) {
            Object.defineProperty(prototype, property, { value: value,
                writable: true,
                configurable: true,
                enumerable: false });
        }
    }
    function removeColors(s) {
        return s.replace(/\033\[[0-9]*m/g, "");
    }
    extendBuiltin(String.prototype, "padRight", function (c, n) {
        var str = this;
        var length = removeColors(str).length;
        if (!c || length >= n) {
            return str;
        }
        var max = (n - length) / c.length;
        for (var i = 0; i < max; i++) {
            str += c;
        }
        return str;
    });
    extendBuiltin(String.prototype, "padLeft", function (c, n) {
        var str = this;
        var length = str.length;
        if (!c || length >= n) {
            return str;
        }
        var max = (n - length) / c.length;
        for (var i = 0; i < max; i++) {
            str = c + str;
        }
        return str;
    });
    extendBuiltin(String.prototype, "trim", function () {
        return this.replace(/^\s+|\s+$/g, "");
    });
    extendBuiltin(String.prototype, "endsWith", function (str) {
        return this.indexOf(str, this.length - str.length) !== -1;
    });
})();
var J2ME;
(function (J2ME) {
    var Shell;
    (function (Shell) {
        var MicroTask = (function () {
            function MicroTask(id, fn, args, interval, repeat) {
                this.id = id;
                this.fn = fn;
                this.args = args;
                this.interval = interval;
                this.repeat = repeat;
            }
            return MicroTask;
        })();
        Shell.MicroTask = MicroTask;
        var MicroTasksQueue = (function () {
            function MicroTasksQueue() {
                this.tasks = [];
                this.nextId = 1;
                this.stopped = true;
            }
            Object.defineProperty(MicroTasksQueue.prototype, "isEmpty", {
                get: function () {
                    return this.tasks.length === 0;
                },
                enumerable: true,
                configurable: true
            });
            MicroTasksQueue.prototype.scheduleInterval = function (fn, args, interval, repeat) {
                var MIN_INTERVAL = 4;
                interval = Math.round((interval || 0) / 10) * 10;
                if (interval < MIN_INTERVAL) {
                    interval = MIN_INTERVAL;
                }
                var taskId = this.nextId++;
                var task = new MicroTask(taskId, fn, args, interval, repeat);
                this.enqueue(task);
                return task;
            };
            MicroTasksQueue.prototype.enqueue = function (task) {
                var tasks = this.tasks;
                task.runAt = dateNow() + task.interval;
                var i = tasks.length;
                while (i > 0 && tasks[i - 1].runAt > task.runAt) {
                    i--;
                }
                if (i === tasks.length) {
                    tasks.push(task);
                }
                else {
                    tasks.splice(i, 0, task);
                }
            };
            MicroTasksQueue.prototype.dequeue = function (runAt) {
                if (this.tasks[0].runAt > runAt) {
                    return null;
                }
                var task = this.tasks.shift();
                return task;
            };
            MicroTasksQueue.prototype.remove = function (id) {
                var tasks = this.tasks;
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === id) {
                        tasks.splice(i, 1);
                        return;
                    }
                }
            };
            MicroTasksQueue.prototype.clear = function () {
                this.tasks.length = 0;
            };
            /**
             * Runs micro tasks for a certain |duration| and |count| whichever comes first. Optionally,
             * if the |clear| option is specified, the micro task queue is cleared even if not all the
             * tasks have been executed.
             *
             * If a |preCallback| function is specified, only continue execution if |preCallback()| returns true.
             */
            MicroTasksQueue.prototype.run = function (duration, count, clear, preCallback) {
                if (duration === void 0) { duration = 0; }
                if (count === void 0) { count = 0; }
                if (clear === void 0) { clear = false; }
                if (preCallback === void 0) { preCallback = null; }
                this.stopped = false;
                var executedTasks = 0;
                var stopAt = Date.now() + duration;
                while (!this.isEmpty && !this.stopped) {
                    if (duration > 0 && Date.now() >= stopAt) {
                        break;
                    }
                    if (count > 0 && executedTasks >= count) {
                        break;
                    }
                    var task = null;
                    do {
                        task = this.dequeue(dateNow());
                    } while (!task);
                    if (preCallback && !preCallback(task)) {
                        return;
                    }
                    task.fn.apply(null, task.args);
                    executedTasks++;
                }
                if (clear) {
                    this.clear();
                }
                this.stopped = true;
            };
            MicroTasksQueue.prototype.stop = function () {
                this.stopped = true;
            };
            return MicroTasksQueue;
        })();
        Shell.MicroTasksQueue = MicroTasksQueue;
    })(Shell = J2ME.Shell || (J2ME.Shell = {}));
})(J2ME || (J2ME = {}));
/*
 * Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var J2ME;
(function (J2ME) {
    var Metrics;
    (function (Metrics) {
        var Timer = (function () {
            function Timer(parent, name) {
                this._parent = parent;
                this._timers = J2ME.ObjectUtilities.createMap();
                this._name = name;
                this._begin = 0;
                this._last = 0;
                this._total = 0;
                this._count = 0;
            }
            Timer.time = function (name, fn) {
                Timer.start(name);
                fn();
                Timer.stop();
            };
            Timer.start = function (name) {
                Timer._top = Timer._top._timers[name] || (Timer._top._timers[name] = new Timer(Timer._top, name));
                Timer._top.start();
                var tmp = Timer._flat._timers[name] || (Timer._flat._timers[name] = new Timer(Timer._flat, name));
                tmp.start();
                Timer._flatStack.push(tmp);
            };
            Timer.stop = function () {
                Timer._top.stop();
                Timer._top = Timer._top._parent;
                Timer._flatStack.pop().stop();
            };
            Timer.stopStart = function (name) {
                Timer.stop();
                Timer.start(name);
            };
            Timer.prototype.start = function () {
                this._begin = J2ME.getTicks();
            };
            Timer.prototype.stop = function () {
                this._last = J2ME.getTicks() - this._begin;
                this._total += this._last;
                this._count += 1;
            };
            Timer.prototype.toJSON = function () {
                return { name: this._name, total: this._total, timers: this._timers };
            };
            Timer.prototype.trace = function (writer) {
                writer.enter(this._name + ": " + this._total.toFixed(2) + " ms" +
                    ", count: " + this._count +
                    ", average: " + (this._total / this._count).toFixed(2) + " ms");
                for (var name in this._timers) {
                    this._timers[name].trace(writer);
                }
                writer.outdent();
            };
            Timer.trace = function (writer) {
                Timer._base.trace(writer);
                Timer._flat.trace(writer);
            };
            Timer._base = new Timer(null, "Total");
            Timer._top = Timer._base;
            Timer._flat = new Timer(null, "Flat");
            Timer._flatStack = [];
            return Timer;
        })();
        Metrics.Timer = Timer;
        /**
         * Quick way to count named events.
         */
        var Counter = (function () {
            function Counter(enabled) {
                this._enabled = enabled;
                this.clear();
            }
            Object.defineProperty(Counter.prototype, "counts", {
                get: function () {
                    return this._counts;
                },
                enumerable: true,
                configurable: true
            });
            Counter.prototype.setEnabled = function (enabled) {
                this._enabled = enabled;
            };
            Counter.prototype.clear = function () {
                this._counts = J2ME.ObjectUtilities.createMap();
                this._times = J2ME.ObjectUtilities.createMap();
            };
            Counter.prototype.toJSON = function () {
                return {
                    counts: this._counts,
                    times: this._times
                };
            };
            Counter.prototype.count = function (name, increment, time) {
                if (increment === void 0) { increment = 1; }
                if (time === void 0) { time = 0; }
                if (!this._enabled) {
                    return;
                }
                if (this._counts[name] === undefined) {
                    this._counts[name] = 0;
                    this._times[name] = 0;
                }
                this._counts[name] += increment;
                this._times[name] += time;
                return this._counts[name];
            };
            Counter.prototype.trace = function (writer) {
                for (var name in this._counts) {
                    writer.writeLn(name + ": " + this._counts[name]);
                }
            };
            Counter.prototype._pairToString = function (times, pair) {
                var name = pair[0];
                var count = pair[1];
                var time = times[name];
                var line = count + ": " + name;
                if (time) {
                    line += ", " + time.toFixed(4);
                    if (count > 1) {
                        line += " (" + (time / count).toFixed(4) + ")";
                    }
                }
                return line;
            };
            Counter.prototype.toStringSorted = function () {
                var self = this;
                var times = this._times;
                var pairs = [];
                for (var name in this._counts) {
                    pairs.push([name, this._counts[name]]);
                }
                pairs.sort(function (a, b) {
                    return b[1] - a[1];
                });
                return (pairs.map(function (pair) {
                    return self._pairToString(times, pair);
                }).join(", "));
            };
            Counter.prototype.traceSorted = function (writer, inline) {
                if (inline === void 0) { inline = false; }
                var self = this;
                var times = this._times;
                var pairs = [];
                for (var name in this._counts) {
                    pairs.push([name, this._counts[name]]);
                }
                pairs.sort(function (a, b) {
                    return b[1] - a[1];
                });
                if (inline) {
                    writer.writeLn(pairs.map(function (pair) {
                        return self._pairToString(times, pair);
                    }).join(", "));
                }
                else {
                    pairs.forEach(function (pair) {
                        writer.writeLn(self._pairToString(times, pair));
                    });
                }
            };
            Counter.instance = new Counter(true);
            return Counter;
        })();
        Metrics.Counter = Counter;
        var Average = (function () {
            function Average(max) {
                this._samples = new Float64Array(max);
                this._count = 0;
                this._index = 0;
            }
            Average.prototype.push = function (sample) {
                if (this._count < this._samples.length) {
                    this._count++;
                }
                this._index++;
                this._samples[this._index % this._samples.length] = sample;
            };
            Average.prototype.average = function () {
                var sum = 0;
                for (var i = 0; i < this._count; i++) {
                    sum += this._samples[i];
                }
                return sum / this._count;
            };
            return Average;
        })();
        Metrics.Average = Average;
    })(Metrics = J2ME.Metrics || (J2ME.Metrics = {}));
})(J2ME || (J2ME = {}));
/**
 * Port of Java java.util.Hashtable.
 */
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    var TypedArrayHashtableEntry = (function () {
        function TypedArrayHashtableEntry() {
            this.hash = 0;
            this.value = null;
            this.next = null;
            this.key = null;
        }
        return TypedArrayHashtableEntry;
    })();
    J2ME.TypedArrayHashtableEntry = TypedArrayHashtableEntry;
    function arrayEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    function arrayRangeEqual(a, offset, length, b) {
        if (length !== b.length) {
            return false;
        }
        var j = offset;
        for (var i = 0; i < length; j++, i++) {
            if (a[j] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    function arrayHash(array) {
        return arrayRangeHash(array, 0, array.length);
    }
    function arrayRangeHash(array, offset, length) {
        var h = 0;
        var l = offset + length;
        for (var i = offset; i < l; i++) {
            h = (Math.imul(31, h) | 0 + array[i] | 0);
        }
        return h;
    }
    function nullArray(capacity) {
        var array = new Array(capacity);
        for (var i = 0; i < capacity; i++) {
            array[i] = null;
        }
        return array;
    }
    var TypedArrayHashtable = (function () {
        function TypedArrayHashtable(initialCapacity) {
            this.count = 0;
            release || assert(initialCapacity >= 0, "bad initialCapacity in Uint8Hashtable constructor");
            if (initialCapacity == 0) {
                initialCapacity = 1;
            }
            this.table = nullArray(initialCapacity);
            this.threshold = ((initialCapacity * TypedArrayHashtable.loadFactorPercent) / 100) | 0;
        }
        TypedArrayHashtable.prototype.contains = function (key) {
            var table = this.table;
            var hash = arrayHash(key);
            var index = (hash & 0x7FFFFFFF) % table.length;
            for (var e = table[index]; e !== null; e = e.next) {
                if ((e.hash === hash) && arrayEqual(e.key, key)) {
                    return true;
                }
            }
            return false;
        };
        TypedArrayHashtable.prototype.getByRange = function (key, offset, length) {
            var table = this.table;
            var hash = arrayRangeHash(key, offset, length);
            var index = (hash & 0x7FFFFFFF) % table.length;
            for (var e = table[index]; e !== null; e = e.next) {
                if ((e.hash === hash) && arrayRangeEqual(key, offset, length, e.key)) {
                    return e.value;
                }
            }
            return null;
        };
        TypedArrayHashtable.prototype.get = function (key) {
            var table = this.table;
            var hash = arrayHash(key);
            var index = (hash & 0x7FFFFFFF) % table.length;
            for (var e = table[index]; e !== null; e = e.next) {
                if ((e.hash === hash) && arrayEqual(e.key, key)) {
                    return e.value;
                }
            }
            return null;
        };
        TypedArrayHashtable.prototype.put = function (key, value) {
            // Make sure the value is not null
            release || assert(value !== null, "bad value in Uin8Hashtable put");
            // Makes sure the key is not already in the hashtable.
            var table = this.table;
            var hash = arrayHash(key);
            var index = (hash & 0x7FFFFFFF) % table.length;
            for (var e = table[index]; e !== null; e = e.next) {
                if ((e.hash === hash) && arrayEqual(e.key, key)) {
                    var old = e.value;
                    e.value = value;
                    return old;
                }
            }
            if (this.count >= this.threshold) {
                // Rehash the table if the threshold is exceeded
                this.rehash();
                return this.put(key, value);
            }
            // Creates the new entry.
            var e = new TypedArrayHashtableEntry();
            e.hash = hash;
            e.key = key;
            e.value = value;
            e.next = table[index];
            table[index] = e;
            this.count++;
            return null;
        };
        TypedArrayHashtable.prototype.rehash = function () {
            var oldCapacity = this.table.length;
            var oldTable = this.table;
            var newCapacity = oldCapacity * 2 + 1;
            var newTable = nullArray(newCapacity);
            this.threshold = ((newCapacity * TypedArrayHashtable.loadFactorPercent) / 100) | 0;
            this.table = newTable;
            for (var i = oldCapacity; i-- > 0;) {
                for (var old = oldTable[i]; old !== null;) {
                    var e = old;
                    old = old.next;
                    var index = (e.hash & 0x7FFFFFFF) % newCapacity;
                    e.next = newTable[index];
                    newTable[index] = e;
                }
            }
        };
        TypedArrayHashtable.loadFactorPercent = 75;
        return TypedArrayHashtable;
    })();
    J2ME.TypedArrayHashtable = TypedArrayHashtable;
})(J2ME || (J2ME = {}));
/*
 * Copyright (c) 2009, 2011, Oracle and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Oracle, 500 Oracle Parkway, Redwood Shores, CA 94065 USA
 * or visit www.oracle.com if you need additional information or have any
 * questions.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var J2ME;
(function (J2ME) {
    var Bytecode;
    (function (Bytecode) {
        var assert = J2ME.Debug.assert;
        var Bytes = (function () {
            function Bytes() {
            }
            /**
             * Gets a signed 1-byte value.
             */
            Bytes.beS1 = function (data, bci) {
                return (data[bci] << 24) >> 24;
            };
            /**
             * Gets a signed 2-byte big-endian value.
             */
            Bytes.beS2 = function (data, bci) {
                return ((data[bci] << 8) | (data[bci + 1] & 0xff)) << 16 >> 16;
            };
            /**
             * Gets an unsigned 1-byte value.
             */
            Bytes.beU1 = function (data, bci) {
                return data[bci] & 0xff;
            };
            /**
             * Gets an unsigned 2-byte big-endian value.
             */
            Bytes.beU2 = function (data, bci) {
                return ((data[bci] & 0xff) << 8) | (data[bci + 1] & 0xff);
            };
            /**
             * Gets a signed 4-byte big-endian value.
             */
            Bytes.beS4 = function (data, bci) {
                return (data[bci] << 24) | ((data[bci + 1] & 0xff) << 16) | ((data[bci + 2] & 0xff) << 8) | (data[bci + 3] & 0xff);
            };
            /**
             * Gets either a signed 2-byte or a signed 4-byte big-endian value.
             */
            Bytes.beSVar = function (data, bci, fourByte) {
                if (fourByte) {
                    return Bytes.beS4(data, bci);
                }
                else {
                    return Bytes.beS2(data, bci);
                }
            };
            return Bytes;
        })();
        Bytecode.Bytes = Bytes;
        (function (Condition) {
            /**
             * Equal.
             */
            Condition[Condition["EQ"] = 0] = "EQ";
            /**
             * Not equal.
             */
            Condition[Condition["NE"] = 1] = "NE";
            /**
             * Signed less than.
             */
            Condition[Condition["LT"] = 2] = "LT";
            /**
             * Signed less than or equal.
             */
            Condition[Condition["LE"] = 3] = "LE";
            /**
             * Signed greater than.
             */
            Condition[Condition["GT"] = 4] = "GT";
            /**
             * Signed greater than or equal.
             */
            Condition[Condition["GE"] = 5] = "GE";
            /**
             * Unsigned greater than or equal ("above than or equal").
             */
            Condition[Condition["AE"] = 6] = "AE";
            /**
             * Unsigned less than or equal ("below than or equal").
             */
            Condition[Condition["BE"] = 7] = "BE";
            /**
             * Unsigned greater than ("above than").
             */
            Condition[Condition["AT"] = 8] = "AT";
            /**
             * Unsigned less than ("below than").
             */
            Condition[Condition["BT"] = 9] = "BT";
            /**
             * Operation produced an overflow.
             */
            Condition[Condition["OF"] = 10] = "OF";
            /**
             * Operation did not produce an overflow.
             */
            Condition[Condition["NOF"] = 11] = "NOF";
        })(Bytecode.Condition || (Bytecode.Condition = {}));
        var Condition = Bytecode.Condition;
        /**
         * The definitions of the bytecodes that are valid input to the compiler and
         * related utility methods. This comprises two groups: the standard Java
         * bytecodes defined by <a href=
         * "http://java.sun.com/docs/books/jvms/second_edition/html/VMSpecTOC.doc.html">
         * Java Virtual Machine Specification</a>, and a set of <i>extended</i>
         * bytecodes that support low-level programming, for example, memory barriers.
         *
         * The extended bytecodes are one or three bytes in size. The one-byte bytecodes
         * follow the values in the standard set, with no gap. The three-byte extended
         * bytecodes share a common first byte and carry additional instruction-specific
         * information in the second and third bytes.
         */
        (function (Bytecodes) {
            Bytecodes[Bytecodes["NOP"] = 0] = "NOP";
            Bytecodes[Bytecodes["ACONST_NULL"] = 1] = "ACONST_NULL";
            Bytecodes[Bytecodes["ICONST_M1"] = 2] = "ICONST_M1";
            Bytecodes[Bytecodes["ICONST_0"] = 3] = "ICONST_0";
            Bytecodes[Bytecodes["ICONST_1"] = 4] = "ICONST_1";
            Bytecodes[Bytecodes["ICONST_2"] = 5] = "ICONST_2";
            Bytecodes[Bytecodes["ICONST_3"] = 6] = "ICONST_3";
            Bytecodes[Bytecodes["ICONST_4"] = 7] = "ICONST_4";
            Bytecodes[Bytecodes["ICONST_5"] = 8] = "ICONST_5";
            Bytecodes[Bytecodes["LCONST_0"] = 9] = "LCONST_0";
            Bytecodes[Bytecodes["LCONST_1"] = 10] = "LCONST_1";
            Bytecodes[Bytecodes["FCONST_0"] = 11] = "FCONST_0";
            Bytecodes[Bytecodes["FCONST_1"] = 12] = "FCONST_1";
            Bytecodes[Bytecodes["FCONST_2"] = 13] = "FCONST_2";
            Bytecodes[Bytecodes["DCONST_0"] = 14] = "DCONST_0";
            Bytecodes[Bytecodes["DCONST_1"] = 15] = "DCONST_1";
            Bytecodes[Bytecodes["BIPUSH"] = 16] = "BIPUSH";
            Bytecodes[Bytecodes["SIPUSH"] = 17] = "SIPUSH";
            Bytecodes[Bytecodes["LDC"] = 18] = "LDC";
            Bytecodes[Bytecodes["LDC_W"] = 19] = "LDC_W";
            Bytecodes[Bytecodes["LDC2_W"] = 20] = "LDC2_W";
            Bytecodes[Bytecodes["ILOAD"] = 21] = "ILOAD";
            Bytecodes[Bytecodes["LLOAD"] = 22] = "LLOAD";
            Bytecodes[Bytecodes["FLOAD"] = 23] = "FLOAD";
            Bytecodes[Bytecodes["DLOAD"] = 24] = "DLOAD";
            Bytecodes[Bytecodes["ALOAD"] = 25] = "ALOAD";
            Bytecodes[Bytecodes["ILOAD_0"] = 26] = "ILOAD_0";
            Bytecodes[Bytecodes["ILOAD_1"] = 27] = "ILOAD_1";
            Bytecodes[Bytecodes["ILOAD_2"] = 28] = "ILOAD_2";
            Bytecodes[Bytecodes["ILOAD_3"] = 29] = "ILOAD_3";
            Bytecodes[Bytecodes["LLOAD_0"] = 30] = "LLOAD_0";
            Bytecodes[Bytecodes["LLOAD_1"] = 31] = "LLOAD_1";
            Bytecodes[Bytecodes["LLOAD_2"] = 32] = "LLOAD_2";
            Bytecodes[Bytecodes["LLOAD_3"] = 33] = "LLOAD_3";
            Bytecodes[Bytecodes["FLOAD_0"] = 34] = "FLOAD_0";
            Bytecodes[Bytecodes["FLOAD_1"] = 35] = "FLOAD_1";
            Bytecodes[Bytecodes["FLOAD_2"] = 36] = "FLOAD_2";
            Bytecodes[Bytecodes["FLOAD_3"] = 37] = "FLOAD_3";
            Bytecodes[Bytecodes["DLOAD_0"] = 38] = "DLOAD_0";
            Bytecodes[Bytecodes["DLOAD_1"] = 39] = "DLOAD_1";
            Bytecodes[Bytecodes["DLOAD_2"] = 40] = "DLOAD_2";
            Bytecodes[Bytecodes["DLOAD_3"] = 41] = "DLOAD_3";
            Bytecodes[Bytecodes["ALOAD_0"] = 42] = "ALOAD_0";
            Bytecodes[Bytecodes["ALOAD_1"] = 43] = "ALOAD_1";
            Bytecodes[Bytecodes["ALOAD_2"] = 44] = "ALOAD_2";
            Bytecodes[Bytecodes["ALOAD_3"] = 45] = "ALOAD_3";
            Bytecodes[Bytecodes["IALOAD"] = 46] = "IALOAD";
            Bytecodes[Bytecodes["LALOAD"] = 47] = "LALOAD";
            Bytecodes[Bytecodes["FALOAD"] = 48] = "FALOAD";
            Bytecodes[Bytecodes["DALOAD"] = 49] = "DALOAD";
            Bytecodes[Bytecodes["AALOAD"] = 50] = "AALOAD";
            Bytecodes[Bytecodes["BALOAD"] = 51] = "BALOAD";
            Bytecodes[Bytecodes["CALOAD"] = 52] = "CALOAD";
            Bytecodes[Bytecodes["SALOAD"] = 53] = "SALOAD";
            Bytecodes[Bytecodes["ISTORE"] = 54] = "ISTORE";
            Bytecodes[Bytecodes["LSTORE"] = 55] = "LSTORE";
            Bytecodes[Bytecodes["FSTORE"] = 56] = "FSTORE";
            Bytecodes[Bytecodes["DSTORE"] = 57] = "DSTORE";
            Bytecodes[Bytecodes["ASTORE"] = 58] = "ASTORE";
            Bytecodes[Bytecodes["ISTORE_0"] = 59] = "ISTORE_0";
            Bytecodes[Bytecodes["ISTORE_1"] = 60] = "ISTORE_1";
            Bytecodes[Bytecodes["ISTORE_2"] = 61] = "ISTORE_2";
            Bytecodes[Bytecodes["ISTORE_3"] = 62] = "ISTORE_3";
            Bytecodes[Bytecodes["LSTORE_0"] = 63] = "LSTORE_0";
            Bytecodes[Bytecodes["LSTORE_1"] = 64] = "LSTORE_1";
            Bytecodes[Bytecodes["LSTORE_2"] = 65] = "LSTORE_2";
            Bytecodes[Bytecodes["LSTORE_3"] = 66] = "LSTORE_3";
            Bytecodes[Bytecodes["FSTORE_0"] = 67] = "FSTORE_0";
            Bytecodes[Bytecodes["FSTORE_1"] = 68] = "FSTORE_1";
            Bytecodes[Bytecodes["FSTORE_2"] = 69] = "FSTORE_2";
            Bytecodes[Bytecodes["FSTORE_3"] = 70] = "FSTORE_3";
            Bytecodes[Bytecodes["DSTORE_0"] = 71] = "DSTORE_0";
            Bytecodes[Bytecodes["DSTORE_1"] = 72] = "DSTORE_1";
            Bytecodes[Bytecodes["DSTORE_2"] = 73] = "DSTORE_2";
            Bytecodes[Bytecodes["DSTORE_3"] = 74] = "DSTORE_3";
            Bytecodes[Bytecodes["ASTORE_0"] = 75] = "ASTORE_0";
            Bytecodes[Bytecodes["ASTORE_1"] = 76] = "ASTORE_1";
            Bytecodes[Bytecodes["ASTORE_2"] = 77] = "ASTORE_2";
            Bytecodes[Bytecodes["ASTORE_3"] = 78] = "ASTORE_3";
            Bytecodes[Bytecodes["IASTORE"] = 79] = "IASTORE";
            Bytecodes[Bytecodes["LASTORE"] = 80] = "LASTORE";
            Bytecodes[Bytecodes["FASTORE"] = 81] = "FASTORE";
            Bytecodes[Bytecodes["DASTORE"] = 82] = "DASTORE";
            Bytecodes[Bytecodes["AASTORE"] = 83] = "AASTORE";
            Bytecodes[Bytecodes["BASTORE"] = 84] = "BASTORE";
            Bytecodes[Bytecodes["CASTORE"] = 85] = "CASTORE";
            Bytecodes[Bytecodes["SASTORE"] = 86] = "SASTORE";
            Bytecodes[Bytecodes["POP"] = 87] = "POP";
            Bytecodes[Bytecodes["POP2"] = 88] = "POP2";
            Bytecodes[Bytecodes["DUP"] = 89] = "DUP";
            Bytecodes[Bytecodes["DUP_X1"] = 90] = "DUP_X1";
            Bytecodes[Bytecodes["DUP_X2"] = 91] = "DUP_X2";
            Bytecodes[Bytecodes["DUP2"] = 92] = "DUP2";
            Bytecodes[Bytecodes["DUP2_X1"] = 93] = "DUP2_X1";
            Bytecodes[Bytecodes["DUP2_X2"] = 94] = "DUP2_X2";
            Bytecodes[Bytecodes["SWAP"] = 95] = "SWAP";
            Bytecodes[Bytecodes["IADD"] = 96] = "IADD";
            Bytecodes[Bytecodes["LADD"] = 97] = "LADD";
            Bytecodes[Bytecodes["FADD"] = 98] = "FADD";
            Bytecodes[Bytecodes["DADD"] = 99] = "DADD";
            Bytecodes[Bytecodes["ISUB"] = 100] = "ISUB";
            Bytecodes[Bytecodes["LSUB"] = 101] = "LSUB";
            Bytecodes[Bytecodes["FSUB"] = 102] = "FSUB";
            Bytecodes[Bytecodes["DSUB"] = 103] = "DSUB";
            Bytecodes[Bytecodes["IMUL"] = 104] = "IMUL";
            Bytecodes[Bytecodes["LMUL"] = 105] = "LMUL";
            Bytecodes[Bytecodes["FMUL"] = 106] = "FMUL";
            Bytecodes[Bytecodes["DMUL"] = 107] = "DMUL";
            Bytecodes[Bytecodes["IDIV"] = 108] = "IDIV";
            Bytecodes[Bytecodes["LDIV"] = 109] = "LDIV";
            Bytecodes[Bytecodes["FDIV"] = 110] = "FDIV";
            Bytecodes[Bytecodes["DDIV"] = 111] = "DDIV";
            Bytecodes[Bytecodes["IREM"] = 112] = "IREM";
            Bytecodes[Bytecodes["LREM"] = 113] = "LREM";
            Bytecodes[Bytecodes["FREM"] = 114] = "FREM";
            Bytecodes[Bytecodes["DREM"] = 115] = "DREM";
            Bytecodes[Bytecodes["INEG"] = 116] = "INEG";
            Bytecodes[Bytecodes["LNEG"] = 117] = "LNEG";
            Bytecodes[Bytecodes["FNEG"] = 118] = "FNEG";
            Bytecodes[Bytecodes["DNEG"] = 119] = "DNEG";
            Bytecodes[Bytecodes["ISHL"] = 120] = "ISHL";
            Bytecodes[Bytecodes["LSHL"] = 121] = "LSHL";
            Bytecodes[Bytecodes["ISHR"] = 122] = "ISHR";
            Bytecodes[Bytecodes["LSHR"] = 123] = "LSHR";
            Bytecodes[Bytecodes["IUSHR"] = 124] = "IUSHR";
            Bytecodes[Bytecodes["LUSHR"] = 125] = "LUSHR";
            Bytecodes[Bytecodes["IAND"] = 126] = "IAND";
            Bytecodes[Bytecodes["LAND"] = 127] = "LAND";
            Bytecodes[Bytecodes["IOR"] = 128] = "IOR";
            Bytecodes[Bytecodes["LOR"] = 129] = "LOR";
            Bytecodes[Bytecodes["IXOR"] = 130] = "IXOR";
            Bytecodes[Bytecodes["LXOR"] = 131] = "LXOR";
            Bytecodes[Bytecodes["IINC"] = 132] = "IINC";
            Bytecodes[Bytecodes["I2L"] = 133] = "I2L";
            Bytecodes[Bytecodes["I2F"] = 134] = "I2F";
            Bytecodes[Bytecodes["I2D"] = 135] = "I2D";
            Bytecodes[Bytecodes["L2I"] = 136] = "L2I";
            Bytecodes[Bytecodes["L2F"] = 137] = "L2F";
            Bytecodes[Bytecodes["L2D"] = 138] = "L2D";
            Bytecodes[Bytecodes["F2I"] = 139] = "F2I";
            Bytecodes[Bytecodes["F2L"] = 140] = "F2L";
            Bytecodes[Bytecodes["F2D"] = 141] = "F2D";
            Bytecodes[Bytecodes["D2I"] = 142] = "D2I";
            Bytecodes[Bytecodes["D2L"] = 143] = "D2L";
            Bytecodes[Bytecodes["D2F"] = 144] = "D2F";
            Bytecodes[Bytecodes["I2B"] = 145] = "I2B";
            Bytecodes[Bytecodes["I2C"] = 146] = "I2C";
            Bytecodes[Bytecodes["I2S"] = 147] = "I2S";
            Bytecodes[Bytecodes["LCMP"] = 148] = "LCMP";
            Bytecodes[Bytecodes["FCMPL"] = 149] = "FCMPL";
            Bytecodes[Bytecodes["FCMPG"] = 150] = "FCMPG";
            Bytecodes[Bytecodes["DCMPL"] = 151] = "DCMPL";
            Bytecodes[Bytecodes["DCMPG"] = 152] = "DCMPG";
            Bytecodes[Bytecodes["IFEQ"] = 153] = "IFEQ";
            Bytecodes[Bytecodes["IFNE"] = 154] = "IFNE";
            Bytecodes[Bytecodes["IFLT"] = 155] = "IFLT";
            Bytecodes[Bytecodes["IFGE"] = 156] = "IFGE";
            Bytecodes[Bytecodes["IFGT"] = 157] = "IFGT";
            Bytecodes[Bytecodes["IFLE"] = 158] = "IFLE";
            Bytecodes[Bytecodes["IF_ICMPEQ"] = 159] = "IF_ICMPEQ";
            Bytecodes[Bytecodes["IF_ICMPNE"] = 160] = "IF_ICMPNE";
            Bytecodes[Bytecodes["IF_ICMPLT"] = 161] = "IF_ICMPLT";
            Bytecodes[Bytecodes["IF_ICMPGE"] = 162] = "IF_ICMPGE";
            Bytecodes[Bytecodes["IF_ICMPGT"] = 163] = "IF_ICMPGT";
            Bytecodes[Bytecodes["IF_ICMPLE"] = 164] = "IF_ICMPLE";
            Bytecodes[Bytecodes["IF_ACMPEQ"] = 165] = "IF_ACMPEQ";
            Bytecodes[Bytecodes["IF_ACMPNE"] = 166] = "IF_ACMPNE";
            Bytecodes[Bytecodes["GOTO"] = 167] = "GOTO";
            Bytecodes[Bytecodes["JSR"] = 168] = "JSR";
            Bytecodes[Bytecodes["RET"] = 169] = "RET";
            Bytecodes[Bytecodes["TABLESWITCH"] = 170] = "TABLESWITCH";
            Bytecodes[Bytecodes["LOOKUPSWITCH"] = 171] = "LOOKUPSWITCH";
            Bytecodes[Bytecodes["IRETURN"] = 172] = "IRETURN";
            Bytecodes[Bytecodes["LRETURN"] = 173] = "LRETURN";
            Bytecodes[Bytecodes["FRETURN"] = 174] = "FRETURN";
            Bytecodes[Bytecodes["DRETURN"] = 175] = "DRETURN";
            Bytecodes[Bytecodes["ARETURN"] = 176] = "ARETURN";
            Bytecodes[Bytecodes["RETURN"] = 177] = "RETURN";
            Bytecodes[Bytecodes["GETSTATIC"] = 178] = "GETSTATIC";
            Bytecodes[Bytecodes["PUTSTATIC"] = 179] = "PUTSTATIC";
            Bytecodes[Bytecodes["GETFIELD"] = 180] = "GETFIELD";
            Bytecodes[Bytecodes["PUTFIELD"] = 181] = "PUTFIELD";
            Bytecodes[Bytecodes["FIRST_INVOKE"] = 182] = "FIRST_INVOKE";
            Bytecodes[Bytecodes["LAST_INVOKE"] = 185] = "LAST_INVOKE";
            Bytecodes[Bytecodes["INVOKEVIRTUAL"] = 182] = "INVOKEVIRTUAL";
            Bytecodes[Bytecodes["INVOKESPECIAL"] = 183] = "INVOKESPECIAL";
            Bytecodes[Bytecodes["INVOKESTATIC"] = 184] = "INVOKESTATIC";
            Bytecodes[Bytecodes["INVOKEINTERFACE"] = 185] = "INVOKEINTERFACE";
            Bytecodes[Bytecodes["XXXUNUSEDXXX"] = 186] = "XXXUNUSEDXXX";
            Bytecodes[Bytecodes["NEW"] = 187] = "NEW";
            Bytecodes[Bytecodes["NEWARRAY"] = 188] = "NEWARRAY";
            Bytecodes[Bytecodes["ANEWARRAY"] = 189] = "ANEWARRAY";
            Bytecodes[Bytecodes["ARRAYLENGTH"] = 190] = "ARRAYLENGTH";
            Bytecodes[Bytecodes["ATHROW"] = 191] = "ATHROW";
            Bytecodes[Bytecodes["CHECKCAST"] = 192] = "CHECKCAST";
            Bytecodes[Bytecodes["INSTANCEOF"] = 193] = "INSTANCEOF";
            Bytecodes[Bytecodes["MONITORENTER"] = 194] = "MONITORENTER";
            Bytecodes[Bytecodes["MONITOREXIT"] = 195] = "MONITOREXIT";
            Bytecodes[Bytecodes["WIDE"] = 196] = "WIDE";
            Bytecodes[Bytecodes["MULTIANEWARRAY"] = 197] = "MULTIANEWARRAY";
            Bytecodes[Bytecodes["IFNULL"] = 198] = "IFNULL";
            Bytecodes[Bytecodes["IFNONNULL"] = 199] = "IFNONNULL";
            Bytecodes[Bytecodes["GOTO_W"] = 200] = "GOTO_W";
            Bytecodes[Bytecodes["JSR_W"] = 201] = "JSR_W";
            Bytecodes[Bytecodes["BREAKPOINT"] = 202] = "BREAKPOINT";
            Bytecodes[Bytecodes["ALOAD_ILOAD"] = 210] = "ALOAD_ILOAD";
            Bytecodes[Bytecodes["IINC_GOTO"] = 211] = "IINC_GOTO";
            Bytecodes[Bytecodes["ARRAYLENGTH_IF_ICMPGE"] = 212] = "ARRAYLENGTH_IF_ICMPGE";
            Bytecodes[Bytecodes["RESOLVED_GETFIELD"] = 213] = "RESOLVED_GETFIELD";
            Bytecodes[Bytecodes["RESOLVED_PUTFIELD"] = 214] = "RESOLVED_PUTFIELD";
            Bytecodes[Bytecodes["RESOLVED_INVOKEVIRTUAL"] = 215] = "RESOLVED_INVOKEVIRTUAL";
            Bytecodes[Bytecodes["ILLEGAL"] = 255] = "ILLEGAL";
            Bytecodes[Bytecodes["END"] = 256] = "END";
            /**
             * The last opcode defined by the JVM specification. To iterate over all JVM bytecodes:
             */
            Bytecodes[Bytecodes["LAST_JVM_OPCODE"] = 201] = "LAST_JVM_OPCODE";
        })(Bytecode.Bytecodes || (Bytecode.Bytecodes = {}));
        var Bytecodes = Bytecode.Bytecodes;
        function getBytecodesName(bytecode) {
            return Bytecode.Bytecodes[bytecode];
        }
        Bytecode.getBytecodesName = getBytecodesName;
        var Flags;
        (function (Flags) {
            /**
             * Denotes an instruction that ends a basic block and does not let control flow fall through to its lexical successor.
             */
            Flags[Flags["STOP"] = 1] = "STOP";
            /**
             * Denotes an instruction that ends a basic block and may let control flow fall through to its lexical successor.
             * In practice this means it is a conditional branch.
             */
            Flags[Flags["FALL_THROUGH"] = 2] = "FALL_THROUGH";
            /**
             * Denotes an instruction that has a 2 or 4 byte operand that is an offset to another instruction in the same method.
             * This does not include the {@link Bytecodes#TABLESWITCH} or {@link Bytecodes#LOOKUPSWITCH} instructions.
             */
            Flags[Flags["BRANCH"] = 4] = "BRANCH";
            /**
             * Denotes an instruction that reads the value of a static or instance field.
             */
            Flags[Flags["FIELD_READ"] = 8] = "FIELD_READ";
            /**
             * Denotes an instruction that writes the value of a static or instance field.
             */
            Flags[Flags["FIELD_WRITE"] = 16] = "FIELD_WRITE";
            /**
             * Denotes an instruction that is not defined in the JVM specification.
             */
            Flags[Flags["EXTENSION"] = 32] = "EXTENSION";
            /**
             * Denotes an instruction that can cause aFlags.TRAP.
             */
            Flags[Flags["TRAP"] = 128] = "TRAP";
            /**
             * Denotes an instruction that is commutative.
             */
            Flags[Flags["COMMUTATIVE"] = 256] = "COMMUTATIVE";
            /**
             * Denotes an instruction that is associative.
             */
            Flags[Flags["ASSOCIATIVE"] = 512] = "ASSOCIATIVE";
            /**
             * Denotes an instruction that loads an operand.
             */
            Flags[Flags["LOAD"] = 1024] = "LOAD";
            /**
             * Denotes an instruction that stores an operand.
             */
            Flags[Flags["STORE"] = 2048] = "STORE";
            /**
             * Denotes the 4 INVOKE* instructions.
             */
            Flags[Flags["INVOKE"] = 4096] = "INVOKE";
            /**
             * Denotes a return instruction that ends a basic block.
             */
            Flags[Flags["RETURN"] = 8192] = "RETURN";
        })(Flags || (Flags = {}));
        /**
         * A array that maps from a bytecode value to the set of {@link Flags} for the corresponding instruction.
         */
        Bytecode.flags = new Uint32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 128, 128, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 128, 128, 128, 128, 128, 128, 128, 128, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 128, 128, 128, 128, 128, 128, 128, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 768, 768, 768, 768, 0, 0, 0, 0, 768, 768, 768, 768, 128, 128, 0, 0, 128, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 768, 768, 768, 768, 768, 768, 3072, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 262, 262, 6, 6, 6, 6, 262, 262, 5, 5, 1, 1, 1, 8321, 8321, 8321, 8321, 8321, 8321, 136, 144, 136, 144, 4224, 4224, 4224, 4224, 0, 128, 128, 128, 128, 129, 128, 128, 128, 128, 0, 128, 6, 6, 5, 5, 128, 0, 0, 0, 0, 0, 0, 0, 1024, 3077, 390, 136, 144, 4224, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        /**
         * A array that maps from a bytecode value to the length in bytes for the corresponding instruction.
         */
        Bytecode.length = new Uint32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 2, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 5, 0, 3, 2, 3, 1, 1, 3, 3, 1, 1, 0, 4, 3, 3, 5, 5, 1, 0, 0, 0, 0, 0, 0, 0, 2, 3, 1, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        var writer = new J2ME.IndentingWriter();
        /**
         * Assert that |flags| and |lengths| tables are up to date.
         */
        if (!release) {
            function define(opcode, name, format, flags_) {
                if (flags_ === void 0) { flags_ = 0; }
                var instructionLength = format.length;
                assert(Bytecode.length[opcode] === instructionLength, "Wrong instruction length");
                assert(Bytecode.flags[opcode] === flags_, "Wrong flags");
                assert(!isConditionalBranch(opcode) || isBranch(opcode), "a conditional branch must also be a branch");
            }
            /**
             * Only call this before the compiler is used.
             */
            function defineBytecodes() {
                define(0 /* NOP */, "nop", "b");
                define(1 /* ACONST_NULL */, "aconst_null", "b");
                define(2 /* ICONST_M1 */, "iconst_m1", "b");
                define(3 /* ICONST_0 */, "iconst_0", "b");
                define(4 /* ICONST_1 */, "iconst_1", "b");
                define(5 /* ICONST_2 */, "iconst_2", "b");
                define(6 /* ICONST_3 */, "iconst_3", "b");
                define(7 /* ICONST_4 */, "iconst_4", "b");
                define(8 /* ICONST_5 */, "iconst_5", "b");
                define(9 /* LCONST_0 */, "lconst_0", "b");
                define(10 /* LCONST_1 */, "lconst_1", "b");
                define(11 /* FCONST_0 */, "fconst_0", "b");
                define(12 /* FCONST_1 */, "fconst_1", "b");
                define(13 /* FCONST_2 */, "fconst_2", "b");
                define(14 /* DCONST_0 */, "dconst_0", "b");
                define(15 /* DCONST_1 */, "dconst_1", "b");
                define(16 /* BIPUSH */, "bipush", "bc");
                define(17 /* SIPUSH */, "sipush", "bcc");
                define(18 /* LDC */, "ldc", "bi", 128 /* TRAP */);
                define(19 /* LDC_W */, "ldc_w", "bii", 128 /* TRAP */);
                define(20 /* LDC2_W */, "ldc2_w", "bii", 128 /* TRAP */);
                define(21 /* ILOAD */, "iload", "bi", 1024 /* LOAD */);
                define(22 /* LLOAD */, "lload", "bi", 1024 /* LOAD */);
                define(23 /* FLOAD */, "fload", "bi", 1024 /* LOAD */);
                define(24 /* DLOAD */, "dload", "bi", 1024 /* LOAD */);
                define(25 /* ALOAD */, "aload", "bi", 1024 /* LOAD */);
                define(26 /* ILOAD_0 */, "iload_0", "b", 1024 /* LOAD */);
                define(27 /* ILOAD_1 */, "iload_1", "b", 1024 /* LOAD */);
                define(28 /* ILOAD_2 */, "iload_2", "b", 1024 /* LOAD */);
                define(29 /* ILOAD_3 */, "iload_3", "b", 1024 /* LOAD */);
                define(30 /* LLOAD_0 */, "lload_0", "b", 1024 /* LOAD */);
                define(31 /* LLOAD_1 */, "lload_1", "b", 1024 /* LOAD */);
                define(32 /* LLOAD_2 */, "lload_2", "b", 1024 /* LOAD */);
                define(33 /* LLOAD_3 */, "lload_3", "b", 1024 /* LOAD */);
                define(34 /* FLOAD_0 */, "fload_0", "b", 1024 /* LOAD */);
                define(35 /* FLOAD_1 */, "fload_1", "b", 1024 /* LOAD */);
                define(36 /* FLOAD_2 */, "fload_2", "b", 1024 /* LOAD */);
                define(37 /* FLOAD_3 */, "fload_3", "b", 1024 /* LOAD */);
                define(38 /* DLOAD_0 */, "dload_0", "b", 1024 /* LOAD */);
                define(39 /* DLOAD_1 */, "dload_1", "b", 1024 /* LOAD */);
                define(40 /* DLOAD_2 */, "dload_2", "b", 1024 /* LOAD */);
                define(41 /* DLOAD_3 */, "dload_3", "b", 1024 /* LOAD */);
                define(42 /* ALOAD_0 */, "aload_0", "b", 1024 /* LOAD */);
                define(43 /* ALOAD_1 */, "aload_1", "b", 1024 /* LOAD */);
                define(44 /* ALOAD_2 */, "aload_2", "b", 1024 /* LOAD */);
                define(45 /* ALOAD_3 */, "aload_3", "b", 1024 /* LOAD */);
                define(46 /* IALOAD */, "iaload", "b", 128 /* TRAP */);
                define(47 /* LALOAD */, "laload", "b", 128 /* TRAP */);
                define(48 /* FALOAD */, "faload", "b", 128 /* TRAP */);
                define(49 /* DALOAD */, "daload", "b", 128 /* TRAP */);
                define(50 /* AALOAD */, "aaload", "b", 128 /* TRAP */);
                define(51 /* BALOAD */, "baload", "b", 128 /* TRAP */);
                define(52 /* CALOAD */, "caload", "b", 128 /* TRAP */);
                define(53 /* SALOAD */, "saload", "b", 128 /* TRAP */);
                define(54 /* ISTORE */, "istore", "bi", 2048 /* STORE */);
                define(55 /* LSTORE */, "lstore", "bi", 2048 /* STORE */);
                define(56 /* FSTORE */, "fstore", "bi", 2048 /* STORE */);
                define(57 /* DSTORE */, "dstore", "bi", 2048 /* STORE */);
                define(58 /* ASTORE */, "astore", "bi", 2048 /* STORE */);
                define(59 /* ISTORE_0 */, "istore_0", "b", 2048 /* STORE */);
                define(60 /* ISTORE_1 */, "istore_1", "b", 2048 /* STORE */);
                define(61 /* ISTORE_2 */, "istore_2", "b", 2048 /* STORE */);
                define(62 /* ISTORE_3 */, "istore_3", "b", 2048 /* STORE */);
                define(63 /* LSTORE_0 */, "lstore_0", "b", 2048 /* STORE */);
                define(64 /* LSTORE_1 */, "lstore_1", "b", 2048 /* STORE */);
                define(65 /* LSTORE_2 */, "lstore_2", "b", 2048 /* STORE */);
                define(66 /* LSTORE_3 */, "lstore_3", "b", 2048 /* STORE */);
                define(67 /* FSTORE_0 */, "fstore_0", "b", 2048 /* STORE */);
                define(68 /* FSTORE_1 */, "fstore_1", "b", 2048 /* STORE */);
                define(69 /* FSTORE_2 */, "fstore_2", "b", 2048 /* STORE */);
                define(70 /* FSTORE_3 */, "fstore_3", "b", 2048 /* STORE */);
                define(71 /* DSTORE_0 */, "dstore_0", "b", 2048 /* STORE */);
                define(72 /* DSTORE_1 */, "dstore_1", "b", 2048 /* STORE */);
                define(73 /* DSTORE_2 */, "dstore_2", "b", 2048 /* STORE */);
                define(74 /* DSTORE_3 */, "dstore_3", "b", 2048 /* STORE */);
                define(75 /* ASTORE_0 */, "astore_0", "b", 2048 /* STORE */);
                define(76 /* ASTORE_1 */, "astore_1", "b", 2048 /* STORE */);
                define(77 /* ASTORE_2 */, "astore_2", "b", 2048 /* STORE */);
                define(78 /* ASTORE_3 */, "astore_3", "b", 2048 /* STORE */);
                define(79 /* IASTORE */, "iastore", "b", 128 /* TRAP */);
                define(80 /* LASTORE */, "lastore", "b", 128 /* TRAP */);
                define(81 /* FASTORE */, "fastore", "b", 128 /* TRAP */);
                define(82 /* DASTORE */, "dastore", "b", 128 /* TRAP */);
                define(83 /* AASTORE */, "aastore", "b", 128 /* TRAP */);
                define(84 /* BASTORE */, "bastore", "b", 128 /* TRAP */);
                define(85 /* CASTORE */, "castore", "b", 128 /* TRAP */);
                define(86 /* SASTORE */, "sastore", "b", 128 /* TRAP */);
                define(87 /* POP */, "pop", "b");
                define(88 /* POP2 */, "pop2", "b");
                define(89 /* DUP */, "dup", "b");
                define(90 /* DUP_X1 */, "dup_x1", "b");
                define(91 /* DUP_X2 */, "dup_x2", "b");
                define(92 /* DUP2 */, "dup2", "b");
                define(93 /* DUP2_X1 */, "dup2_x1", "b");
                define(94 /* DUP2_X2 */, "dup2_x2", "b");
                define(95 /* SWAP */, "swap", "b");
                define(96 /* IADD */, "iadd", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(97 /* LADD */, "ladd", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(98 /* FADD */, "fadd", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(99 /* DADD */, "dadd", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(100 /* ISUB */, "isub", "b");
                define(101 /* LSUB */, "lsub", "b");
                define(102 /* FSUB */, "fsub", "b");
                define(103 /* DSUB */, "dsub", "b");
                define(104 /* IMUL */, "imul", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(105 /* LMUL */, "lmul", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(106 /* FMUL */, "fmul", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(107 /* DMUL */, "dmul", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(108 /* IDIV */, "idiv", "b", 128 /* TRAP */);
                define(109 /* LDIV */, "ldiv", "b", 128 /* TRAP */);
                define(110 /* FDIV */, "fdiv", "b");
                define(111 /* DDIV */, "ddiv", "b");
                define(112 /* IREM */, "irem", "b", 128 /* TRAP */);
                define(113 /* LREM */, "lrem", "b", 128 /* TRAP */);
                define(114 /* FREM */, "frem", "b");
                define(115 /* DREM */, "drem", "b");
                define(116 /* INEG */, "ineg", "b");
                define(117 /* LNEG */, "lneg", "b");
                define(118 /* FNEG */, "fneg", "b");
                define(119 /* DNEG */, "dneg", "b");
                define(120 /* ISHL */, "ishl", "b");
                define(121 /* LSHL */, "lshl", "b");
                define(122 /* ISHR */, "ishr", "b");
                define(123 /* LSHR */, "lshr", "b");
                define(124 /* IUSHR */, "iushr", "b");
                define(125 /* LUSHR */, "lushr", "b");
                define(126 /* IAND */, "iand", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(127 /* LAND */, "land", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(128 /* IOR */, "ior", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(129 /* LOR */, "lor", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(130 /* IXOR */, "ixor", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(131 /* LXOR */, "lxor", "b", 256 /* COMMUTATIVE */ | 512 /* ASSOCIATIVE */);
                define(132 /* IINC */, "iinc", "bic", 1024 /* LOAD */ | 2048 /* STORE */);
                define(133 /* I2L */, "i2l", "b");
                define(134 /* I2F */, "i2f", "b");
                define(135 /* I2D */, "i2d", "b");
                define(136 /* L2I */, "l2i", "b");
                define(137 /* L2F */, "l2f", "b");
                define(138 /* L2D */, "l2d", "b");
                define(139 /* F2I */, "f2i", "b");
                define(140 /* F2L */, "f2l", "b");
                define(141 /* F2D */, "f2d", "b");
                define(142 /* D2I */, "d2i", "b");
                define(143 /* D2L */, "d2l", "b");
                define(144 /* D2F */, "d2f", "b");
                define(145 /* I2B */, "i2b", "b");
                define(146 /* I2C */, "i2c", "b");
                define(147 /* I2S */, "i2s", "b");
                define(148 /* LCMP */, "lcmp", "b");
                define(149 /* FCMPL */, "fcmpl", "b");
                define(150 /* FCMPG */, "fcmpg", "b");
                define(151 /* DCMPL */, "dcmpl", "b");
                define(152 /* DCMPG */, "dcmpg", "b");
                define(153 /* IFEQ */, "ifeq", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(154 /* IFNE */, "ifne", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(155 /* IFLT */, "iflt", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(156 /* IFGE */, "ifge", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(157 /* IFGT */, "ifgt", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(158 /* IFLE */, "ifle", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(159 /* IF_ICMPEQ */, "if_icmpeq", "boo", 256 /* COMMUTATIVE */ | 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(160 /* IF_ICMPNE */, "if_icmpne", "boo", 256 /* COMMUTATIVE */ | 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(161 /* IF_ICMPLT */, "if_icmplt", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(162 /* IF_ICMPGE */, "if_icmpge", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(163 /* IF_ICMPGT */, "if_icmpgt", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(164 /* IF_ICMPLE */, "if_icmple", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(165 /* IF_ACMPEQ */, "if_acmpeq", "boo", 256 /* COMMUTATIVE */ | 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(166 /* IF_ACMPNE */, "if_acmpne", "boo", 256 /* COMMUTATIVE */ | 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(167 /* GOTO */, "goto", "boo", 1 /* STOP */ | 4 /* BRANCH */);
                define(168 /* JSR */, "jsr", "boo", 1 /* STOP */ | 4 /* BRANCH */);
                define(169 /* RET */, "ret", "bi", 1 /* STOP */);
                define(170 /* TABLESWITCH */, "tableswitch", "", 1 /* STOP */);
                define(171 /* LOOKUPSWITCH */, "lookupswitch", "", 1 /* STOP */);
                define(172 /* IRETURN */, "ireturn", "b", 128 /* TRAP */ | 1 /* STOP */ | 8192 /* RETURN */);
                define(173 /* LRETURN */, "lreturn", "b", 128 /* TRAP */ | 1 /* STOP */ | 8192 /* RETURN */);
                define(174 /* FRETURN */, "freturn", "b", 128 /* TRAP */ | 1 /* STOP */ | 8192 /* RETURN */);
                define(175 /* DRETURN */, "dreturn", "b", 128 /* TRAP */ | 1 /* STOP */ | 8192 /* RETURN */);
                define(176 /* ARETURN */, "areturn", "b", 128 /* TRAP */ | 1 /* STOP */ | 8192 /* RETURN */);
                define(177 /* RETURN */, "return", "b", 128 /* TRAP */ | 1 /* STOP */ | 8192 /* RETURN */);
                define(178 /* GETSTATIC */, "getstatic", "bjj", 128 /* TRAP */ | 8 /* FIELD_READ */);
                define(179 /* PUTSTATIC */, "putstatic", "bjj", 128 /* TRAP */ | 16 /* FIELD_WRITE */);
                define(180 /* GETFIELD */, "getfield", "bjj", 128 /* TRAP */ | 8 /* FIELD_READ */);
                define(181 /* PUTFIELD */, "putfield", "bjj", 128 /* TRAP */ | 16 /* FIELD_WRITE */);
                define(213 /* RESOLVED_GETFIELD */, "getfield", "bjj", 128 /* TRAP */ | 8 /* FIELD_READ */);
                define(214 /* RESOLVED_PUTFIELD */, "putfield", "bjj", 128 /* TRAP */ | 16 /* FIELD_WRITE */);
                define(182 /* INVOKEVIRTUAL */, "invokevirtual", "bjj", 128 /* TRAP */ | 4096 /* INVOKE */);
                define(215 /* RESOLVED_INVOKEVIRTUAL */, "invokevirtual", "bjj", 128 /* TRAP */ | 4096 /* INVOKE */);
                define(183 /* INVOKESPECIAL */, "invokespecial", "bjj", 128 /* TRAP */ | 4096 /* INVOKE */);
                define(184 /* INVOKESTATIC */, "invokestatic", "bjj", 128 /* TRAP */ | 4096 /* INVOKE */);
                define(185 /* INVOKEINTERFACE */, "invokeinterface", "bjja_", 128 /* TRAP */ | 4096 /* INVOKE */);
                define(186 /* XXXUNUSEDXXX */, "xxxunusedxxx", "");
                define(187 /* NEW */, "new", "bii", 128 /* TRAP */);
                define(188 /* NEWARRAY */, "newarray", "bc", 128 /* TRAP */);
                define(189 /* ANEWARRAY */, "anewarray", "bii", 128 /* TRAP */);
                define(190 /* ARRAYLENGTH */, "arraylength", "b", 128 /* TRAP */);
                define(191 /* ATHROW */, "athrow", "b", 128 /* TRAP */ | 1 /* STOP */);
                define(192 /* CHECKCAST */, "checkcast", "bii", 128 /* TRAP */);
                define(193 /* INSTANCEOF */, "instanceof", "bii", 128 /* TRAP */);
                define(194 /* MONITORENTER */, "monitorenter", "b", 128 /* TRAP */);
                define(195 /* MONITOREXIT */, "monitorexit", "b", 128 /* TRAP */);
                define(196 /* WIDE */, "wide", "");
                define(197 /* MULTIANEWARRAY */, "multianewarray", "biic", 128 /* TRAP */);
                define(198 /* IFNULL */, "ifnull", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(199 /* IFNONNULL */, "ifnonnull", "boo", 2 /* FALL_THROUGH */ | 4 /* BRANCH */);
                define(200 /* GOTO_W */, "goto_w", "boooo", 1 /* STOP */ | 4 /* BRANCH */);
                define(201 /* JSR_W */, "jsr_w", "boooo", 1 /* STOP */ | 4 /* BRANCH */);
                define(202 /* BREAKPOINT */, "breakpoint", "b", 128 /* TRAP */);
                define(210 /* ALOAD_ILOAD */, "aload_iload", "bi", 1024 /* LOAD */);
                define(211 /* IINC_GOTO */, "iinc_goto", "bic", 1024 /* LOAD */ | 2048 /* STORE */ | 1 /* STOP */ | 4 /* BRANCH */);
                define(212 /* ARRAYLENGTH_IF_ICMPGE */, "arraylength_IF_ICMPGE", "b", 256 /* COMMUTATIVE */ | 2 /* FALL_THROUGH */ | 4 /* BRANCH */ | 128 /* TRAP */);
            }
            defineBytecodes();
        }
        /**
         * Gets the length of an instruction denoted by a given opcode.
         */
        function lengthOf(opcode) {
            return Bytecode.length[opcode & 0xff];
        }
        Bytecode.lengthOf = lengthOf;
        function lengthAt(code, bci) {
            var opcode = Bytes.beU1(code, bci);
            var _length = Bytecode.length[opcode & 0xff];
            if (_length == 0) {
                switch (opcode) {
                    case 170 /* TABLESWITCH */: {
                        return new BytecodeTableSwitch(code, bci).size();
                    }
                    case 171 /* LOOKUPSWITCH */: {
                        return new BytecodeLookupSwitch(code, bci).size();
                    }
                    case 196 /* WIDE */: {
                        var opc = Bytes.beU1(code, bci + 1);
                        if (opc == 169 /* RET */) {
                            return 4;
                        }
                        else if (opc == 132 /* IINC */) {
                            return 6;
                        }
                        else {
                            return 4; // a load or store bytecode
                        }
                    }
                    default:
                        throw new Error("unknown variable-length bytecode: " + opcode);
                }
            }
            return _length;
        }
        Bytecode.lengthAt = lengthAt;
        /**
         * Determines if an opcode is commutative.
         */
        function isCommutative(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 256 /* COMMUTATIVE */) != 0;
        }
        /**
         * Determines if a given opcode denotes an instruction that can cause an implicit exception.
         */
        function canTrap(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 128 /* TRAP */) != 0;
        }
        Bytecode.canTrap = canTrap;
        /**
         * Determines if a given opcode denotes an instruction that loads a local variable to the operand stack.
         */
        function isLoad(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 1024 /* LOAD */) != 0;
        }
        /**
         * Determines if a given opcode denotes an instruction that ends a basic block and does not let control flow fall
         * through to its lexical successor.
         */
        function isStop(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 1 /* STOP */) != 0;
        }
        Bytecode.isStop = isStop;
        /**
         * Determines if a given opcode denotes an instruction that stores a value to a local variable
         * after popping it from the operand stack.
         */
        function isInvoke(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 4096 /* INVOKE */) != 0;
        }
        Bytecode.isInvoke = isInvoke;
        /**
         * Determines if a given opcode denotes an instruction that stores a value to a local variable
         * after popping it from the operand stack.
         */
        function isStore(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 2048 /* STORE */) != 0;
        }
        Bytecode.isStore = isStore;
        /**
         * Determines if a given opcode is an instruction that delimits a basic block.
         */
        function isBlockEnd(opcode) {
            return (Bytecode.flags[opcode & 0xff] & (1 /* STOP */ | 2 /* FALL_THROUGH */)) != 0;
        }
        Bytecode.isBlockEnd = isBlockEnd;
        /**
         * Determines if a given opcode is an instruction that has a 2 or 4 byte operand that is an offset to another
         * instruction in the same method. This does not include the {@linkplain #TABLESWITCH switch} instructions.
         */
        function isBranch(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 4 /* BRANCH */) != 0;
        }
        /**
         * Determines if a given opcode denotes a conditional branch.
         */
        function isConditionalBranch(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 2 /* FALL_THROUGH */) != 0;
        }
        /**
         * Determines if a given opcode denotes a standard bytecode. A standard bytecode is
         * defined in the JVM specification.
         */
        function isStandard(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 32 /* EXTENSION */) == 0;
        }
        /**
         * Determines if a given opcode denotes an extended bytecode.
         */
        function isExtended(opcode) {
            return (Bytecode.flags[opcode & 0xff] & 32 /* EXTENSION */) != 0;
        }
        /**
         * Determines if a given opcode is a three-byte extended bytecode.
         */
        function isThreeByteExtended(opcode) {
            return (opcode & ~0xff) != 0;
        }
        /**
         * Determines if a given opcode is a return bytecode.
         */
        function isReturn(opcode) {
            return !!(Bytecode.flags[opcode & 0xff] & 8192 /* RETURN */);
        }
        Bytecode.isReturn = isReturn;
        var BytecodeSwitch = (function () {
            /**
             * Constructor for a bytecode array.
             * @param code the bytecode array containing the switch instruction.
             * @param bci the index in the array of the switch instruction
             */
            function BytecodeSwitch(code, bci) {
                this.alignedBci = (bci + 4) & 0xfffffffc;
                this.code = code;
                this.bci = bci;
            }
            /**
             * Gets the index of the instruction denoted by the {@code i}'th switch target.
             * @param i index of the switch target
             * @return the index of the instruction denoted by the {@code i}'th switch target
             */
            BytecodeSwitch.prototype.targetAt = function (i) {
                return this.bci + this.offsetAt(i);
            };
            /**
             * Gets the index of the instruction for the default switch target.
             * @return the index of the instruction for the default switch target
             */
            BytecodeSwitch.prototype.defaultTarget = function () {
                return this.bci + this.defaultOffset();
            };
            /**
             * Gets the offset from the start of the switch instruction to the default switch target.
             * @return the offset to the default switch target
             */
            BytecodeSwitch.prototype.defaultOffset = function () {
                throw J2ME.Debug.abstractMethod("defaultOffset");
            };
            /**
             * Gets the key at {@code i}'th switch target index.
             * @param i the switch target index
             * @return the key at {@code i}'th switch target index
             */
            BytecodeSwitch.prototype.keyAt = function (i) {
                throw J2ME.Debug.abstractMethod("keyAt");
            };
            /**
             * Gets the offset from the start of the switch instruction for the {@code i}'th switch target.
             * @param i the switch target index
             * @return the offset to the {@code i}'th switch target
             */
            BytecodeSwitch.prototype.offsetAt = function (i) {
                throw J2ME.Debug.abstractMethod("offsetAt");
            };
            /**
             * Gets the number of switch targets.
             * @return the number of switch targets
             */
            BytecodeSwitch.prototype.numberOfCases = function () {
                throw J2ME.Debug.abstractMethod("numberOfCases");
            };
            /**
             * Gets the total size in bytes of the switch instruction.
             * @return the total size in bytes of the switch instruction
             */
            BytecodeSwitch.prototype.size = function () {
                throw J2ME.Debug.abstractMethod("size");
            };
            /**
             * Reads the signed value at given bytecode index.
             * @param bci the start index of the value to retrieve
             * @return the signed, 4-byte value in the bytecode array starting at {@code bci}
             */
            BytecodeSwitch.prototype.readWord = function (bci) {
                return Bytes.beS4(this.code, bci);
            };
            return BytecodeSwitch;
        })();
        Bytecode.BytecodeSwitch = BytecodeSwitch;
        var BytecodeTableSwitch = (function (_super) {
            __extends(BytecodeTableSwitch, _super);
            /**
             * Constructor for a bytecode array.
             * @param code the bytecode array containing the switch instruction.
             * @param bci the index in the array of the switch instruction
             */
            function BytecodeTableSwitch(code, bci) {
                _super.call(this, code, bci);
            }
            /**
             * Gets the low key of the table switch.
             */
            BytecodeTableSwitch.prototype.lowKey = function () {
                return this.readWord(this.alignedBci + BytecodeTableSwitch.OFFSET_TO_LOW_KEY);
            };
            /**
             * Gets the high key of the table switch.
             */
            BytecodeTableSwitch.prototype.highKey = function () {
                return this.readWord(this.alignedBci + BytecodeTableSwitch.OFFSET_TO_HIGH_KEY);
            };
            BytecodeTableSwitch.prototype.keyAt = function (i) {
                return this.lowKey() + i;
            };
            BytecodeTableSwitch.prototype.defaultOffset = function () {
                return this.readWord(this.alignedBci);
            };
            BytecodeTableSwitch.prototype.offsetAt = function (i) {
                return this.readWord(this.alignedBci + BytecodeTableSwitch.OFFSET_TO_FIRST_JUMP_OFFSET + BytecodeTableSwitch.JUMP_OFFSET_SIZE * i);
            };
            BytecodeTableSwitch.prototype.numberOfCases = function () {
                return this.highKey() - this.lowKey() + 1;
            };
            BytecodeTableSwitch.prototype.size = function () {
                return this.alignedBci + BytecodeTableSwitch.OFFSET_TO_FIRST_JUMP_OFFSET + BytecodeTableSwitch.JUMP_OFFSET_SIZE * this.numberOfCases() - this.bci;
            };
            BytecodeTableSwitch.OFFSET_TO_LOW_KEY = 4;
            BytecodeTableSwitch.OFFSET_TO_HIGH_KEY = 8;
            BytecodeTableSwitch.OFFSET_TO_FIRST_JUMP_OFFSET = 12;
            BytecodeTableSwitch.JUMP_OFFSET_SIZE = 4;
            return BytecodeTableSwitch;
        })(BytecodeSwitch);
        Bytecode.BytecodeTableSwitch = BytecodeTableSwitch;
        var BytecodeLookupSwitch = (function (_super) {
            __extends(BytecodeLookupSwitch, _super);
            function BytecodeLookupSwitch(code, bci) {
                _super.call(this, code, bci);
            }
            BytecodeLookupSwitch.prototype.defaultOffset = function () {
                return this.readWord(this.alignedBci);
            };
            BytecodeLookupSwitch.prototype.offsetAt = function (i) {
                return this.readWord(this.alignedBci + BytecodeLookupSwitch.OFFSET_TO_FIRST_PAIR_OFFSET + BytecodeLookupSwitch.PAIR_SIZE * i);
            };
            BytecodeLookupSwitch.prototype.keyAt = function (i) {
                return this.readWord(this.alignedBci + BytecodeLookupSwitch.OFFSET_TO_FIRST_PAIR_MATCH + BytecodeLookupSwitch.PAIR_SIZE * i);
            };
            BytecodeLookupSwitch.prototype.numberOfCases = function () {
                return this.readWord(this.alignedBci + BytecodeLookupSwitch.OFFSET_TO_NUMBER_PAIRS);
            };
            BytecodeLookupSwitch.prototype.size = function () {
                return this.alignedBci + BytecodeLookupSwitch.OFFSET_TO_FIRST_PAIR_MATCH + BytecodeLookupSwitch.PAIR_SIZE * this.numberOfCases() - this.bci;
            };
            BytecodeLookupSwitch.OFFSET_TO_NUMBER_PAIRS = 4;
            BytecodeLookupSwitch.OFFSET_TO_FIRST_PAIR_MATCH = 8;
            BytecodeLookupSwitch.OFFSET_TO_FIRST_PAIR_OFFSET = 12;
            BytecodeLookupSwitch.PAIR_SIZE = 8;
            return BytecodeLookupSwitch;
        })(BytecodeSwitch);
        Bytecode.BytecodeLookupSwitch = BytecodeLookupSwitch;
        /**
         * A utility class that makes iterating over bytecodes and reading operands
         * simpler and less error prone. For example, it handles the {@link Bytecodes#WIDE} instruction
         * and wide variants of instructions internally.
         */
        var BytecodeStream = (function () {
            function BytecodeStream(code) {
                assert(code, "No Code");
                this._code = code;
                this.setBCI(0);
            }
            /**
             * Advances to the next bytecode.
             */
            BytecodeStream.prototype.next = function () {
                this.setBCI(this.nextBCI);
            };
            /**
             * Gets the bytecode index of the end of the code.
             */
            BytecodeStream.prototype.endBCI = function () {
                return this._code.length;
            };
            Object.defineProperty(BytecodeStream.prototype, "nextBCI", {
                /**
                 * Gets the next bytecode index (no side-effects).
                 */
                get: function () {
                    return this._nextBCI;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BytecodeStream.prototype, "currentBCI", {
                /**
                 * Gets the current bytecode index.
                 */
                get: function () {
                    return this._currentBCI;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Gets the current opcode. This method will never return the
             * {@link Bytecodes#WIDE WIDE} opcode, but will instead
             * return the opcode that is modified by the {@code WIDE} opcode.
             * @return the current opcode; {@link Bytecodes#END} if at or beyond the end of the code
             */
            BytecodeStream.prototype.currentBC = function () {
                if (this._opcode === 196 /* WIDE */) {
                    return Bytes.beU1(this._code, this._currentBCI + 1);
                }
                else {
                    return this._opcode;
                }
            };
            BytecodeStream.prototype.rawCurrentBC = function () {
                return this._opcode;
            };
            /**
             * Sets the current opcode.
             */
            BytecodeStream.prototype.writeCurrentBC = function (bc) {
                assert(lengthOf(this.currentBC()) === lengthOf(bc), "Wrong BC length");
                this._code[this._currentBCI] = bc;
            };
            /**
             * Gets the next opcode.
             * @return the next opcode; {@link Bytecodes#END} if at or beyond the end of the code
             */
            BytecodeStream.prototype.nextBC = function () {
                return Bytes.beU1(this._code, this._nextBCI);
            };
            /**
             * Reads the index of a local variable for one of the load or store instructions.
             * The WIDE modifier is handled internally.
             */
            BytecodeStream.prototype.readLocalIndex = function () {
                // read local variable index for load/store
                if (this._opcode == 196 /* WIDE */) {
                    return Bytes.beU2(this._code, this._currentBCI + 2);
                }
                return Bytes.beU1(this._code, this._currentBCI + 1);
            };
            /**
             * Read the delta for an {@link Bytecodes#IINC} bytecode.
             */
            BytecodeStream.prototype.readIncrement = function () {
                // read the delta for the iinc bytecode
                if (this._opcode == 196 /* WIDE */) {
                    return Bytes.beS2(this._code, this._currentBCI + 4);
                }
                return Bytes.beS1(this._code, this._currentBCI + 2);
            };
            /**
             * Read the destination of a {@link Bytecodes#GOTO} or {@code IF} instructions.
             * @return the destination bytecode index
             */
            BytecodeStream.prototype.readBranchDest = function () {
                // reads the destination for a branch bytecode
                return this._currentBCI + Bytes.beS2(this._code, this._currentBCI + 1);
            };
            /**
             * Read the destination of a {@link Bytecodes#GOTO_W} or {@link Bytecodes#JSR_W} instructions.
             * @return the destination bytecode index
             */
            BytecodeStream.prototype.readFarBranchDest = function () {
                // reads the destination for a wide branch bytecode
                return this._currentBCI + Bytes.beS4(this._code, this._currentBCI + 1);
            };
            /**
             * Read a signed 4-byte integer from the bytecode stream at the specified bytecode index.
             * @param bci the bytecode index
             * @return the integer value
             */
            BytecodeStream.prototype.readInt = function (bci) {
                // reads a 4-byte signed value
                return Bytes.beS4(this._code, bci);
            };
            /**
             * Reads an unsigned, 1-byte value from the bytecode stream at the specified bytecode index.
             * @param bci the bytecode index
             * @return the byte
             */
            BytecodeStream.prototype.readUByte = function (bci) {
                return Bytes.beU1(this._code, bci);
            };
            /**
             * Reads a constant pool index for the current instruction.
             * @return the constant pool index
             */
            BytecodeStream.prototype.readCPI = function () {
                if (this._opcode == 18 /* LDC */) {
                    return Bytes.beU1(this._code, this._currentBCI + 1);
                }
                return Bytes.beU2(this._code, this._currentBCI + 1) << 16 >> 16;
            };
            /**
             * Reads a signed, 1-byte value for the current instruction (e.g. BIPUSH).
             */
            BytecodeStream.prototype.readByte = function () {
                return this._code[this._currentBCI + 1] << 24 >> 24;
            };
            /**
             * Reads a signed, 2-byte short for the current instruction (e.g. SIPUSH).
             */
            BytecodeStream.prototype.readShort = function () {
                return Bytes.beS2(this._code, this._currentBCI + 1) << 16 >> 16;
            };
            /**
             * Sets the bytecode index to the specified value.
             * If {@code bci} is beyond the end of the array, {@link #currentBC} will return
             * {@link Bytecodes#END} and other methods may throw {@link ArrayIndexOutOfBoundsException}.
             * @param bci the new bytecode index
             */
            BytecodeStream.prototype.setBCI = function (bci) {
                this._currentBCI = bci;
                if (this._currentBCI < this._code.length) {
                    this._opcode = Bytes.beU1(this._code, bci);
                    this._nextBCI = bci + lengthAt(this._code, bci);
                }
                else {
                    this._opcode = 256 /* END */;
                    this._nextBCI = this._currentBCI;
                }
            };
            BytecodeStream.prototype.readTableSwitch = function () {
                return new BytecodeTableSwitch(this._code, this._currentBCI);
            };
            BytecodeStream.prototype.readLookupSwitch = function () {
                return new BytecodeLookupSwitch(this._code, this._currentBCI);
            };
            return BytecodeStream;
        })();
        Bytecode.BytecodeStream = BytecodeStream;
    })(Bytecode = J2ME.Bytecode || (J2ME.Bytecode = {}));
})(J2ME || (J2ME = {}));
/*
 * Copyright (c) 2009, 2011, Oracle and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Oracle, 500 Oracle Parkway, Redwood Shores, CA 94065 USA
 * or visit www.oracle.com if you need additional information or have any
 * questions.
 */
var J2ME;
(function (J2ME) {
    var Bytecode;
    (function (Bytecode) {
        var assert = J2ME.Debug.assert;
        var pushUnique = J2ME.ArrayUtilities.pushUnique;
        var Uint32ArrayBitSet = J2ME.BitSets.Uint32ArrayBitSet;
        var writer = new J2ME.IndentingWriter();
        var Block = (function () {
            function Block() {
                this.loops = 0; // long
                this.exits = 0; // long
                this.loopID = -1; // long
                this.successors = [];
                this.predecessors = [];
            }
            Block.prototype.isInnerLoopHeader = function () {
                return this.isLoopHeader && (this.loops !== (1 << this.loopID));
            };
            Block.prototype.clone = function () {
                var block = new Block();
                block.startBci = this.startBci;
                block.endBci = this.endBci;
                block.isExceptionEntry = this.isExceptionEntry;
                block.isLoopHeader = this.isLoopHeader;
                block.isLoopEnd = this.isLoopEnd;
                block.hasHandlers = this.hasHandlers;
                block.loops = this.loops;
                block.loopID = this.loopID;
                block.blockID = this.blockID;
                block.successors = this.successors.slice(0);
                block.predecessors = this.predecessors.slice(0);
                return block;
            };
            return Block;
        })();
        Bytecode.Block = Block;
        var ExceptionBlock = (function (_super) {
            __extends(ExceptionBlock, _super);
            function ExceptionBlock() {
                _super.apply(this, arguments);
            }
            return ExceptionBlock;
        })(Block);
        Bytecode.ExceptionBlock = ExceptionBlock;
        var BlockMap = (function () {
            function BlockMap(method) {
                /**
                 * The next available loop number.
                 */
                this._nextLoop = 0;
                this.exceptionDispatch = new Map();
                this.blocks = [];
                this.method = method;
                this.hasBackwardBranches = false;
                this.invokeCount = 0;
                this.blockMap = new Array(method.codeAttribute.code.length);
                this.canTrap = new Uint32ArrayBitSet(this.blockMap.length);
            }
            BlockMap.prototype.build = function () {
                this.makeExceptionEntries();
                this.iterateOverBytecodes();
                this.addExceptionEdges();
                this.computeBlockOrder();
                this.fixLoopBits();
                this.initializeBlockIDs();
                this.computeLoopStores();
            };
            BlockMap.prototype.makeExceptionEntries = function () {
                // start basic blocks at all exception handler blocks and mark them as exception entries
                for (var i = 0; i < this.method.exception_table_length; i++) {
                    var handler = this.method.getExceptionEntryViewByIndex(i);
                    var block = this.makeBlock(handler.handler_pc);
                    block.isExceptionEntry = true;
                }
            };
            BlockMap.prototype.computeLoopStores = function () {
            };
            BlockMap.prototype.initializeBlockIDs = function () {
                for (var i = 0; i < this.blocks.length; i++) {
                    this.blocks[i].blockID = i;
                }
            };
            BlockMap.prototype.getBlock = function (bci) {
                return this.blockMap[bci];
            };
            BlockMap.prototype.getOSREntryPoints = function () {
                var points = [];
                for (var i = 0; i < this.blocks.length; i++) {
                    var block = this.blocks[i];
                    if (block.isLoopHeader && !block.isInnerLoopHeader()) {
                        points.push(block.startBci);
                    }
                }
                return points;
            };
            BlockMap.prototype.makeBlock = function (startBci) {
                var oldBlock = this.blockMap[startBci];
                if (!oldBlock) {
                    var newBlock = new Block();
                    newBlock.startBci = startBci;
                    this.blockMap[startBci] = newBlock;
                    return newBlock;
                }
                else if (oldBlock.startBci != startBci) {
                    // Backward branch into the middle of an already processed block.
                    // Add the correct fall-through successor.
                    var newBlock = new Block();
                    newBlock.startBci = startBci;
                    newBlock.endBci = oldBlock.endBci;
                    J2ME.ArrayUtilities.pushMany(newBlock.successors, oldBlock.successors);
                    newBlock.normalSuccessors = oldBlock.normalSuccessors;
                    oldBlock.endBci = startBci - 1;
                    oldBlock.successors.length = 0;
                    oldBlock.successors.push(newBlock);
                    oldBlock.normalSuccessors = 1;
                    for (var i = startBci; i <= newBlock.endBci; i++) {
                        this.blockMap[i] = newBlock;
                    }
                    return newBlock;
                }
                else {
                    return oldBlock;
                }
            };
            BlockMap.prototype.makeSwitchSuccessors = function (tswitch) {
                var max = tswitch.numberOfCases();
                var successors = new Array(max + 1);
                for (var i = 0; i < max; i++) {
                    successors[i] = this.makeBlock(tswitch.targetAt(i));
                }
                successors[max] = this.makeBlock(tswitch.defaultTarget());
                return successors;
            };
            BlockMap.prototype.setSuccessors = function (predBci, successors) {
                if (!this.hasBackwardBranches) {
                    for (var i = 0; i < successors.length; i++) {
                        if (successors[i].startBci < predBci) {
                            this.hasBackwardBranches = true;
                        }
                    }
                }
                var predecessor = this.blockMap[predBci];
                assert(predecessor.successors.length === 0, predecessor.successors.map(function (x) { return x.startBci; }).join(", "));
                J2ME.ArrayUtilities.pushMany(predecessor.successors, successors);
                predecessor.normalSuccessors = successors.length;
            };
            BlockMap.prototype.canTrapAt = function (opcode, bci) {
                return Bytecode.canTrap(opcode);
            };
            BlockMap.prototype.iterateOverBytecodes = function () {
                // iterate over the bytecodes top to bottom.
                // mark the entrypoints of basic blocks and build lists of successors for
                // all bytecodes that end basic blocks (i.e. goto, ifs, switches, throw, jsr, returns, ret)
                var code = this.method.codeAttribute.code;
                var current = null;
                var bci = 0;
                while (bci < code.length) {
                    if (!current || this.blockMap[bci]) {
                        var b = this.makeBlock(bci);
                        if (current) {
                            this.setSuccessors(current.endBci, [b]);
                        }
                        current = b;
                    }
                    this.blockMap[bci] = current;
                    current.endBci = bci;
                    var opcode = Bytecode.Bytes.beU1(code, bci);
                    switch (opcode) {
                        case 172 /* IRETURN */: // fall through
                        case 173 /* LRETURN */: // fall through
                        case 174 /* FRETURN */: // fall through
                        case 175 /* DRETURN */: // fall through
                        case 176 /* ARETURN */: // fall through
                        case 177 /* RETURN */: {
                            current = null;
                            break;
                        }
                        case 191 /* ATHROW */: {
                            current = null;
                            this.canTrap.set(bci);
                            break;
                        }
                        case 153 /* IFEQ */: // fall through
                        case 154 /* IFNE */: // fall through
                        case 155 /* IFLT */: // fall through
                        case 156 /* IFGE */: // fall through
                        case 157 /* IFGT */: // fall through
                        case 158 /* IFLE */: // fall through
                        case 159 /* IF_ICMPEQ */: // fall through
                        case 160 /* IF_ICMPNE */: // fall through
                        case 161 /* IF_ICMPLT */: // fall through
                        case 162 /* IF_ICMPGE */: // fall through
                        case 163 /* IF_ICMPGT */: // fall through
                        case 164 /* IF_ICMPLE */: // fall through
                        case 165 /* IF_ACMPEQ */: // fall through
                        case 166 /* IF_ACMPNE */: // fall through
                        case 198 /* IFNULL */: // fall through
                        case 199 /* IFNONNULL */: {
                            current = null;
                            var probability = -1;
                            var b1 = this.makeBlock(bci + Bytecode.Bytes.beS2(code, bci + 1));
                            var b2 = this.makeBlock(bci + 3);
                            this.setSuccessors(bci, [b1, b2]);
                            break;
                        }
                        case 167 /* GOTO */:
                        case 200 /* GOTO_W */: {
                            current = null;
                            var target = bci + Bytecode.Bytes.beSVar(code, bci + 1, opcode == 200 /* GOTO_W */);
                            var b1 = this.makeBlock(target);
                            this.setSuccessors(bci, [b1]);
                            break;
                        }
                        case 170 /* TABLESWITCH */: {
                            current = null;
                            this.setSuccessors(bci, this.makeSwitchSuccessors(new Bytecode.BytecodeTableSwitch(code, bci)));
                            break;
                        }
                        case 171 /* LOOKUPSWITCH */: {
                            current = null;
                            this.setSuccessors(bci, this.makeSwitchSuccessors(new Bytecode.BytecodeLookupSwitch(code, bci)));
                            break;
                        }
                        case 196 /* WIDE */: {
                            var opcode2 = Bytecode.Bytes.beU1(code, bci);
                            switch (opcode2) {
                                case 169 /* RET */: {
                                    writer.writeLn("RET");
                                    current = null;
                                    break;
                                }
                            }
                            break;
                        }
                        case 182 /* INVOKEVIRTUAL */:
                        case 183 /* INVOKESPECIAL */:
                        case 184 /* INVOKESTATIC */:
                        case 185 /* INVOKEINTERFACE */:
                            this.invokeCount++;
                            if (this.canTrapAt(opcode, bci)) {
                                this.canTrap.set(bci);
                            }
                            break;
                        default: {
                            if (this.canTrapAt(opcode, bci)) {
                                this.canTrap.set(bci);
                            }
                            if (Bytecode.isInvoke(opcode)) {
                                this.invokeCount++;
                            }
                        }
                    }
                    bci += Bytecode.lengthAt(code, bci);
                }
            };
            /**
             * Mark the block as a loop header, using the next available loop number.
             * Also checks for corner cases that we don't want to compile.
             */
            BlockMap.prototype.makeLoopHeader = function (block) {
                if (!block.isLoopHeader) {
                    block.isLoopHeader = true;
                    if (block.isExceptionEntry) {
                    }
                    if (this._nextLoop >= 32) {
                        // This restriction can be removed by using a fall-back to a BitSet in case we have more than 32 loops
                        // Don't compile such methods for now, until we see a concrete case that allows checking for correctness.
                        throw "Too many loops in method";
                    }
                    assert(!block.loops, "makeLoopHeader: block.loops");
                    block.loops = 1 << this._nextLoop;
                    block.loopID = this._nextLoop;
                    this._nextLoop++;
                }
                assert(J2ME.IntegerUtilities.bitCount(block.loops) === 1, "bad loop count in makeLoopHeader");
            };
            // catch_type
            BlockMap.prototype.handlerIsCatchAll = function (handler) {
                return handler.catch_type === 0;
            };
            BlockMap.prototype.makeExceptionDispatch = function (handlers, index, bci) {
                var handler = handlers[index];
                if (this.handlerIsCatchAll(handler)) {
                    return this.blockMap[handler.handler_pc];
                }
                var block = this.exceptionDispatch.get(handler);
                if (!block) {
                    block = new ExceptionBlock();
                    block.startBci = -1;
                    block.endBci = -1;
                    block.deoptBci = bci;
                    block.handler = handler;
                    block.successors.push(this.blockMap[handler.handler_pc]);
                    if (index < handlers.length - 1) {
                        block.successors.push(this.makeExceptionDispatch(handlers, index + 1, bci));
                    }
                    this.exceptionDispatch.set(handler, block);
                }
                return block;
            };
            BlockMap.prototype.addExceptionEdges = function () {
                var length = this.canTrap.length;
                for (var bci = this.canTrap.nextSetBit(0, length); bci >= 0; bci = this.canTrap.nextSetBit(bci + 1, length)) {
                    var block = this.blockMap[bci];
                    var handlers = null;
                    for (var i = 0; i < this.method.exception_table_length; i++) {
                        var handler = this.method.getExceptionEntryViewByIndex(i);
                        if (handler.start_pc <= bci && bci < handler.end_pc) {
                            if (!handlers) {
                                handlers = [];
                            }
                            handlers.push(handler);
                            if (this.handlerIsCatchAll(handler)) {
                                break;
                            }
                        }
                    }
                    if (handlers) {
                        var dispatch = this.makeExceptionDispatch(handlers, 0, bci);
                        block.successors.push(dispatch);
                        block.hasHandlers = true;
                    }
                }
            };
            BlockMap.prototype.fixLoopBits = function () {
                var loopChanges = false;
                function _fixLoopBits(block) {
                    if (block.visited) {
                        // Return cached loop information for this block.
                        if (block.isLoopHeader) {
                            return block.loops & ~(1 << block.loopID);
                        }
                        else {
                            return block.loops;
                        }
                    }
                    block.visited = true;
                    var loops = block.loops;
                    var successors = block.successors;
                    for (var i = 0; i < successors.length; i++) {
                        // Recursively process successors.
                        loops |= _fixLoopBits(successors[i]);
                    }
                    for (var i = 0; i < successors.length; i++) {
                        var successor = successors[i];
                        successor.exits = loops & ~successor.loops;
                    }
                    if (block.loops !== loops) {
                        loopChanges = true;
                        block.loops = loops;
                    }
                    if (block.isLoopHeader) {
                        loops &= ~(1 << block.loopID);
                    }
                    return loops;
                }
                do {
                    loopChanges = false;
                    for (var i = 0; i < this.blocks.length; i++) {
                        this.blocks[i].visited = false;
                    }
                    var loop = _fixLoopBits(this.blockMap[0]);
                    if (loop !== 0) {
                        // There is a path from a loop end to the method entry that does not pass the loop
                        // header.
                        // Therefore, the loop is non reducible (has more than one entry).
                        // We don't want to compile such methods because the IR only supports structured
                        // loops.
                        throw new J2ME.CompilerBailout("Non-reducible loop");
                    }
                } while (loopChanges);
            };
            BlockMap.prototype.computeBlockOrder = function () {
                var loop = this.computeBlockOrderFrom(this.blockMap[0]);
                if (loop != 0) {
                    // There is a path from a loop end to the method entry that does not pass the loop header.
                    // Therefore, the loop is non reducible (has more than one entry).
                    // We don't want to compile such methods because the IR only supports structured loops.
                    throw new J2ME.CompilerBailout("Non-reducible loop");
                }
                // Convert postorder to the desired reverse postorder.
                this.blocks.reverse();
            };
            /**
             * Depth-first traversal of the control flow graph. The flag {@linkplain Block#visited} is used to
             * visit every block only once. The flag {@linkplain Block#active} is used to detect cycles (backward
             * edges).
             */
            BlockMap.prototype.computeBlockOrderFrom = function (block) {
                if (block.visited) {
                    if (block.active) {
                        // Reached block via backward branch.
                        this.makeLoopHeader(block);
                        return block.loops;
                    }
                    else if (block.isLoopHeader) {
                        return block.loops & ~(1 << block.loopID);
                    }
                    else {
                        return block.loops;
                    }
                }
                block.visited = true;
                block.active = true;
                var loops = 0;
                for (var i = 0; i < block.successors.length; i++) {
                    var successor = block.successors[i];
                    pushUnique(successor.predecessors, block);
                    // Recursively process successors.
                    loops |= this.computeBlockOrderFrom(block.successors[i]);
                    if (successor.active) {
                        // Reached block via backward branch.
                        block.isLoopEnd = true;
                    }
                }
                block.loops = loops;
                if (block.isLoopHeader) {
                    loops &= ~(1 << block.loopID);
                }
                block.active = false;
                this.blocks.push(block);
                return loops;
            };
            BlockMap.prototype.blockToString = function (block) {
                return "blockID: " + String(block.blockID +
                    ", ").padRight(" ", 5) +
                    "bci: [" + block.startBci + ", " + block.endBci + "]" +
                    (block.successors.length ? ", successors: => " + block.successors.map(function (b) { return b.blockID; }).join(", ") : "") +
                    (block.isLoopHeader ? " isLoopHeader, inner: " + block.isInnerLoopHeader() : "") +
                    (block.isLoopEnd ? " isLoopEnd" : "") +
                    (block.isExceptionEntry ? " isExceptionEntry" : "") +
                    (block.hasHandlers ? " hasHandlers" : "") +
                    ", loops: " + block.loops.toString(2) +
                    ", exits: " + block.exits.toString(2) +
                    ", loopID: " + block.loopID;
            };
            BlockMap.prototype.trace = function (writer, traceBytecode) {
                var _this = this;
                if (traceBytecode === void 0) { traceBytecode = false; }
                var code = this.method.codeAttribute.code;
                var stream = new Bytecode.BytecodeStream(code);
                writer.enter("Block Map: " + this.blocks.map(function (b) { return b.blockID; }).join(", "));
                this.blocks.forEach(function (block) {
                    writer.enter(_this.blockToString(block));
                    if (traceBytecode) {
                        var bci = block.startBci;
                        stream.setBCI(bci);
                        while (stream.currentBCI <= block.endBci) {
                            writer.writeLn(Bytecode.getBytecodesName(stream.currentBC()));
                            stream.next();
                            bci = stream.currentBCI;
                        }
                    }
                    writer.outdent();
                });
                writer.outdent();
            };
            BlockMap.prototype.traceDOTFile = function (writer) {
                writer.enter("digraph CFG {");
                writer.writeLn("graph [bgcolor = gray10];");
                writer.writeLn("edge [fontname = Consolas, fontsize = 11, color = white, fontcolor = white];");
                writer.writeLn("node [shape = box, fontname = Consolas, fontsize = 11, color = white, fontcolor = black, style = filled];");
                writer.writeLn("rankdir = TB;");
                var blocks = this.blocks;
                blocks.forEach(function (block) {
                    var label = "B" + block.blockID + " " +
                        (block.isLoopHeader ? "H" : "") +
                        (block.isLoopEnd ? "E" : "") +
                        // (block.isExceptionEntry ? "X" : "") +
                        // (block.hasHandlers ? "X" : "") +
                        " l:" + block.loops.toString(2) +
                        " e:" + block.exits.toString(2) +
                        " i:" + block.loopID +
                        " p:" + block.predecessors.length;
                    writer.writeLn("B" + block.blockID + " [label = \"" + label + "\"];");
                });
                blocks.forEach(function (block) {
                    block.successors.forEach(function (successor) {
                        writer.writeLn("B" + block.blockID + " -> " + "B" + successor.blockID);
                    });
                });
                writer.leave("}");
            };
            return BlockMap;
        })();
        Bytecode.BlockMap = BlockMap;
    })(Bytecode = J2ME.Bytecode || (J2ME.Bytecode = {}));
})(J2ME || (J2ME = {}));
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    var isInvoke = J2ME.Bytecode.isInvoke;
    var toHEX = J2ME.IntegerUtilities.toHEX;
    function toName(o) {
        if (o instanceof J2ME.MethodInfo) {
            return "MI: " + o.implKey;
        }
        function getArrayInfo(o) {
            var s = [];
            var x = [];
            for (var i = 0; i < Math.min(o.length, 8); i++) {
                s.push(o[i]);
                x.push(String.fromCharCode(o[i]));
            }
            var suffix = (o.length > 8 ? "..." : "");
            return J2ME.fromUTF8(o.classInfo.utf8Name) +
                ", length: " + o.length +
                ", values: [" + s.join(", ") + suffix + "]" +
                ", chars: \"" + x.join("") + suffix + "\"";
        }
        function getObjectInfo(o) {
            if (o.length !== undefined) {
                return getArrayInfo(o);
            }
            return J2ME.fromUTF8(o.classInfo.utf8Name) + (o._address ? " " + toHEX(o._address) : "");
        }
        if (o && !o.classInfo) {
            return o;
        }
        if (o && o.classInfo === J2ME.CLASSES.java_lang_Class) {
            return "[" + getObjectInfo(o) + "] " + J2ME.classIdToClassInfoMap[o.vmClass].getClassNameSlow();
        }
        if (o && o.classInfo === J2ME.CLASSES.java_lang_String) {
            return "[" + getObjectInfo(o) + "] \"" + J2ME.fromStringAddr(o._address) + "\"";
        }
        return o ? ("[" + getObjectInfo(o) + "]") : "null";
    }
    /**
     * The number of opcodes executed thus far.
     */
    J2ME.bytecodeCount = 0;
    /**
     * The number of times the interpreter method was called thus far.
     */
    J2ME.interpreterCount = 0;
    J2ME.onStackReplacementCount = 0;
    function wordsToDouble(l, h) {
        aliasedI32[0] = l;
        aliasedI32[1] = h;
        return aliasedF64[0];
    }
    /**
     * Calling Convention:
     *
     * Interpreter -> Interpreter:
     *   This follows the JVM bytecode calling convention. This interpreter is highly
     *   optimized for this calling convention.
     *
     * Compiled / Native -> Compiled / Native:
     *   64-bit floats and single word values can be encoded using only one JS value. However, 64-bit longs cannot and
     *   require a (low, high) JS value pair. For example, the signature: "foo.(IDJi)J" is expressed as:
     *
     *   function foo(i, d, lowBits, highBits, i) {
     *     return tempReturn0 = highBits, lowBits;
     *   }
     *
     *   Returning longs is equally problamatic, the convention is to return the lowBits, and save the highBits in a
     *   global |tempReturn0| variable.
     */
    /*
     * Stack Frame Layout:
     *
     *   LP  --->  +--------------------------------+
     *             | Parameter 0                    |
     *             +--------------------------------+
     *             |              ...               |
     *             +--------------------------------+
     *             | Parameter (P-1)                |
     *             +--------------------------------+
     *             | Non-Parameter Local 0          |
     *             +--------------------------------+
     *             |              ...               |
     *             +--------------------------------+
     *             | Non-Parameter Local (L-1)      |
     *   FP  --->  +--------------------------------+
     *             | Caller Return Address          | // The opPC of the caller's invoke bytecode.
     *             +--------------------------------+
     *             | Caller FP                      |
     *             +--------------------------------+
     *             | Callee Method Info | Marker    |
     *             +--------------------------------+
     *             | Monitor                        |
     *             +--------------------------------+
     *             | Stack slot 0                   |
     *             +--------------------------------+
     *             |              ...               |
     *             +--------------------------------+
     *             | Stack slot (S-1)               |
     *   SP  --->  +--------------------------------+
     */
    (function (FrameType) {
        /**
         * Normal interpreter frame.
         */
        FrameType[FrameType["Interpreter"] = 0] = "Interpreter";
        /**
         * Marks the beginning of a sequence of interpreter frames. If we see this
         * frame when returning we need to exit the interpreter loop.
         */
        FrameType[FrameType["ExitInterpreter"] = 268435456] = "ExitInterpreter";
        /**
         * Native frames are pending and need to be pushed on the stack.
         */
        FrameType[FrameType["PushPendingFrames"] = 536870912] = "PushPendingFrames";
        /**
         * Marks the beginning of frames that were not invoked by the previous frame.
         */
        FrameType[FrameType["Interrupt"] = 805306368] = "Interrupt";
        /**
         * Marks the beginning of native/compiled code called from the interpreter.
         */
        FrameType[FrameType["Native"] = 1073741824] = "Native";
    })(J2ME.FrameType || (J2ME.FrameType = {}));
    var FrameType = J2ME.FrameType;
    (function (FrameLayout) {
        /**
         * Stored in the lower 28 bits.
         */
        FrameLayout[FrameLayout["CalleeMethodInfoOffset"] = 2] = "CalleeMethodInfoOffset";
        FrameLayout[FrameLayout["CalleeMethodInfoMask"] = 268435455] = "CalleeMethodInfoMask";
        /**
         * Stored in the upper 4 bits.
         */
        FrameLayout[FrameLayout["FrameTypeOffset"] = 2] = "FrameTypeOffset";
        FrameLayout[FrameLayout["FrameTypeMask"] = 4026531840] = "FrameTypeMask";
        FrameLayout[FrameLayout["CallerFPOffset"] = 1] = "CallerFPOffset";
        FrameLayout[FrameLayout["CallerRAOffset"] = 0] = "CallerRAOffset";
        FrameLayout[FrameLayout["MonitorOffset"] = 3] = "MonitorOffset";
        FrameLayout[FrameLayout["CallerSaveSize"] = 4] = "CallerSaveSize";
    })(J2ME.FrameLayout || (J2ME.FrameLayout = {}));
    var FrameLayout = J2ME.FrameLayout;
    var FrameView = (function () {
        function FrameView() {
        }
        FrameView.prototype.set = function (thread, fp, sp, pc) {
            this.thread = thread;
            this.fp = fp;
            this.sp = sp;
            this.pc = pc;
            if (!release) {
                assert(fp >= (thread.tp >> 2), "Frame pointer is not less than than the top of the stack.");
                assert(fp < (thread.tp + 4096 /* MAX_STACK_SIZE */ >> 2), "Frame pointer is not greater than the stack size.");
                var callee = J2ME.methodIdToMethodInfoMap[i32[this.fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
                assert(!callee ||
                    callee instanceof J2ME.MethodInfo, "Callee @" + ((this.fp + 2 /* CalleeMethodInfoOffset */) & 268435455 /* CalleeMethodInfoMask */) + " is not a MethodInfo, " + toName(callee));
            }
        };
        FrameView.prototype.setParameter = function (kind, i, v) {
            i32[this.fp + this.parameterOffset + i] = v;
        };
        FrameView.prototype.setStackSlot = function (kind, i, v) {
            switch (kind) {
                case 8 /* Reference */:
                case 4 /* Int */:
                case 1 /* Byte */:
                case 3 /* Char */:
                case 2 /* Short */:
                case 0 /* Boolean */:
                    i32[this.fp + 4 /* CallerSaveSize */ + i] = v;
                    break;
                default:
                    release || assert(false, "Cannot set stack slot of kind: " + J2ME.getKindName(kind));
            }
        };
        Object.defineProperty(FrameView.prototype, "methodInfo", {
            get: function () {
                return J2ME.methodIdToMethodInfoMap[i32[this.fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
            },
            set: function (methodInfo) {
                i32[this.fp + 2 /* CalleeMethodInfoOffset */] = (i32[this.fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */) | methodInfo.id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FrameView.prototype, "type", {
            get: function () {
                return i32[this.fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FrameView.prototype, "parameterOffset", {
            get: function () {
                return this.methodInfo ? -this.methodInfo.codeAttribute.max_locals : 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FrameView.prototype, "stackOffset", {
            get: function () {
                return 4 /* CallerSaveSize */;
            },
            enumerable: true,
            configurable: true
        });
        FrameView.prototype.traceStack = function (writer, details) {
            if (details === void 0) { details = false; }
            var fp = this.fp;
            var sp = this.sp;
            var pc = this.pc;
            while (true) {
                if (this.fp < (this.thread.tp >> 2)) {
                    writer.writeLn("Bad frame pointer FP: " + this.fp + " TOP: " + (this.thread.tp >> 2));
                    break;
                }
                this.trace(writer, details);
                if (this.fp === (this.thread.tp >> 2)) {
                    break;
                }
                this.set(this.thread, i32[this.fp + 1 /* CallerFPOffset */], this.fp + this.parameterOffset, i32[this.fp + 0 /* CallerRAOffset */]);
            }
            this.fp = fp;
            this.sp = sp;
            this.pc = pc;
        };
        FrameView.prototype.trace = function (writer, details) {
            if (details === void 0) { details = true; }
            function toNumber(v) {
                if (v < 0) {
                    return String(v);
                }
                else if (v === 0) {
                    return " 0";
                }
                else {
                    return "+" + v;
                }
            }
            function clampString(v, n) {
                if (v.length > n) {
                    return v.substring(0, n - 3) + "...";
                }
                return v;
            }
            var op = -1;
            if (this.methodInfo) {
                op = this.methodInfo.codeAttribute.code[this.pc];
            }
            var type = i32[this.fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
            writer.writeLn("Frame: " + FrameType[type] + " " + (this.methodInfo ? this.methodInfo.implKey : "null") + ", FP: " + this.fp + "(" + (this.fp - (this.thread.tp >> 2)) + "), SP: " + this.sp + ", PC: " + this.pc + (op >= 0 ? ", OP: " + J2ME.Bytecode.getBytecodesName(op) : ""));
            if (details) {
                for (var i = Math.max(0, this.fp + this.parameterOffset); i < this.sp; i++) {
                    var prefix = "    ";
                    if (i >= this.fp + this.stackOffset) {
                        prefix = "S" + (i - (this.fp + this.stackOffset)) + ": ";
                    }
                    else if (i === this.fp + 2 /* CalleeMethodInfoOffset */) {
                        prefix = "MI: ";
                    }
                    else if (i === this.fp + 1 /* CallerFPOffset */) {
                        prefix = "CF: ";
                    }
                    else if (i === this.fp + 0 /* CallerRAOffset */) {
                        prefix = "RA: ";
                    }
                    else if (i === this.fp + 3 /* MonitorOffset */) {
                        prefix = "MO: ";
                    }
                    else if (i >= this.fp + this.parameterOffset) {
                        prefix = "L" + (i - (this.fp + this.parameterOffset)) + ": ";
                    }
                    writer.writeLn(" " + prefix.padRight(' ', 5) + " " + toNumber(i - this.fp).padLeft(' ', 3) + " " + String(i).padLeft(' ', 4) + " " + toHEX(i << 2) + ": " +
                        String(i32[i]).padLeft(' ', 12) + " " +
                        toHEX(i32[i]) + " " +
                        ((i32[i] >= 32 && i32[i] < 1024) ? String.fromCharCode(i32[i]) : "?") + " " +
                        clampString(String(f32[i]), 12).padLeft(' ', 12) + " " +
                        clampString(String(wordsToDouble(i32[i], i32[i + 1])), 12).padLeft(' ', 12) + " ");
                }
            }
        };
        return FrameView;
    })();
    J2ME.FrameView = FrameView;
    J2ME.interpreterCounter = new J2ME.Metrics.Counter(true);
    var Thread = (function () {
        function Thread(ctx) {
            this.tp = J2ME.gcMalloc(4096 /* MAX_STACK_SIZE */);
            this.bp = this.tp >> 2;
            this.fp = this.bp;
            this.sp = this.fp;
            this.pc = -1;
            this.view = new FrameView();
            this.ctx = ctx;
            this.unwoundNativeFrames = [];
            this.pendingNativeFrames = [];
            this.nativeFrameCount = 0;
            release || J2ME.threadWriter && J2ME.threadWriter.writeLn("creatingThread: tp: " + toHEX(this.tp) + " " + toHEX(this.tp + 4096 /* MAX_STACK_SIZE */));
        }
        Thread.prototype.set = function (fp, sp, pc) {
            this.fp = fp;
            this.sp = sp;
            this.pc = pc;
        };
        Thread.prototype.hashFrame = function () {
            var fp = this.fp << 2;
            var sp = this.sp << 2;
            return J2ME.HashUtilities.hashBytesTo32BitsAdler(u8, fp, sp);
        };
        Object.defineProperty(Thread.prototype, "frame", {
            get: function () {
                this.view.set(this, this.fp, this.sp, this.pc);
                return this.view;
            },
            enumerable: true,
            configurable: true
        });
        Thread.prototype.pushMarkerFrame = function (frameType) {
            if (frameType === FrameType.Native) {
                this.nativeFrameCount++;
            }
            this.pushFrame(null, 0, 0, null, frameType);
        };
        Thread.prototype.pushFrame = function (methodInfo, sp, pc, monitorAddr, frameType) {
            if (sp === void 0) { sp = 0; }
            if (pc === void 0) { pc = 0; }
            if (monitorAddr === void 0) { monitorAddr = 0 /* NULL */; }
            if (frameType === void 0) { frameType = FrameType.Interpreter; }
            var fp = this.fp;
            if (methodInfo) {
                this.fp = this.sp + methodInfo.codeAttribute.max_locals;
            }
            else {
                this.fp = this.sp;
            }
            release || assert(fp < (this.tp + 4096 /* MAX_STACK_SIZE */ >> 2), "Frame pointer is not greater than the stack size.");
            i32[this.fp + 0 /* CallerRAOffset */] = this.pc; // Caller RA
            i32[this.fp + 1 /* CallerFPOffset */] = fp; // Caller FP
            i32[this.fp + 2 /* CalleeMethodInfoOffset */] = frameType | (methodInfo === null ? 0 /* NULL */ : methodInfo.id); // Callee
            i32[this.fp + 3 /* MonitorOffset */] = monitorAddr; // Monitor
            this.sp = this.fp + 4 /* CallerSaveSize */ + sp;
            this.pc = pc;
        };
        Thread.prototype.popMarkerFrame = function (frameType) {
            if (frameType === FrameType.Native) {
                this.nativeFrameCount--;
            }
            return this.popFrame(null, frameType);
        };
        Thread.prototype.popFrame = function (methodInfo, frameType) {
            if (frameType === void 0) { frameType = FrameType.Interpreter; }
            var mi = J2ME.methodIdToMethodInfoMap[i32[this.fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
            var type = i32[this.fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
            release || assert(mi === methodInfo && type === frameType, "mi === methodInfo && type === frameType");
            this.pc = i32[this.fp + 0 /* CallerRAOffset */];
            var maxLocals = mi ? mi.codeAttribute.max_locals : 0;
            this.sp = this.fp - maxLocals;
            this.fp = i32[this.fp + 1 /* CallerFPOffset */];
            release || assert(this.fp >= (this.tp >> 2), "Valid frame pointer after pop.");
            return J2ME.methodIdToMethodInfoMap[i32[this.fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
        };
        Thread.prototype.run = function () {
            release || J2ME.traceWriter && J2ME.traceWriter.writeLn("Thread.run " + $.ctx.id);
            return interpret(this);
        };
        Thread.prototype.exceptionUnwind = function (e) {
            release || J2ME.traceWriter && J2ME.traceWriter.writeLn("exceptionUnwind: " + toName(e));
            var pc = -1;
            var classInfo;
            while (true) {
                var frameType = i32[this.fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
                switch (frameType) {
                    case FrameType.Interpreter:
                        var mi = J2ME.methodIdToMethodInfoMap[i32[this.fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
                        release || J2ME.traceWriter && J2ME.traceWriter.writeLn("Looking for handler in: " + mi.implKey);
                        for (var i = 0; i < mi.exception_table_length; i++) {
                            var exceptionEntryView = mi.getExceptionEntryViewByIndex(i);
                            release || J2ME.traceWriter && J2ME.traceWriter.writeLn("Checking catch range: " + exceptionEntryView.start_pc + " - " + exceptionEntryView.end_pc);
                            if (this.pc >= exceptionEntryView.start_pc && this.pc < exceptionEntryView.end_pc) {
                                if (exceptionEntryView.catch_type === 0) {
                                    pc = exceptionEntryView.handler_pc;
                                    break;
                                }
                                else {
                                    classInfo = mi.classInfo.constantPool.resolveClass(exceptionEntryView.catch_type);
                                    release || J2ME.traceWriter && J2ME.traceWriter.writeLn("Checking catch type: " + classInfo);
                                    if (J2ME.isAssignableTo(e.classInfo, classInfo)) {
                                        pc = exceptionEntryView.handler_pc;
                                        break;
                                    }
                                }
                            }
                        }
                        if (pc >= 0) {
                            this.pc = pc;
                            this.sp = this.fp + 4 /* CallerSaveSize */;
                            release || assert(e instanceof Object && "_address" in e, "exception is object with address");
                            i32[this.sp++] = e._address;
                            return;
                        }
                        if (mi.isSynchronized) {
                            this.ctx.monitorExit(J2ME.getMonitor(i32[this.fp + 3 /* MonitorOffset */]));
                        }
                        this.popFrame(mi);
                        release || J2ME.traceWriter && J2ME.traceWriter.outdent();
                        release || J2ME.traceWriter && J2ME.traceWriter.writeLn("<< I Unwind");
                        break;
                    case FrameType.ExitInterpreter:
                        this.popMarkerFrame(FrameType.ExitInterpreter);
                        throw e;
                    case FrameType.PushPendingFrames:
                        this.frame.thread.pushPendingNativeFrames();
                        break;
                    case FrameType.Interrupt:
                        this.popMarkerFrame(FrameType.Interrupt);
                        break;
                    case FrameType.Native:
                        this.popMarkerFrame(FrameType.Native);
                        break;
                    default:
                        J2ME.Debug.assertUnreachable("Unhandled frame type: " + frameType);
                        break;
                }
            }
        };
        Thread.prototype.classInitAndUnwindCheck = function (fp, sp, pc, classInfo) {
            this.set(fp, sp, pc);
            J2ME.classInitCheck(classInfo);
        };
        Thread.prototype.throwException = function (fp, sp, pc, type, a) {
            this.set(fp, sp, pc);
            switch (type) {
                case 1 /* ArrayIndexOutOfBoundsException */:
                    J2ME.throwArrayIndexOutOfBoundsException(a);
                    break;
                case 0 /* ArithmeticException */:
                    J2ME.throwArithmeticException();
                    break;
                case 2 /* NegativeArraySizeException */:
                    J2ME.throwNegativeArraySizeException();
                    break;
                case 3 /* NullPointerException */:
                    J2ME.throwNullPointerException();
                    break;
            }
        };
        Thread.prototype.tracePendingFrames = function (writer) {
            for (var i = 0; i < this.pendingNativeFrames.length; i++) {
                var pendingFrame = this.pendingNativeFrames[i];
                writer.writeLn(pendingFrame ? J2ME.methodIdToMethodInfoMap[i32[pendingFrame + 0 /* MethodIdOffset */ >> 2]].implKey : "-marker-");
            }
        };
        Thread.prototype.pushPendingNativeFrames = function () {
            J2ME.traceWriter && J2ME.traceWriter.writeLn("Pushing pending native frames.");
            if (J2ME.traceWriter) {
                J2ME.traceWriter.enter("Pending native frames before:");
                this.tracePendingFrames(J2ME.traceWriter);
                J2ME.traceWriter.leave("");
                J2ME.traceWriter.enter("Stack before:");
                this.frame.traceStack(J2ME.traceWriter);
                J2ME.traceWriter.leave("");
            }
            while (true) {
                // We should have a |PushPendingFrames| marker frame on the stack at this point.
                this.popMarkerFrame(FrameType.PushPendingFrames);
                var pendingNativeFrameAddress = null;
                var frames = [];
                while (pendingNativeFrameAddress = this.pendingNativeFrames.pop()) {
                    frames.push(pendingNativeFrameAddress);
                }
                while (pendingNativeFrameAddress = frames.pop()) {
                    var methodInfo = J2ME.methodIdToMethodInfoMap[i32[pendingNativeFrameAddress + 0 /* MethodIdOffset */ >> 2]];
                    var stackCount = i32[pendingNativeFrameAddress + 12 /* StackCountOffset */ >> 2];
                    var localCount = i32[pendingNativeFrameAddress + 8 /* LocalCountOffset */ >> 2];
                    var pc = i32[pendingNativeFrameAddress + 4 /* PCOffset */ >> 2];
                    var lockObjectAddress = i32[pendingNativeFrameAddress + 16 /* LockOffset */ >> 2];
                    J2ME.traceWriter && J2ME.traceWriter.writeLn("Pushing frame: " + methodInfo.implKey);
                    this.pushFrame(methodInfo, stackCount, pc, lockObjectAddress);
                    var frame = this.frame;
                    for (var j = 0; j < localCount; j++) {
                        var value = i32[(pendingNativeFrameAddress + 20 /* HeaderSize */ >> 2) + j];
                        frame.setParameter(4 /* Int */, j, value);
                    }
                    for (var j = 0; j < stackCount; j++) {
                        var value = i32[(pendingNativeFrameAddress + 20 /* HeaderSize */ >> 2) + j + localCount];
                        frame.setStackSlot(4 /* Int */, j, value);
                    }
                    ASM._gcFree(pendingNativeFrameAddress);
                }
                var frameType = i32[this.fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
                if (frameType === FrameType.PushPendingFrames) {
                    continue;
                }
                break;
            }
            if (J2ME.traceWriter) {
                J2ME.traceWriter.enter("Pending native frames after:");
                this.tracePendingFrames(J2ME.traceWriter);
                J2ME.traceWriter.leave("");
                J2ME.traceWriter.enter("Stack after:");
                this.frame.traceStack(J2ME.traceWriter);
                J2ME.traceWriter.leave("");
            }
        };
        /**
         * Called when unwinding begins.
         */
        Thread.prototype.beginUnwind = function () {
            // The |unwoundNativeFrames| stack should be empty at this point.
            release || assert(this.unwoundNativeFrames.length === 0, "0 unwound native frames");
        };
        /*
         * Called when unwinding ends.
         *
         *  x: Interpreter Frame
         * x': Compiler Frame
         *  -: Skip Frame
         *  +: Push Pending Frames
         *  /: null
         *
         *
         * Suppose you have the following logical call stack: a, b, c, d', e', -, f, g, h', i', -, j, k. The physical call
         * stack doesn't have any of the native frames on it: a, b, c, -, f, g, -, j, k, so when we resume we need to
         * make sure that native frames are accounted for. During unwinding, we save the state of native frames in the
         * |unwoundNativeFrames| array. In order to keep track of how native frames interleave with interpreter frames we
         * insert null markers in the |unwoundNativeFrames| array. So in this example, the array will be: /, i', h', /,
         * e', d'. When we resume in the interpreter, our call stack is: a, b, c, +, f, g, +, j, k. During unwinding, the
         * skip marker frames have been converted to push pending frames. These indicate to the interpreter that some native
         * frames should be pushed on the stack. When we return from j, we need to push h and i. Similarly, when we return
         * from f, we need to push d and e. After unwiding is complete, all elements in |unwoundNativeFrames| are poped and
         * pushed into the |pendingNativeFrames| which keeps track of the native frames that need to be pushed once a
         * push pending prame marker is observed. In this case |pendingNativeFrames| is: d', e', /, h', i', /. When we return
         * from j and see the first push pending frames marker, we look for the last set of frames in the |pendingNativeFrames|
         * list and push those on the stack.
         *
         *
         * Before every unwind, the |unwoundNativeFrames| list must be empty. However, the |pendingNativeFrames| list may
         * have unprocessed frames in it. This can happen if after resuming and returning from j, we call some native code
         * that unwinds. Luckily, all new native frames must be further down on the stack than the current frames in the
         * |pendingNativeFrames| list, so we can just push them at the end.
         *
         * TODO: Do a better job explaining all this.
         */
        Thread.prototype.endUnwind = function () {
            var unwound = this.unwoundNativeFrames;
            var pending = this.pendingNativeFrames;
            while (unwound.length) {
                pending.push(unwound.pop());
            }
            // Garbage collection is disabled during compiled code which can lead to OOM's if
            // we consistently stay in compiled code. Most code unwinds often enough that we can
            // force collection here since at the end of an unwind all frames are
            // stored back on the heap.
            ASM._collectALittle();
        };
        /**
         * Walks the stack from the current fp to find the frame that will return
         * to the removeFP and make it instead return to the newCallerFP.
         */
        Thread.prototype.removeFrame = function (removeFP, newCallerFP, newCallerPC) {
            var fp = this.fp;
            release || assert(fp !== removeFP, "Cannot remove current fp.");
            while ((i32[fp + 1 /* CallerFPOffset */]) !== removeFP) {
                fp = i32[fp + 1 /* CallerFPOffset */];
            }
            release || assert(i32[fp + 1 /* CallerFPOffset */] === removeFP, "Did not find the frame to remove.");
            i32[fp + 1 /* CallerFPOffset */] = newCallerFP;
            i32[fp + 0 /* CallerRAOffset */] = newCallerPC;
        };
        return Thread;
    })();
    J2ME.Thread = Thread;
    function prepareInterpretedMethod(methodInfo) {
        var method = function fastInterpreterFrameAdapter() {
            J2ME.runtimeCounter && J2ME.runtimeCounter.count("fastInterpreterFrameAdapter");
            var calleeStats = methodInfo.stats;
            calleeStats.interpreterCallCount++;
            if (config.forceRuntimeCompilation ||
                calleeStats.interpreterCallCount + calleeStats.backwardsBranchCount > J2ME.ConfigThresholds.InvokeThreshold) {
                J2ME.compileAndLinkMethod(methodInfo);
                if (methodInfo.state === 1 /* Compiled */) {
                    return methodInfo.fn.apply(null, arguments);
                }
            }
            var ctx = $.ctx;
            var thread = ctx.nativeThread;
            var callerFP = thread.fp;
            var callerPC = thread.pc;
            // release || traceWriter && traceWriter.writeLn(">> I");
            thread.pushMarkerFrame(FrameType.ExitInterpreter);
            var exitFP = thread.fp;
            thread.pushFrame(methodInfo);
            var calleeFP = thread.fp;
            var frame = thread.frame;
            var kinds = methodInfo.signatureKinds;
            var index = 0;
            if (!methodInfo.isStatic) {
                frame.setParameter(8 /* Reference */, index++, arguments[0]);
            }
            for (var i = 1, j = 1; i < kinds.length; i++) {
                frame.setParameter(kinds[i], index++, arguments[j++]);
                if (J2ME.isTwoSlot(kinds[i])) {
                    frame.setParameter(kinds[i], index++, arguments[j++]);
                }
            }
            if (methodInfo.isSynchronized) {
                var monitorAddr = methodInfo.isStatic ? $.getClassObjectAddress(methodInfo.classInfo) : arguments[0];
                i32[calleeFP + 3 /* MonitorOffset */] = monitorAddr;
                $.ctx.monitorEnter(J2ME.getMonitor(monitorAddr));
                release || assert(U !== 1 /* Yielding */, "Monitors should never yield.");
                if (U === 2 /* Pausing */ || U === 3 /* Stopping */) {
                    // Splice out the marker frame so the interpreter doesn't return early when execution is resumed.
                    // The simple solution of using the calleeFP to splice the frame cannot be used since the frame
                    // stack may have changed if an OSR occurred.
                    thread.removeFrame(exitFP, callerFP, callerPC);
                    return;
                }
            }
            var v = interpret(thread);
            if (U) {
                // Splice out the marker frame so the interpreter doesn't return early when execution is resumed.
                // The simple solution of using the calleeFP to splice the frame cannot be used since the frame
                // stack may have changed if an OSR occurred.
                thread.removeFrame(exitFP, callerFP, callerPC);
                return;
            }
            thread.popMarkerFrame(FrameType.ExitInterpreter);
            release || assert(callerFP === thread.fp, "callerFP === thread.fp");
            // release || traceWriter && traceWriter.writeLn("<< I");
            return v;
        };
        return method;
    }
    J2ME.prepareInterpretedMethod = prepareInterpretedMethod;
    var args = new Array(16);
    (function (ExceptionType) {
        ExceptionType[ExceptionType["ArithmeticException"] = 0] = "ArithmeticException";
        ExceptionType[ExceptionType["ArrayIndexOutOfBoundsException"] = 1] = "ArrayIndexOutOfBoundsException";
        ExceptionType[ExceptionType["NegativeArraySizeException"] = 2] = "NegativeArraySizeException";
        ExceptionType[ExceptionType["NullPointerException"] = 3] = "NullPointerException";
    })(J2ME.ExceptionType || (J2ME.ExceptionType = {}));
    var ExceptionType = J2ME.ExceptionType;
    /**
     * Debugging helper to make sure native methods were implemented correctly.
     */
    function checkReturnValue(methodInfo, l, h) {
        if (U) {
            if (typeof l !== "undefined") {
                assert(false, "Expected undefined return value during unwind, got " + l + " in " + methodInfo.implKey);
            }
            return;
        }
        if (!(J2ME.getKindCheck(methodInfo.returnKind)(l, h))) {
            assert(false, "Expected " + J2ME.getKindName(methodInfo.returnKind) + " return value, got low: " + l + " high: " + h + " in " + methodInfo.implKey);
        }
    }
    /**
     * Main interpreter loop. This method is carefully written to avoid memory allocation and
     * function calls on fast paths. Therefore, everything is inlined, even if it makes the code
     * look ugly.
     *
     * The interpreter loop caches the thread state in local variables. Doing so avoids a lot of
     * property accesses but also makes the code brittle since you need to manually sync up the
     * thread state with the local thead state at precise points.
     *
     * At call sites, caller frame |pc|s are always at the beggining of invoke bytecodes. In the
     * interpreter return bytecodes advance the pc past the invoke bytecode. Native code that
     * unwinds and resumes execution at a later point needs to adjust the pc accordingly.
     *
     * Bytecodes that construct exception objects must save the tread state before executing any
     * code that may overwrite the frame. Use the |throwException| helper method to ensure that
     * the thread state is property saved.
     */
    function interpret(thread) {
        release || J2ME.interpreterCount++;
        var frame = thread.frame;
        // Special case where a |PushPendingFrames| marker is on top of the stack. This happens when
        // native code is on top of the stack.
        if (frame.type === FrameType.PushPendingFrames) {
            thread.pushPendingNativeFrames();
            frame = thread.frame;
        }
        release || assert(frame.type === FrameType.Interpreter, "Must begin with interpreter frame.");
        var mi = frame.methodInfo;
        release || assert(mi, "Must have method info.");
        mi.stats.interpreterCallCount++;
        if (config.forceRuntimeCompilation || (mi.state === 0 /* Cold */ &&
            mi.stats.interpreterCallCount + mi.stats.backwardsBranchCount > J2ME.ConfigThresholds.InvokeThreshold)) {
            J2ME.compileAndLinkMethod(mi);
        }
        var maxLocals = mi.codeAttribute.max_locals;
        var ci = mi.classInfo;
        var cp = ci.constantPool;
        var code = mi ? mi.codeAttribute.code : null;
        var fp = thread.fp | 0;
        var lp = fp - maxLocals | 0;
        var sp = thread.sp | 0;
        var opPC = 0, pc = thread.pc | 0;
        var tag;
        var type, size;
        var value, index, arrayAddr, offset, buffer, tag, targetPC, jumpOffset;
        var address = 0, isStatic = false;
        var ia = 0, ib = 0; // Integer Operands
        var ll = 0, lh = 0; // Long Low / High
        var classInfo;
        var otherClassInfo;
        var fieldInfo;
        var monitorAddr;
        // HEAD
        var lastPC = 0;
        while (true) {
            opPC = pc, op = code[pc], pc = pc + 1 | 0;
            lastPC = opPC;
            if (!release) {
                assert(code === mi.codeAttribute.code, "Bad Code.");
                assert(ci === mi.classInfo, "Bad Class Info.");
                assert(cp === ci.constantPool, "Bad Constant Pool.");
                assert(lp === fp - mi.codeAttribute.max_locals, "Bad lp.");
                assert(fp >= (thread.tp >> 2), "Frame pointer is not less than than the top of the stack.");
                assert(fp < (thread.tp + 4096 /* MAX_STACK_SIZE */ >> 2), "Frame pointer is not greater than the stack size.");
                J2ME.bytecodeCount++;
                if (J2ME.traceStackWriter) {
                    frame.set(thread, fp, sp, opPC);
                    frame.trace(J2ME.traceStackWriter);
                    J2ME.traceStackWriter.writeLn();
                    J2ME.traceStackWriter.greenLn(mi.implKey + ": PC: " + opPC + ", FP: " + fp + ", " + J2ME.Bytecode.getBytecodesName(op));
                }
            }
            try {
                switch (op) {
                    case 0 /* NOP */:
                        continue;
                    case 1 /* ACONST_NULL */:
                        i32[sp] = 0 /* NULL */;
                        sp = sp + 1 | 0;
                        continue;
                    case 2 /* ICONST_M1 */:
                    case 3 /* ICONST_0 */:
                    case 4 /* ICONST_1 */:
                    case 5 /* ICONST_2 */:
                    case 6 /* ICONST_3 */:
                    case 7 /* ICONST_4 */:
                    case 8 /* ICONST_5 */:
                        i32[sp] = op - 3 /* ICONST_0 */ | 0;
                        sp = sp + 1 | 0;
                        continue;
                    case 11 /* FCONST_0 */:
                    case 12 /* FCONST_1 */:
                    case 13 /* FCONST_2 */:
                        f32[sp] = op - 11 /* FCONST_0 */ | 0;
                        sp = sp + 1 | 0;
                        continue;
                    case 14 /* DCONST_0 */:
                        i32[sp] = 0;
                        sp = sp + 1 | 0;
                        i32[sp] = 0;
                        sp = sp + 1 | 0;
                        continue;
                    case 15 /* DCONST_1 */:
                        i32[sp] = 0;
                        sp = sp + 1 | 0;
                        i32[sp] = 1072693248;
                        sp = sp + 1 | 0;
                        continue;
                    case 9 /* LCONST_0 */:
                    case 10 /* LCONST_1 */:
                        i32[sp] = op - 9 /* LCONST_0 */ | 0;
                        sp = sp + 1 | 0;
                        i32[sp] = 0;
                        sp = sp + 1 | 0;
                        continue;
                    case 16 /* BIPUSH */:
                        i32[sp] = code[pc] << 24 >> 24;
                        sp = sp + 1 | 0;
                        pc = pc + 1 | 0;
                        continue;
                    case 17 /* SIPUSH */:
                        i32[sp] = (code[pc] << 8 | code[pc + 1 | 0]) << 16 >> 16;
                        sp = sp + 1 | 0;
                        pc = pc + 2 | 0;
                        continue;
                    case 18 /* LDC */:
                    case 19 /* LDC_W */:
                        index = (op === 18 /* LDC */) ? code[pc++] : code[pc++] << 8 | code[pc++];
                        offset = cp.entries[index];
                        buffer = cp.buffer;
                        tag = buffer[offset++];
                        if (tag === 3 /* CONSTANT_Integer */ || tag === 4 /* CONSTANT_Float */) {
                            i32[sp++] = buffer[offset++] << 24 | buffer[offset++] << 16 | buffer[offset++] << 8 | buffer[offset++];
                        }
                        else if (tag === 8 /* CONSTANT_String */) {
                            i32[sp++] = cp.resolve(index, tag, false);
                        }
                        else {
                            release || assert(false, J2ME.getTAGSName(tag));
                        }
                        continue;
                    case 20 /* LDC2_W */:
                        index = code[pc++] << 8 | code[pc++];
                        offset = cp.entries[index];
                        buffer = cp.buffer;
                        tag = buffer[offset++];
                        if (tag === 5 /* CONSTANT_Long */ || tag === 6 /* CONSTANT_Double */) {
                            i32[sp + 1] = buffer[offset++] << 24 | buffer[offset++] << 16 | buffer[offset++] << 8 | buffer[offset++];
                            i32[sp] = buffer[offset++] << 24 | buffer[offset++] << 16 | buffer[offset++] << 8 | buffer[offset++];
                            sp += 2;
                        }
                        else {
                            release || assert(false, J2ME.getTAGSName(tag));
                        }
                        continue;
                    case 21 /* ILOAD */:
                    case 23 /* FLOAD */:
                    case 25 /* ALOAD */:
                        i32[sp] = i32[lp + code[pc] | 0];
                        sp = sp + 1 | 0;
                        pc = pc + 1 | 0;
                        continue;
                    case 22 /* LLOAD */:
                    case 24 /* DLOAD */:
                        offset = lp + code[pc] | 0;
                        i32[sp] = i32[offset];
                        i32[sp + 1 | 0] = i32[offset + 1 | 0];
                        sp = sp + 2 | 0;
                        pc = pc + 1 | 0;
                        continue;
                    case 26 /* ILOAD_0 */:
                    case 27 /* ILOAD_1 */:
                    case 28 /* ILOAD_2 */:
                    case 29 /* ILOAD_3 */:
                        i32[sp] = i32[(lp + op | 0) - 26 /* ILOAD_0 */ | 0];
                        sp = sp + 1 | 0;
                        continue;
                    case 34 /* FLOAD_0 */:
                    case 35 /* FLOAD_1 */:
                    case 36 /* FLOAD_2 */:
                    case 37 /* FLOAD_3 */:
                        i32[sp] = i32[(lp + op | 0) - 34 /* FLOAD_0 */ | 0];
                        sp = sp + 1 | 0;
                        continue;
                    case 42 /* ALOAD_0 */:
                    case 43 /* ALOAD_1 */:
                    case 44 /* ALOAD_2 */:
                    case 45 /* ALOAD_3 */:
                        i32[sp] = i32[(lp + op | 0) - 42 /* ALOAD_0 */ | 0];
                        sp = sp + 1 | 0;
                        continue;
                    case 30 /* LLOAD_0 */:
                    case 31 /* LLOAD_1 */:
                    case 32 /* LLOAD_2 */:
                    case 33 /* LLOAD_3 */:
                        offset = (lp + op | 0) - 30 /* LLOAD_0 */ | 0;
                        i32[sp] = i32[offset];
                        i32[sp + 1 | 0] = i32[offset + 1 | 0];
                        sp = sp + 2 | 0;
                        continue;
                    case 38 /* DLOAD_0 */:
                    case 39 /* DLOAD_1 */:
                    case 40 /* DLOAD_2 */:
                    case 41 /* DLOAD_3 */:
                        offset = (lp + op | 0) - 38 /* DLOAD_0 */ | 0;
                        i32[sp] = i32[offset];
                        i32[sp + 1 | 0] = i32[offset + 1 | 0];
                        sp = sp + 2 | 0;
                        continue;
                    case 46 /* IALOAD */:
                    case 48 /* FALOAD */:
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[sp++] = i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index];
                        continue;
                    case 51 /* BALOAD */:
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[sp++] = i8[arrayAddr + 8 /* ARRAY_HDR_SIZE */ + index];
                        continue;
                    case 52 /* CALOAD */:
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[sp++] = u16[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 1) + index];
                        continue;
                    case 53 /* SALOAD */:
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[sp++] = i16[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 1) + index];
                        continue;
                    case 50 /* AALOAD */:
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if (arrayAddr === 0 /* NULL */) {
                            thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                            continue;
                        }
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[sp++] = i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index];
                        continue;
                    case 54 /* ISTORE */:
                    case 56 /* FSTORE */:
                    case 58 /* ASTORE */:
                        sp = sp - 1 | 0;
                        i32[lp + code[pc] | 0] = i32[sp];
                        pc = pc + 1 | 0;
                        continue;
                    case 55 /* LSTORE */:
                    case 57 /* DSTORE */:
                        offset = lp + code[pc] | 0;
                        sp = sp - 1 | 0;
                        i32[offset + 1 | 0] = i32[sp];
                        sp = sp - 1 | 0;
                        i32[offset] = i32[sp];
                        pc = pc + 1 | 0;
                        continue;
                    case 59 /* ISTORE_0 */:
                    case 60 /* ISTORE_1 */:
                    case 61 /* ISTORE_2 */:
                    case 62 /* ISTORE_3 */:
                        sp = sp - 1 | 0;
                        i32[(lp + op | 0) - 59 /* ISTORE_0 */ | 0] = i32[sp];
                        continue;
                    case 67 /* FSTORE_0 */:
                    case 68 /* FSTORE_1 */:
                    case 69 /* FSTORE_2 */:
                    case 70 /* FSTORE_3 */:
                        sp = sp - 1 | 0;
                        i32[(lp + op | 0) - 67 /* FSTORE_0 */ | 0] = i32[sp];
                        continue;
                    case 75 /* ASTORE_0 */:
                    case 76 /* ASTORE_1 */:
                    case 77 /* ASTORE_2 */:
                    case 78 /* ASTORE_3 */:
                        sp = sp - 1 | 0;
                        i32[(lp + op | 0) - 75 /* ASTORE_0 */ | 0] = i32[sp];
                        continue;
                    case 63 /* LSTORE_0 */:
                    case 64 /* LSTORE_1 */:
                    case 65 /* LSTORE_2 */:
                    case 66 /* LSTORE_3 */:
                        offset = lp + op - 63 /* LSTORE_0 */;
                        i32[offset + 1] = i32[--sp];
                        i32[offset] = i32[--sp];
                        continue;
                    case 71 /* DSTORE_0 */:
                    case 72 /* DSTORE_1 */:
                    case 73 /* DSTORE_2 */:
                    case 74 /* DSTORE_3 */:
                        offset = lp + op - 71 /* DSTORE_0 */;
                        i32[offset + 1] = i32[--sp];
                        i32[offset] = i32[--sp];
                        continue;
                    case 79 /* IASTORE */:
                    case 81 /* FASTORE */:
                        value = i32[--sp];
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index] = value;
                        continue;
                    case 84 /* BASTORE */:
                        value = i32[--sp];
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i8[arrayAddr + 8 /* ARRAY_HDR_SIZE */ + index] = value;
                        continue;
                    case 85 /* CASTORE */:
                        value = i32[--sp];
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        u16[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 1) + index] = value;
                        continue;
                    case 86 /* SASTORE */:
                        value = i32[--sp];
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i16[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 1) + index] = value;
                        continue;
                    case 80 /* LASTORE */:
                    case 82 /* DASTORE */:
                        lh = i32[--sp];
                        ll = i32[--sp];
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index * 2] = ll;
                        i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index * 2 + 1] = lh;
                        continue;
                    case 47 /* LALOAD */:
                    case 49 /* DALOAD */:
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        i32[sp++] = i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index * 2];
                        i32[sp++] = i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index * 2 + 1];
                        continue;
                    case 83 /* AASTORE */:
                        address = i32[--sp];
                        index = i32[--sp];
                        arrayAddr = i32[--sp];
                        if (arrayAddr === 0 /* NULL */) {
                            thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                            continue;
                        }
                        if ((index >>> 0) >= (i32[arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] >>> 0)) {
                            thread.throwException(fp, sp, opPC, 1 /* ArrayIndexOutOfBoundsException */, index);
                        }
                        J2ME.checkArrayStore(arrayAddr, address);
                        i32[(arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2) + index] = address;
                        continue;
                    case 87 /* POP */:
                        sp = sp - 1 | 0;
                        continue;
                    case 88 /* POP2 */:
                        sp = sp - 2 | 0;
                        continue;
                    case 89 /* DUP */:
                        i32[sp] = i32[sp - 1 | 0];
                        sp = sp + 1 | 0;
                        continue;
                    case 92 /* DUP2 */:
                        i32[sp] = i32[sp - 2]; // b
                        i32[sp + 1] = i32[sp - 1]; // a
                        sp += 2;
                        continue;
                    case 90 /* DUP_X1 */:
                        i32[sp] = i32[sp - 1]; // a
                        i32[sp - 1] = i32[sp - 2]; // b
                        i32[sp - 2] = i32[sp]; // a
                        sp++;
                        continue;
                    case 91 /* DUP_X2 */:
                        i32[sp] = i32[sp - 1]; // a
                        i32[sp - 1] = i32[sp - 2]; // b
                        i32[sp - 2] = i32[sp - 3]; // c
                        i32[sp - 3] = i32[sp]; // a
                        sp++;
                        continue;
                    case 93 /* DUP2_X1 */:
                        i32[sp + 1] = i32[sp - 1]; // a
                        i32[sp] = i32[sp - 2]; // b
                        i32[sp - 1] = i32[sp - 3]; // c
                        i32[sp - 2] = i32[sp + 1]; // a
                        i32[sp - 3] = i32[sp]; // b
                        sp += 2;
                        continue;
                    case 94 /* DUP2_X2 */:
                        i32[sp + 1] = i32[sp - 1]; // a
                        i32[sp] = i32[sp - 2]; // b
                        i32[sp - 1] = i32[sp - 3]; // c
                        i32[sp - 2] = i32[sp - 4]; // d
                        i32[sp - 3] = i32[sp + 1]; // a
                        i32[sp - 4] = i32[sp]; // b
                        sp += 2;
                        continue;
                    case 95 /* SWAP */:
                        ia = i32[sp - 1];
                        i32[sp - 1] = i32[sp - 2];
                        i32[sp - 2] = ia;
                        continue;
                    case 132 /* IINC */:
                        index = code[pc];
                        value = code[pc + 1 | 0] << 24 >> 24;
                        i32[lp + index | 0] = i32[lp + index | 0] + value | 0;
                        pc = pc + 2 | 0;
                        continue;
                    case 96 /* IADD */:
                        i32[sp - 2 | 0] = (i32[sp - 2 | 0] + i32[sp - 1 | 0]) | 0;
                        sp = sp - 1 | 0;
                        continue;
                    case 97 /* LADD */:
                        ASM._lAdd(sp - 4 << 2, sp - 4 << 2, sp - 2 << 2);
                        sp -= 2;
                        continue;
                    case 98 /* FADD */:
                        f32[sp - 2] = f32[sp - 2] + f32[sp - 1];
                        sp--;
                        continue;
                    case 99 /* DADD */:
                        aliasedI32[0] = i32[sp - 4];
                        aliasedI32[1] = i32[sp - 3];
                        ia = aliasedF64[0];
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        ib = aliasedF64[0];
                        aliasedF64[0] = ia + ib;
                        i32[sp - 4] = aliasedI32[0];
                        i32[sp - 3] = aliasedI32[1];
                        sp -= 2;
                        continue;
                    case 100 /* ISUB */:
                        i32[sp - 2 | 0] = (i32[sp - 2 | 0] - i32[sp - 1 | 0]) | 0;
                        sp = sp - 1 | 0;
                        continue;
                    case 101 /* LSUB */:
                        ASM._lSub(sp - 4 << 2, sp - 4 << 2, sp - 2 << 2);
                        sp -= 2;
                        continue;
                    case 102 /* FSUB */:
                        f32[sp - 2] = f32[sp - 2] - f32[sp - 1];
                        sp--;
                        continue;
                    case 103 /* DSUB */:
                        aliasedI32[0] = i32[sp - 4];
                        aliasedI32[1] = i32[sp - 3];
                        ia = aliasedF64[0];
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        ib = aliasedF64[0];
                        aliasedF64[0] = ia - ib;
                        i32[sp - 4] = aliasedI32[0];
                        i32[sp - 3] = aliasedI32[1];
                        sp -= 2;
                        continue;
                    case 104 /* IMUL */:
                        i32[sp - 2 | 0] = Math.imul(i32[sp - 2 | 0], i32[sp - 1 | 0]) | 0;
                        sp = sp - 1 | 0;
                        continue;
                    case 105 /* LMUL */:
                        ASM._lMul(sp - 4 << 2, sp - 4 << 2, sp - 2 << 2);
                        sp -= 2;
                        continue;
                    case 106 /* FMUL */:
                        f32[sp - 2] = f32[sp - 2] * f32[sp - 1];
                        sp--;
                        continue;
                    case 107 /* DMUL */:
                        aliasedI32[0] = i32[sp - 4];
                        aliasedI32[1] = i32[sp - 3];
                        ia = aliasedF64[0];
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        ib = aliasedF64[0];
                        aliasedF64[0] = ia * ib;
                        i32[sp - 4] = aliasedI32[0];
                        i32[sp - 3] = aliasedI32[1];
                        sp -= 2;
                        continue;
                    case 108 /* IDIV */:
                        if (i32[sp - 1] === 0) {
                            thread.throwException(fp, sp, opPC, 0 /* ArithmeticException */);
                        }
                        ia = i32[sp - 2];
                        ib = i32[sp - 1];
                        i32[sp - 2] = (ia === -2147483648 /* INT_MIN */ && ib === -1) ? ia : ((ia / ib) | 0);
                        sp--;
                        continue;
                    case 109 /* LDIV */:
                        if (i32[sp - 2] === 0 && i32[sp - 1] === 0) {
                            thread.throwException(fp, sp, opPC, 0 /* ArithmeticException */);
                        }
                        ASM._lDiv(sp - 4 << 2, sp - 4 << 2, sp - 2 << 2);
                        sp -= 2;
                        continue;
                    case 110 /* FDIV */:
                        f32[sp - 2] = Math.fround(f32[sp - 2] / f32[sp - 1]);
                        sp--;
                        continue;
                    case 111 /* DDIV */:
                        aliasedI32[0] = i32[sp - 4];
                        aliasedI32[1] = i32[sp - 3];
                        ia = aliasedF64[0];
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        ib = aliasedF64[0];
                        aliasedF64[0] = ia / ib;
                        i32[sp - 4] = aliasedI32[0];
                        i32[sp - 3] = aliasedI32[1];
                        sp -= 2;
                        continue;
                    case 112 /* IREM */:
                        if (i32[sp - 1] === 0) {
                            thread.throwException(fp, sp, opPC, 0 /* ArithmeticException */);
                        }
                        i32[sp - 2] = (i32[sp - 2] % i32[sp - 1]) | 0;
                        sp--;
                        continue;
                    case 113 /* LREM */:
                        if (i32[sp - 2] === 0 && i32[sp - 1] === 0) {
                            thread.throwException(fp, sp, opPC, 0 /* ArithmeticException */);
                        }
                        ASM._lRem(sp - 4 << 2, sp - 4 << 2, sp - 2 << 2);
                        sp -= 2;
                        continue;
                    case 114 /* FREM */:
                        f32[sp - 2] = Math.fround(f32[sp - 2] % f32[sp - 1]);
                        sp--;
                        continue;
                    case 115 /* DREM */:
                        aliasedI32[0] = i32[sp - 4];
                        aliasedI32[1] = i32[sp - 3];
                        ia = aliasedF64[0];
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        ib = aliasedF64[0];
                        aliasedF64[0] = ia % ib;
                        i32[sp - 4] = aliasedI32[0];
                        i32[sp - 3] = aliasedI32[1];
                        sp -= 2;
                        continue;
                    case 116 /* INEG */:
                        i32[sp - 1] = -i32[sp - 1] | 0;
                        continue;
                    case 117 /* LNEG */:
                        ASM._lNeg(sp - 2 << 2, sp - 2 << 2);
                        continue;
                    case 118 /* FNEG */:
                        f32[sp - 1] = -f32[sp - 1];
                        continue;
                    case 119 /* DNEG */:
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        aliasedF64[0] = -aliasedF64[0];
                        i32[sp - 2] = aliasedI32[0];
                        i32[sp - 1] = aliasedI32[1];
                        continue;
                    case 120 /* ISHL */:
                        i32[sp - 2 | 0] = i32[sp - 2 | 0] << i32[sp - 1 | 0];
                        sp = sp - 1 | 0;
                        continue;
                    case 121 /* LSHL */:
                        ASM._lShl(sp - 3 << 2, sp - 3 << 2, i32[sp - 1]);
                        sp -= 1;
                        continue;
                    case 122 /* ISHR */:
                        i32[sp - 2 | 0] = i32[sp - 2 | 0] >> i32[sp - 1 | 0];
                        sp = sp - 1 | 0;
                        continue;
                    case 123 /* LSHR */:
                        ASM._lShr(sp - 3 << 2, sp - 3 << 2, i32[sp - 1]);
                        sp -= 1;
                        continue;
                    case 124 /* IUSHR */:
                        i32[sp - 2 | 0] = i32[sp - 2 | 0] >>> i32[sp - 1 | 0];
                        sp = sp - 1 | 0;
                        continue;
                    case 125 /* LUSHR */:
                        ASM._lUshr(sp - 3 << 2, sp - 3 << 2, i32[sp - 1]);
                        sp -= 1;
                        continue;
                    case 126 /* IAND */:
                        i32[sp - 2] &= i32[sp - 1 | 0];
                        sp = sp - 1 | 0;
                        continue;
                    case 127 /* LAND */:
                        i32[sp - 4] &= i32[sp - 2];
                        i32[sp - 3] &= i32[sp - 1];
                        sp -= 2;
                        break;
                    case 128 /* IOR */:
                        i32[sp - 2] |= i32[sp - 1 | 0];
                        sp = sp - 1 | 0;
                        continue;
                    case 129 /* LOR */:
                        i32[sp - 4] |= i32[sp - 2];
                        i32[sp - 3] |= i32[sp - 1];
                        sp -= 2;
                        continue;
                    case 130 /* IXOR */:
                        i32[sp - 2] ^= i32[sp - 1 | 0];
                        sp = sp - 1 | 0;
                        continue;
                    case 131 /* LXOR */:
                        i32[sp - 4] ^= i32[sp - 2];
                        i32[sp - 3] ^= i32[sp - 1];
                        sp -= 2;
                        continue;
                    case 148 /* LCMP */:
                        ASM._lCmp(sp - 4 << 2, sp - 4 << 2, sp - 2 << 2);
                        sp -= 3;
                        continue;
                    case 149 /* FCMPL */:
                    case 150 /* FCMPG */:
                        var FCMP_fb = f32[--sp];
                        var FCMP_fa = f32[--sp];
                        if (FCMP_fa !== FCMP_fa || FCMP_fb !== FCMP_fb) {
                            i32[sp++] = op === 149 /* FCMPL */ ? -1 : 1;
                        }
                        else if (FCMP_fa > FCMP_fb) {
                            i32[sp++] = 1;
                        }
                        else if (FCMP_fa < FCMP_fb) {
                            i32[sp++] = -1;
                        }
                        else {
                            i32[sp++] = 0;
                        }
                        continue;
                    case 151 /* DCMPL */:
                    case 152 /* DCMPG */:
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        var DCMP_fb = aliasedF64[0];
                        aliasedI32[0] = i32[sp - 4];
                        aliasedI32[1] = i32[sp - 3];
                        var DCMP_fa = aliasedF64[0];
                        sp -= 4;
                        if (DCMP_fa !== DCMP_fa || DCMP_fb !== DCMP_fb) {
                            i32[sp++] = op === 151 /* DCMPL */ ? -1 : 1;
                        }
                        else if (DCMP_fa > DCMP_fb) {
                            i32[sp++] = 1;
                        }
                        else if (DCMP_fa < DCMP_fb) {
                            i32[sp++] = -1;
                        }
                        else {
                            i32[sp++] = 0;
                        }
                        continue;
                    case 153 /* IFEQ */:
                        if (i32[--sp] === 0) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 154 /* IFNE */:
                        if (i32[--sp] !== 0) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 155 /* IFLT */:
                        if (i32[--sp] < 0) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 156 /* IFGE */:
                        if (i32[--sp] >= 0) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 157 /* IFGT */:
                        if (i32[--sp] > 0) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 158 /* IFLE */:
                        if (i32[--sp] <= 0) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 159 /* IF_ICMPEQ */:
                        if (i32[--sp] === i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 160 /* IF_ICMPNE */:
                        if (i32[--sp] !== i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 161 /* IF_ICMPLT */:
                        if (i32[--sp] > i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 162 /* IF_ICMPGE */:
                        if (i32[--sp] <= i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 163 /* IF_ICMPGT */:
                        if (i32[--sp] < i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 164 /* IF_ICMPLE */:
                        if (i32[--sp] >= i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 165 /* IF_ACMPEQ */:
                        if (i32[--sp] === i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 166 /* IF_ACMPNE */:
                        if (i32[--sp] !== i32[--sp]) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 198 /* IFNULL */:
                        if (i32[--sp] === 0 /* NULL */) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 199 /* IFNONNULL */:
                        if (i32[--sp] !== 0 /* NULL */) {
                            jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                            pc = opPC + jumpOffset | 0;
                            continue;
                        }
                        pc = pc + 2 | 0;
                        continue;
                    case 167 /* GOTO */:
                        jumpOffset = ((code[pc++] << 8 | code[pc++]) << 16 >> 16);
                        if (jumpOffset < 0) {
                            mi.stats.backwardsBranchCount++;
                            if (config.forceRuntimeCompilation || (mi.state === 0 /* Cold */ &&
                                mi.stats.interpreterCallCount + mi.stats.backwardsBranchCount > J2ME.ConfigThresholds.BackwardBranchThreshold)) {
                                J2ME.compileAndLinkMethod(mi);
                            }
                            if (J2ME.enableOnStackReplacement && mi.state === 1 /* Compiled */) {
                                // Just because we've jumped backwards doesn't mean we are at a loop header but it does mean that we are
                                // at the beginning of a basic block. This is a really cheap test and a convenient place to perform an
                                // on stack replacement.
                                var previousFrameType = i32[i32[fp + 1 /* CallerFPOffset */] + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
                                if ((previousFrameType === FrameType.Interpreter || previousFrameType === FrameType.ExitInterpreter) && mi.onStackReplacementEntryPoints.indexOf(opPC + jumpOffset) > -1) {
                                    J2ME.traceWriter && J2ME.traceWriter.writeLn("OSR: " + mi.implKey);
                                    J2ME.onStackReplacementCount++;
                                    // Set the global OSR to the current method info.
                                    O = mi;
                                    thread.set(fp, sp, opPC + jumpOffset);
                                    opPC = i32[fp + 0 /* CallerRAOffset */];
                                    fp = i32[fp + 1 /* CallerFPOffset */];
                                    var kind = 9 /* Void */;
                                    var signatureKinds = mi.signatureKinds;
                                    var returnValue;
                                    // The osr will push a Native frame for us.
                                    var frameTypeOffset = thread.fp - mi.codeAttribute.max_locals + 2 /* FrameTypeOffset */;
                                    returnValue = mi.fn.call();
                                    release || assert(O === null, "OSR frame must be removed.");
                                    if (!release) {
                                    }
                                    if (U) {
                                        J2ME.traceWriter && J2ME.traceWriter.writeLn("<< I Unwind: " + J2ME.getVMStateName(U));
                                        release || assert(thread.unwoundNativeFrames.length, "Must have unwound frames.");
                                        thread.nativeFrameCount--;
                                        i32[frameTypeOffset] = FrameType.PushPendingFrames;
                                        thread.unwoundNativeFrames.push(null);
                                        return;
                                    }
                                    thread.popMarkerFrame(FrameType.Native);
                                    sp = thread.sp | 0;
                                    release || assert(fp >= (thread.tp >> 2), "Valid frame pointer after return.");
                                    kind = signatureKinds[0];
                                    if (previousFrameType === FrameType.ExitInterpreter) {
                                        thread.set(fp, sp, opPC);
                                        switch (kind) {
                                            case 6 /* Long */:
                                            case 7 /* Double */:
                                                return J2ME.returnLong(returnValue, tempReturn0);
                                            case 4 /* Int */:
                                            case 1 /* Byte */:
                                            case 3 /* Char */:
                                            case 5 /* Float */:
                                            case 2 /* Short */:
                                            case 0 /* Boolean */:
                                            case 8 /* Reference */:
                                                return returnValue;
                                            case 9 /* Void */:
                                                return;
                                            default:
                                                release || assert(false, "Invalid Kind: " + J2ME.getKindName(kind));
                                        }
                                    }
                                    mi = J2ME.methodIdToMethodInfoMap[i32[fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
                                    type = i32[fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
                                    maxLocals = mi.codeAttribute.max_locals;
                                    lp = fp - maxLocals | 0;
                                    ci = mi.classInfo;
                                    cp = ci.constantPool;
                                    code = mi.codeAttribute.code;
                                    pc = opPC + (code[opPC] === 185 /* INVOKEINTERFACE */ ? 5 : 3);
                                    // Push return value.
                                    switch (kind) {
                                        case 6 /* Long */:
                                        case 7 /* Double */:
                                            i32[sp++] = returnValue;
                                            i32[sp++] = tempReturn0;
                                            continue;
                                        case 4 /* Int */:
                                        case 1 /* Byte */:
                                        case 3 /* Char */:
                                        case 5 /* Float */:
                                        case 2 /* Short */:
                                        case 0 /* Boolean */:
                                        case 8 /* Reference */:
                                            i32[sp++] = returnValue;
                                            continue;
                                        case 9 /* Void */:
                                            continue;
                                        default:
                                            release || assert(false, "Invalid Kind: " + J2ME.getKindName(kind));
                                    }
                                }
                            }
                        }
                        pc = opPC + jumpOffset | 0;
                        continue;
                    //        case Bytecodes.GOTO_W:
                    //          frame.pc = frame.read32Signed() - 1;
                    //          break;
                    //        case Bytecodes.JSR:
                    //          pc = frame.read16();
                    //          stack.push(frame.pc);
                    //          frame.pc = pc;
                    //          break;
                    //        case Bytecodes.JSR_W:
                    //          pc = frame.read32();
                    //          stack.push(frame.pc);
                    //          frame.pc = pc;
                    //          break;
                    //        case Bytecodes.RET:
                    //          frame.pc = frame.local[frame.read8()];
                    //          break;
                    case 133 /* I2L */:
                        i32[sp] = i32[sp - 1] < 0 ? -1 : 0;
                        sp++;
                        continue;
                    case 134 /* I2F */:
                        aliasedF32[0] = i32[--sp];
                        i32[sp++] = aliasedI32[0];
                        continue;
                    case 135 /* I2D */:
                        aliasedF64[0] = i32[--sp];
                        i32[sp++] = aliasedI32[0];
                        i32[sp++] = aliasedI32[1];
                        continue;
                    case 136 /* L2I */:
                        sp--;
                        continue;
                    case 137 /* L2F */:
                        aliasedF32[0] = Math.fround(J2ME.longToNumber(i32[sp - 2], i32[sp - 1]));
                        i32[sp - 2] = aliasedI32[0];
                        sp--;
                        continue;
                    case 138 /* L2D */:
                        aliasedF64[0] = J2ME.longToNumber(i32[sp - 2], i32[sp - 1]);
                        i32[sp - 2] = aliasedI32[0];
                        i32[sp - 1] = aliasedI32[1];
                        continue;
                    case 139 /* F2I */:
                        var F2I_fa = f32[sp - 1];
                        if (F2I_fa > 2147483647 /* INT_MAX */) {
                            i32[sp - 1] = 2147483647 /* INT_MAX */;
                        }
                        else if (F2I_fa < -2147483648 /* INT_MIN */) {
                            i32[sp - 1] = -2147483648 /* INT_MIN */;
                        }
                        else {
                            i32[sp - 1] = F2I_fa | 0;
                        }
                        continue;
                    case 140 /* F2L */:
                        var F2L_fa = f32[--sp];
                        i32[sp++] = J2ME.returnLongValue(F2L_fa);
                        i32[sp++] = tempReturn0;
                        continue;
                    case 141 /* F2D */:
                        aliasedF64[0] = f32[--sp];
                        i32[sp++] = aliasedI32[0];
                        i32[sp++] = aliasedI32[1];
                        continue;
                    case 142 /* D2I */:
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        var D2I_fa = aliasedF64[0];
                        if (D2I_fa > 2147483647 /* INT_MAX */) {
                            i32[sp - 2] = 2147483647 /* INT_MAX */;
                        }
                        else if (D2I_fa < -2147483648 /* INT_MIN */) {
                            i32[sp - 2] = -2147483648 /* INT_MIN */;
                        }
                        else {
                            i32[sp - 2] = D2I_fa | 0;
                        }
                        sp--;
                        continue;
                    case 143 /* D2L */:
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        var D2L_fa = aliasedF64[0];
                        if (D2L_fa === Number.POSITIVE_INFINITY) {
                            i32[sp - 2] = 4294967295 /* LONG_MAX_LOW */;
                            i32[sp - 1] = 2147483647 /* LONG_MAX_HIGH */;
                        }
                        else if (D2L_fa === Number.NEGATIVE_INFINITY) {
                            i32[sp - 2] = 0 /* LONG_MIN_LOW */;
                            i32[sp - 1] = 2147483648 /* LONG_MIN_HIGH */;
                        }
                        else {
                            i32[sp - 2] = J2ME.returnLongValue(D2L_fa);
                            i32[sp - 1] = tempReturn0;
                        }
                        continue;
                    case 144 /* D2F */:
                        aliasedI32[0] = i32[sp - 2];
                        aliasedI32[1] = i32[sp - 1];
                        f32[sp - 2] = Math.fround(aliasedF64[0]);
                        sp--;
                        continue;
                    case 145 /* I2B */:
                        i32[sp - 1] = (i32[sp - 1] << 24) >> 24;
                        continue;
                    case 146 /* I2C */:
                        i32[sp - 1] &= 0xffff;
                        continue;
                    case 147 /* I2S */:
                        i32[sp - 1] = (i32[sp - 1] << 16) >> 16;
                        continue;
                    case 170 /* TABLESWITCH */:
                        pc = (pc + 3) & ~0x03; // Consume Padding
                        offset = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                        ia = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                        ib = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                        value = i32[--sp];
                        if (value >= ia && value <= ib) {
                            pc += (value - ia) << 2;
                            offset = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                        }
                        pc = opPC + offset;
                        continue;
                    case 171 /* LOOKUPSWITCH */:
                        pc = (pc + 3) & ~0x03; // Consume Padding
                        offset = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                        var npairs = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                        value = i32[--sp];
                        lookup: for (var i = 0; i < npairs; i++) {
                            var key = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                            if (key === value) {
                                offset = code[pc++] << 24 | code[pc++] << 16 | code[pc++] << 8 | code[pc++];
                            }
                            else {
                                pc += 4;
                            }
                            if (key >= value) {
                                break lookup;
                            }
                        }
                        pc = opPC + offset;
                        continue;
                    case 189 /* ANEWARRAY */:
                        index = code[pc++] << 8 | code[pc++];
                        classInfo = cp.resolveClass(index);
                        size = i32[--sp];
                        if (size < 0) {
                            thread.throwException(fp, sp, opPC, 2 /* NegativeArraySizeException */);
                        }
                        i32[sp++] = J2ME.newArray(classInfo, size);
                        continue;
                    case 197 /* MULTIANEWARRAY */:
                        index = code[pc++] << 8 | code[pc++];
                        classInfo = cp.resolveClass(index);
                        var dimensions = code[pc++];
                        var lengths = new Array(dimensions);
                        for (var i = 0; i < dimensions; i++) {
                            lengths[i] = i32[--sp];
                            if (size < 0) {
                                thread.throwException(fp, sp, opPC, 2 /* NegativeArraySizeException */);
                            }
                        }
                        i32[sp++] = J2ME.newMultiArray(classInfo, lengths.reverse());
                        continue;
                    case 190 /* ARRAYLENGTH */:
                        arrayAddr = i32[--sp];
                        if (arrayAddr === 0 /* NULL */) {
                            thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                            continue;
                        }
                        i32[sp++] = i32[(arrayAddr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2)];
                        continue;
                    case 180 /* GETFIELD */:
                    case 178 /* GETSTATIC */:
                        index = code[pc++] << 8 | code[pc++];
                        fieldInfo = cp.resolved[index] || cp.resolveField(index, op === 178 /* GETSTATIC */);
                        if (op === 178 /* GETSTATIC */) {
                            thread.classInitAndUnwindCheck(fp, sp, opPC, fieldInfo.classInfo);
                            if (U) {
                                return;
                            }
                            address = $.staticObjectAddresses[fieldInfo.classInfo.id] + fieldInfo.byteOffset;
                            if (address === 0 /* NULL */) {
                                thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                                continue;
                            }
                        }
                        else {
                            address = i32[--sp];
                            if (address === 0 /* NULL */) {
                                thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                                continue;
                            }
                            address += fieldInfo.byteOffset;
                        }
                        switch (fieldInfo.kind) {
                            case 8 /* Reference */:
                                i32[sp++] = i32[address >> 2];
                                continue;
                            case 4 /* Int */:
                            case 1 /* Byte */:
                            case 3 /* Char */:
                            case 2 /* Short */:
                            case 0 /* Boolean */:
                            case 5 /* Float */:
                                i32[sp++] = i32[address >> 2];
                                continue;
                            case 6 /* Long */:
                            case 7 /* Double */:
                                i32[sp++] = i32[address >> 2];
                                i32[sp++] = i32[address + 4 >> 2];
                                continue;
                            default:
                                release || assert(false, "fieldInfo.kind");
                        }
                        continue;
                    case 181 /* PUTFIELD */:
                    case 179 /* PUTSTATIC */:
                        index = code[pc++] << 8 | code[pc++];
                        fieldInfo = cp.resolved[index] || cp.resolveField(index, op === 179 /* PUTSTATIC */);
                        isStatic = op === 179 /* PUTSTATIC */;
                        if (isStatic) {
                            thread.classInitAndUnwindCheck(fp, sp, opPC, fieldInfo.classInfo);
                            if (U) {
                                return;
                            }
                            address = $.staticObjectAddresses[fieldInfo.classInfo.id] + fieldInfo.byteOffset;
                        }
                        else {
                            address = i32[sp - (J2ME.isTwoSlot(fieldInfo.kind) ? 3 : 2)];
                            if (address === 0 /* NULL */) {
                                thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                                continue;
                            }
                            address += fieldInfo.byteOffset;
                        }
                        switch (fieldInfo.kind) {
                            case 8 /* Reference */:
                                i32[address >> 2] = i32[--sp];
                                break;
                            case 4 /* Int */:
                            case 1 /* Byte */:
                            case 3 /* Char */:
                            case 2 /* Short */:
                            case 0 /* Boolean */:
                            case 5 /* Float */:
                                i32[address >> 2] = i32[--sp];
                                break;
                            case 6 /* Long */:
                            case 7 /* Double */:
                                i32[address + 4 >> 2] = i32[--sp];
                                i32[address >> 2] = i32[--sp];
                                break;
                            default:
                                release || assert(false, "fieldInfo.kind");
                        }
                        if (!isStatic) {
                            sp--; // Pop Reference
                        }
                        continue;
                    case 187 /* NEW */:
                        index = code[pc++] << 8 | code[pc++];
                        release || J2ME.traceWriter && J2ME.traceWriter.writeLn(mi.implKey + " " + index);
                        classInfo = cp.resolveClass(index);
                        thread.classInitAndUnwindCheck(fp, sp, opPC, classInfo);
                        if (U) {
                            return;
                        }
                        i32[sp++] = J2ME.allocObject(classInfo);
                        continue;
                    case 192 /* CHECKCAST */:
                        index = code[pc++] << 8 | code[pc++];
                        classInfo = cp.resolveClass(index);
                        address = i32[sp - 1];
                        if (address === 0 /* NULL */) {
                            continue;
                        }
                        otherClassInfo = J2ME.classIdToClassInfoMap[i32[address >> 2]];
                        if (!J2ME.isAssignableTo(otherClassInfo, classInfo)) {
                            thread.set(fp, sp, opPC);
                            throw $.newClassCastException(otherClassInfo.getClassNameSlow() + " is not assignable to " + classInfo.getClassNameSlow());
                        }
                        continue;
                    case 193 /* INSTANCEOF */:
                        index = code[pc++] << 8 | code[pc++];
                        classInfo = cp.resolveClass(index);
                        address = i32[--sp];
                        if (address === 0 /* NULL */) {
                            i32[sp++] = 0;
                        }
                        else {
                            otherClassInfo = J2ME.classIdToClassInfoMap[i32[address >> 2]];
                            i32[sp++] = J2ME.isAssignableTo(otherClassInfo, classInfo) ? 1 : 0;
                        }
                        continue;
                    case 191 /* ATHROW */:
                        address = i32[--sp];
                        if (address === 0 /* NULL */) {
                            thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                        }
                        throw J2ME.getHandle(address);
                    case 194 /* MONITORENTER */:
                        thread.ctx.monitorEnter(J2ME.getMonitor(i32[--sp]));
                        release || assert(U !== 1 /* Yielding */, "Monitors should never yield.");
                        if (U === 2 /* Pausing */ || U === 3 /* Stopping */) {
                            thread.set(fp, sp, pc); // We need to resume past the MONITORENTER bytecode.
                            return;
                        }
                        continue;
                    case 195 /* MONITOREXIT */:
                        thread.ctx.monitorExit(J2ME.getMonitor(i32[--sp]));
                        continue;
                    case 196 /* WIDE */:
                        var op = code[pc++];
                        switch (op) {
                            case 21 /* ILOAD */:
                            case 23 /* FLOAD */:
                                i32[sp++] = i32[lp + (code[pc++] << 8 | code[pc++])];
                                continue;
                            case 25 /* ALOAD */:
                                i32[sp++] = i32[lp + (code[pc++] << 8 | code[pc++])];
                                continue;
                            case 22 /* LLOAD */:
                            case 24 /* DLOAD */:
                                offset = lp + (code[pc++] << 8 | code[pc++]);
                                i32[sp++] = i32[offset];
                                i32[sp++] = i32[offset + 1];
                                continue;
                            case 54 /* ISTORE */:
                            case 56 /* FSTORE */:
                                i32[lp + (code[pc++] << 8 | code[pc++])] = i32[--sp];
                                continue;
                            case 58 /* ASTORE */:
                                i32[lp + (code[pc++] << 8 | code[pc++])] = i32[--sp];
                                continue;
                            case 55 /* LSTORE */:
                            case 57 /* DSTORE */:
                                offset = lp + (code[pc++] << 8 | code[pc++]);
                                i32[offset + 1] = i32[--sp];
                                i32[offset] = i32[--sp];
                                continue;
                            case 132 /* IINC */:
                                index = code[pc++] << 8 | code[pc++];
                                value = (code[pc++] << 8 | code[pc++]) << 16 >> 16;
                                i32[lp + index] = i32[lp + index] + value | 0;
                                continue;
                            //case Bytecodes.RET:
                            //  this.pc = this.local[this.read16()];
                            //  break;
                            default:
                                var opName = J2ME.Bytecode.getBytecodesName(op);
                                throw new Error("Wide opcode " + opName + " [" + op + "] not supported.");
                        }
                    case 188 /* NEWARRAY */:
                        type = code[pc++];
                        size = i32[--sp];
                        if (size < 0) {
                            thread.throwException(fp, sp, opPC, 2 /* NegativeArraySizeException */);
                        }
                        i32[sp++] = J2ME.newArray(J2ME.PrimitiveClassInfo["????ZCFDBSIJ"[type]], size);
                        continue;
                    case 173 /* LRETURN */:
                    case 175 /* DRETURN */:
                    case 172 /* IRETURN */:
                    case 174 /* FRETURN */:
                    case 176 /* ARETURN */:
                    case 177 /* RETURN */:
                        // Store the return values immediately since the values may be overwritten by a push pending frame.
                        var returnOne, returnTwo;
                        switch (op) {
                            case 173 /* LRETURN */:
                            case 175 /* DRETURN */:
                                returnTwo = i32[sp - 2];
                            // Fallthrough
                            case 172 /* IRETURN */:
                            case 174 /* FRETURN */:
                            case 176 /* ARETURN */:
                                returnOne = i32[sp - 1];
                                break;
                        }
                        var lastMI = mi;
                        if (lastMI.isSynchronized) {
                            $.ctx.monitorExit(J2ME.getMonitor(i32[fp + 3 /* MonitorOffset */]));
                        }
                        opPC = i32[fp + 0 /* CallerRAOffset */];
                        sp = fp - maxLocals | 0;
                        fp = i32[fp + 1 /* CallerFPOffset */];
                        release || assert(fp >= (thread.tp >> 2), "Valid frame pointer after return.");
                        mi = J2ME.methodIdToMethodInfoMap[i32[fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
                        type = i32[fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
                        release || assert(type === FrameType.Interpreter && mi || type !== FrameType.Interpreter && !mi, "Is valid frame type and method info after return.");
                        var interrupt = false;
                        while (type !== FrameType.Interpreter) {
                            if (type === FrameType.ExitInterpreter) {
                                thread.set(fp, sp, opPC);
                                switch (op) {
                                    case 176 /* ARETURN */:
                                    case 172 /* IRETURN */:
                                    case 174 /* FRETURN */:
                                        return returnOne;
                                    case 173 /* LRETURN */:
                                        return J2ME.returnLong(returnTwo, returnOne);
                                    case 175 /* DRETURN */:
                                        return J2ME.returnDouble(returnTwo, returnOne);
                                    case 177 /* RETURN */:
                                        return;
                                }
                            }
                            else if (type === FrameType.PushPendingFrames) {
                                thread.set(fp, sp, opPC);
                                thread.pushPendingNativeFrames();
                                fp = thread.fp | 0;
                                sp = thread.sp | 0;
                                opPC = pc = thread.pc;
                                type = i32[fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
                                mi = J2ME.methodIdToMethodInfoMap[i32[fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
                                continue;
                            }
                            else if (type === FrameType.Interrupt) {
                                thread.set(fp, sp, opPC);
                                thread.popMarkerFrame(FrameType.Interrupt);
                                fp = thread.fp | 0;
                                sp = thread.sp | 0;
                                opPC = pc = thread.pc;
                                type = i32[fp + 2 /* FrameTypeOffset */] & 4026531840 /* FrameTypeMask */;
                                mi = J2ME.methodIdToMethodInfoMap[i32[fp + 2 /* CalleeMethodInfoOffset */] & 268435455 /* CalleeMethodInfoMask */];
                                interrupt = true;
                                continue;
                            }
                            else {
                                assert(false, "Bad frame type: " + FrameType[type]);
                            }
                        }
                        release || assert(type === FrameType.Interpreter, "Cannot resume in frame type: " + FrameType[type]);
                        maxLocals = mi.codeAttribute.max_locals;
                        lp = fp - maxLocals | 0;
                        release || J2ME.traceWriter && J2ME.traceWriter.outdent();
                        release || J2ME.traceWriter && J2ME.traceWriter.writeLn("<< I " + lastMI.implKey);
                        ci = mi.classInfo;
                        cp = ci.constantPool;
                        code = mi.codeAttribute.code;
                        if (interrupt) {
                            continue;
                        }
                        release || assert(isInvoke(code[opPC]), "Return must come from invoke op: " + mi.implKey + " PC: " + pc + J2ME.Bytecode.getBytecodesName(op));
                        // Calculate the PC based on the size of the caller's invoke bytecode.
                        pc = opPC + (code[opPC] === 185 /* INVOKEINTERFACE */ ? 5 : 3);
                        // Push return value.
                        switch (op) {
                            case 173 /* LRETURN */:
                            case 175 /* DRETURN */:
                                i32[sp++] = returnTwo; // Low Bits
                            // Fallthrough
                            case 172 /* IRETURN */:
                            case 174 /* FRETURN */:
                            case 176 /* ARETURN */:
                                i32[sp++] = returnOne;
                                continue;
                        }
                        continue;
                    case 182 /* INVOKEVIRTUAL */:
                    case 183 /* INVOKESPECIAL */:
                    case 184 /* INVOKESTATIC */:
                    case 185 /* INVOKEINTERFACE */:
                        index = code[pc++] << 8 | code[pc++];
                        if (op === 185 /* INVOKEINTERFACE */) {
                            pc = pc + 2 | 0; // Args Number & Zero
                        }
                        isStatic = (op === 184 /* INVOKESTATIC */);
                        // Resolve method and do the class init check if necessary.
                        var calleeMethodInfo = cp.resolved[index] || cp.resolveMethod(index, isStatic);
                        var calleeTargetMethodInfo = null;
                        var callee = null;
                        if (isStatic) {
                            address = 0 /* NULL */;
                        }
                        else {
                            address = i32[sp - calleeMethodInfo.argumentSlots];
                            classInfo = (address !== 0 /* NULL */) ? J2ME.classIdToClassInfoMap[i32[address >> 2]] : null;
                        }
                        if (isStatic) {
                            thread.classInitAndUnwindCheck(fp, sp, opPC, calleeMethodInfo.classInfo);
                            if (U) {
                                return;
                            }
                        }
                        switch (op) {
                            case 183 /* INVOKESPECIAL */:
                                if (address === 0 /* NULL */) {
                                    thread.throwException(fp, sp, opPC, 3 /* NullPointerException */);
                                }
                            case 184 /* INVOKESTATIC */:
                                calleeTargetMethodInfo = calleeMethodInfo;
                                break;
                            case 182 /* INVOKEVIRTUAL */:
                                calleeTargetMethodInfo = classInfo.vTable[calleeMethodInfo.vTableIndex];
                                break;
                            case 185 /* INVOKEINTERFACE */:
                                calleeTargetMethodInfo = classInfo.iTable[calleeMethodInfo.mangledName];
                                break;
                            default:
                                release || J2ME.traceWriter && J2ME.traceWriter.writeLn("Not Implemented: " + J2ME.Bytecode.getBytecodesName(op));
                                assert(false, "Not Implemented: " + J2ME.Bytecode.getBytecodesName(op));
                        }
                        // Call Native or Compiled Method.
                        var callMethod = calleeTargetMethodInfo.isNative || calleeTargetMethodInfo.state === 1 /* Compiled */;
                        var calleeStats = calleeTargetMethodInfo.stats;
                        calleeStats.interpreterCallCount++;
                        if (callMethod === false) {
                            if (config.forceRuntimeCompilation || (calleeTargetMethodInfo.state === 0 /* Cold */ &&
                                calleeStats.interpreterCallCount + calleeStats.backwardsBranchCount > J2ME.ConfigThresholds.InvokeThreshold)) {
                                J2ME.compileAndLinkMethod(calleeTargetMethodInfo);
                                callMethod = calleeTargetMethodInfo.state === 1 /* Compiled */;
                            }
                        }
                        if (callMethod) {
                            var kind = 9 /* Void */;
                            var signatureKinds = calleeTargetMethodInfo.signatureKinds;
                            callee = calleeTargetMethodInfo.fn || J2ME.getLinkedMethod(calleeTargetMethodInfo);
                            var returnValue;
                            var frameTypeOffset = -1;
                            // Fast path for the no-argument case.
                            if (signatureKinds.length === 1) {
                                if (!isStatic) {
                                    --sp; // Pop Reference
                                }
                                thread.set(fp, sp, opPC);
                                thread.pushMarkerFrame(FrameType.Native);
                                frameTypeOffset = thread.fp + 2 /* FrameTypeOffset */;
                                returnValue = callee(address);
                            }
                            else {
                                args.length = 0;
                                for (var i = signatureKinds.length - 1; i > 0; i--) {
                                    kind = signatureKinds[i];
                                    switch (kind) {
                                        case 6 /* Long */:
                                        case 7 /* Double */:
                                            args.unshift(i32[--sp]); // High Bits
                                        // Fallthrough
                                        case 4 /* Int */:
                                        case 1 /* Byte */:
                                        case 3 /* Char */:
                                        case 5 /* Float */:
                                        case 2 /* Short */:
                                        case 0 /* Boolean */:
                                        case 8 /* Reference */:
                                            args.unshift(i32[--sp]);
                                            break;
                                        default:
                                            release || assert(false, "Invalid Kind: " + J2ME.getKindName(kind));
                                    }
                                }
                                if (!isStatic) {
                                    --sp; // Pop Reference
                                }
                                thread.set(fp, sp, opPC);
                                thread.pushMarkerFrame(FrameType.Native);
                                frameTypeOffset = thread.fp + 2 /* FrameTypeOffset */;
                                if (!release) {
                                }
                                args.unshift(address);
                                returnValue = callee.apply(null, args);
                            }
                            if (!release) {
                            }
                            if (U) {
                                J2ME.traceWriter && J2ME.traceWriter.writeLn("<< I Unwind: " + J2ME.getVMStateName(U));
                                release || assert(thread.unwoundNativeFrames.length, "Must have unwound frames.");
                                thread.nativeFrameCount--;
                                i32[frameTypeOffset] = FrameType.PushPendingFrames;
                                thread.unwoundNativeFrames.push(null);
                                return;
                            }
                            thread.popMarkerFrame(FrameType.Native);
                            kind = signatureKinds[0];
                            // Push return value.
                            switch (kind) {
                                case 6 /* Long */:
                                case 7 /* Double */:
                                    i32[sp++] = returnValue;
                                    i32[sp++] = tempReturn0;
                                    continue;
                                case 4 /* Int */:
                                case 1 /* Byte */:
                                case 3 /* Char */:
                                case 5 /* Float */:
                                case 2 /* Short */:
                                case 0 /* Boolean */:
                                    i32[sp++] = returnValue;
                                    continue;
                                case 8 /* Reference */:
                                    release || assert(returnValue !== "number", "native return value is a number");
                                    i32[sp++] = returnValue;
                                    continue;
                                case 9 /* Void */:
                                    continue;
                                default:
                                    release || assert(false, "Invalid Kind: " + J2ME.getKindName(kind));
                            }
                            continue;
                        }
                        // Call Interpreted Method.
                        release || J2ME.traceWriter && J2ME.traceWriter.writeLn(">> I " + calleeTargetMethodInfo.implKey);
                        mi = calleeTargetMethodInfo;
                        maxLocals = mi.codeAttribute.max_locals;
                        ci = mi.classInfo;
                        cp = ci.constantPool;
                        var callerFPOffset = fp;
                        // Reserve space for non-parameter locals.
                        lp = sp - mi.argumentSlots | 0;
                        fp = lp + maxLocals | 0;
                        sp = fp + 4 /* CallerSaveSize */ | 0;
                        // Caller saved values.
                        i32[fp + 0 /* CallerRAOffset */] = opPC;
                        i32[fp + 1 /* CallerFPOffset */] = callerFPOffset;
                        i32[fp + 2 /* CalleeMethodInfoOffset */] = FrameType.Interpreter | mi.id;
                        i32[fp + 3 /* MonitorOffset */] = 0 /* NULL */; // Monitor
                        // Reset PC.
                        opPC = pc = 0;
                        lastPC = 0;
                        if (calleeTargetMethodInfo.isSynchronized) {
                            monitorAddr = calleeTargetMethodInfo.isStatic
                                ? $.getClassObjectAddress(calleeTargetMethodInfo.classInfo)
                                : address;
                            i32[fp + 3 /* MonitorOffset */] = monitorAddr;
                            $.ctx.monitorEnter(J2ME.getMonitor(monitorAddr));
                            release || assert(U !== 1 /* Yielding */, "Monitors should never yield.");
                            if (U === 2 /* Pausing */ || U === 3 /* Stopping */) {
                                thread.set(fp, sp, opPC);
                                return;
                            }
                        }
                        code = mi.codeAttribute.code;
                        release || J2ME.traceWriter && J2ME.traceWriter.indent();
                        continue;
                    default:
                        release || J2ME.traceWriter && J2ME.traceWriter.writeLn("Not Implemented: " + J2ME.Bytecode.getBytecodesName(op) + ", PC: " + opPC + ", CODE: " + code.length);
                        release || assert(false, "Not Implemented: " + J2ME.Bytecode.getBytecodesName(op));
                        continue;
                }
            }
            catch (e) {
                release || J2ME.traceWriter && J2ME.traceWriter.redLn("XXX I Caught: " + e + ", details: " + toName(e));
                release || J2ME.traceWriter && J2ME.traceWriter.writeLn(e.stack);
                // release || traceWriter && traceWriter.writeLn(jsGlobal.getBacktrace());
                // If an exception is thrown from a native there will be a native marker frame at the top of the stack
                // which will be cut off when the the fp is set on the thread below. To keep the nativeFrameCount in
                // sync the native marker must be popped.
                if (thread.fp > fp && thread.frame.type === FrameType.Native) {
                    release || assert(i32[thread.fp + 1 /* CallerFPOffset */] === fp, "Only one extra frame is on the stack. " + (thread.fp - fp));
                    thread.popMarkerFrame(FrameType.Native);
                }
                thread.set(fp, sp, opPC);
                e = J2ME.translateException(e);
                if (!e.classInfo) {
                    // A non-java exception was thrown. Rethrow so it is not handled by exceptionUnwind.
                    throw e;
                }
                thread.exceptionUnwind(e);
                // Load thread state after exception unwind.
                fp = thread.fp | 0;
                sp = thread.sp | 0;
                pc = thread.pc | 0;
                mi = thread.frame.methodInfo;
                maxLocals = mi.codeAttribute.max_locals;
                lp = fp - maxLocals | 0;
                ci = mi.classInfo;
                cp = ci.constantPool;
                code = mi.codeAttribute.code;
                continue;
            }
        }
    }
    J2ME.interpret = interpret;
})(J2ME || (J2ME = {}));
/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/
var $; // The currently-executing runtime.
var tempReturn0 = 0;
var J2ME;
(function (J2ME) {
    function returnLong(l, h) {
        tempReturn0 = h;
        return l;
    }
    J2ME.returnLong = returnLong;
    function returnDouble(l, h) {
        tempReturn0 = h;
        return l;
    }
    J2ME.returnDouble = returnDouble;
    function returnDoubleValue(v) {
        aliasedF64[0] = v;
        return returnDouble(aliasedI32[0], aliasedI32[1]);
    }
    J2ME.returnDoubleValue = returnDoubleValue;
    J2ME.aotMetaData = Object.create(null);
    /**
     * Turns on just-in-time compilation of methods.
     */
    J2ME.enableRuntimeCompilation = true;
    /**
     * Turns on onStackReplacement
     */
    J2ME.enableOnStackReplacement = true;
    /**
     * Turns on caching of JIT-compiled methods.
     */
    J2ME.enableCompiledMethodCache = true && typeof CompiledMethodCache !== "undefined";
    /**
     * Traces method execution.
     */
    J2ME.traceWriter = null;
    /**
     * Traces bytecode execution.
     */
    J2ME.traceStackWriter = null;
    /**
     * Traces performance problems.
     */
    J2ME.perfWriter = null;
    /**
     * Traces linking and class loading.
     */
    J2ME.linkWriter = null;
    /**
     * Traces JIT compilation.
     */
    J2ME.jitWriter = null;
    /**
     * Traces class loading.
     */
    J2ME.loadWriter = null;
    /**
     * Traces winding and unwinding.
     */
    J2ME.windingWriter = null;
    /**
     * Traces class initialization.
     */
    J2ME.initWriter = null;
    /**
     * Traces thread execution.
     */
    J2ME.threadWriter = null;
    /**
     * Traces generated code.
     */
    J2ME.codeWriter = null;
    (function (MethodState) {
        /**
         * All methods start in this state.
         */
        MethodState[MethodState["Cold"] = 0] = "Cold";
        /**
         * Methods have this state if code has been compiled for them or
         * there is a native implementation that needs to be used.
         */
        MethodState[MethodState["Compiled"] = 1] = "Compiled";
        /**
         * We don't want to compiled these methods, they may be too large
         * to benefit from JIT compilation.
         */
        MethodState[MethodState["NotCompiled"] = 2] = "NotCompiled";
        /**
         * Methods are not compiled because of some exception.
         */
        MethodState[MethodState["CannotCompile"] = 3] = "CannotCompile";
    })(J2ME.MethodState || (J2ME.MethodState = {}));
    var MethodState = J2ME.MethodState;
    J2ME.timeline;
    J2ME.threadTimeline;
    J2ME.methodTimelines = [];
    J2ME.gcCounter = release ? null : new J2ME.Metrics.Counter(true);
    J2ME.nativeCounter = release ? null : new J2ME.Metrics.Counter(true);
    J2ME.runtimeCounter = release ? null : new J2ME.Metrics.Counter(true);
    J2ME.baselineMethodCounter = release ? null : new J2ME.Metrics.Counter(true);
    J2ME.asyncCounter = release ? null : new J2ME.Metrics.Counter(true);
    J2ME.unwindCount = 0;
    if (typeof Shumway !== "undefined") {
        J2ME.timeline = new Shumway.Tools.Profiler.TimelineBuffer("Runtime");
        J2ME.threadTimeline = new Shumway.Tools.Profiler.TimelineBuffer("Threads");
    }
    function enterTimeline(name, data) {
        J2ME.timeline && J2ME.timeline.enter(name, data);
    }
    J2ME.enterTimeline = enterTimeline;
    function leaveTimeline(name, data) {
        J2ME.timeline && J2ME.timeline.leave(name, data);
    }
    J2ME.leaveTimeline = leaveTimeline;
    function Int64Array(buffer, offset, length) {
        this.length = length;
        this.byteOffset = offset;
        this.buffer = buffer;
    }
    /**
     * We can't always mutate the |__proto__|.
     */
    function isPrototypeOfFunctionMutable(fn) {
        // We don't list all builtins here, since not all of them are used in the object
        // hierarchy.
        switch (fn) {
            case Object:
            case Array:
            case Uint8Array:
            case Uint16Array:
            case Float32Array:
            case Float64Array:
            case Int8Array:
            case Int16Array:
            case Int32Array:
            case Int64Array:
                return false;
            default:
                return true;
        }
    }
    J2ME.stdoutWriter = new J2ME.IndentingWriter();
    J2ME.stderrWriter = new J2ME.IndentingWriter(false, J2ME.IndentingWriter.stderr);
    (function (ExecutionPhase) {
        /**
         * Default runtime behaviour.
         */
        ExecutionPhase[ExecutionPhase["Runtime"] = 0] = "Runtime";
        /**
         * When compiling code statically.
         */
        ExecutionPhase[ExecutionPhase["Compiler"] = 1] = "Compiler";
    })(J2ME.ExecutionPhase || (J2ME.ExecutionPhase = {}));
    var ExecutionPhase = J2ME.ExecutionPhase;
    J2ME.phase = 0 /* Runtime */;
    // Initial capacity of the interned strings is the capacity of a large midlet after startup.
    J2ME.internedStrings = new J2ME.TypedArrayHashtable(767);
    var assert = J2ME.Debug.assert;
    (function (RuntimeStatus) {
        RuntimeStatus[RuntimeStatus["New"] = 1] = "New";
        RuntimeStatus[RuntimeStatus["Started"] = 2] = "Started";
        RuntimeStatus[RuntimeStatus["Stopping"] = 3] = "Stopping";
        RuntimeStatus[RuntimeStatus["Stopped"] = 4] = "Stopped";
    })(J2ME.RuntimeStatus || (J2ME.RuntimeStatus = {}));
    var RuntimeStatus = J2ME.RuntimeStatus;
    (function (MethodType) {
        MethodType[MethodType["Interpreted"] = 0] = "Interpreted";
        MethodType[MethodType["Native"] = 1] = "Native";
        MethodType[MethodType["Compiled"] = 2] = "Compiled";
    })(J2ME.MethodType || (J2ME.MethodType = {}));
    var MethodType = J2ME.MethodType;
    function getMethodTypeName(methodType) {
        return J2ME.MethodType[methodType];
    }
    J2ME.getMethodTypeName = getMethodTypeName;
    var hashMap = Object.create(null);
    var hashArray = new Int32Array(1024);
    function hashString(s) {
        if (hashArray.length < s.length) {
            hashArray = new Int32Array((hashArray.length * 2 / 3) | 0);
        }
        var data = hashArray;
        for (var i = 0; i < s.length; i++) {
            data[i] = s.charCodeAt(i);
        }
        var hash = J2ME.HashUtilities.hashBytesTo32BitsMurmur(data, 0, s.length);
        if (!release) {
            if (hashMap[hash] && hashMap[hash] !== s) {
                assert(false, "Collision detected!!!");
            }
            hashMap[hash] = s;
        }
        return hash;
    }
    function hashUTF8String(s) {
        var hash = J2ME.HashUtilities.hashBytesTo32BitsMurmur(s, 0, s.length);
        if (!release) {
            if (hashMap[hash] && hashMap[hash] !== s) {
                assert(false, "Collision detected in hashUTF8String!!!");
            }
            hashMap[hash] = s;
        }
        return hash;
    }
    J2ME.hashUTF8String = hashUTF8String;
    function isIdentifierChar(c) {
        return (c >= 97 && c <= 122) ||
            (c >= 65 && c <= 90) ||
            (c === 36) || (c === 95); // $ && _
    }
    function isDigit(c) {
        return c >= 48 && c <= 57;
    }
    function needsEscaping(s) {
        var l = s.length;
        for (var i = 0; i < l; i++) {
            var c = s.charCodeAt(i);
            if (!isIdentifierChar(c)) {
                return true;
            }
        }
        return false;
    }
    // Fast lookup table.
    var map = new Array(128);
    for (var i = 0; i < 128; i++) {
        map[i] = String.fromCharCode(i);
    }
    // Patch up some entries.
    var invalidChars = "[];/<>()";
    var replaceChars = "abc_defg";
    for (var i = 0; i < invalidChars.length; i++) {
        map[invalidChars.charCodeAt(i)] = replaceChars[i];
    }
    // Reuse array.
    var T = new Array(1024);
    function escapeString(s) {
        if (!needsEscaping(s)) {
            return s;
        }
        var l = s.length;
        var r = T;
        r.length = l;
        for (var i = 0; i < l; i++) {
            var c = s.charCodeAt(i);
            if (i === 0 && isDigit(c)) {
                r[i] = String.fromCharCode(c - 48 + 97); // Map 0 .. 9 to a .. j
            }
            else if (c < 128) {
                r[i] = map[c];
            }
            else {
                r[i] = s[i];
            }
        }
        return r.join("");
    }
    J2ME.escapeString = escapeString;
    var stringHashes = Object.create(null);
    var stringHashCount = 0;
    function hashStringStrong(s) {
        // Hash with Murmur hash.
        var result = J2ME.StringUtilities.variableLengthEncodeInt32(hashString(s));
        // Also use the length for some more precision.
        result += J2ME.StringUtilities.toEncoding(s.length & 0x3f);
        return result;
    }
    function hashStringToString(s) {
        if (stringHashCount > 1024) {
            return hashStringStrong(s);
        }
        var c = stringHashes[s];
        if (c) {
            return c;
        }
        c = stringHashes[s] = hashStringStrong(s);
        stringHashCount++;
        return c;
    }
    J2ME.hashStringToString = hashStringToString;
    /**
     * This class is abstract and should never be initialized. It only acts as a template for
     * actual runtime objects.
     */
    var RuntimeTemplate = (function () {
        function RuntimeTemplate(jvm) {
            this.priority = J2ME.ISOLATE_NORM_PRIORITY;
            this.jvm = jvm;
            this.status = 1 /* New */;
            this.waiting = [];
            this.threadCount = 0;
            this.I = this.initialized = new Int8Array(4095 /* MAX_CLASS_ID */);
            this.SA = this.staticObjectAddresses = new Int32Array(511 /* INITIAL_MAX_CLASS_ID */ + 1);
            this.CO = this.classObjectAddresses = new Int32Array(511 /* INITIAL_MAX_CLASS_ID */ + 1);
            this.ctx = null;
            this.allCtxs = new Set();
            this._runtimeId = RuntimeTemplate._nextRuntimeId++;
            this._nextHashCode = (this._runtimeId << 24) | 1; // Increase by one so the first hashcode isn't zero.
        }
        RuntimeTemplate.prototype.preInitializeClasses = function (ctx) {
            var prevCtx = $ ? $.ctx : null;
            var preInit = J2ME.CLASSES.preInitializedClasses;
            ctx.setAsCurrentContext();
            for (var i = 0; i < preInit.length; i++) {
                J2ME.preemptionLockLevel++;
                var classInfo = preInit[i];
                classInitCheck(classInfo);
                release || J2ME.Debug.assert(!U, "Unexpected unwind during preInitializeClasses.");
                J2ME.preemptionLockLevel--;
            }
            ctx.clearCurrentContext();
            if (prevCtx) {
                prevCtx.setAsCurrentContext();
            }
        };
        /**
         * After class initialization is finished the init9 method will invoke this so
         * any further initialize calls can be avoided. This isn't set on the first call
         * to a class initializer because there can be multiple calls into initialize from
         * different threads that need trigger the Class.initialize() code so they block.
         */
        RuntimeTemplate.prototype.setClassInitialized = function (classId) {
            this.initialized[classId] = 1;
        };
        RuntimeTemplate.prototype.getClassObjectAddress = function (classInfo) {
            var id = classInfo.id;
            if (!this.classObjectAddresses[classInfo.id]) {
                var addr = allocUncollectableObject(J2ME.CLASSES.java_lang_Class);
                var handle = getHandle(addr);
                handle.vmClass = id;
                // Ensure that maps are large enough.
                this.SA = this.staticObjectAddresses = J2ME.ArrayUtilities.ensureInt32ArrayLength(this.staticObjectAddresses, id + 1);
                this.CO = this.classObjectAddresses = J2ME.ArrayUtilities.ensureInt32ArrayLength(this.classObjectAddresses, id + 1);
                this.classObjectAddresses[id] = addr;
                this.staticObjectAddresses[id] = gcMallocUncollectable(8 /* OBJ_HDR_SIZE */ + classInfo.sizeOfStaticFields);
                J2ME.linkWriter && J2ME.linkWriter.writeLn("Initializing Class Object For: " + classInfo.getClassNameSlow());
                if (classInfo === J2ME.CLASSES.java_lang_Object ||
                    classInfo === J2ME.CLASSES.java_lang_Class ||
                    classInfo === J2ME.CLASSES.java_lang_String ||
                    classInfo === J2ME.CLASSES.java_lang_Thread) {
                    handle.status = 4;
                    this.setClassInitialized(id);
                }
            }
            return this.classObjectAddresses[id];
        };
        /**
         * Generates a new hash code for the specified |object|.
         */
        RuntimeTemplate.prototype.nextHashCode = function () {
            return this._nextHashCode++;
        };
        RuntimeTemplate.prototype.waitStatus = function (callback) {
            this.waiting.push(callback);
        };
        RuntimeTemplate.prototype.updateStatus = function (status) {
            this.status = status;
            var waiting = this.waiting;
            this.waiting = [];
            waiting.forEach(function (callback) {
                try {
                    callback();
                }
                catch (ex) {
                }
            });
        };
        RuntimeTemplate.prototype.addContext = function (ctx) {
            ++this.threadCount;
            RuntimeTemplate.all.add(this);
            this.allCtxs.add(ctx);
        };
        RuntimeTemplate.prototype.removeContext = function (ctx) {
            if (!--this.threadCount) {
                RuntimeTemplate.all.delete(this);
                this.updateStatus(4 /* Stopped */);
            }
            this.allCtxs.delete(ctx);
        };
        RuntimeTemplate.prototype.newStringConstant = function (utf16ArrayAddr) {
            var utf16Array = getArrayFromAddr(utf16ArrayAddr);
            var javaStringAddr = J2ME.internedStrings.get(utf16Array);
            if (javaStringAddr !== null) {
                return javaStringAddr;
            }
            setUncollectable(utf16ArrayAddr);
            // It's ok to create and intern an object here, because we only return it
            // to ConstantPool.resolve, which itself is only called by a few callers,
            // which should be able to convert it into an address if needed.  But we
            // should confirm that all callers of ConstantPool.resolve really do that.
            javaStringAddr = allocUncollectableObject(J2ME.CLASSES.java_lang_String);
            var javaString = getHandle(javaStringAddr);
            javaString.value = utf16ArrayAddr;
            javaString.offset = 0;
            javaString.count = utf16Array.length;
            J2ME.internedStrings.put(utf16Array, javaStringAddr);
            unsetUncollectable(utf16ArrayAddr);
            return javaStringAddr;
        };
        RuntimeTemplate.prototype.newIOException = function (str) {
            return $.ctx.createException("java/io/IOException", str);
        };
        RuntimeTemplate.prototype.newUnsupportedEncodingException = function (str) {
            return $.ctx.createException("java/io/UnsupportedEncodingException", str);
        };
        RuntimeTemplate.prototype.newUTFDataFormatException = function (str) {
            return $.ctx.createException("java/io/UTFDataFormatException", str);
        };
        RuntimeTemplate.prototype.newSecurityException = function (str) {
            return $.ctx.createException("java/lang/SecurityException", str);
        };
        RuntimeTemplate.prototype.newIllegalThreadStateException = function (str) {
            return $.ctx.createException("java/lang/IllegalThreadStateException", str);
        };
        RuntimeTemplate.prototype.newRuntimeException = function (str) {
            return $.ctx.createException("java/lang/RuntimeException", str);
        };
        RuntimeTemplate.prototype.newIndexOutOfBoundsException = function (str) {
            return $.ctx.createException("java/lang/IndexOutOfBoundsException", str);
        };
        RuntimeTemplate.prototype.newArrayIndexOutOfBoundsException = function (str) {
            return $.ctx.createException("java/lang/ArrayIndexOutOfBoundsException", str);
        };
        RuntimeTemplate.prototype.newStringIndexOutOfBoundsException = function (str) {
            return $.ctx.createException("java/lang/StringIndexOutOfBoundsException", str);
        };
        RuntimeTemplate.prototype.newArrayStoreException = function (str) {
            return $.ctx.createException("java/lang/ArrayStoreException", str);
        };
        RuntimeTemplate.prototype.newIllegalMonitorStateException = function (str) {
            return $.ctx.createException("java/lang/IllegalMonitorStateException", str);
        };
        RuntimeTemplate.prototype.newClassCastException = function (str) {
            return $.ctx.createException("java/lang/ClassCastException", str);
        };
        RuntimeTemplate.prototype.newArithmeticException = function (str) {
            return $.ctx.createException("java/lang/ArithmeticException", str);
        };
        RuntimeTemplate.prototype.newClassNotFoundException = function (str) {
            return $.ctx.createException("java/lang/ClassNotFoundException", str);
        };
        RuntimeTemplate.prototype.newIllegalArgumentException = function (str) {
            return $.ctx.createException("java/lang/IllegalArgumentException", str);
        };
        RuntimeTemplate.prototype.newIllegalStateException = function (str) {
            return $.ctx.createException("java/lang/IllegalStateException", str);
        };
        RuntimeTemplate.prototype.newNegativeArraySizeException = function (str) {
            return $.ctx.createException("java/lang/NegativeArraySizeException", str);
        };
        RuntimeTemplate.prototype.newNullPointerException = function (str) {
            return $.ctx.createException("java/lang/NullPointerException", str);
        };
        RuntimeTemplate.prototype.newMediaException = function (str) {
            return $.ctx.createException("javax/microedition/media/MediaException", str);
        };
        RuntimeTemplate.prototype.newInstantiationException = function (str) {
            return $.ctx.createException("java/lang/InstantiationException", str);
        };
        RuntimeTemplate.prototype.newException = function (str) {
            return $.ctx.createException("java/lang/Exception", str);
        };
        RuntimeTemplate.classInfoComplete = function (classInfo) {
            if (J2ME.phase !== 0 /* Runtime */) {
                return;
            }
            if (!classInfo.isInterface) {
                // Pre-allocate linkedVTableMap.
                ensureDenseObjectMapLength(J2ME.linkedVTableMap, classInfo.id + 1);
                ensureDenseObjectMapLength(J2ME.flatLinkedVTableMap, (classInfo.id + 1) << 6 /* LOG_MAX_FLAT_VTABLE_SIZE */);
                J2ME.linkedVTableMap[classInfo.id] = J2ME.ArrayUtilities.makeDenseArray(classInfo.vTable.length, null);
            }
        };
        RuntimeTemplate.all = new Set();
        RuntimeTemplate._nextRuntimeId = 0;
        return RuntimeTemplate;
    })();
    J2ME.RuntimeTemplate = RuntimeTemplate;
    (function (VMState) {
        VMState[VMState["Running"] = 0] = "Running";
        VMState[VMState["Yielding"] = 1] = "Yielding";
        VMState[VMState["Pausing"] = 2] = "Pausing";
        VMState[VMState["Stopping"] = 3] = "Stopping";
    })(J2ME.VMState || (J2ME.VMState = {}));
    var VMState = J2ME.VMState;
    function getVMStateName(vmState) {
        return J2ME.VMState[vmState];
    }
    J2ME.getVMStateName = getVMStateName;
    (function (Constants) {
        Constants[Constants["BYTE_MIN"] = -128] = "BYTE_MIN";
        Constants[Constants["BYTE_MAX"] = 127] = "BYTE_MAX";
        Constants[Constants["SHORT_MIN"] = -32768] = "SHORT_MIN";
        Constants[Constants["SHORT_MAX"] = 32767] = "SHORT_MAX";
        Constants[Constants["CHAR_MIN"] = 0] = "CHAR_MIN";
        Constants[Constants["CHAR_MAX"] = 65535] = "CHAR_MAX";
        Constants[Constants["INT_MIN"] = -2147483648] = "INT_MIN";
        Constants[Constants["INT_MAX"] = 2147483647] = "INT_MAX";
        Constants[Constants["LONG_MAX_LOW"] = 4294967295] = "LONG_MAX_LOW";
        Constants[Constants["LONG_MAX_HIGH"] = 2147483647] = "LONG_MAX_HIGH";
        Constants[Constants["LONG_MIN_LOW"] = 0] = "LONG_MIN_LOW";
        Constants[Constants["LONG_MIN_HIGH"] = 2147483648] = "LONG_MIN_HIGH";
        Constants[Constants["MAX_STACK_SIZE"] = 4096] = "MAX_STACK_SIZE";
        Constants[Constants["TWO_PWR_32_DBL"] = 4294967296] = "TWO_PWR_32_DBL";
        Constants[Constants["TWO_PWR_63_DBL"] = 9223372036854776000] = "TWO_PWR_63_DBL";
        // The size in bytes of the header in the memory allocated to the object.
        Constants[Constants["OBJ_HDR_SIZE"] = 8] = "OBJ_HDR_SIZE";
        // The offset in bytes from the beginning of the allocated memory
        // to the location of the class id.
        Constants[Constants["OBJ_CLASS_ID_OFFSET"] = 0] = "OBJ_CLASS_ID_OFFSET";
        // The offset in bytes from the beginning of the allocated memory
        // to the location of the hash code.
        Constants[Constants["HASH_CODE_OFFSET"] = 4] = "HASH_CODE_OFFSET";
        Constants[Constants["ARRAY_HDR_SIZE"] = 8] = "ARRAY_HDR_SIZE";
        Constants[Constants["ARRAY_LENGTH_OFFSET"] = 4] = "ARRAY_LENGTH_OFFSET";
        Constants[Constants["NULL"] = 0] = "NULL";
        Constants[Constants["MAX_METHOD_ID"] = 16383] = "MAX_METHOD_ID";
        Constants[Constants["INITIAL_MAX_METHOD_ID"] = 511] = "INITIAL_MAX_METHOD_ID";
        Constants[Constants["MAX_CLASS_ID"] = 4095] = "MAX_CLASS_ID";
        Constants[Constants["INITIAL_MAX_CLASS_ID"] = 511] = "INITIAL_MAX_CLASS_ID";
        Constants[Constants["LOG_MAX_FLAT_VTABLE_SIZE"] = 6] = "LOG_MAX_FLAT_VTABLE_SIZE"; // 64
    })(J2ME.Constants || (J2ME.Constants = {}));
    var Constants = J2ME.Constants;
    var Runtime = (function (_super) {
        __extends(Runtime, _super);
        function Runtime(jvm) {
            _super.call(this, jvm);
            this.id = Runtime._nextId++;
        }
        /**
         * Bailout callback whenever a JIT frame is unwound.
         */
        Runtime.prototype.B = function (methodId, pc, lockObjectAddress) {
            var methodInfo = J2ME.methodIdToMethodInfoMap[methodId];
            var localCount = methodInfo.codeAttribute.max_locals;
            var argumentCount = 3;
            // Figure out the |stackCount| from the number of arguments.
            var stackCount = arguments.length - argumentCount - localCount;
            // TODO: use specialized $.B functions based on the local and stack size so we don't have to use the arguments variable.
            var bailoutFrameAddress = createBailoutFrame(methodId, pc, localCount, stackCount, lockObjectAddress);
            for (var j = 0; j < localCount; j++) {
                i32[(bailoutFrameAddress + 20 /* HeaderSize */ >> 2) + j] = arguments[argumentCount + j];
            }
            for (var j = 0; j < stackCount; j++) {
                i32[(bailoutFrameAddress + 20 /* HeaderSize */ >> 2) + j + localCount] = arguments[argumentCount + localCount + j];
            }
            this.ctx.bailout(bailoutFrameAddress);
        };
        Runtime.prototype.yield = function (reason) {
            J2ME.unwindCount++;
            J2ME.threadWriter && J2ME.threadWriter.writeLn("yielding " + reason);
            J2ME.runtimeCounter && J2ME.runtimeCounter.count("yielding " + reason);
            U = 1 /* Yielding */;
            profile && $.ctx.pauseMethodTimeline();
            this.ctx.nativeThread.beginUnwind();
        };
        Runtime.prototype.nativeBailout = function (returnKind, opCode) {
            var pc = returnKind === 9 /* Void */ ? 0 : 1;
            var methodInfo = J2ME.CLASSES.getUnwindMethodInfo(returnKind, opCode);
            var bailoutFrameAddress = createBailoutFrame(methodInfo.id, pc, 0, 0, 0 /* NULL */);
            this.ctx.bailout(bailoutFrameAddress);
        };
        Runtime.prototype.pause = function (reason) {
            J2ME.unwindCount++;
            J2ME.threadWriter && J2ME.threadWriter.writeLn("pausing " + reason);
            J2ME.runtimeCounter && J2ME.runtimeCounter.count("pausing " + reason);
            U = 2 /* Pausing */;
            profile && $.ctx.pauseMethodTimeline();
            this.ctx.nativeThread.beginUnwind();
        };
        Runtime.prototype.stop = function () {
            U = 3 /* Stopping */;
        };
        Runtime._nextId = 0;
        return Runtime;
    })(RuntimeTemplate);
    J2ME.Runtime = Runtime;
    J2ME.classIdToClassInfoMap = [];
    J2ME.methodIdToMethodInfoMap = [];
    J2ME.linkedMethods = [];
    function ensureDenseObjectMapLength(array, length) {
        while (array.length < length) {
            array.push(null);
        }
        release || J2ME.Debug.assertNonDictionaryModeObject(array);
    }
    function registerClassId(classId, classInfo) {
        release || assert(J2ME.phase === 1 /* Compiler */ || classId <= 4095 /* MAX_CLASS_ID */, "Maximum class id was exceeded, " + classId);
        ensureDenseObjectMapLength(J2ME.classIdToClassInfoMap, classId + 1);
        J2ME.classIdToClassInfoMap[classId] = classInfo;
    }
    J2ME.registerClassId = registerClassId;
    function registerMethodId(methodId, methodInfo) {
        release || assert(J2ME.phase === 1 /* Compiler */ || methodId <= 16383 /* MAX_METHOD_ID */, "Maximum method id was exceeded, " + methodId);
        ensureDenseObjectMapLength(J2ME.methodIdToMethodInfoMap, methodId + 1);
        ensureDenseObjectMapLength(J2ME.linkedMethods, methodId + 1);
        J2ME.methodIdToMethodInfoMap[methodId] = methodInfo;
    }
    J2ME.registerMethodId = registerMethodId;
    /**
     * Maps classIds to vTables containing JS functions.
     */
    J2ME.linkedVTableMap = [];
    /**
     * Flat map of classId and vTableIndex to JS functions. This allows the compiler to
     * emit a single memory load to lookup a vTable entry
     *  flatLinkedVTableMap[classId << LOG_MAX_FLAT_VTABLE_SIZE + vTableIndex]
     * instead of the slower more general
     *  linkedVTableMap[classId][vTableIndex]
     */
    J2ME.flatLinkedVTableMap = [];
    function getClassInfo(addr) {
        release || assert(addr !== 0 /* NULL */, "addr !== Constants.NULL");
        release || assert(i32[addr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2] != 0, "i32[addr + Constants.OBJ_CLASS_ID_OFFSET >> 2] != 0");
        return J2ME.classIdToClassInfoMap[i32[addr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]];
    }
    J2ME.getClassInfo = getClassInfo;
    /**
     * A map from addresses to monitors, which are JS objects that we use to track
     * the lock state of Java objects.
     *
     * In most cases, we create the JS objects via Object.create(null), but we use
     * java.lang.Class objects for classes, since those continue to be represented
     * by JS objects in the runtime.  We also overload this map to retrieve those
     * class objects for other purposes.
     *
     * XXX Consider storing lock state in the ASM heap.
     */
    J2ME.monitorMap = Object.create(null);
    // XXX Figure out correct return type(s).
    function getMonitor(ref) {
        release || assert(typeof ref === "number", "monitor reference is a number");
        var hash = i32[ref + 4 /* HASH_CODE_OFFSET */ >> 2];
        if (hash === 0 /* NULL */) {
            hash = i32[ref + 4 /* HASH_CODE_OFFSET */ >> 2] = $.nextHashCode();
        }
        return J2ME.monitorMap[hash] || (J2ME.monitorMap[hash] = new Lock(0 /* NULL */, 0));
    }
    J2ME.getMonitor = getMonitor;
    var Lock = (function () {
        function Lock(threadAddress, level) {
            this.threadAddress = threadAddress;
            this.level = level;
            this.ready = [];
            this.waiting = [];
        }
        return Lock;
    })();
    J2ME.Lock = Lock;
    function findNativeMethodBinding(methodInfo) {
        var classBindings = J2ME.BindingsMap.get(methodInfo.classInfo.utf8Name);
        if (classBindings && classBindings.native) {
            var method = classBindings.native[methodInfo.name + "." + methodInfo.signature];
            if (method) {
                return method;
            }
        }
        return null;
    }
    function reportError(method, key) {
        return function () {
            try {
                return method.apply(this, arguments);
            }
            catch (e) {
                // Filter JAVA exception and only report the native js exception, which
                // cannnot be handled properly by the JAVA code.
                if (!e.classInfo) {
                    J2ME.stderrWriter.errorLn("Native " + key + " throws: " + e);
                }
                throw e;
            }
        };
    }
    function findNativeMethodImplementation(methodInfo) {
        // Look in bindings first.
        var binding = findNativeMethodBinding(methodInfo);
        if (binding) {
            return release ? binding : reportError(binding, methodInfo.implKey);
        }
        if (methodInfo.isNative) {
            var implKey = methodInfo.implKey;
            if (implKey in Native) {
                return release ? Native[implKey] : reportError(Native[implKey], implKey);
            }
            else {
                // Some Native MethodInfos are constructed but never called;
                // that's fine, unless we actually try to call them.
                return function missingImplementation() {
                    J2ME.stderrWriter.errorLn("implKey " + implKey + " is native but does not have an implementation.");
                };
            }
        }
        return null;
    }
    var frameView = new J2ME.FrameView();
    function findCompiledMethod(methodInfo) {
        return;
        // Use aotMetaData to find AOT methods instead of jsGlobal because runtime compiled methods may
        // be on the jsGlobal.
        //var mangledClassAndMethodName = methodInfo.mangledClassAndMethodName;
        //if (aotMetaData[mangledClassAndMethodName]) {
        //  aotMethodCount++;
        //  methodInfo.onStackReplacementEntryPoints = aotMetaData[methodInfo.mangledClassAndMethodName].osr;
        //  release || assert(jsGlobal[mangledClassAndMethodName], "function must be present when aotMetaData exists");
        //  return jsGlobal[mangledClassAndMethodName];
        //}
        //if (enableCompiledMethodCache) {
        //  var cachedMethod;
        //  if ((cachedMethod = CompiledMethodCache.get(methodInfo.implKey))) {
        //    cachedMethodCount ++;
        //    linkMethod(methodInfo, cachedMethod.source, cachedMethod.referencedClasses, cachedMethod.onStackReplacementEntryPoints);
        //  }
        //}
        //
        //return jsGlobal[mangledClassAndMethodName];
    }
    /**
     * Creates convenience getters / setters on Java objects.
     */
    function linkHandleFields(handleConstructor, classInfo) {
        // Get all the parent classes so their fields are linked first.
        var classes = [classInfo];
        var superClass = classInfo.superClass;
        while (superClass) {
            classes.unshift(superClass);
            superClass = superClass.superClass;
        }
        for (var i = 0; i < classes.length; i++) {
            var classInfo = classes[i];
            var classBindings = J2ME.BindingsMap.get(classInfo.utf8Name);
            if (classBindings && classBindings.fields) {
                release || assert(!classBindings.fields.staticSymbols, "Static fields are not supported yet");
                var instanceSymbols = classBindings.fields.instanceSymbols;
                for (var fieldName in instanceSymbols) {
                    var fieldSignature = instanceSymbols[fieldName];
                    var field = classInfo.getFieldByName(J2ME.toUTF8(fieldName), J2ME.toUTF8(fieldSignature), false);
                    release || assert(!field.isStatic, "Static field was defined as instance in BindingsMap");
                    var object = field.isStatic ? handleConstructor : handleConstructor.prototype;
                    release || assert(!object.hasOwnProperty(fieldName), "Should not overwrite existing properties.");
                    var getter;
                    var setter;
                    if (true || release) {
                        switch (field.kind) {
                            case 8 /* Reference */:
                                setter = new Function("value", "i32[this._address + " + field.byteOffset + " >> 2] = value;");
                                getter = new Function("return i32[this._address + " + field.byteOffset + " >> 2];");
                                break;
                            case 0 /* Boolean */:
                                setter = new Function("value", "i32[this._address + " + field.byteOffset + " >> 2] = value ? 1 : 0;");
                                getter = new Function("return i32[this._address + " + field.byteOffset + " >> 2];");
                                break;
                            case 1 /* Byte */:
                            case 2 /* Short */:
                            case 4 /* Int */:
                                setter = new Function("value", "i32[this._address + " + field.byteOffset + " >> 2] = value;");
                                getter = new Function("return i32[this._address + " + field.byteOffset + " >> 2];");
                                break;
                            case 5 /* Float */:
                                setter = new Function("value", "f32[this._address + " + field.byteOffset + " >> 2] = value;");
                                getter = new Function("return f32[this._address + " + field.byteOffset + " >> 2];");
                                break;
                            case 6 /* Long */:
                                setter = new Function("value", "i32[this._address + " + field.byteOffset + " >> 2] = J2ME.returnLongValue(value);" +
                                    "i32[this._address + " + field.byteOffset + " + 4 >> 2] = tempReturn0;");
                                getter = new Function("return J2ME.longToNumber(i32[this._address + " + field.byteOffset + " >> 2]," +
                                    "                         i32[this._address + " + field.byteOffset + " + 4 >> 2]);");
                                break;
                            case 7 /* Double */:
                                setter = new Function("value", "aliasedF64[0] = value;" +
                                    "i32[this._address + " + field.byteOffset + " >> 2] = aliasedI32[0];" +
                                    "i32[this._address + " + field.byteOffset + " + 4 >> 2] = aliasedI32[1];");
                                getter = new Function("aliasedI32[0] = i32[this._address + " + field.byteOffset + " >> 2];" +
                                    "aliasedI32[1] = i32[this._address + " + field.byteOffset + " + 4 >> 2];" +
                                    "return aliasedF64[0];");
                                break;
                            default:
                                J2ME.Debug.assert(false, J2ME.getKindName(field.kind));
                                break;
                        }
                    }
                    else {
                        setter = J2ME.FunctionUtilities.makeDebugForwardingSetter(field.mangledName, J2ME.getKindCheck(field.kind));
                    }
                    Object.defineProperty(object, fieldName, {
                        get: getter,
                        set: setter,
                        configurable: true,
                        enumerable: false
                    });
                }
            }
        }
    }
    function profilingWrapper(fn, methodInfo, methodType) {
        if (methodType === 0 /* Interpreted */) {
            // Profiling for interpreted functions is handled by the context.
            return fn;
        }
        var code;
        if (methodInfo.isNative) {
            if (methodInfo.returnKind === 9 /* Void */) {
                code = new Uint8Array([177 /* RETURN */]);
            }
            else if (J2ME.isTwoSlot(methodInfo.returnKind)) {
                code = new Uint8Array([173 /* LRETURN */]);
            }
            else {
                code = new Uint8Array([172 /* IRETURN */]);
            }
        }
        return function (a, b, c, d) {
            var key = methodInfo.implKey;
            try {
                var ctx = $.ctx;
                ctx.enterMethodTimeline(key, methodType);
                var r;
                switch (arguments.length) {
                    case 0:
                        r = fn.call(this);
                        break;
                    case 1:
                        r = fn.call(this, a);
                        break;
                    case 2:
                        r = fn.call(this, a, b);
                        break;
                    case 3:
                        r = fn.call(this, a, b, c);
                        break;
                    default:
                        r = fn.apply(this, arguments);
                }
                if (U) {
                    release || assert(ctx.paused, "context is paused");
                    if (methodInfo.isNative) {
                    }
                }
                else {
                    ctx.leaveMethodTimeline(key, methodType);
                }
            }
            catch (e) {
                ctx.leaveMethodTimeline(key, methodType);
                throw e;
            }
            return r;
        };
    }
    function tracingWrapper(fn, methodInfo, methodType) {
        var wrapper = function () {
            // jsGlobal.getBacktrace && traceWriter.writeLn(jsGlobal.getBacktrace());
            var args = Array.prototype.slice.apply(arguments);
            J2ME.traceWriter.enter("> " + getMethodTypeName(methodType)[0] + " " + methodInfo.implKey);
            var s = performance.now();
            try {
                var value = fn.apply(this, args);
            }
            catch (e) {
                J2ME.traceWriter.leave("< " + getMethodTypeName(methodType)[0] + " Throwing");
                throw e;
            }
            J2ME.traceWriter.leave("< " + getMethodTypeName(methodType)[0] + " " + methodInfo.implKey);
            return value;
        };
        wrapper.methodInfo = methodInfo;
        return wrapper;
    }
    function getLinkedMethod(methodInfo) {
        if (methodInfo.fn) {
            return methodInfo.fn;
        }
        linkMethod(methodInfo);
        release || assert(methodInfo.fn, "bad fn in getLinkedMethod");
        return methodInfo.fn;
    }
    J2ME.getLinkedMethod = getLinkedMethod;
    function getLinkedMethodById(methodId) {
        return getLinkedMethod(J2ME.methodIdToMethodInfoMap[methodId]);
    }
    J2ME.getLinkedMethodById = getLinkedMethodById;
    function getLinkedVirtualMethodById(classId, vTableIndex) {
        var methodInfo = J2ME.classIdToClassInfoMap[classId].vTable[vTableIndex];
        var fn = getLinkedMethod(methodInfo);
        // Only cache compiled methods in the |linkedVTableMap| and |flatLinkedVTableMap|.
        if (methodInfo.state === 1 /* Compiled */) {
            var vTable = J2ME.linkedVTableMap[classId];
            release || J2ME.Debug.assertNonDictionaryModeObject(vTable);
            vTable[vTableIndex] = fn;
            // Only cache methods in the |flatLinkedVTableMap| if there is room.
            if (vTableIndex < (1 << 6 /* LOG_MAX_FLAT_VTABLE_SIZE */)) {
                release || J2ME.Debug.assertNonDictionaryModeObject(J2ME.flatLinkedVTableMap);
                J2ME.flatLinkedVTableMap[(classId << 6 /* LOG_MAX_FLAT_VTABLE_SIZE */) + vTableIndex] = fn;
            }
        }
        return fn;
    }
    J2ME.getLinkedVirtualMethodById = getLinkedVirtualMethodById;
    function linkMethod(methodInfo) {
        J2ME.runtimeCounter && J2ME.runtimeCounter.count("linkMethod");
        var fn;
        var methodType;
        var nativeMethod = findNativeMethodImplementation(methodInfo);
        if (nativeMethod) {
            J2ME.linkWriter && J2ME.linkWriter.writeLn("Method: " + methodInfo.name + methodInfo.signature + " -> Native");
            fn = nativeMethod;
            methodType = 1 /* Native */;
            methodInfo.state = 1 /* Compiled */;
        }
        else {
            fn = findCompiledMethod(methodInfo);
            if (fn) {
                J2ME.linkWriter && J2ME.linkWriter.greenLn("Method: " + methodInfo.name + methodInfo.signature + " -> Compiled");
                methodType = 2 /* Compiled */;
                methodInfo.state = 1 /* Compiled */;
            }
            else {
                J2ME.linkWriter && J2ME.linkWriter.warnLn("Method: " + methodInfo.name + methodInfo.signature + " -> Interpreter");
                methodType = 0 /* Interpreted */;
                fn = J2ME.prepareInterpretedMethod(methodInfo);
            }
        }
        linkMethodFunction(methodInfo, fn, methodType);
    }
    /**
     * Number of methods that have been compiled thus far.
     */
    J2ME.compiledMethodCount = 0;
    /**
     * Maximum number of methods to compile.
     */
    J2ME.maxCompiledMethodCount = -1;
    /**
     * Number of methods that have not been compiled thus far.
     */
    J2ME.notCompiledMethodCount = 0;
    /**
     * Number of methods that have been loaded from the code cache thus far.
     */
    J2ME.cachedMethodCount = 0;
    /**
     * Number of methods that have been loaded from ahead of time compiled code thus far.
     */
    J2ME.aotMethodCount = 0;
    /**
     * Number of ms that have been spent compiled code thus far.
     */
    var totalJITTime = 0;
    /**
     * Compiles method and links it up at runtime.
     */
    function compileAndLinkMethod(methodInfo) {
        if (!J2ME.enableRuntimeCompilation) {
            return;
        }
        // Don't do anything if we're past the compiled state.
        if (methodInfo.state >= 1 /* Compiled */) {
            return;
        }
        // Don't compile if we've compiled too many methods.
        if (J2ME.maxCompiledMethodCount >= 0 && J2ME.compiledMethodCount >= J2ME.maxCompiledMethodCount) {
            return;
        }
        // Don't compile methods that are too large.
        if (methodInfo.codeAttribute.code.length > 4000 && !config.forceRuntimeCompilation) {
            J2ME.jitWriter && J2ME.jitWriter.writeLn("Not compiling: " + methodInfo.implKey + " because it's too large. " + methodInfo.codeAttribute.code.length);
            methodInfo.state = 2 /* NotCompiled */;
            J2ME.notCompiledMethodCount++;
            return;
        }
        if (J2ME.enableCompiledMethodCache) {
            var cachedMethod;
            if (cachedMethod = CompiledMethodCache.get(methodInfo.implKey)) {
                J2ME.cachedMethodCount++;
                J2ME.jitWriter && J2ME.jitWriter.writeLn("Retrieved " + methodInfo.implKey + " from compiled method cache");
                var referencedClasses = [];
                // Ensure referenced classes are loaded.
                // We only need to do this for cached methods, since referenced classes
                // get loaded automatically during JIT compilation.
                for (var i = 0; i < cachedMethod.referencedClasses.length; i++) {
                    referencedClasses.push(J2ME.CLASSES.getClass(cachedMethod.referencedClasses[i]));
                }
                linkMethodSource(methodInfo, cachedMethod.args, cachedMethod.body, referencedClasses, cachedMethod.onStackReplacementEntryPoints);
                return;
            }
        }
        var mangledClassAndMethodName = methodInfo.mangledClassAndMethodName;
        J2ME.jitWriter && J2ME.jitWriter.enter("Compiling: " + J2ME.compiledMethodCount + " " + methodInfo.implKey + ", interpreterCallCount: " + methodInfo.stats.interpreterCallCount + " backwardsBranchCount: " + methodInfo.stats.backwardsBranchCount + " currentBytecodeCount: " + methodInfo.stats.bytecodeCount);
        var s = performance.now();
        var compiledMethod;
        enterTimeline("Compiling");
        try {
            compiledMethod = J2ME.baselineCompileMethod(methodInfo, J2ME.enableCompiledMethodCache ? 1 /* Static */ : 0 /* Runtime */);
            J2ME.compiledMethodCount++;
        }
        catch (e) {
            methodInfo.state = 3 /* CannotCompile */;
            J2ME.jitWriter && J2ME.jitWriter.writeLn("Cannot compile: " + methodInfo.implKey + " because of " + e);
            leaveTimeline("Compiling");
            return;
        }
        leaveTimeline("Compiling");
        if (J2ME.codeWriter) {
            J2ME.codeWriter.writeLn("// Method: " + methodInfo.implKey);
            J2ME.codeWriter.writeLn("// Arguments: " + compiledMethod.args.join(", "));
            J2ME.codeWriter.writeLn("// Referenced Classes: ");
            for (var i = 0; i < compiledMethod.referencedClasses.length; i++) {
                J2ME.codeWriter.writeLn("// " + i + ": " + compiledMethod.referencedClasses[i].getClassNameSlow());
            }
            J2ME.codeWriter.writeLns(compiledMethod.body);
        }
        if (J2ME.enableCompiledMethodCache) {
            CompiledMethodCache.put({
                key: methodInfo.implKey,
                args: compiledMethod.args,
                body: compiledMethod.body,
                referencedClasses: compiledMethod.referencedClasses.map(function (v) { return v.getClassNameSlow(); }),
                onStackReplacementEntryPoints: compiledMethod.onStackReplacementEntryPoints
            });
        }
        linkMethodSource(methodInfo, compiledMethod.args, compiledMethod.body, compiledMethod.referencedClasses, compiledMethod.onStackReplacementEntryPoints);
        var methodJITTime = (performance.now() - s);
        totalJITTime += methodJITTime;
        if (J2ME.jitWriter) {
            J2ME.jitWriter.leave("Compilation Done: " + methodJITTime.toFixed(2) + " ms, " +
                "codeSize: " + methodInfo.codeAttribute.code.length + ", " +
                "sourceSize: " + compiledMethod.body.length);
            J2ME.jitWriter.writeLn("Total: " + totalJITTime.toFixed(2) + " ms");
        }
    }
    J2ME.compileAndLinkMethod = compileAndLinkMethod;
    function wrapMethod(fn, methodInfo, methodType) {
        if (profile) {
            fn = profilingWrapper(fn, methodInfo, methodType);
        }
        if (J2ME.traceWriter) {
            fn = tracingWrapper(fn, methodInfo, methodType);
        }
        return fn;
    }
    function linkMethodFunction(methodInfo, fn, methodType) {
        if (profile || J2ME.traceWriter) {
            fn = wrapMethod(fn, methodInfo, methodType);
        }
        methodInfo.fn = fn;
        J2ME.linkedMethods[methodInfo.id] = fn;
    }
    // Make sure class and method symbol references can be parsed as identifiers. This allows closure and other tools
    // to process this code as JS files.
    J2ME.classInfoSymbolPrefix = "$C"; // "$C123
    J2ME.methodInfoSymbolPrefix = "$M"; // "$M123_456
    var classInfoSymbolPrefixPattern = /\$C(\d+)/g;
    var methodInfoSymbolPrefixPattern = /\$M(\d+)_(\d+)/g;
    /**
     * Enable this if you want your profiles to have nice function names. Naming eval'ed functions
     * using: |new Function("return function displayName {}");| can cause performance problems and
     * we keep it disabled by default.
     */
    var nameJITFunctions = false;
    /**
     * Links up compiled method at runtime.
     */
    function linkMethodSource(methodInfo, args, body, referencedClasses, onStackReplacementEntryPoints) {
        J2ME.jitWriter && J2ME.jitWriter.writeLn("Link method: " + methodInfo.implKey);
        // TODO: Don't use RegExp ever ever.
        // Patch class and method symbols in relocatable code.
        body = body.replace(classInfoSymbolPrefixPattern, function (match, symbol) {
            // jitWriter && jitWriter.writeLn("Linking Class Symbol: " + symbol + " to " + referencedClasses[symbol]);
            return referencedClasses[symbol].id;
        }).replace(methodInfoSymbolPrefixPattern, function (match, symbol, index) {
            // jitWriter && jitWriter.writeLn("Linking Method Symbol: " + symbol + ":" + index + " to " + referencedClasses[symbol].getMethodByIndex(index));
            return referencedClasses[symbol].getMethodByIndex(index).id;
        });
        enterTimeline("Eval Compiled Code");
        // This overwrites the method on the global object.
        var fn = null;
        if (!release || nameJITFunctions) {
            fn = new Function("return function fn_" + methodInfo.implKey.replace(/\W+/g, "_") + "(" + args.join(",") + "){ " + body + "}")();
        }
        else {
            fn = new Function(args.join(','), body);
        }
        leaveTimeline("Eval Compiled Code");
        methodInfo.state = 1 /* Compiled */;
        methodInfo.onStackReplacementEntryPoints = onStackReplacementEntryPoints;
        linkMethodFunction(methodInfo, fn, 2 /* Compiled */);
    }
    J2ME.linkMethodSource = linkMethodSource;
    function isAssignableTo(from, to) {
        return from.isAssignableTo(to);
    }
    J2ME.isAssignableTo = isAssignableTo;
    function instanceOfKlass(objectAddr, classId) {
        release || assert(typeof classId === "number", "Class id must be a number.");
        return objectAddr !== 0 /* NULL */ && isAssignableTo(J2ME.classIdToClassInfoMap[i32[objectAddr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]], J2ME.classIdToClassInfoMap[classId]);
    }
    J2ME.instanceOfKlass = instanceOfKlass;
    function instanceOfInterface(objectAddr, classId) {
        release || assert(typeof classId === "number", "Class id must be a number.");
        release || assert(J2ME.classIdToClassInfoMap[classId].isInterface, "instanceOfInterface called on non interface");
        return objectAddr !== 0 /* NULL */ && isAssignableTo(J2ME.classIdToClassInfoMap[i32[objectAddr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]], J2ME.classIdToClassInfoMap[classId]);
    }
    J2ME.instanceOfInterface = instanceOfInterface;
    function checkCastKlass(objectAddr, classId) {
        release || assert(typeof classId === "number", "Class id must be a number.");
        if (objectAddr !== 0 /* NULL */ && !isAssignableTo(J2ME.classIdToClassInfoMap[i32[objectAddr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]], J2ME.classIdToClassInfoMap[classId])) {
            throw $.newClassCastException();
        }
    }
    J2ME.checkCastKlass = checkCastKlass;
    function checkCastInterface(objectAddr, classId) {
        if (objectAddr !== 0 /* NULL */ && !isAssignableTo(J2ME.classIdToClassInfoMap[i32[objectAddr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]], J2ME.classIdToClassInfoMap[classId])) {
            throw $.newClassCastException();
        }
    }
    J2ME.checkCastInterface = checkCastInterface;
    var handleConstructors = Object.create(null);
    function allocUncollectableObject(classInfo) {
        var address = gcMallocUncollectable(8 /* OBJ_HDR_SIZE */ + classInfo.sizeOfFields);
        i32[address >> 2] = classInfo.id | 0;
        return address;
    }
    J2ME.allocUncollectableObject = allocUncollectableObject;
    function allocObject(classInfo) {
        var address = gcMalloc(8 /* OBJ_HDR_SIZE */ + classInfo.sizeOfFields);
        i32[address >> 2] = classInfo.id | 0;
        return address;
    }
    J2ME.allocObject = allocObject;
    function getFreeMemory() {
        return asmJsTotalMemory - ASM._getUsedHeapSize();
    }
    J2ME.getFreeMemory = getFreeMemory;
    function onFinalize(addr) {
        J2ME.NativeMap.delete(addr);
    }
    J2ME.onFinalize = onFinalize;
    (function (BailoutFrameLayout) {
        BailoutFrameLayout[BailoutFrameLayout["MethodIdOffset"] = 0] = "MethodIdOffset";
        BailoutFrameLayout[BailoutFrameLayout["PCOffset"] = 4] = "PCOffset";
        BailoutFrameLayout[BailoutFrameLayout["LocalCountOffset"] = 8] = "LocalCountOffset";
        BailoutFrameLayout[BailoutFrameLayout["StackCountOffset"] = 12] = "StackCountOffset";
        BailoutFrameLayout[BailoutFrameLayout["LockOffset"] = 16] = "LockOffset";
        BailoutFrameLayout[BailoutFrameLayout["HeaderSize"] = 20] = "HeaderSize";
    })(J2ME.BailoutFrameLayout || (J2ME.BailoutFrameLayout = {}));
    var BailoutFrameLayout = J2ME.BailoutFrameLayout;
    function createBailoutFrame(methodId, pc, localCount, stackCount, lockObjectAddress) {
        var address = gcMallocUncollectable(20 /* HeaderSize */ + ((localCount + stackCount) << 2));
        release || assert(typeof methodId === "number" && J2ME.methodIdToMethodInfoMap[methodId], "Must be valid method info.");
        i32[address + 0 /* MethodIdOffset */ >> 2] = methodId;
        i32[address + 4 /* PCOffset */ >> 2] = pc;
        i32[address + 8 /* LocalCountOffset */ >> 2] = localCount;
        i32[address + 12 /* StackCountOffset */ >> 2] = stackCount;
        i32[address + 16 /* LockOffset */ >> 2] = lockObjectAddress;
        return address;
    }
    J2ME.createBailoutFrame = createBailoutFrame;
    /**
     * A map from Java object addresses to native objects.
     *
     * Currently this only supports mapping an address to a single native.
     * Will we ever want to map multiple natives to an address?  If so, we'll need
     * to do something more sophisticated here.
     */
    J2ME.NativeMap = new Map();
    function setNative(addr, obj) {
        J2ME.NativeMap.set(addr, obj);
        ASM._registerFinalizer(addr);
    }
    J2ME.setNative = setNative;
    /**
     * Get a handle for an object in the ASM heap.
     *
     * Currently, we implement this using JS constructors (i.e. Klass instances)
     * with a prototype chain that reflects the Java class hierarchy and getters/
     * setters for fields.
     */
    function getHandle(address) {
        if (address === 0 /* NULL */) {
            return null;
        }
        release || assert(typeof address === "number", "address is number");
        var classId = i32[address + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2];
        var classInfo = J2ME.classIdToClassInfoMap[classId];
        release || assert(classInfo, "object has class info");
        release || assert(!classInfo.elementClass, "object isn't an array");
        if (!handleConstructors[classId]) {
            var constructor = function (address) {
                this._address = address;
            };
            constructor.prototype.classInfo = classInfo;
            // Link the field bindings.
            linkHandleFields(constructor, classInfo);
            handleConstructors[classId] = constructor;
        }
        return new handleConstructors[classId](address);
    }
    J2ME.getHandle = getHandle;
    // TODO: TextEncoder('utf-16') was removed, this is some polyfil code,
    // but there probably is a faster way to do this.
    function encode_utf16(jsString, littleEndian) {
        var a = new Uint8Array(jsString.length * 2);
        var view = new DataView(a.buffer);
        jsString.split('').forEach(function (c, i) {
            view.setUint16(i * 2, c.charCodeAt(0), littleEndian);
        });
        return a;
    }
    function newString(jsString) {
        if (jsString === null || jsString === undefined) {
            return 0 /* NULL */;
        }
        var objectAddr = allocObject(J2ME.CLASSES.java_lang_String);
        setUncollectable(objectAddr);
        var object = getHandle(objectAddr);
        var encoded = new Uint16Array(encode_utf16(jsString, true).buffer);
        var arrayAddr = newCharArray(encoded.length);
        u16.set(encoded, 8 /* ARRAY_HDR_SIZE */ + arrayAddr >> 1);
        object.value = arrayAddr;
        object.offset = 0;
        object.count = encoded.length;
        unsetUncollectable(objectAddr);
        return objectAddr;
    }
    J2ME.newString = newString;
    function getArrayFromAddr(addr) {
        if (addr === 0 /* NULL */) {
            return null;
        }
        release || assert(typeof addr === "number", "addr is number");
        var classInfo = J2ME.classIdToClassInfoMap[i32[addr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]];
        var constructor;
        if (classInfo instanceof J2ME.PrimitiveArrayClassInfo) {
            switch (classInfo) {
                case J2ME.PrimitiveArrayClassInfo.Z:
                    constructor = Uint8Array;
                    break;
                case J2ME.PrimitiveArrayClassInfo.C:
                    constructor = Uint16Array;
                    break;
                case J2ME.PrimitiveArrayClassInfo.F:
                    constructor = Float32Array;
                    break;
                case J2ME.PrimitiveArrayClassInfo.D:
                    constructor = Float64Array;
                    break;
                case J2ME.PrimitiveArrayClassInfo.B:
                    constructor = Int8Array;
                    break;
                case J2ME.PrimitiveArrayClassInfo.S:
                    constructor = Int16Array;
                    break;
                case J2ME.PrimitiveArrayClassInfo.I:
                    constructor = Int32Array;
                    break;
                case J2ME.PrimitiveArrayClassInfo.J:
                    constructor = Int64Array;
                    break;
                default:
                    J2ME.Debug.assertUnreachable("Bad primitive array" + classInfo.getClassNameSlow());
                    break;
            }
        }
        else {
            constructor = Int32Array;
        }
        var arrayObject = new constructor(ASM.buffer, 8 /* ARRAY_HDR_SIZE */ + addr, i32[addr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2]);
        arrayObject.classInfo = classInfo;
        return arrayObject;
    }
    J2ME.getArrayFromAddr = getArrayFromAddr;
    var uncollectableMaxNumber = 16;
    var uncollectableAddress = gcMallocUncollectable(uncollectableMaxNumber << 2);
    function setUncollectable(addr) {
        for (var i = 0; i < uncollectableMaxNumber; i++) {
            var address = (uncollectableAddress >> 2) + i;
            if (i32[address] === 0 /* NULL */) {
                i32[address] = addr;
                return;
            }
        }
        release || J2ME.Debug.assertUnreachable("There must be a free slot.");
    }
    J2ME.setUncollectable = setUncollectable;
    function unsetUncollectable(addr) {
        for (var i = 0; i < uncollectableMaxNumber; i++) {
            var address = (uncollectableAddress >> 2) + i;
            if (i32[address] === addr) {
                i32[address] = 0 /* NULL */;
                return;
            }
        }
        release || J2ME.Debug.assertUnreachable("The adddress was not found in the uncollectables.");
    }
    J2ME.unsetUncollectable = unsetUncollectable;
    function newArray(elementClassInfo, size) {
        release || assert(elementClassInfo instanceof J2ME.ClassInfo, "elementClassInfo instanceof ClassInfo");
        if (size < 0) {
            throwNegativeArraySizeException();
        }
        var arrayClassInfo = J2ME.CLASSES.getClass("[" + elementClassInfo.getClassNameSlow());
        var addr;
        if (elementClassInfo instanceof J2ME.PrimitiveClassInfo) {
            addr = gcMallocAtomic(8 /* ARRAY_HDR_SIZE */ + size * arrayClassInfo.bytesPerElement);
        }
        else {
            // We need to hold an integer to define the length of the array
            // and *size* references.
            addr = gcMalloc(8 /* ARRAY_HDR_SIZE */ + size * 4);
        }
        i32[addr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2] = arrayClassInfo.id;
        i32[addr + 4 /* ARRAY_LENGTH_OFFSET */ >> 2] = size;
        return addr;
    }
    J2ME.newArray = newArray;
    function newMultiArray(classInfo, lengths) {
        var length = lengths[0];
        var arrayAddr = newArray(classInfo.elementClass, length);
        if (lengths.length > 1) {
            setUncollectable(arrayAddr);
            lengths = lengths.slice(1);
            var start = (arrayAddr + 8 /* ARRAY_HDR_SIZE */ >> 2);
            for (var i = start; i < start + length; i++) {
                i32[i] = newMultiArray(classInfo.elementClass, lengths);
            }
            unsetUncollectable(arrayAddr);
        }
        return arrayAddr;
    }
    J2ME.newMultiArray = newMultiArray;
    J2ME.JavaRuntimeException = function (message) {
        this.message = message;
    };
    J2ME.JavaRuntimeException.prototype = Object.create(Error.prototype);
    J2ME.JavaRuntimeException.prototype.name = "JavaRuntimeException";
    J2ME.JavaRuntimeException.prototype.constructor = J2ME.JavaRuntimeException;
    function throwNegativeArraySizeException() {
        throw $.newNegativeArraySizeException();
    }
    J2ME.throwNegativeArraySizeException = throwNegativeArraySizeException;
    function throwNullPointerException() {
        throw $.newNullPointerException();
    }
    J2ME.throwNullPointerException = throwNullPointerException;
    function newObjectArray(size) {
        return newArray(J2ME.CLASSES.java_lang_Object, size);
    }
    J2ME.newObjectArray = newObjectArray;
    function newStringArray(size) {
        return newArray(J2ME.CLASSES.java_lang_String, size);
    }
    J2ME.newStringArray = newStringArray;
    function newByteArray(size) {
        return newArray(J2ME.PrimitiveClassInfo.B, size);
    }
    J2ME.newByteArray = newByteArray;
    function newCharArray(size) {
        return newArray(J2ME.PrimitiveClassInfo.C, size);
    }
    J2ME.newCharArray = newCharArray;
    function newIntArray(size) {
        return newArray(J2ME.PrimitiveClassInfo.I, size);
    }
    J2ME.newIntArray = newIntArray;
    var jStringDecoder = new TextDecoder('utf-16');
    function fromJavaChars(charsAddr, offset, count) {
        release || assert(charsAddr !== 0 /* NULL */, "charsAddr !== Constants.NULL");
        var start = (8 /* ARRAY_HDR_SIZE */ + charsAddr >> 1) + offset;
        return jStringDecoder.decode(u16.subarray(start, start + count));
    }
    J2ME.fromJavaChars = fromJavaChars;
    function fromStringAddr(stringAddr) {
        if (stringAddr === 0 /* NULL */) {
            return null;
        }
        // XXX Retrieve the characters directly from memory, without indirecting
        // through getHandle.
        var javaString = getHandle(stringAddr);
        return fromJavaChars(javaString.value, javaString.offset, javaString.count);
    }
    J2ME.fromStringAddr = fromStringAddr;
    function checkDivideByZero(value) {
        if (value === 0) {
            throwArithmeticException();
        }
    }
    J2ME.checkDivideByZero = checkDivideByZero;
    /**
     * Do bounds check using only one branch. The math works out because array.length
     * can't be larger than 2^31 - 1. So |index| >>> 0 will be larger than
     * array.length if it is less than zero. We need to make the right side unsigned
     * as well because otherwise the SM optimization that converts this to an
     * unsinged branch doesn't kick in.
     */
    function checkArrayBounds(array, index) {
        // XXX: This function is unused, should be updated if we're
        // ever going to use it
        if ((index >>> 0) >= (array.length >>> 0)) {
            throw $.newArrayIndexOutOfBoundsException(String(index));
        }
    }
    J2ME.checkArrayBounds = checkArrayBounds;
    function throwArrayIndexOutOfBoundsException(index) {
        throw $.newArrayIndexOutOfBoundsException(String(index));
    }
    J2ME.throwArrayIndexOutOfBoundsException = throwArrayIndexOutOfBoundsException;
    function throwArithmeticException() {
        throw $.newArithmeticException("/ by zero");
    }
    J2ME.throwArithmeticException = throwArithmeticException;
    function checkArrayStore(arrayAddr, valueAddr) {
        if (valueAddr === 0 /* NULL */) {
            return;
        }
        var arrayClassInfo = J2ME.classIdToClassInfoMap[i32[arrayAddr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]];
        var valueClassInfo = J2ME.classIdToClassInfoMap[i32[valueAddr + 0 /* OBJ_CLASS_ID_OFFSET */ >> 2]];
        if (!isAssignableTo(valueClassInfo, arrayClassInfo.elementClass)) {
            throw $.newArrayStoreException();
        }
    }
    J2ME.checkArrayStore = checkArrayStore;
    function checkNull(object) {
        if (!object) {
            throw $.newNullPointerException();
        }
    }
    J2ME.checkNull = checkNull;
    var ConfigThresholds = (function () {
        function ConfigThresholds() {
        }
        ConfigThresholds.InvokeThreshold = config.invokeThreshold;
        ConfigThresholds.BackwardBranchThreshold = config.backwardBranchThreshold;
        return ConfigThresholds;
    })();
    J2ME.ConfigThresholds = ConfigThresholds;
    function monitorEnter(lock) {
        $.ctx.monitorEnter(lock);
    }
    J2ME.monitorEnter = monitorEnter;
    function monitorExit(lock) {
        $.ctx.monitorExit(lock);
    }
    J2ME.monitorExit = monitorExit;
    function translateException(e) {
        if (e.name === "TypeError") {
            // JavaScript's TypeError is analogous to a NullPointerException.
            return $.newNullPointerException(e.message);
        }
        else if (e.name === "JavaRuntimeException") {
            return $.newRuntimeException(e.message);
        }
        return e;
    }
    J2ME.translateException = translateException;
    function classInitCheck(classInfo) {
        if (classInfo instanceof J2ME.ArrayClassInfo || $.initialized[classInfo.id]) {
            return;
        }
        // TODO: make this more efficient when we decide on how to invoke code.
        var thread = $.ctx.nativeThread;
        thread.pushMarkerFrame(J2ME.FrameType.Interrupt);
        thread.pushMarkerFrame(J2ME.FrameType.Native);
        var frameTypeOffset = thread.fp + 2 /* FrameTypeOffset */;
        getLinkedMethod(J2ME.CLASSES.java_lang_Class.getMethodByNameString("initialize", "()V"))($.getClassObjectAddress(classInfo));
        if (U) {
            i32[frameTypeOffset] = J2ME.FrameType.PushPendingFrames;
            thread.nativeFrameCount--;
            thread.unwoundNativeFrames.push(null);
            return;
        }
        thread.popMarkerFrame(J2ME.FrameType.Native);
        thread.popMarkerFrame(J2ME.FrameType.Interrupt);
    }
    J2ME.classInitCheck = classInitCheck;
    function preempt() {
        if (J2ME.Scheduler.shouldPreempt()) {
            $.yield("preemption");
        }
    }
    J2ME.preempt = preempt;
    var UnwindThrowLocation = (function () {
        function UnwindThrowLocation() {
            this.pc = 0;
            this.sp = 0;
            this.nextPC = 0;
        }
        UnwindThrowLocation.prototype.setLocation = function (pc, nextPC, sp) {
            this.pc = pc;
            this.sp = sp;
            this.nextPC = nextPC;
            return this;
        };
        UnwindThrowLocation.prototype.getPC = function () {
            return this.pc;
        };
        UnwindThrowLocation.prototype.getSP = function () {
            return this.sp;
        };
        UnwindThrowLocation.instance = new UnwindThrowLocation();
        return UnwindThrowLocation;
    })();
    J2ME.UnwindThrowLocation = UnwindThrowLocation;
    /**
     * Helper methods used by the compiler.
     */
    /**
     * Generic unwind throw.
     */
    function throwUnwind(pc, nextPC, sp) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        if (sp === void 0) { sp = 0; }
        throw UnwindThrowLocation.instance.setLocation(pc, nextPC, sp);
    }
    J2ME.throwUnwind = throwUnwind;
    /**
     * Unwind throws with different stack heights. This is useful so we can
     * save a few bytes encoding the stack height in the function name.
     */
    function throwUnwind0(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 0);
    }
    J2ME.throwUnwind0 = throwUnwind0;
    function throwUnwind1(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 1);
    }
    J2ME.throwUnwind1 = throwUnwind1;
    function throwUnwind2(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 2);
    }
    J2ME.throwUnwind2 = throwUnwind2;
    function throwUnwind3(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 3);
    }
    J2ME.throwUnwind3 = throwUnwind3;
    function throwUnwind4(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 4);
    }
    J2ME.throwUnwind4 = throwUnwind4;
    function throwUnwind5(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 5);
    }
    J2ME.throwUnwind5 = throwUnwind5;
    function throwUnwind6(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 6);
    }
    J2ME.throwUnwind6 = throwUnwind6;
    function throwUnwind7(pc, nextPC) {
        if (nextPC === void 0) { nextPC = pc + 3; }
        throwUnwind(pc, nextPC, 7);
    }
    J2ME.throwUnwind7 = throwUnwind7;
    function fadd(a, b) {
        aliasedI32[0] = a;
        aliasedI32[1] = b;
        aliasedF32[2] = aliasedF32[0] + aliasedF32[1];
        return aliasedI32[2];
    }
    J2ME.fadd = fadd;
    function fsub(a, b) {
        aliasedI32[0] = a;
        aliasedI32[1] = b;
        aliasedF32[2] = aliasedF32[0] - aliasedF32[1];
        return aliasedI32[2];
    }
    J2ME.fsub = fsub;
    function fmul(a, b) {
        aliasedI32[0] = a;
        aliasedI32[1] = b;
        aliasedF32[2] = aliasedF32[0] * aliasedF32[1];
        return aliasedI32[2];
    }
    J2ME.fmul = fmul;
    function fdiv(a, b) {
        aliasedI32[0] = a;
        aliasedI32[1] = b;
        aliasedF32[2] = Math.fround(aliasedF32[0] / aliasedF32[1]);
        return aliasedI32[2];
    }
    J2ME.fdiv = fdiv;
    function frem(a, b) {
        aliasedI32[0] = a;
        aliasedI32[1] = b;
        aliasedF32[2] = Math.fround(aliasedF32[0] % aliasedF32[1]);
        return aliasedI32[2];
    }
    J2ME.frem = frem;
    function fcmp(a, b, isLessThan) {
        var x = (aliasedI32[0] = a, aliasedF32[0]);
        var y = (aliasedI32[0] = b, aliasedF32[0]);
        if (x !== x || y !== y) {
            return isLessThan ? -1 : 1;
        }
        else if (x > y) {
            return 1;
        }
        else if (x < y) {
            return -1;
        }
        else {
            return 0;
        }
    }
    J2ME.fcmp = fcmp;
    function fneg(a) {
        aliasedF32[0] = -(aliasedI32[0] = a, aliasedF32[0]);
        return aliasedI32[0];
    }
    J2ME.fneg = fneg;
    function dcmp(al, ah, bl, bh, isLessThan) {
        var x = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]);
        var y = (aliasedI32[0] = bl, aliasedI32[1] = bh, aliasedF64[0]);
        if (x !== x || y !== y) {
            return isLessThan ? -1 : 1;
        }
        else if (x > y) {
            return 1;
        }
        else if (x < y) {
            return -1;
        }
        else {
            return 0;
        }
    }
    J2ME.dcmp = dcmp;
    function dadd(al, ah, bl, bh) {
        aliasedF64[0] = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]) +
            (aliasedI32[0] = bl, aliasedI32[1] = bh, aliasedF64[0]);
        return (tempReturn0 = aliasedI32[1], aliasedI32[0]);
    }
    J2ME.dadd = dadd;
    function dsub(al, ah, bl, bh) {
        aliasedF64[0] = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]) -
            (aliasedI32[0] = bl, aliasedI32[1] = bh, aliasedF64[0]);
        return (tempReturn0 = aliasedI32[1], aliasedI32[0]);
    }
    J2ME.dsub = dsub;
    function dmul(al, ah, bl, bh) {
        aliasedF64[0] = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]) *
            (aliasedI32[0] = bl, aliasedI32[1] = bh, aliasedF64[0]);
        return (tempReturn0 = aliasedI32[1], aliasedI32[0]);
    }
    J2ME.dmul = dmul;
    function ddiv(al, ah, bl, bh) {
        aliasedF64[0] = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]) /
            (aliasedI32[0] = bl, aliasedI32[1] = bh, aliasedF64[0]);
        return (tempReturn0 = aliasedI32[1], aliasedI32[0]);
    }
    J2ME.ddiv = ddiv;
    function drem(al, ah, bl, bh) {
        aliasedF64[0] = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]) %
            (aliasedI32[0] = bl, aliasedI32[1] = bh, aliasedF64[0]);
        return (tempReturn0 = aliasedI32[1], aliasedI32[0]);
    }
    J2ME.drem = drem;
    function dneg(al, ah) {
        aliasedF64[0] = -(aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]);
        tempReturn0 = aliasedI32[1];
        return aliasedI32[0];
    }
    J2ME.dneg = dneg;
    function f2i(a) {
        var x = (aliasedI32[0] = a, aliasedF32[0]);
        if (x > 2147483647 /* INT_MAX */) {
            return 2147483647 /* INT_MAX */;
        }
        else if (x < -2147483648 /* INT_MIN */) {
            return -2147483648 /* INT_MIN */;
        }
        else {
            return x | 0;
        }
    }
    J2ME.f2i = f2i;
    function d2i(al, ah) {
        var x = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]);
        if (x > 2147483647 /* INT_MAX */) {
            return 2147483647 /* INT_MAX */;
        }
        else if (x < -2147483648 /* INT_MIN */) {
            return -2147483648 /* INT_MIN */;
        }
        else {
            return x | 0;
        }
    }
    J2ME.d2i = d2i;
    function i2f(a) {
        aliasedF32[0] = a;
        return aliasedI32[0];
    }
    J2ME.i2f = i2f;
    function i2d(a) {
        aliasedF64[0] = a;
        tempReturn0 = aliasedI32[1];
        return aliasedI32[0];
    }
    J2ME.i2d = i2d;
    function l2d(al, ah) {
        aliasedF64[0] = J2ME.longToNumber(al, ah);
        tempReturn0 = aliasedI32[1];
        return aliasedI32[0];
    }
    J2ME.l2d = l2d;
    function l2f(al, ah) {
        aliasedF32[0] = Math.fround(J2ME.longToNumber(al, ah));
        return aliasedI32[0];
    }
    J2ME.l2f = l2f;
    function f2d(l) {
        aliasedF64[0] = (aliasedI32[0] = l, aliasedF32[0]);
        tempReturn0 = aliasedI32[1];
        return aliasedI32[0];
    }
    J2ME.f2d = f2d;
    function f2l(l) {
        var x = (aliasedI32[0] = l, aliasedF32[0]);
        return J2ME.returnLongValue(x);
    }
    J2ME.f2l = f2l;
    function d2l(al, ah) {
        var x = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]);
        if (x === Number.POSITIVE_INFINITY) {
            tempReturn0 = 2147483647 /* LONG_MAX_HIGH */;
            return 4294967295 /* LONG_MAX_LOW */;
        }
        else if (x === Number.NEGATIVE_INFINITY) {
            tempReturn0 = 2147483648 /* LONG_MIN_HIGH */;
            return 0 /* LONG_MIN_LOW */;
        }
        else {
            return J2ME.returnLongValue(x);
        }
    }
    J2ME.d2l = d2l;
    function d2f(al, ah) {
        var x = (aliasedI32[0] = al, aliasedI32[1] = ah, aliasedF64[0]);
        aliasedF32[0] = Math.fround(x);
        return aliasedI32[0];
    }
    J2ME.d2f = d2f;
    function gcMalloc(size) {
        release || J2ME.gcCounter.count("gcMalloc");
        return ASM._gcMalloc(size);
    }
    J2ME.gcMalloc = gcMalloc;
    function gcMallocAtomic(size) {
        release || J2ME.gcCounter.count("gcMallocAtomic");
        return ASM._gcMallocAtomic(size);
    }
    J2ME.gcMallocAtomic = gcMallocAtomic;
    function gcMallocUncollectable(size) {
        release || J2ME.gcCounter.count("gcMallocUncollectable");
        return ASM._gcMallocUncollectable(size);
    }
    J2ME.gcMallocUncollectable = gcMallocUncollectable;
    var tmpAddress = gcMallocUncollectable(32);
    function lcmp(al, ah, bl, bh) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        i32[tmpAddress + 8 >> 2] = bl;
        i32[tmpAddress + 12 >> 2] = bh;
        ASM._lCmp(tmpAddress, tmpAddress, tmpAddress + 8);
        return i32[tmpAddress >> 2];
    }
    J2ME.lcmp = lcmp;
    function ladd(al, ah, bl, bh) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        i32[tmpAddress + 8 >> 2] = bl;
        i32[tmpAddress + 12 >> 2] = bh;
        ASM._lAdd(tmpAddress, tmpAddress, tmpAddress + 8);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.ladd = ladd;
    function lsub(al, ah, bl, bh) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        i32[tmpAddress + 8 >> 2] = bl;
        i32[tmpAddress + 12 >> 2] = bh;
        ASM._lSub(tmpAddress, tmpAddress, tmpAddress + 8);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.lsub = lsub;
    function lmul(al, ah, bl, bh) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        i32[tmpAddress + 8 >> 2] = bl;
        i32[tmpAddress + 12 >> 2] = bh;
        ASM._lMul(tmpAddress, tmpAddress, tmpAddress + 8);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.lmul = lmul;
    function ldiv(al, ah, bl, bh) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        i32[tmpAddress + 8 >> 2] = bl;
        i32[tmpAddress + 12 >> 2] = bh;
        ASM._lDiv(tmpAddress, tmpAddress, tmpAddress + 8);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.ldiv = ldiv;
    function lrem(al, ah, bl, bh) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        i32[tmpAddress + 8 >> 2] = bl;
        i32[tmpAddress + 12 >> 2] = bh;
        ASM._lRem(tmpAddress, tmpAddress, tmpAddress + 8);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.lrem = lrem;
    function lneg(al, ah) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        ASM._lNeg(tmpAddress, tmpAddress);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.lneg = lneg;
    function lshl(al, ah, shift) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        ASM._lShl(tmpAddress, tmpAddress, shift);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.lshl = lshl;
    function lshr(al, ah, shift) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        ASM._lShr(tmpAddress, tmpAddress, shift);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.lshr = lshr;
    function lushr(al, ah, shift) {
        i32[tmpAddress + 0 >> 2] = al;
        i32[tmpAddress + 4 >> 2] = ah;
        ASM._lUshr(tmpAddress, tmpAddress, shift);
        tempReturn0 = i32[tmpAddress + 4 >> 2];
        return i32[tmpAddress >> 2];
    }
    J2ME.lushr = lushr;
})(J2ME || (J2ME = {}));
var Runtime = J2ME.Runtime;
var AOTMD = J2ME.aotMetaData;
/**
 * Are we currently unwinding the stack because of a Yield? This technically
 * belonges to a context but we store it in the global object because it is
 * read very often.
 */
var U = 0 /* Running */;
// To enable breaking when it is set in Chrome, define it as a getter/setter:
// http://stackoverflow.com/questions/11618278/how-to-break-on-property-change-in-chrome
// var _U: J2ME.VMState = J2ME.VMState.Running;
// declare var U;
// Object.defineProperty(jsGlobal, 'U', {
//     get: function () {
//         return jsGlobal._U;
//     },
//     set: function (value) {
//         jsGlobal._U = value;
//     }
// });
// Several unwind throws for different stack heights.
var B0 = J2ME.throwUnwind0;
var B1 = J2ME.throwUnwind1;
var B2 = J2ME.throwUnwind2;
var B3 = J2ME.throwUnwind3;
var B4 = J2ME.throwUnwind4;
var B5 = J2ME.throwUnwind5;
var B6 = J2ME.throwUnwind6;
var B7 = J2ME.throwUnwind7;
/**
 * OSR Frame.
 */
// REDUX
var O = null;
/**
 * Runtime exports for compiled code.
 * DO NOT use these short names outside of compiled code.
 */
var CI = J2ME.classIdToClassInfoMap;
var MI = J2ME.methodIdToMethodInfoMap;
var LM = J2ME.linkedMethods;
var GLM = J2ME.getLinkedMethodById;
var GLVM = J2ME.getLinkedVirtualMethodById;
var VT = J2ME.linkedVTableMap;
var FT = J2ME.flatLinkedVTableMap;
var CIC = J2ME.classInitCheck;
var GH = J2ME.getHandle;
var AO = J2ME.allocObject;
var IOK = J2ME.instanceOfKlass;
var IOI = J2ME.instanceOfInterface;
var CCK = J2ME.checkCastKlass;
var CCI = J2ME.checkCastInterface;
//var AK = J2ME.getArrayKlass;
var NA = J2ME.newArray;
var NM = J2ME.newMultiArray;
var CAB = J2ME.checkArrayBounds;
var CAS = J2ME.checkArrayStore;
// XXX Ensure these work with new monitor objects.
var GM = J2ME.getMonitor;
var ME = J2ME.monitorEnter;
var MX = J2ME.monitorExit;
var TE = J2ME.translateException;
var TI = J2ME.throwArrayIndexOutOfBoundsException;
var TA = J2ME.throwArithmeticException;
var TS = J2ME.throwNegativeArraySizeException;
var TN = J2ME.throwNullPointerException;
var PE = J2ME.preempt;
var PS = 0; // Preemption samples.
var MA = J2ME.gcMallocAtomic;
var fadd = J2ME.fadd;
var fsub = J2ME.fsub;
var fmul = J2ME.fmul;
var fdiv = J2ME.fdiv;
var frem = J2ME.frem;
var fneg = J2ME.fneg;
var f2i = J2ME.f2i;
var f2l = J2ME.f2l;
var f2d = J2ME.f2d;
var i2f = J2ME.i2f;
var i2d = J2ME.i2d;
var d2i = J2ME.d2i;
var d2l = J2ME.d2l;
var d2f = J2ME.d2f;
var l2f = J2ME.l2f;
var l2d = J2ME.l2d;
var fcmp = J2ME.fcmp;
var dneg = J2ME.dneg;
var dcmp = J2ME.dcmp;
var dadd = J2ME.dadd;
var dsub = J2ME.dsub;
var dmul = J2ME.dmul;
var ddiv = J2ME.ddiv;
var drem = J2ME.drem;
var lneg = J2ME.lneg;
var ladd = J2ME.ladd;
var lsub = J2ME.lsub;
var lmul = J2ME.lmul;
var ldiv = J2ME.ldiv;
var lrem = J2ME.lrem;
var lcmp = J2ME.lcmp;
var lshl = J2ME.lshl;
var lshr = J2ME.lshr;
var lushr = J2ME.lushr;
var getHandle = J2ME.getHandle;
var NativeMap = J2ME.NativeMap;
var setNative = J2ME.setNative;
/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    var concat3 = J2ME.StringUtilities.concat3;
    var pushMany = J2ME.ArrayUtilities.pushMany;
    var unique = J2ME.ArrayUtilities.unique;
    var hashBytesTo32BitsMurmur = J2ME.HashUtilities.hashBytesTo32BitsMurmur;
    (function (UTF8Chars) {
        UTF8Chars[UTF8Chars["a"] = 97] = "a";
        UTF8Chars[UTF8Chars["Z"] = 90] = "Z";
        UTF8Chars[UTF8Chars["C"] = 67] = "C";
        UTF8Chars[UTF8Chars["F"] = 70] = "F";
        UTF8Chars[UTF8Chars["D"] = 68] = "D";
        UTF8Chars[UTF8Chars["B"] = 66] = "B";
        UTF8Chars[UTF8Chars["S"] = 83] = "S";
        UTF8Chars[UTF8Chars["I"] = 73] = "I";
        UTF8Chars[UTF8Chars["J"] = 74] = "J";
        UTF8Chars[UTF8Chars["V"] = 86] = "V";
        UTF8Chars[UTF8Chars["L"] = 76] = "L";
        UTF8Chars[UTF8Chars["OpenBracket"] = 91] = "OpenBracket";
        UTF8Chars[UTF8Chars["Semicolon"] = 59] = "Semicolon";
        UTF8Chars[UTF8Chars["Dot"] = 46] = "Dot";
        UTF8Chars[UTF8Chars["Slash"] = 47] = "Slash";
        UTF8Chars[UTF8Chars["OpenParenthesis"] = 40] = "OpenParenthesis";
        UTF8Chars[UTF8Chars["CloseParenthesis"] = 41] = "CloseParenthesis";
    })(J2ME.UTF8Chars || (J2ME.UTF8Chars = {}));
    var UTF8Chars = J2ME.UTF8Chars;
    var UTF8;
    (function (UTF8) {
        UTF8.Code = new Uint8Array([67, 111, 100, 101]);
        UTF8.ConstantValue = new Uint8Array([67, 111, 110, 115, 116, 97, 110, 116, 86, 97, 108, 117, 101]);
        UTF8.Init = new Uint8Array([60, 105, 110, 105, 116, 62]);
        UTF8.Z = new Uint8Array([90 /* Z */]);
        UTF8.C = new Uint8Array([67 /* C */]);
        UTF8.F = new Uint8Array([70 /* F */]);
        UTF8.D = new Uint8Array([68 /* D */]);
        UTF8.B = new Uint8Array([66 /* B */]);
        UTF8.S = new Uint8Array([83 /* S */]);
        UTF8.I = new Uint8Array([73 /* I */]);
        UTF8.J = new Uint8Array([74 /* J */]);
    })(UTF8 || (UTF8 = {}));
    function strcmp(a, b) {
        if (a === b) {
            return true;
        }
        if (a.length !== b.length) {
            return false;
        }
        var l = a.length;
        for (var i = 0; i < l; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    J2ME.strcmp = strcmp;
    var utf8Cache = Object.create(null);
    /**
     * Caches frequently used UTF8 strings. Only use this for a small set of frequently
     * used JS -> UTF8 conversions.
     */
    function cacheUTF8(s) {
        var r = utf8Cache[s];
        if (r !== undefined) {
            return r;
        }
        return utf8Cache[s] = toUTF8(s);
    }
    J2ME.cacheUTF8 = cacheUTF8;
    function toUTF8(s) {
        var r = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            release || assert(c <= 0x7f, "bad char in toUTF8");
            r[i] = c;
        }
        return r;
    }
    J2ME.toUTF8 = toUTF8;
    function fromUTF8(s) {
        return ByteStream.readString(s);
    }
    J2ME.fromUTF8 = fromUTF8;
    function strcatSingle(a, b) {
        var r = new Uint8Array(1 + b.length);
        r[0] = a;
        // For short strings, a for loop is faster than a call to TypedArray::set()
        for (var i = 1; i < b.length + 1; i++) {
            r[i] = b[i - 1];
        }
        return r;
    }
    function strcat4Single(a, b, c, d) {
        var r = new Uint8Array(c.length + 3);
        r[0] = a;
        r[1] = b;
        // For short strings, a for loop is faster than a call to TypedArray::set()
        for (var i = 2; i < c.length + 2; i++) {
            r[i] = c[i - 2];
        }
        r[2 + c.length] = d;
        return r;
    }
    // Seal ClassInfo, MethodInfo and FieldInfo objects so their shapes are fixed. This should
    // not be enabled by default as it usually causes perf problems, but it's useful as a
    // debugging feature nonetheless.
    var sealObjects = false;
    /**
     * Base class of all class file structs.
     */
    var ByteStream = (function () {
        function ByteStream(buffer, offset) {
            this.buffer = buffer;
            this.offset = offset;
            // ...
        }
        ByteStream.UTF8toUTF16 = function (utf8) {
            // This conversion is mainly used for symbols within a class file,
            // in which the large majority of strings are all ascii.
            var ascii = true;
            var utf8Length = utf8.length;
            var utf16Addr = J2ME.newCharArray(utf8Length);
            for (var i = 0; i < utf8Length; i++) {
                var ch1 = utf8[i];
                if (ch1 === 0) {
                    throw new Error("Bad utf16 value.");
                }
                if (ch1 >= 128) {
                    ascii = false;
                    break;
                }
                u16[(utf16Addr + 8 /* ARRAY_HDR_SIZE */ >> 1) + i] = ch1;
            }
            if (ascii) {
                return utf16Addr;
            }
            var index = 0;
            var a = [];
            while (index < utf8Length) {
                var ch1 = utf8[index++];
                if (ch1 < 128) {
                    a.push(ch1);
                    continue;
                }
                switch (ch1 >> 4) {
                    case 0x8:
                    case 0x9:
                    case 0xA:
                    case 0xB:
                    case 0xF:
                        throw new Error("Bad utf16 value.");
                    case 0xC:
                    case 0xD:
                        /* 110xxxxx  10xxxxxx */
                        if (index < utf8Length) {
                            var ch2 = utf8[index];
                            index++;
                            if ((ch2 & 0xC0) == 0x80) {
                                var highFive = (ch1 & 0x1F);
                                var lowSix = (ch2 & 0x3F);
                                a.push(((highFive << 6) + lowSix));
                            }
                        }
                        break;
                    case 0xE:
                        /* 1110xxxx 10xxxxxx 10xxxxxx */
                        if (index < utf8Length) {
                            var ch2 = utf8[index];
                            index++;
                            if ((ch2 & 0xC0) == 0x80 && index < utf8Length) {
                                var ch3 = utf8[index];
                                if ((ch3 & 0xC0) == 0x80) {
                                    index++;
                                    var highFour = (ch1 & 0x0f);
                                    var midSix = (ch2 & 0x3f);
                                    var lowSix = (ch3 & 0x3f);
                                    a.push((((highFour << 6) + midSix) << 6) + lowSix);
                                }
                                else {
                                    var highFour = (ch1 & 0x0f);
                                    var lowSix = (ch2 & 0x3f);
                                    a.push((highFour << 6) + lowSix);
                                }
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
            var retAddr = J2ME.newCharArray(a.length);
            u16.set(a, retAddr + 8 /* ARRAY_HDR_SIZE */ >> 1);
            return retAddr;
        };
        ByteStream.prototype.u2 = function (offset) {
            var b = this.buffer;
            var o = this.offset + offset;
            return b[o] << 8 | b[o + 1];
        };
        ByteStream.prototype.clone = function () {
            return new ByteStream(this.buffer, this.offset);
        };
        ByteStream.prototype.readU1 = function () {
            return this.buffer[this.offset++];
        };
        ByteStream.prototype.peekU1 = function () {
            return this.buffer[this.offset];
        };
        ByteStream.prototype.readU2 = function () {
            var buffer = this.buffer;
            var o = this.offset;
            this.offset += 2;
            return buffer[o] << 8 | buffer[o + 1];
        };
        ByteStream.prototype.peekU16 = function () {
            var buffer = this.buffer;
            var o = this.offset;
            return buffer[o] << 8 | buffer[o + 1];
        };
        ByteStream.prototype.readU4 = function () {
            return this.readS4() >>> 0;
        };
        ByteStream.prototype.skipU4 = function () {
            this.offset += 4;
        };
        ByteStream.prototype.readS4 = function () {
            var o = this.offset;
            var buffer = this.buffer;
            var a = buffer[o + 0];
            var b = buffer[o + 1];
            var c = buffer[o + 2];
            var d = buffer[o + 3];
            this.offset = o + 4;
            return (a << 24) | (b << 16) | (c << 8) | d;
        };
        ByteStream.prototype.seek = function (offset) {
            this.offset = offset;
            return this;
        };
        ByteStream.prototype.skip = function (length) {
            this.offset += length;
            return this;
        };
        /**
         * Interns small and frequently used Uint8Array buffers.
         *
         * Relative frequencies of readByte sizes.
         *  2011: readBytes 2
         *  1853: readBytes 1 - Special cased.
         *  1421: readBytes 4
         *  1170: readBytes 5
         *  1042: readBytes 3 - Special cased, most three byte buffers are signatures of the form "()?".
         *  1022: readBytes 6
         *
         * All other sizes are interned using a hashtable.
         */
        ByteStream.prototype.internBytes = function (length) {
            var o = this.offset;
            var buffer = this.buffer;
            var a = buffer[o];
            if (length === 1) {
                var one = ByteStream.internedOneByteArrays;
                var r = one[a];
                if (r === null) {
                    r = one[a] = new Uint8Array([a]);
                }
                return r;
            }
            else if (length === 3 &&
                a === 40 /* OpenParenthesis */) {
                var b = buffer[o + 1];
                if (b === 41 /* CloseParenthesis */) {
                    var three = ByteStream.internedThreeByteArraySignatures;
                    var c = buffer[o + 2];
                    for (var i = 0; i < three.length; i++) {
                        if (three[i][2] === c) {
                            return three[i];
                        }
                    }
                }
            }
            else {
                var data = ByteStream.internedMap.getByRange(buffer, o, length);
                if (data) {
                    return data;
                }
                var data = this.buffer.subarray(o, o + length);
                ByteStream.internedMap.put(data, data);
                return data;
            }
            return null;
        };
        ByteStream.prototype.readBytes = function (length) {
            var data = this.buffer.subarray(this.offset, this.offset + length);
            this.offset += length;
            return data;
        };
        ByteStream.prototype.readInternedBytes = function (length) {
            var data = length <= 4 ? this.internBytes(length) : null;
            if (data) {
                this.offset += data.length;
                return data;
            }
            return this.readBytes(length);
        };
        ByteStream.getArray = function (length) {
            return ByteStream.arrays[length];
        };
        // Decode Java's modified UTF-8 (JVM specs, $ 4.4.7)
        // http://docs.oracle.com/javase/specs/jvms/se5.0/html/ClassFile.doc.html#7963
        ByteStream.readStringFast = function (buffer) {
            var length = buffer.length;
            var a = (length < 128) ? ByteStream.getArray(length) : new Array(length);
            var i = 0, j = 0;
            var o = 0;
            var e = o + length;
            var buffer = buffer;
            while (o < e) {
                var x = buffer[o++];
                if (x <= 0x7f) {
                    // Code points in the range '\u0001' to '\u007F' are represented by a
                    // single byte.
                    // The 7 bits of data in the byte give the value of the code point
                    // represented.
                    a[j++] = String.fromCharCode(x);
                }
                else if (x <= 0xdf) {
                    // The null code point ('\u0000') and code points in the range '\u0080'
                    // to '\u07FF' are represented by a pair of bytes x and y.
                    var y = buffer[o++];
                    a[j++] = String.fromCharCode(((x & 0x1f) << 6) + (y & 0x3f));
                }
                else {
                    // Code points in the range '\u0800' to '\uFFFF' are represented by 3
                    // bytes x, y, and z.
                    var y = buffer[o++];
                    var z = buffer[o++];
                    a[j++] = String.fromCharCode(((x & 0xf) << 12) + ((y & 0x3f) << 6) + (z & 0x3f));
                }
            }
            if (j !== a.length) {
                var b = (j < 128) ? ByteStream.getArray(j) : new Array(j);
                for (var i = 0; i < j; i++) {
                    b[i] = a[i];
                }
                a = b;
            }
            return a.join("");
        };
        ByteStream.readString = function (buffer) {
            var length = buffer.length;
            if (length === 1) {
                var c = buffer[0];
                if (c <= 0x7f) {
                    return String.fromCharCode(c);
                }
            }
            else if (length < 128) {
                return ByteStream.readStringFast(buffer);
            }
            return ByteStream.readStringSlow(buffer);
        };
        ByteStream.readStringSlow = function (buffer) {
            // First try w/ TextDecoder, fallback to manually parsing if there was an
            // error. This will handle parsing errors resulting from Java's modified
            // UTF-8 implementation.
            try {
                return util.decodeUtf8Array(buffer);
            }
            catch (e) {
                return this.readStringFast(buffer);
            }
        };
        ByteStream.readU16 = function (buffer, o) {
            return buffer[o] << 8 | buffer[o + 1];
        };
        ByteStream.internedOneByteArrays = J2ME.ArrayUtilities.makeDenseArray(256, null);
        // Most common tree byte arrays signatures, these must all be prefixed with "()". If you want
        // to support more complicated patterns, modify |readInternedBytes|.
        ByteStream.internedThreeByteArraySignatures = [
            new Uint8Array([40, 41, 86]),
            new Uint8Array([40, 41, 73]),
            new Uint8Array([40, 41, 90]),
            new Uint8Array([40, 41, 74]),
        ];
        ByteStream.internedMap = new J2ME.TypedArrayHashtable(64);
        ByteStream.arrays = J2ME.ArrayUtilities.makeArrays(128);
        return ByteStream;
    })();
    J2ME.ByteStream = ByteStream;
    (function (ACCESS_FLAGS) {
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_PUBLIC"] = 1] = "ACC_PUBLIC";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_PRIVATE"] = 2] = "ACC_PRIVATE";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_PROTECTED"] = 4] = "ACC_PROTECTED";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_STATIC"] = 8] = "ACC_STATIC";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_FINAL"] = 16] = "ACC_FINAL";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_SYNCHRONIZED"] = 32] = "ACC_SYNCHRONIZED";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_VOLATILE"] = 64] = "ACC_VOLATILE";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_TRANSIENT"] = 128] = "ACC_TRANSIENT";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_NATIVE"] = 256] = "ACC_NATIVE";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_INTERFACE"] = 512] = "ACC_INTERFACE";
        ACCESS_FLAGS[ACCESS_FLAGS["ACC_ABSTRACT"] = 1024] = "ACC_ABSTRACT";
        ACCESS_FLAGS[ACCESS_FLAGS["J2ME_IMPLEMENTS_INTERFACE"] = 65536] = "J2ME_IMPLEMENTS_INTERFACE";
    })(J2ME.ACCESS_FLAGS || (J2ME.ACCESS_FLAGS = {}));
    var ACCESS_FLAGS = J2ME.ACCESS_FLAGS;
    (function (TAGS) {
        TAGS[TAGS["CONSTANT_Class"] = 7] = "CONSTANT_Class";
        TAGS[TAGS["CONSTANT_Fieldref"] = 9] = "CONSTANT_Fieldref";
        TAGS[TAGS["CONSTANT_Methodref"] = 10] = "CONSTANT_Methodref";
        TAGS[TAGS["CONSTANT_InterfaceMethodref"] = 11] = "CONSTANT_InterfaceMethodref";
        TAGS[TAGS["CONSTANT_String"] = 8] = "CONSTANT_String";
        TAGS[TAGS["CONSTANT_Integer"] = 3] = "CONSTANT_Integer";
        TAGS[TAGS["CONSTANT_Float"] = 4] = "CONSTANT_Float";
        TAGS[TAGS["CONSTANT_Long"] = 5] = "CONSTANT_Long";
        TAGS[TAGS["CONSTANT_Double"] = 6] = "CONSTANT_Double";
        TAGS[TAGS["CONSTANT_NameAndType"] = 12] = "CONSTANT_NameAndType";
        TAGS[TAGS["CONSTANT_Utf8"] = 1] = "CONSTANT_Utf8";
        TAGS[TAGS["CONSTANT_Unicode"] = 2] = "CONSTANT_Unicode";
        TAGS[TAGS["CONSTANT_Any"] = 13] = "CONSTANT_Any"; // NON-STANDARD
    })(J2ME.TAGS || (J2ME.TAGS = {}));
    var TAGS = J2ME.TAGS;
    function getTAGSName(tag) {
        return J2ME.TAGS[tag];
    }
    J2ME.getTAGSName = getTAGSName;
    var ConstantPool = (function (_super) {
        __extends(ConstantPool, _super);
        function ConstantPool(stream) {
            _super.call(this, stream.buffer, stream.offset);
            this.scanEntries();
        }
        /**
         * Quickly scan over the constant pool and record the position of each constant pool entry.
         */
        ConstantPool.prototype.scanEntries = function () {
            var s = this;
            var c = s.readU2();
            this.entries = new Uint32Array(c);
            // We make this dense because the access pattern is pretty random, and it would otherwise
            // cause lots of ION bailouts.
            this.resolved = J2ME.ArrayUtilities.makeDenseArray(c, undefined);
            var S = ConstantPool.tagSize;
            var o = s.offset;
            var buffer = s.buffer;
            var e = this.entries;
            for (var i = 1; i < c; i++) {
                e[i] = o;
                var t = buffer[o++];
                if (t === 1 /* CONSTANT_Utf8 */) {
                    o += 2 + ByteStream.readU16(buffer, o);
                }
                else {
                    o += S[t];
                }
                if (t === 5 /* CONSTANT_Long */ || t === 6 /* CONSTANT_Double */) {
                    i++;
                }
            }
            s.offset = o;
        };
        ConstantPool.prototype.resolveUtf8 = function (i) {
            return this.resolve(i, 1 /* CONSTANT_Utf8 */);
        };
        /**
         * Reads a 16-bit number at an offset from the constant pool entry index.
         */
        ConstantPool.prototype.readTagU2 = function (i, tag, offset) {
            var b = this.buffer;
            release || assert(b[this.entries[i]] === tag, "readTagU2 failure");
            var o = this.entries[i] + offset;
            return b[o] << 8 | b[o + 1];
        };
        /**
         * Seeks the current stream position to a specified constant pool entry and
         * returns the tag value.
         */
        ConstantPool.prototype.seekTag = function (i) {
            this.seek(this.entries[i]);
            return this.peekU1();
        };
        ConstantPool.prototype.peekTag = function (i) {
            return this.buffer[this.entries[i]];
        };
        /**
         * This causes the Utf8 string to be redecoded each time so don't use it often.
         */
        ConstantPool.prototype.resolveUtf8String = function (i) {
            if (i === 0)
                return null;
            var u8 = this.resolveUtf8(i);
            return ByteStream.readString(u8);
        };
        ConstantPool.prototype.resolveUtf8ClassNameString = function (i) {
            if (i === 0)
                return null;
            return this.resolveUtf8String(this.readTagU2(i, 7 /* CONSTANT_Class */, 1));
        };
        ConstantPool.prototype.resolveUtf8ClassName = function (i) {
            if (i === 0)
                return null;
            return this.resolveUtf8(this.readTagU2(i, 7 /* CONSTANT_Class */, 1));
        };
        ConstantPool.prototype.getConstantTag = function (i) {
            return this.seekTag(i);
        };
        ConstantPool.prototype.resolveString = function (i) {
            var s = this;
            var tag = s.seekTag(i);
            release || assert(tag === 8 /* CONSTANT_String */, "resolveString failure");
            s.readU1();
            return this.resolveUtf8String(s.readU2());
        };
        /**
         * Resolves a constant pool reference.
         */
        ConstantPool.prototype.resolve = function (i, expectedTag, isStatic) {
            if (isStatic === void 0) { isStatic = false; }
            var s = this, r = this.resolved[i];
            if (r === undefined) {
                var tag = this.seekTag(i);
                release || J2ME.Debug.assert(expectedTag === 13 /* CONSTANT_Any */ || expectedTag === tag ||
                    (expectedTag === 10 /* CONSTANT_Methodref */ && tag === 11 /* CONSTANT_InterfaceMethodref */), "bad expectedTag in resolve");
                switch (s.readU1()) {
                    case 8 /* CONSTANT_String */:
                        r = this.resolved[i] = $.newStringConstant(ByteStream.UTF8toUTF16(this.resolveUtf8(s.readU2())));
                        break;
                    case 1 /* CONSTANT_Utf8 */:
                        r = this.resolved[i] = s.readInternedBytes(s.readU2());
                        break;
                    case 7 /* CONSTANT_Class */:
                        r = this.resolved[i] = J2ME.CLASSES.getClass(ByteStream.readString(this.resolve(s.readU2(), 1 /* CONSTANT_Utf8 */)));
                        break;
                    case 9 /* CONSTANT_Fieldref */:
                    case 10 /* CONSTANT_Methodref */:
                    case 11 /* CONSTANT_InterfaceMethodref */:
                        var class_index = s.readU2();
                        var name_and_type_index = s.readU2();
                        var classInfo = this.resolveClass(class_index);
                        var name_index = this.readTagU2(name_and_type_index, 12 /* CONSTANT_NameAndType */, 1);
                        var type_index = this.readTagU2(name_and_type_index, 12 /* CONSTANT_NameAndType */, 3);
                        var name = this.resolveUtf8(name_index);
                        var type = this.resolveUtf8(type_index);
                        if (tag === 9 /* CONSTANT_Fieldref */) {
                            r = classInfo.getFieldByName(name, type, isStatic);
                        }
                        else {
                            r = classInfo.getMethodByName(name, type);
                        }
                        if (!r) {
                            throw new J2ME.JavaRuntimeException(classInfo.getClassNameSlow() + "." + fromUTF8(name) + "." + fromUTF8(type) + " not found");
                        }
                        // Set the method/field as resolved only if it was actually found, otherwise a new attempt to
                        // resolve this method/field will not fail with a RuntimeException.
                        this.resolved[i] = r;
                        break;
                    default:
                        assert(false, "bad type (" + expectedTag + ") in resolve");
                        break;
                }
            }
            return r;
        };
        ConstantPool.prototype.resolveClass = function (index) {
            return this.resolve(index, 7 /* CONSTANT_Class */);
        };
        ConstantPool.prototype.resolveMethod = function (index, isStatic) {
            return this.resolve(index, 10 /* CONSTANT_Methodref */, isStatic);
        };
        ConstantPool.prototype.resolveField = function (index, isStatic) {
            return this.resolve(index, 9 /* CONSTANT_Fieldref */, isStatic);
        };
        /**
         * Size of each tag. This is used to jump over constant pool entries quickly.
         */
        ConstantPool.tagSize = new Int8Array([
            -1,
            -1,
            -1,
            4,
            4,
            8,
            8,
            2,
            2,
            4,
            4,
            4,
            4 // CONSTANT_NameAndType
        ]);
        return ConstantPool;
    })(ByteStream);
    J2ME.ConstantPool = ConstantPool;
    var FieldInfo = (function (_super) {
        __extends(FieldInfo, _super);
        function FieldInfo(classInfo, offset) {
            _super.call(this, classInfo.buffer, offset);
            this.byteOffset = 0;
            this.mangledName = null;
            this.fTableIndex = -1;
            this.classInfo = classInfo;
            this.accessFlags = this.readU2();
            this.utf8Name = classInfo.constantPool.resolveUtf8(this.readU2());
            this.utf8Signature = classInfo.constantPool.resolveUtf8(this.readU2());
            this.kind = J2ME.getSignatureKind(this.utf8Signature);
            this.scanFieldInfoAttributes();
            sealObjects && Object.seal(this);
        }
        Object.defineProperty(FieldInfo.prototype, "isStatic", {
            get: function () {
                return !!(this.accessFlags & 8 /* ACC_STATIC */);
            },
            enumerable: true,
            configurable: true
        });
        FieldInfo.prototype.scanFieldInfoAttributes = function () {
            var s = this;
            var attributes_count = s.readU2();
            for (var i = 0; i < attributes_count; i++) {
                var attribute_name_index = s.readU2();
                var attribute_length = s.readU4();
                var o = s.offset;
                var attribute_name = this.classInfo.constantPool.resolveUtf8(attribute_name_index);
                if (strcmp(attribute_name, UTF8.ConstantValue)) {
                    release || assert(attribute_length === 2, "Attribute length of ConstantValue must be 2.");
                }
                s.seek(o + attribute_length);
            }
        };
        return FieldInfo;
    })(ByteStream);
    J2ME.FieldInfo = FieldInfo;
    var SourceLocation = (function () {
        function SourceLocation(className, sourceFile, lineNumber) {
            this.className = className;
            this.sourceFile = sourceFile;
            this.lineNumber = lineNumber;
            // ...
        }
        SourceLocation.prototype.toString = function () {
            return this.sourceFile + ":" + this.lineNumber;
        };
        SourceLocation.prototype.equals = function (other) {
            if (!other) {
                return false;
            }
            return this.sourceFile === other.sourceFile &&
                this.lineNumber === other.lineNumber;
        };
        return SourceLocation;
    })();
    J2ME.SourceLocation = SourceLocation;
    var MethodInfoStats = (function () {
        function MethodInfoStats() {
            this.callCount = 0;
            this.bytecodeCount = 0;
            this.backwardsBranchCount = 0;
            this.interpreterCallCount = 0;
        }
        return MethodInfoStats;
    })();
    J2ME.MethodInfoStats = MethodInfoStats;
    var ExceptionEntryView = (function (_super) {
        __extends(ExceptionEntryView, _super);
        function ExceptionEntryView() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(ExceptionEntryView.prototype, "start_pc", {
            get: function () {
                return this.u2(0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ExceptionEntryView.prototype, "end_pc", {
            get: function () {
                return this.u2(2);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ExceptionEntryView.prototype, "handler_pc", {
            get: function () {
                return this.u2(4);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ExceptionEntryView.prototype, "catch_type", {
            get: function () {
                return this.u2(6);
            },
            enumerable: true,
            configurable: true
        });
        return ExceptionEntryView;
    })(ByteStream);
    J2ME.ExceptionEntryView = ExceptionEntryView;
    function mangleClassAndMethod(methodInfo) {
        return methodInfo.classInfo.mangledName + "_" + methodInfo.index;
    }
    J2ME.mangleClassAndMethod = mangleClassAndMethod;
    function mangleMethod(methodInfo) {
        var utf8Name = methodInfo.utf8Name;
        var utf8Signature = methodInfo.utf8Signature;
        var hash = hashBytesTo32BitsMurmur(utf8Name, 0, utf8Name.length);
        hash ^= hashBytesTo32BitsMurmur(utf8Signature, 0, utf8Signature.length);
        return "$" + J2ME.StringUtilities.variableLengthEncodeInt32(hash);
    }
    J2ME.mangleMethod = mangleMethod;
    /**
     * Encodes variable length utf8 alpha strings of the form [a-z]* to
     * 32 bit numbers. Below are some sample encodings:
     *
     *  "" => 0
     *  "a" => 1
     *  "b" => 2 ...
     *  "z" => 26
     *  "aa" => 27
     *  "ab" => 28 ...
     *  "zz" => 703
     *  "aaa" => 704
     *  "azz" => 1378
     *  "zzz" => 18278
     *
     *  The goal of this encoding is to map short strings to low numeric values
     *  that we can then use to index into tables.
     */
    function lowerCaseAlphaToInt32(utf8String) {
        // We can't encode strings larger than 6 characters because we don't
        // have enough bits. Technically the limit is somewhere between 6 and 7
        // but we don't bother to check that here.
        if (utf8String.length > 6) {
            // It's okay to return |-1| as a fail value since we'll never use the
            // highest order bit for encoding.
            return -1;
        }
        var s = 0;
        for (var i = 0; i < utf8String.length; i++) {
            var v = utf8String[i] - 97 /* a */;
            if (v < 0 || v >= 26) {
                return -1;
            }
            s *= 26;
            s += (1 + v); // 'a' is mapped to 1.
        }
        return s;
    }
    J2ME.lowerCaseAlphaToInt32 = lowerCaseAlphaToInt32;
    function mangleClassName(utf8Name) {
        var hash = lowerCaseAlphaToInt32(utf8Name);
        if (hash > 0 && hash < 2048) {
            return "$" + fromUTF8(utf8Name);
        }
        var hash = hashBytesTo32BitsMurmur(utf8Name, 0, utf8Name.length);
        return concat3("$", J2ME.StringUtilities.variableLengthEncodeInt32(hash), J2ME.StringUtilities.toEncoding(utf8Name.length & 0x3f));
    }
    J2ME.mangleClassName = mangleClassName;
    var MethodInfo = (function (_super) {
        __extends(MethodInfo, _super);
        function MethodInfo(classInfo, offset, index) {
            _super.call(this, classInfo.buffer, offset);
            this.fn = null;
            this._virtualName = null;
            this._mangledName = null;
            this._mangledClassAndMethodName = null;
            this._implKey = null;
            this._name = null;
            this._signature = null;
            ///// FIX THESE LATER ////
            this.onStackReplacementEntryPoints = null;
            this.exception_table_length = -1;
            this.exception_table_offset = -1;
            this.isOptimized = false;
            this.id = MethodInfo.nextId++;
            J2ME.registerMethodId(this.id, this);
            this.index = index;
            this.accessFlags = this.u2(0);
            this.classInfo = classInfo;
            var cp = this.classInfo.constantPool;
            this.utf8Name = cp.resolveUtf8(this.u2(2));
            this.utf8Signature = cp.resolveUtf8(this.u2(4));
            this.vTableIndex = -1;
            this.state = 0 /* Cold */;
            this.stats = new MethodInfoStats();
            this.codeAttribute = null;
            this.scanMethodInfoAttributes();
            // Parse signature and cache some useful information.
            var signatureKinds = this.signatureKinds = J2ME.parseMethodDescriptorKinds(this.utf8Signature, 0).slice();
            this.returnKind = signatureKinds[0];
            this.hasTwoSlotArguments = J2ME.signatureHasTwoSlotArguments(signatureKinds);
            this.signatureSlots = J2ME.signatureArgumentSlotCount(signatureKinds);
            this.argumentSlots = this.signatureSlots;
            if (!this.isStatic) {
                this.argumentSlots++;
            }
            sealObjects && Object.seal(this);
        }
        /**
         * Clones this method info.
         */
        MethodInfo.prototype.cloneMethodInfo = function () {
            return new MethodInfo(this.classInfo, this.offset, this.index);
        };
        Object.defineProperty(MethodInfo.prototype, "virtualName", {
            get: function () {
                if (this.vTableIndex >= 0) {
                    return this._virtualName || (this._virtualName = "v" + this.vTableIndex);
                }
                return undefined;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "mangledName", {
            get: function () {
                return this._mangledName || (this._mangledName = mangleMethod(this));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "mangledClassAndMethodName", {
            get: function () {
                return this._mangledClassAndMethodName || (this._mangledClassAndMethodName = mangleClassAndMethod(this));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "name", {
            get: function () {
                return this._name || (this._name = ByteStream.readString(this.utf8Name));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "signature", {
            get: function () {
                return this._signature || (this._signature = ByteStream.readString(this.utf8Signature));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "implementsInterface", {
            get: function () {
                return !!(this.accessFlags & 65536 /* J2ME_IMPLEMENTS_INTERFACE */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "implKey", {
            get: function () {
                return this._implKey || (this._implKey = this.classInfo.getClassNameSlow() + "." + this.name + "." + this.signature);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "isNative", {
            get: function () {
                if (!release) {
                    if (Native[this.implKey]) {
                        return true;
                    }
                }
                return !!(this.accessFlags & 256 /* ACC_NATIVE */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "isFinal", {
            get: function () {
                return !!(this.accessFlags & 16 /* ACC_FINAL */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "isPublic", {
            get: function () {
                return !!(this.accessFlags & 1 /* ACC_PUBLIC */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "isStatic", {
            get: function () {
                return !!(this.accessFlags & 8 /* ACC_STATIC */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "isSynchronized", {
            get: function () {
                return !!(this.accessFlags & 32 /* ACC_SYNCHRONIZED */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MethodInfo.prototype, "isAbstract", {
            get: function () {
                return !!(this.accessFlags & 1024 /* ACC_ABSTRACT */);
            },
            enumerable: true,
            configurable: true
        });
        MethodInfo.prototype.getSourceLocationForPC = function (pc) {
            return null;
        };
        MethodInfo.prototype.getExceptionEntryViewByIndex = function (i) {
            if (i >= this.exception_table_length) {
                return null;
            }
            return new ExceptionEntryView(this.buffer, this.exception_table_offset + i * 8);
        };
        MethodInfo.prototype.scanMethodInfoAttributes = function () {
            var b = this.offset;
            var s = this.skip(6);
            var count = s.readU2();
            for (var i = 0; i < count; i++) {
                var attribute_name_index = s.readU2();
                var attribute_length = s.readU4();
                var o = s.offset;
                var attribute_name = this.classInfo.constantPool.resolveUtf8(attribute_name_index);
                if (strcmp(attribute_name, UTF8.Code)) {
                    this.codeAttribute = new CodeAttribute(s);
                    this.exception_table_length = s.readU2();
                    this.exception_table_offset = s.offset;
                }
                s.seek(o + attribute_length);
            }
            this.seek(b);
        };
        MethodInfo.nextId = 1;
        return MethodInfo;
    })(ByteStream);
    J2ME.MethodInfo = MethodInfo;
    var ResolvedFlags;
    (function (ResolvedFlags) {
        ResolvedFlags[ResolvedFlags["None"] = 0] = "None";
        ResolvedFlags[ResolvedFlags["Fields"] = 1] = "Fields";
        ResolvedFlags[ResolvedFlags["Methods"] = 2] = "Methods";
        ResolvedFlags[ResolvedFlags["Interfaces"] = 4] = "Interfaces";
    })(ResolvedFlags || (ResolvedFlags = {}));
    var CodeAttribute = (function () {
        function CodeAttribute(s) {
            this.max_stack = s.readU2();
            this.max_locals = s.readU2();
            var code_length = s.readU4();
            // We don't call |readInternedBytes| because the returned bytes can be modified by the
            // interpreter, and interned bytes must be immutable.
            this.code = s.readBytes(code_length);
        }
        return CodeAttribute;
    })();
    J2ME.CodeAttribute = CodeAttribute;
    function indexOfMethod(table, utf8Name, utf8Signature, indexHint) {
        // Quick test using the index hint.
        if (indexHint >= 0) {
            if (strcmp(utf8Name, table[indexHint].utf8Name) && strcmp(utf8Signature, table[indexHint].utf8Signature)) {
                return indexHint;
            }
        }
        for (var i = 0; i < table.length; i++) {
            var methodInfo = table[i];
            var methodUTF8Name = methodInfo.utf8Name;
            if (utf8Name.length !== methodUTF8Name.length || utf8Name[0] !== methodUTF8Name[0]) {
                continue;
            }
            if (strcmp(utf8Name, methodUTF8Name) && strcmp(utf8Signature, methodInfo.utf8Signature)) {
                return i;
            }
        }
        return -1;
    }
    // Very simple hash map that uses Uint8Array keys.
    var hashMapSizeMask = 0xff;
    function setHashMapValue(cache, key, value) {
        var hash = key[0] + Math.imul(key.length, 31);
        cache[hash & 0xff] = value;
    }
    function getHashMapValue(cache, key) {
        var hash = key[0] + Math.imul(key.length, 31);
        return cache[hash & 0xff];
    }
    var ClassInfo = (function (_super) {
        __extends(ClassInfo, _super);
        function ClassInfo(buffer) {
            _super.call(this, buffer, 0);
            this.constantPool = null;
            this.utf8Name = null;
            this.utf8SuperName = null;
            this.superClass = null;
            this.elementClass = null;
            this.subClasses = [];
            this.allSubClasses = [];
            // Class hierarchy depth.
            this.depth = 0;
            this.display = null;
            this.accessFlags = 0;
            this.vTable = null;
            // This is not really a table per se, but rather a map.
            this.iTable = Object.create(null);
            // Custom hash map to make vTable name lookups quicker. It maps utf8 method names to indices in
            // the vTable. A zero value indicate no method by that name exists, while a value > 0 indicates
            // that a method entry at |value - 1| position exists in the vTable whose hash matches they
            // lookup key. We can use this map as a quick way to detect if a method doesn't exist in the
            // vTable.
            this.vTableMap = null;
            this.fTable = null;
            this.sizeOfFields = 0;
            this.sizeOfStaticFields = 0;
            this.resolvedFlags = 0 /* None */;
            this.fields = null;
            this.methods = null;
            this.interfaces = null;
            this.allInterfaces = null;
            this.sourceFile = null;
            this.mangledName = null;
            this._name = null;
            this._superName = null;
            this.id = ClassInfo.nextId++;
            J2ME.registerClassId(this.id, this);
            if (!buffer) {
                sealObjects && Object.seal(this);
                return;
            }
            J2ME.enterTimeline("ClassInfo");
            var s = this;
            s.skipU4(); // magic
            s.skipU4(); // minor_version and major_version
            this.constantPool = new ConstantPool(s);
            s.seek(this.constantPool.offset);
            this.accessFlags = s.readU2();
            this.utf8Name = this.constantPool.resolveUtf8ClassName(s.readU2());
            this.utf8SuperName = this.constantPool.resolveUtf8ClassName(s.readU2());
            this.vTable = [];
            this.fTable = [];
            this.scanInterfaces();
            this.scanFields();
            this.scanMethods();
            this.scanClassInfoAttributes();
            this.mangledName = mangleClassName(this.utf8Name);
            J2ME.leaveTimeline("ClassInfo");
            sealObjects && Object.seal(this);
        }
        /**
         * Creates synthetic methodInfo objects in abstract classes for all unimplemented
         * interface methods. This is needed so that vTable entries are created correctly
         * for abstract classes that don't otherwise define methods for their implemented
         * interface.
         */
        ClassInfo.prototype.createAbstractMethods = function () {
            // We only do this for abstract classes. Sometimes, interfaces are also marked
            // as abstract but they aren't really.
            if (!this.isAbstract || this.isInterface) {
                return;
            }
            var methods = this.getMethods();
            var interfaces = this.getInterfaces();
            for (var i = 0; i < interfaces.length; i++) {
                var c = interfaces[i];
                for (var j = 0; j < c.methods.length; j++) {
                    var methodInfo = c.getMethodByIndex(j);
                    if (methodInfo.isStatic || strcmp(methodInfo.utf8Name, UTF8.Init)) {
                        // Ignore static methods.
                        continue;
                    }
                    var index = indexOfMethod(methods, methodInfo.utf8Name, methodInfo.utf8Signature, -1);
                    if (index < 0) {
                        // Make a copy of the interface method info and add it to the current list of
                        // virtual class methods. The vTable construction will give this a proper
                        // vTable index later.
                        var abstractMethod = methodInfo.cloneMethodInfo();
                        methods.push(abstractMethod);
                    }
                }
            }
        };
        ClassInfo.prototype.scanInterfaces = function () {
            var b = this;
            var interfaces_count = b.readU2();
            this.interfaces = new Array(interfaces_count);
            for (var i = 0; i < interfaces_count; i++) {
                this.interfaces[i] = b.readU2();
            }
        };
        ClassInfo.prototype.scanFields = function () {
            var s = this;
            var fields_count = s.readU2();
            var f = this.fields = new Array(fields_count);
            for (var i = 0; i < fields_count; i++) {
                f[i] = s.offset;
                s.skip(6);
                this.skipAttributes();
            }
        };
        ClassInfo.prototype.getClassNameSlow = function () {
            return this._name || (this._name = ByteStream.readString(this.utf8Name));
        };
        Object.defineProperty(ClassInfo.prototype, "superClassName", {
            get: function () {
                if (this.utf8SuperName) {
                    return this._superName || (this._superName = ByteStream.readString(this.utf8SuperName));
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Gets the class hierarchy in derived -> base order.
         */
        ClassInfo.prototype.getClassHierarchy = function () {
            var classHierarchy = [];
            var classInfo = this;
            do {
                classHierarchy.push(classInfo);
                classInfo = classInfo.superClass;
            } while (classInfo);
            return classHierarchy;
        };
        ClassInfo.prototype.trace = function (writer) {
            writer.enter(this.getClassNameSlow() + " VTable:");
            for (var i = 0; i < this.vTable.length; i++) {
                writer.writeLn(i + ": " + ByteStream.readString(this.vTable[i].utf8Name) + "." + ByteStream.readString(this.vTable[i].utf8Signature));
            }
            writer.leave("");
        };
        ClassInfo.prototype.complete = function () {
            this.createAbstractMethods();
            if (!this.isInterface) {
                this.buildVTable();
                this.buildITable();
                this.buildFTable();
            }
            // Notify the runtime so it can perform and necessary setup.
            if (J2ME.RuntimeTemplate) {
                J2ME.RuntimeTemplate.classInfoComplete(this);
            }
            J2ME.loadWriter && this.trace(J2ME.loadWriter);
        };
        /**
         * Constructs the VTable for this class by appending to or overriding methods
         * in the super class VTable.
         */
        ClassInfo.prototype.buildVTable = function () {
            var superClassVTable = this.superClass ? this.superClass.vTable : null;
            var vTable = this.vTable = superClassVTable ? superClassVTable.slice() : [];
            var vTableMap = this.vTableMap = new Uint16Array(hashMapSizeMask + 1);
            var superClassVTableMap = null;
            if (this.superClass) {
                superClassVTableMap = this.superClass.vTableMap;
                vTableMap.set(superClassVTableMap);
            }
            var methods = this.methods;
            if (!methods) {
                return;
            }
            for (var i = 0; i < methods.length; i++) {
                var methodInfo = this.getMethodByIndex(i);
                if (!methodInfo.isStatic && !strcmp(methodInfo.utf8Name, UTF8.Init)) {
                    var vTableIndex = -1;
                    if (superClassVTable) {
                        vTableIndex = getHashMapValue(superClassVTableMap, methodInfo.utf8Name) - 1;
                        if (vTableIndex >= 0) {
                            vTableIndex = indexOfMethod(superClassVTable, methodInfo.utf8Name, methodInfo.utf8Signature, vTableIndex);
                        }
                    }
                    if (vTableIndex < 0) {
                        methodInfo.vTableIndex = vTable.length;
                        vTable.push(methodInfo); // Append
                        setHashMapValue(vTableMap, methodInfo.utf8Name, methodInfo.vTableIndex + 1);
                    }
                    else {
                        vTable[vTableIndex] = methodInfo; // Override
                        methodInfo.vTableIndex = vTableIndex;
                    }
                }
            }
            // Go through all the interfaces and mark all methods in the vTable that implement interface methods.
            var interfaces = this.getAllInterfaces();
            for (var i = 0; i < interfaces.length; i++) {
                var c = interfaces[i];
                for (var j = 0; j < c.methods.length; j++) {
                    var methodInfo = c.getMethodByIndex(j);
                    var vTableIndex = indexOfMethod(this.vTable, methodInfo.utf8Name, methodInfo.utf8Signature, -1);
                    if (vTableIndex >= 0) {
                        this.vTable[vTableIndex].accessFlags |= 65536 /* J2ME_IMPLEMENTS_INTERFACE */;
                    }
                }
            }
        };
        ClassInfo.prototype.buildITable = function () {
            var vTable = this.vTable;
            var iTable = this.iTable;
            for (var i = 0; i < vTable.length; i++) {
                var methodInfo = vTable[i];
                // TODO: Find out why only doing this when |methodInfo.implementsInterface| is |true|, fails.
                release || assert(methodInfo.mangledName, "methodInfo.mangledName");
                release || assert(!iTable[methodInfo.mangledName], "!iTable[methodInfo.mangledName]");
                iTable[methodInfo.mangledName] = methodInfo;
            }
        };
        ClassInfo.prototype.buildFTable = function () {
            if (this.superClass === null) {
                this.sizeOfFields = 0;
                this.sizeOfStaticFields = 0;
            }
            else {
                this.sizeOfFields = this.superClass.sizeOfFields;
                this.sizeOfStaticFields = this.superClass.sizeOfStaticFields;
            }
            var superClassFTable = this.superClass ? this.superClass.fTable : null;
            var fTable = this.fTable = superClassFTable ? superClassFTable.slice() : [];
            var fields = this.fields;
            if (!fields) {
                return;
            }
            for (var i = 0; i < fields.length; i++) {
                var fieldInfo = this.getFieldByIndex(i);
                if (!fieldInfo.isStatic) {
                    fieldInfo.fTableIndex = fTable.length;
                    fTable.push(fieldInfo); // Append
                    fieldInfo.mangledName = "f" + fieldInfo.fTableIndex;
                    fieldInfo.byteOffset = 8 /* OBJ_HDR_SIZE */ + this.sizeOfFields;
                    this.sizeOfFields += J2ME.kindSize(fieldInfo.kind);
                }
                else {
                    fieldInfo.mangledName = "s" + i;
                    fieldInfo.byteOffset = 8 /* OBJ_HDR_SIZE */ + this.sizeOfStaticFields;
                    this.sizeOfStaticFields += J2ME.kindSize(fieldInfo.kind);
                }
            }
        };
        ClassInfo.prototype.scanMethods = function () {
            var s = this;
            var methods_count = s.readU2();
            var m = this.methods = new Array(methods_count);
            for (var i = 0; i < methods_count; i++) {
                m[i] = s.offset;
                s.skip(6);
                this.skipAttributes();
            }
        };
        ClassInfo.prototype.addVTableEntry = function (accessFlags, name_index, descriptor_index) {
        };
        ClassInfo.prototype.skipAttributes = function () {
            var s = this;
            var attributes_count = s.readU2();
            for (var i = 0; i < attributes_count; i++) {
                s.readU2();
                s.skip(s.readU4());
            }
        };
        ClassInfo.prototype.scanClassInfoAttributes = function () {
            var s = this;
            var attributes_count = s.readU2();
            for (var i = 0; i < attributes_count; i++) {
                var attribute_name_index = s.readU2();
                var attribute_length = s.readU4();
                var o = s.offset;
                s.seek(o + attribute_length);
            }
        };
        ClassInfo.prototype.getMethodByIndex = function (i) {
            if (typeof this.methods[i] === "number") {
                var methodInfo = this.methods[i] = new MethodInfo(this, this.methods[i], i);
            }
            var methodInfo = this.methods[i];
            return methodInfo;
        };
        ClassInfo.prototype.indexOfMethod = function (utf8Name, utf8Signature) {
            var methods = this.methods;
            if (!methods) {
                return -1;
            }
            for (var i = 0; i < methods.length; i++) {
                var methodInfo = this.getMethodByIndex(i);
                var methodUTF8Name = methodInfo.utf8Name;
                if (utf8Name.length !== methodUTF8Name.length || utf8Name[0] !== methodUTF8Name[0]) {
                    continue;
                }
                if (strcmp(methodUTF8Name, utf8Name) && strcmp(methodInfo.utf8Signature, utf8Signature)) {
                    return i;
                }
            }
            return -1;
        };
        // This should only ever be used from code where the name and signature originate from JS strings.
        ClassInfo.prototype.getMethodByNameString = function (name, signature) {
            return this.getMethodByName(cacheUTF8(name), cacheUTF8(signature));
        };
        // This should only ever be used from code where the name and signature originate from JS strings.
        ClassInfo.prototype.getLocalMethodByNameString = function (name, signature) {
            return this.getLocalMethodByName(toUTF8(name), toUTF8(signature));
        };
        ClassInfo.prototype.getLocalMethodByName = function (utf8Name, utf8Signature) {
            var i = this.indexOfMethod(utf8Name, utf8Signature);
            if (i >= 0) {
                return this.getMethodByIndex(i);
            }
            return null;
        };
        ClassInfo.prototype.getMethodByName = function (utf8Name, utf8Signature) {
            var c = this;
            do {
                var i = c.indexOfMethod(utf8Name, utf8Signature);
                if (i >= 0) {
                    return c.getMethodByIndex(i);
                }
                c = c.superClass;
            } while (c);
            if (this.isInterface) {
                var interfaces = this.getInterfaces();
                for (var n = 0; n < interfaces.length; ++n) {
                    var method = interfaces[n].getMethodByName(utf8Name, utf8Signature);
                    if (method) {
                        return method;
                    }
                }
            }
            return null;
        };
        ClassInfo.prototype.getMethodCount = function () {
            return this.methods ? this.methods.length : 0;
        };
        ClassInfo.prototype.getMethods = function () {
            if (!this.methods) {
                return J2ME.ArrayUtilities.EMPTY_ARRAY;
            }
            if (this.resolvedFlags & 2 /* Methods */) {
                return this.methods;
            }
            for (var i = 0; i < this.methods.length; i++) {
                this.getMethodByIndex(i);
            }
            this.resolvedFlags |= 2 /* Methods */;
            return this.methods;
        };
        ClassInfo.prototype.getFieldByIndex = function (i) {
            if (typeof this.fields[i] === "number") {
                this.fields[i] = new FieldInfo(this, this.fields[i]);
            }
            return this.fields[i];
        };
        ClassInfo.prototype.indexOfField = function (utf8Name, utf8Signature) {
            var fields = this.fields;
            if (!fields) {
                return -1;
            }
            for (var i = 0; i < fields.length; i++) {
                var fieldInfo = this.getFieldByIndex(i);
                var fieldUTF8Name = fieldInfo.utf8Name;
                if (utf8Name.length !== fieldUTF8Name.length || utf8Name[0] !== fieldUTF8Name[0]) {
                    continue;
                }
                if (strcmp(fieldUTF8Name, utf8Name) && strcmp(fieldInfo.utf8Signature, utf8Signature)) {
                    return i;
                }
            }
            return -1;
        };
        ClassInfo.prototype.getFieldByName = function (utf8Name, utf8Signature, isStatic) {
            var c = this;
            do {
                var i = c.indexOfField(utf8Name, utf8Signature);
                if (i >= 0) {
                    return c.getFieldByIndex(i);
                }
                if (isStatic) {
                    var interfaces = c.getAllInterfaces();
                    for (var n = 0; n < interfaces.length; ++n) {
                        var field = interfaces[n].getFieldByName(utf8Name, utf8Signature, isStatic);
                        if (field) {
                            return field;
                        }
                    }
                }
                c = c.superClass;
            } while (c);
            return null;
        };
        ClassInfo.prototype.getFields = function () {
            if (!this.fields) {
                return J2ME.ArrayUtilities.EMPTY_ARRAY;
            }
            if (this.resolvedFlags & 1 /* Fields */) {
                return this.fields;
            }
            for (var i = 0; i < this.fields.length; i++) {
                this.getFieldByIndex(i);
            }
            this.resolvedFlags |= 1 /* Fields */;
            return this.fields;
        };
        ClassInfo.prototype.getInterface = function (i) {
            if (typeof this.interfaces[i] === "number") {
                this.interfaces[i] = this.constantPool.resolveClass(this.interfaces[i]);
            }
            return this.interfaces[i];
        };
        ClassInfo.prototype.getInterfaces = function () {
            if (!this.interfaces) {
                return J2ME.ArrayUtilities.EMPTY_ARRAY;
            }
            if (this.resolvedFlags & 4 /* Interfaces */) {
                return this.interfaces;
            }
            for (var i = 0; i < this.interfaces.length; i++) {
                this.getInterface(i);
            }
            this.resolvedFlags |= 4 /* Interfaces */;
            return this.interfaces;
        };
        ClassInfo.prototype.getAllInterfaces = function () {
            if (this.allInterfaces) {
                return this.allInterfaces;
            }
            var interfaces = this.getInterfaces();
            var list = interfaces.slice();
            for (var i = 0; i < interfaces.length; i++) {
                pushMany(list, interfaces[i].getAllInterfaces());
            }
            if (this.superClass) {
                pushMany(list, this.superClass.getAllInterfaces());
            }
            return this.allInterfaces = unique(list);
        };
        Object.defineProperty(ClassInfo.prototype, "staticInitializer", {
            get: function () {
                return this.getMethodByNameString("<clinit>", "()V");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassInfo.prototype, "isInterface", {
            get: function () {
                return !!(this.accessFlags & 512 /* ACC_INTERFACE */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassInfo.prototype, "isAbstract", {
            get: function () {
                return !!(this.accessFlags & 1024 /* ACC_ABSTRACT */);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassInfo.prototype, "isFinal", {
            get: function () {
                return !!(this.accessFlags & 16 /* ACC_FINAL */);
            },
            enumerable: true,
            configurable: true
        });
        ClassInfo.prototype.implementsInterface = function (i) {
            var classInfo = this;
            do {
                var interfaces = classInfo.interfaces;
                for (var n = 0; n < interfaces.length; ++n) {
                    if (interfaces[n] === i)
                        return true;
                }
                classInfo = classInfo.superClass;
            } while (classInfo);
            return false;
        };
        ClassInfo.prototype.isAssignableTo = function (toClass) {
            if (this === toClass) {
                return true;
            }
            if (toClass.isInterface) {
                return this.getAllInterfaces().indexOf(toClass) >= 0;
            }
            else if (toClass.elementClass) {
                if (!this.elementClass) {
                    return false;
                }
                return this.elementClass.isAssignableTo(toClass.elementClass);
            }
            return this.getDisplay()[toClass.depth] === toClass;
        };
        /**
          * Creates lookup tables used to efficiently implement type checks.
          */
        ClassInfo.prototype.getDisplay = function () {
            if (this.display !== null) {
                return this.display;
            }
            var display = this.display = new Array(32);
            var i = this.depth;
            var classInfo = this;
            while (classInfo) {
                display[i--] = classInfo;
                classInfo = classInfo.superClass;
            }
            release || assert(i === -1, "i === -1");
            return this.display;
        };
        /**
         * We use this ID to map Java objects to their ClassInfo objects,
         * storing the ID for the Class in the first four bytes
         * of the memory allocated for the Java object in the ASM heap.
         *
         */
        ClassInfo.nextId = 1;
        return ClassInfo;
    })(ByteStream);
    J2ME.ClassInfo = ClassInfo;
    var PrimitiveClassInfo = (function (_super) {
        __extends(PrimitiveClassInfo, _super);
        function PrimitiveClassInfo(utf8Name, mangledName) {
            _super.call(this, null);
            this.utf8Name = utf8Name;
            this.mangledName = mangledName;
            this.complete();
        }
        PrimitiveClassInfo.Z = new PrimitiveClassInfo(UTF8.Z, "boolean");
        PrimitiveClassInfo.C = new PrimitiveClassInfo(UTF8.C, "char");
        PrimitiveClassInfo.F = new PrimitiveClassInfo(UTF8.F, "float");
        PrimitiveClassInfo.D = new PrimitiveClassInfo(UTF8.D, "double");
        PrimitiveClassInfo.B = new PrimitiveClassInfo(UTF8.B, "byte");
        PrimitiveClassInfo.S = new PrimitiveClassInfo(UTF8.S, "short");
        PrimitiveClassInfo.I = new PrimitiveClassInfo(UTF8.I, "int");
        PrimitiveClassInfo.J = new PrimitiveClassInfo(UTF8.J, "long");
        return PrimitiveClassInfo;
    })(ClassInfo);
    J2ME.PrimitiveClassInfo = PrimitiveClassInfo;
    var ArrayClassInfo = (function (_super) {
        __extends(ArrayClassInfo, _super);
        // XXX: This constructor should not be called directly.
        function ArrayClassInfo(elementClass) {
            _super.call(this, null);
            this.elementClass = elementClass;
            this.superClass = J2ME.CLASSES.java_lang_Object;
            this.superClassName = J2ME.CLASSES.java_lang_Object.getClassNameSlow();
            this.depth = 1;
        }
        return ArrayClassInfo;
    })(ClassInfo);
    J2ME.ArrayClassInfo = ArrayClassInfo;
    var ObjectArrayClassInfo = (function (_super) {
        __extends(ObjectArrayClassInfo, _super);
        function ObjectArrayClassInfo(elementClass) {
            _super.call(this, elementClass);
            if (elementClass instanceof ArrayClassInfo) {
                this.utf8Name = strcatSingle(91 /* OpenBracket */, elementClass.utf8Name);
            }
            else {
                this.utf8Name = strcat4Single(91 /* OpenBracket */, 76 /* L */, elementClass.utf8Name, 59 /* Semicolon */);
            }
            this.mangledName = mangleClassName(this.utf8Name);
            this.complete();
        }
        return ObjectArrayClassInfo;
    })(ArrayClassInfo);
    J2ME.ObjectArrayClassInfo = ObjectArrayClassInfo;
    var PrimitiveArrayClassInfo = (function (_super) {
        __extends(PrimitiveArrayClassInfo, _super);
        function PrimitiveArrayClassInfo(elementClass, mangledName, bytesPerElement) {
            _super.call(this, elementClass);
            this.utf8Name = strcatSingle(91 /* OpenBracket */, elementClass.utf8Name);
            this.mangledName = mangledName;
            this.bytesPerElement = bytesPerElement;
            this.complete();
        }
        PrimitiveArrayClassInfo.initialize = function () {
            // Primitive array classes require the java_lang_Object to exists before they can be created.
            PrimitiveArrayClassInfo.Z = new PrimitiveArrayClassInfo(PrimitiveClassInfo.Z, "ZArray", 1);
            PrimitiveArrayClassInfo.C = new PrimitiveArrayClassInfo(PrimitiveClassInfo.C, "CArray", 2);
            PrimitiveArrayClassInfo.F = new PrimitiveArrayClassInfo(PrimitiveClassInfo.F, "FArray", 4);
            PrimitiveArrayClassInfo.D = new PrimitiveArrayClassInfo(PrimitiveClassInfo.D, "DArray", 8);
            PrimitiveArrayClassInfo.B = new PrimitiveArrayClassInfo(PrimitiveClassInfo.B, "BArray", 1);
            PrimitiveArrayClassInfo.S = new PrimitiveArrayClassInfo(PrimitiveClassInfo.S, "SArray", 2);
            PrimitiveArrayClassInfo.I = new PrimitiveArrayClassInfo(PrimitiveClassInfo.I, "IArray", 4);
            PrimitiveArrayClassInfo.J = new PrimitiveArrayClassInfo(PrimitiveClassInfo.J, "JArray", 8);
        };
        return PrimitiveArrayClassInfo;
    })(ArrayClassInfo);
    J2ME.PrimitiveArrayClassInfo = PrimitiveArrayClassInfo;
})(J2ME || (J2ME = {}));
/*
 * Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Option and Argument Management
 *
 * Options are configuration settings sprinkled throughout the code. They can be grouped into sets of
 * options called |OptionSets| which can form a hierarchy of options. For instance:
 *
 * var set = new OptionSet();
 * var opt = set.register(new Option("v", "verbose", "boolean", false, "Enables verbose logging."));
 *
 * creates an option set with one option in it. The option can be changed directly using |opt.value = true| or
 * automatically using the |ArgumentParser|:
 *
 * var parser = new ArgumentParser();
 * parser.addBoundOptionSet(set);
 * parser.parse(["-v"]);
 *
 * The |ArgumentParser| can also be used directly:
 *
 * var parser = new ArgumentParser();
 * argumentParser.addArgument("h", "help", "boolean", {parse: function (x) {
 *   printUsage();
 * }});
 */
var J2ME;
(function (J2ME) {
    var Options;
    (function (Options) {
        var isObject = J2ME.isObject;
        var assert = J2ME.Debug.assert;
        var Argument = (function () {
            function Argument(shortName, longName, type, options) {
                this.shortName = shortName;
                this.longName = longName;
                this.type = type;
                options = options || {};
                this.positional = options.positional;
                this.parseFn = options.parse;
                this.value = options.defaultValue;
            }
            Argument.prototype.parse = function (value) {
                if (this.type === "boolean") {
                    release || assert(typeof value === "boolean", "bad value type in Options.parse");
                    this.value = value;
                }
                else if (this.type === "number") {
                    release || assert(!isNaN(value), value + " is not a number");
                    this.value = parseInt(value, 10);
                }
                else {
                    this.value = value;
                }
                if (this.parseFn) {
                    this.parseFn(this.value);
                }
            };
            return Argument;
        })();
        Options.Argument = Argument;
        var ArgumentParser = (function () {
            function ArgumentParser() {
                this.args = [];
            }
            ArgumentParser.prototype.addArgument = function (shortName, longName, type, options) {
                var argument = new Argument(shortName, longName, type, options);
                this.args.push(argument);
                return argument;
            };
            ArgumentParser.prototype.addBoundOption = function (option) {
                var options = { parse: function (x) {
                        option.value = x;
                    } };
                this.args.push(new Argument(option.shortName, option.longName, option.type, options));
            };
            ArgumentParser.prototype.addBoundOptionSet = function (optionSet) {
                var self = this;
                optionSet.options.forEach(function (x) {
                    if (x instanceof OptionSet) {
                        self.addBoundOptionSet(x);
                    }
                    else {
                        release || assert(x instanceof Option, "bad option type in ArgumentParser.addBoundOptionSet");
                        self.addBoundOption(x);
                    }
                });
            };
            ArgumentParser.prototype.getUsage = function () {
                var str = "";
                this.args.forEach(function (x) {
                    if (!x.positional) {
                        str += "[-" + x.shortName + "|--" + x.longName + (x.type === "boolean" ? "" : " " + x.type[0].toUpperCase()) + "]";
                    }
                    else {
                        str += x.longName;
                    }
                    str += " ";
                });
                return str;
            };
            ArgumentParser.prototype.parse = function (args) {
                var nonPositionalArgumentMap = {};
                var positionalArgumentList = [];
                this.args.forEach(function (x) {
                    if (x.positional) {
                        positionalArgumentList.push(x);
                    }
                    else {
                        nonPositionalArgumentMap["-" + x.shortName] = x;
                        nonPositionalArgumentMap["--" + x.longName] = x;
                    }
                });
                var leftoverArguments = [];
                while (args.length) {
                    var argString = args.shift();
                    var argument = null, value = argString;
                    if (argString == '--') {
                        leftoverArguments = leftoverArguments.concat(args);
                        break;
                    }
                    else if (argString.slice(0, 1) == '-' || argString.slice(0, 2) == '--') {
                        argument = nonPositionalArgumentMap[argString];
                        // release || assert(argument, "Argument " + argString + " is unknown.");
                        if (!argument) {
                            continue;
                        }
                        if (argument.type !== "boolean") {
                            if (argument.type.indexOf("[]") > 0) {
                                value = [];
                                while (args.length && args[0][0] != '-') {
                                    value.push(args.shift());
                                }
                            }
                            else {
                                value = args.shift();
                            }
                            release || assert(value !== "-" && value !== "--", "Argument " + argString + " must have a value.");
                        }
                        else {
                            value = true;
                        }
                    }
                    else if (positionalArgumentList.length) {
                        argument = positionalArgumentList.shift();
                    }
                    else {
                        leftoverArguments.push(value);
                    }
                    if (argument) {
                        argument.parse(value);
                    }
                }
                release || assert(positionalArgumentList.length === 0, "Missing positional arguments.");
                return leftoverArguments;
            };
            return ArgumentParser;
        })();
        Options.ArgumentParser = ArgumentParser;
        var OptionSet = (function () {
            function OptionSet(name, settings) {
                if (settings === void 0) { settings = null; }
                this.open = false;
                this.name = name;
                this.settings = settings || {};
                this.options = [];
            }
            OptionSet.prototype.register = function (option) {
                if (option instanceof OptionSet) {
                    // check for duplicate option sets (bail if found)
                    for (var i = 0; i < this.options.length; i++) {
                        var optionSet = this.options[i];
                        if (optionSet instanceof OptionSet && optionSet.name === option.name) {
                            return optionSet;
                        }
                    }
                }
                this.options.push(option);
                if (this.settings) {
                    if (option instanceof OptionSet) {
                        var optionSettings = this.settings[option.name];
                        if (isObject(optionSettings)) {
                            option.settings = optionSettings.settings;
                            option.open = optionSettings.open;
                        }
                    }
                    else {
                        // build_bundle chokes on this:
                        // if (!isNullOrUndefined(this.settings[option.longName])) {
                        if (typeof this.settings[option.longName] !== "undefined") {
                            switch (option.type) {
                                case "boolean":
                                    option.value = !!this.settings[option.longName];
                                    break;
                                case "number":
                                    option.value = +this.settings[option.longName];
                                    break;
                                default:
                                    option.value = this.settings[option.longName];
                                    break;
                            }
                        }
                    }
                }
                return option;
            };
            OptionSet.prototype.trace = function (writer) {
                writer.enter(this.name + " {");
                this.options.forEach(function (option) {
                    option.trace(writer);
                });
                writer.leave("}");
            };
            OptionSet.prototype.getSettings = function () {
                var settings = {};
                this.options.forEach(function (option) {
                    if (option instanceof OptionSet) {
                        settings[option.name] = {
                            settings: option.getSettings(),
                            open: option.open
                        };
                    }
                    else {
                        settings[option.longName] = option.value;
                    }
                });
                return settings;
            };
            OptionSet.prototype.setSettings = function (settings) {
                if (!settings) {
                    return;
                }
                this.options.forEach(function (option) {
                    if (option instanceof OptionSet) {
                        if (option.name in settings) {
                            option.setSettings(settings[option.name].settings);
                        }
                    }
                    else {
                        if (option.longName in settings) {
                            option.value = settings[option.longName];
                        }
                    }
                });
            };
            return OptionSet;
        })();
        Options.OptionSet = OptionSet;
        var Option = (function () {
            // config:
            //  { range: { min: 1, max: 5, step: 1 } }
            //  { list: [ "item 1", "item 2", "item 3" ] }
            //  { choices: { "choice 1": 1, "choice 2": 2, "choice 3": 3 } }
            function Option(shortName, longName, type, defaultValue, description, config) {
                if (config === void 0) { config = null; }
                this.longName = longName;
                this.shortName = shortName;
                this.type = type;
                this.defaultValue = defaultValue;
                this.value = defaultValue;
                this.description = description;
                this.config = config;
            }
            Option.prototype.parse = function (value) {
                this.value = value;
            };
            Option.prototype.trace = function (writer) {
                writer.writeLn(("-" + this.shortName + "|--" + this.longName).padRight(" ", 30) +
                    " = " + this.type + " " + this.value + " [" + this.defaultValue + "]" +
                    " (" + this.description + ")");
            };
            return Option;
        })();
        Options.Option = Option;
    })(Options = J2ME.Options || (J2ME.Options = {}));
})(J2ME || (J2ME = {}));
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    var writer = new J2ME.IndentingWriter();
    (function (Kind) {
        Kind[Kind["Boolean"] = 0] = "Boolean";
        Kind[Kind["Byte"] = 1] = "Byte";
        Kind[Kind["Short"] = 2] = "Short";
        Kind[Kind["Char"] = 3] = "Char";
        Kind[Kind["Int"] = 4] = "Int";
        Kind[Kind["Float"] = 5] = "Float";
        Kind[Kind["Long"] = 6] = "Long";
        Kind[Kind["Double"] = 7] = "Double";
        Kind[Kind["Reference"] = 8] = "Reference";
        Kind[Kind["Void"] = 9] = "Void";
        Kind[Kind["Illegal"] = 10] = "Illegal";
        Kind[Kind["High"] = 11] = "High";
        Kind[Kind["Store"] = 12] = "Store";
    })(J2ME.Kind || (J2ME.Kind = {}));
    var Kind = J2ME.Kind;
    function getKindName(kind) {
        return J2ME.Kind[kind];
    }
    J2ME.getKindName = getKindName;
    function isTwoSlot(kind) {
        return kind === 6 /* Long */ || kind === 7 /* Double */;
    }
    J2ME.isTwoSlot = isTwoSlot;
    J2ME.valueKinds = [
        0 /* Boolean */,
        3 /* Char */,
        5 /* Float */,
        7 /* Double */,
        1 /* Byte */,
        2 /* Short */,
        4 /* Int */,
        6 /* Long */
    ];
    function returnKind(op) {
        switch (op) {
            case 173 /* LRETURN */:
                return 6 /* Long */;
            case 175 /* DRETURN */:
                return 7 /* Double */;
            case 172 /* IRETURN */:
                return 4 /* Int */;
            case 174 /* FRETURN */:
                return 5 /* Float */;
            case 176 /* ARETURN */:
                return 8 /* Reference */;
            case 177 /* RETURN */:
                return 9 /* Void */;
        }
    }
    J2ME.returnKind = returnKind;
    function stackKind(kind) {
        switch (kind) {
            case 0 /* Boolean */: return 4 /* Int */;
            case 1 /* Byte */: return 4 /* Int */;
            case 2 /* Short */: return 4 /* Int */;
            case 3 /* Char */: return 4 /* Int */;
            case 4 /* Int */: return 4 /* Int */;
            case 5 /* Float */: return 5 /* Float */;
            case 6 /* Long */: return 6 /* Long */;
            case 7 /* Double */: return 7 /* Double */;
            case 8 /* Reference */: return 8 /* Reference */;
            default: throw J2ME.Debug.unexpected("Unknown stack kind: " + kind);
        }
    }
    J2ME.stackKind = stackKind;
    function kindCharacterToKind(kindCharacter) {
        switch (kindCharacter[0]) {
            case 'Z': return 0 /* Boolean */;
            case 'B': return 1 /* Byte */;
            case 'S': return 2 /* Short */;
            case 'C': return 3 /* Char */;
            case 'I': return 4 /* Int */;
            case 'F': return 5 /* Float */;
            case 'J': return 6 /* Long */;
            case 'D': return 7 /* Double */;
            case 'V': return 9 /* Void */;
            case '[': // Fallthrough
            case 'L': return 8 /* Reference */;
            default: throw J2ME.Debug.unexpected("Unknown kind character: " + kindCharacter);
        }
    }
    J2ME.kindCharacterToKind = kindCharacterToKind;
    function arrayTypeCodeToKind(typeCode) {
        switch (typeCode) {
            case 4: return 0 /* Boolean */;
            case 5: return 3 /* Char */;
            case 6: return 5 /* Float */;
            case 7: return 7 /* Double */;
            case 8: return 1 /* Byte */;
            case 9: return 2 /* Short */;
            case 10: return 4 /* Int */;
            case 11: return 6 /* Long */;
            default: throw J2ME.Debug.unexpected("Unknown array type code: " + typeCode);
        }
    }
    J2ME.arrayTypeCodeToKind = arrayTypeCodeToKind;
    function kindSize(kind) {
        if (isTwoSlot(kind)) {
            return 8;
        }
        return 4;
    }
    J2ME.kindSize = kindSize;
    function getKindCheck(kind) {
        switch (kind) {
            case 0 /* Boolean */:
                return function (l, h) { return l === 0 || l === 1; };
            case 1 /* Byte */:
                return function (l, h) { return (l | 0) === l && l >= -128 /* BYTE_MIN */ && l <= 127 /* BYTE_MAX */; };
            case 2 /* Short */:
                return function (l, h) { return (l | 0) === l && l >= -32768 /* SHORT_MIN */ && l <= 32767 /* SHORT_MAX */; };
            case 3 /* Char */:
                return function (l, h) { return (l | 0) === l && l >= 0 /* CHAR_MIN */ && l <= 65535 /* CHAR_MAX */; };
            case 4 /* Int */:
                return function (l, h) { return (l | 0) === l; };
            case 5 /* Float */:
                return function (l, h) { return (l | 0) === l; };
            case 6 /* Long */:
                return function (l, h) { return ((l | 0) === l) && ((h | 0) === h); };
            case 7 /* Double */:
                return function (l, h) { return ((l | 0) === l) && ((h | 0) === h); };
            case 8 /* Reference */:
                return function (l, h) { return l === null || l instanceof Object; };
            case 9 /* Void */:
                return function (l, h) { return typeof l === "undefined"; };
            default:
                throw J2ME.Debug.unexpected("Unknown kind: " + kind);
        }
    }
    J2ME.getKindCheck = getKindCheck;
    function getSignatureKind(signature) {
        switch (signature[0]) {
            case 90 /* Z */:
                return 0 /* Boolean */;
            case 66 /* B */:
                return 1 /* Byte */;
            case 83 /* S */:
                return 2 /* Short */;
            case 67 /* C */:
                return 3 /* Char */;
            case 73 /* I */:
                return 4 /* Int */;
            case 70 /* F */:
                return 5 /* Float */;
            case 74 /* J */:
                return 6 /* Long */;
            case 68 /* D */:
                return 7 /* Double */;
            case 91 /* OpenBracket */:
            case 76 /* L */:
                return 8 /* Reference */;
            case 86 /* V */:
                return 9 /* Void */;
        }
    }
    J2ME.getSignatureKind = getSignatureKind;
    /**
     * MethodDescriptor:
     *    ( ParameterDescriptor* ) ReturnDescriptor
     *  ParameterDescriptor:
     *    FieldType
     *  ReturnDescriptor:
     *    FieldType
     *    VoidDescriptor
     *  VoidDescriptor:
     *    V
     *  FieldDescriptor:
     *    FieldType
     *  FieldType:
     *    BaseType
     *    ObjectType
     *    ArrayType
     *  BaseType:
     *    B
     *    C
     *    D
     *    F
     *    I
     *    J
     *    S
     *    Z
     *  ObjectType:
     *    L ClassName ;
     *  ArrayType:
     *    [ ComponentType
     *  ComponentType:
     *    FieldType
     */
    // Global state for signature parsing, kind of hackish but fast.
    var globalNextIndex = 0;
    var descriptorKinds = [];
    /**
     * Returns an array of kinds that appear in a method signature. The first element is always the
     * return kind. The returned array is shared, so you if you need a copy of it, you'll need to
     * clone it.
     *
     * The parsing algorithm needs some global state to keep track of the current position in the
     * descriptor, namely |globalNextIndex| which always points to the next index in the descriptor
     * after a token has been consumed.
     */
    function parseMethodDescriptorKinds(value, startIndex) {
        globalNextIndex = 0;
        if ((startIndex > value.length - 3) || value[startIndex] !== 40 /* OpenParenthesis */) {
            assert(false, "Invalid method signature.");
        }
        descriptorKinds.length = 0;
        descriptorKinds.push(9 /* Void */); // placeholder until the return type is parsed
        var i = startIndex + 1;
        while (value[i] !== 41 /* CloseParenthesis */) {
            var kind = parseTypeDescriptorKind(value, i);
            descriptorKinds.push(kind);
            i = globalNextIndex;
            if (i >= value.length) {
                assert(false, "Invalid method signature.");
            }
        }
        i++;
        var kind = parseTypeDescriptorKind(value, i);
        if (globalNextIndex !== value.length) {
            assert(false, "Invalid method signature.");
        }
        // Plug in the return type
        descriptorKinds[0] = kind;
        return descriptorKinds;
    }
    J2ME.parseMethodDescriptorKinds = parseMethodDescriptorKinds;
    function parseTypeDescriptorKind(value, startIndex) {
        globalNextIndex = startIndex + 1;
        switch (value[startIndex]) {
            case 90 /* Z */:
                return 0 /* Boolean */;
            case 66 /* B */:
                return 1 /* Byte */;
            case 67 /* C */:
                return 3 /* Char */;
            case 68 /* D */:
                return 7 /* Double */;
            case 70 /* F */:
                return 5 /* Float */;
            case 73 /* I */:
                return 4 /* Int */;
            case 74 /* J */:
                return 6 /* Long */;
            case 83 /* S */:
                return 2 /* Short */;
            case 86 /* V */:
                return 9 /* Void */;
            case 76 /* L */: {
                // parse a slashified Java class name
                var endIndex = parseClassNameKind(value, startIndex + 1, 47 /* Slash */);
                if (endIndex > startIndex + 1 && endIndex < value.length && value[endIndex] === 59 /* Semicolon */) {
                    globalNextIndex = endIndex + 1;
                    return 8 /* Reference */;
                }
                J2ME.Debug.unexpected("Invalid signature.");
            }
            case 91 /* OpenBracket */: {
                // compute the number of dimensions
                var index = startIndex;
                while (index < value.length && value[index] === 91 /* OpenBracket */) {
                    index++;
                }
                var dimensions = index - startIndex;
                if (dimensions > 255) {
                    J2ME.Debug.unexpected("Array with more than 255 dimensions.");
                }
                var component = parseTypeDescriptorKind(value, index);
                return 8 /* Reference */;
            }
            default:
                J2ME.Debug.unexpected("Unexpected type descriptor prefix: " + value[startIndex]);
        }
    }
    function parseClassNameKind(value, index, separator) {
        var position = index;
        var length = value.length;
        while (position < length) {
            var nextch = value[position];
            if (nextch === 46 /* Dot */ || nextch === 47 /* Slash */) {
                if (separator !== nextch) {
                    return position;
                }
            }
            else if (nextch === 59 /* Semicolon */ || nextch === 91 /* OpenBracket */) {
                return position;
            }
            position++;
        }
        return position;
    }
    function signatureHasTwoSlotArguments(signatureKinds) {
        for (var i = 1; i < signatureKinds.length; i++) {
            if (isTwoSlot(signatureKinds[i])) {
                return true;
            }
        }
        return false;
    }
    J2ME.signatureHasTwoSlotArguments = signatureHasTwoSlotArguments;
    function signatureArgumentSlotCount(signatureKinds) {
        var count = 0;
        for (var i = 1; i < signatureKinds.length; i++) {
            count += isTwoSlot(signatureKinds[i]) ? 2 : 1;
        }
        return count;
    }
    J2ME.signatureArgumentSlotCount = signatureArgumentSlotCount;
})(J2ME || (J2ME = {}));
/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/
var J2ME;
(function (J2ME) {
    J2ME.classCounter = new J2ME.Metrics.Counter(true);
    var ClassRegistry = (function () {
        function ClassRegistry() {
            this.sourceDirectories = [];
            this.sourceFiles = Object.create(null);
            this.missingSourceFiles = Object.create(null);
            this.classes = Object.create(null);
            this.preInitializedClasses = [];
            this.unwindMethodInfos = Object.create(null);
        }
        ClassRegistry.prototype.initializeBuiltinClasses = function () {
            // These classes are guaranteed to not have a static initializer.
            J2ME.enterTimeline("initializeBuiltinClasses");
            this.java_lang_Object = this.loadClass("java/lang/Object");
            this.java_lang_Class = this.loadClass("java/lang/Class");
            this.java_lang_String = this.loadClass("java/lang/String");
            this.java_lang_Thread = this.loadClass("java/lang/Thread");
            this.preInitializedClasses.push(this.java_lang_Object);
            this.preInitializedClasses.push(this.java_lang_Class);
            this.preInitializedClasses.push(this.java_lang_String);
            this.preInitializedClasses.push(this.java_lang_Thread);
            /**
             * Force these frequently used classes to be initialized eagerly. We can
             * skip the class initialization check for them. This is only possible
             * because they don't have any static state.
             */
            var classNames = [
                "java/lang/Integer",
                "java/lang/Character",
                "java/lang/Math",
                "java/util/HashtableEntry",
                "java/lang/StringBuffer",
                "java/util/Vector",
                "java/io/IOException",
                "java/lang/IllegalArgumentException",
                // Preload the Isolate class, that is needed to start the VM (see context.ts)
                "com/sun/cldc/isolate/Isolate",
                "org/mozilla/internal/Sys",
                "java/lang/System",
                "java/lang/RuntimeException",
                "java/lang/IllegalStateException",
                "java/lang/Long",
                "java/lang/NullPointerException",
                "java/lang/Boolean",
                "java/util/Hashtable",
                "java/lang/IndexOutOfBoundsException",
                "java/lang/StringIndexOutOfBoundsException",
                // Preload the Isolate class, that is needed to start the VM (see jvm.ts)
                "com/sun/cldc/isolate/Isolate",
            ];
            for (var i = 0; i < classNames.length; i++) {
                this.preInitializedClasses.push(this.loadClass(classNames[i]));
            }
            var primitiveTypes = "ZCFDBSIJ";
            // Link primitive arrays.
            J2ME.PrimitiveArrayClassInfo.initialize();
            for (var i = 0; i < primitiveTypes.length; i++) {
                this.getClass("[" + primitiveTypes[i]);
            }
            J2ME.leaveTimeline("initializeBuiltinClasses");
        };
        ClassRegistry.prototype.isPreInitializedClass = function (classInfo) {
            if (classInfo instanceof J2ME.PrimitiveClassInfo) {
                return true;
            }
            return this.preInitializedClasses.indexOf(classInfo) >= 0;
        };
        ClassRegistry.prototype.addSourceDirectory = function (name) {
            this.sourceDirectories.push(name);
        };
        ClassRegistry.prototype.getSourceLine = function (sourceLocation) {
            if (typeof snarf === "undefined") {
                // Sorry, no snarf in the browser. Do async loading instead.
                return null;
            }
            var source = this.sourceFiles[sourceLocation.className];
            if (!source && !this.missingSourceFiles[sourceLocation.className]) {
                for (var i = 0; i < this.sourceDirectories.length; i++) {
                    try {
                        var path = this.sourceDirectories[i] + "/" + sourceLocation.className + ".java";
                        var file = snarf(path);
                        if (file) {
                            source = this.sourceFiles[sourceLocation.className] = file.split("\n");
                        }
                    }
                    catch (x) {
                    }
                }
            }
            if (source) {
                return source[sourceLocation.lineNumber - 1];
            }
            this.missingSourceFiles[sourceLocation.className] = true;
            return null;
        };
        ClassRegistry.prototype.loadClassBytes = function (bytes) {
            J2ME.enterTimeline("loadClassBytes");
            var classInfo = new J2ME.ClassInfo(bytes);
            J2ME.leaveTimeline("loadClassBytes");
            J2ME.loadWriter && J2ME.loadWriter.writeLn(classInfo.getClassNameSlow() + " -> " + classInfo.superClassName + ";");
            this.classes[classInfo.getClassNameSlow()] = classInfo;
            return classInfo;
        };
        ClassRegistry.prototype.loadClassFile = function (fileName) {
            J2ME.loadWriter && J2ME.loadWriter.enter("> Loading Class File: " + fileName);
            var bytes = JARStore.loadFile(fileName);
            if (!bytes) {
                J2ME.loadWriter && J2ME.loadWriter.leave("< ClassNotFoundException");
                throw new (J2ME.ClassNotFoundException)(fileName);
            }
            var self = this;
            var classInfo = this.loadClassBytes(bytes);
            if (classInfo.superClassName) {
                classInfo.superClass = this.loadClass(classInfo.superClassName);
                classInfo.depth = classInfo.superClass.depth + 1;
                var superClass = classInfo.superClass;
                superClass.subClasses.push(classInfo);
                while (superClass) {
                    superClass.allSubClasses.push(classInfo);
                    superClass = superClass.superClass;
                }
            }
            classInfo.complete();
            J2ME.loadWriter && J2ME.loadWriter.leave("<");
            return classInfo;
        };
        ClassRegistry.prototype.loadClass = function (className) {
            var classInfo = this.classes[className];
            if (classInfo) {
                return classInfo;
            }
            return this.loadClassFile(className + ".class");
        };
        ClassRegistry.prototype.getEntryPoint = function (classInfo) {
            var methods = classInfo.getMethods();
            for (var i = 0; i < methods.length; i++) {
                var method = methods[i];
                if (method.isPublic && method.isStatic && !method.isNative &&
                    method.name === "main" &&
                    method.signature === "([Ljava/lang/String;)V") {
                    return method;
                }
            }
        };
        ClassRegistry.prototype.getClass = function (className) {
            var classInfo = this.classes[className];
            if (!classInfo) {
                if (className[0] === "[") {
                    classInfo = this.createArrayClass(className);
                }
                else {
                    classInfo = this.loadClass(className);
                }
                if (!classInfo)
                    return null;
            }
            return classInfo;
        };
        ClassRegistry.prototype.createArrayClass = function (typeName) {
            var elementType = typeName.substr(1);
            var classInfo;
            if (J2ME.PrimitiveArrayClassInfo[elementType]) {
                classInfo = J2ME.PrimitiveArrayClassInfo[elementType];
            }
            else {
                if (elementType[0] === "L") {
                    elementType = elementType.substr(1).replace(";", "");
                }
                classInfo = new J2ME.ObjectArrayClassInfo(this.getClass(elementType));
            }
            return this.classes[typeName] = classInfo;
        };
        ClassRegistry.prototype.getUnwindMethodInfo = function (returnKind, opCode) {
            var key = "" + returnKind + opCode;
            if (this.unwindMethodInfos[key]) {
                return this.unwindMethodInfos[key];
            }
            var classInfo = J2ME.CLASSES.getClass("org/mozilla/internal/Sys");
            var methodInfo;
            var unwindMethodName = "unwind" + (opCode ? "FromInvoke" : "");
            switch (returnKind) {
                case 6 /* Long */:
                    methodInfo = classInfo.getMethodByNameString(unwindMethodName, "(J)J");
                    break;
                case 7 /* Double */:
                    methodInfo = classInfo.getMethodByNameString(unwindMethodName, "(D)D");
                    break;
                case 5 /* Float */:
                    methodInfo = classInfo.getMethodByNameString(unwindMethodName, "(F)F");
                    break;
                case 4 /* Int */:
                case 1 /* Byte */:
                case 3 /* Char */:
                case 2 /* Short */:
                case 0 /* Boolean */:
                    methodInfo = classInfo.getMethodByNameString(unwindMethodName, "(I)I");
                    break;
                case 8 /* Reference */:
                    methodInfo = classInfo.getMethodByNameString(unwindMethodName, "(Ljava/lang/Object;)Ljava/lang/Object;");
                    break;
                case 9 /* Void */:
                    methodInfo = classInfo.getMethodByNameString(unwindMethodName, "()V");
                    break;
                default:
                    release || J2ME.Debug.assert(false, "Invalid Kind: " + J2ME.getKindName(returnKind));
            }
            release || J2ME.Debug.assert(methodInfo, "Must find unwind method");
            this.unwindMethodInfos[key] = methodInfo;
            return methodInfo;
        };
        return ClassRegistry;
    })();
    J2ME.ClassRegistry = ClassRegistry;
    J2ME.ClassNotFoundException = function (message) {
        this.message = message;
    };
    J2ME.ClassNotFoundException.prototype = Object.create(Error.prototype);
    J2ME.ClassNotFoundException.prototype.name = "ClassNotFoundException";
    J2ME.ClassNotFoundException.prototype.constructor = J2ME.ClassNotFoundException;
})(J2ME || (J2ME = {}));
var J2ME;
(function (J2ME) {
    var Bindings = {
        "java/lang/Object": {
            native: {
                "hashCode.()I": function () {
                    var self = this;
                    if (self._hashCode) {
                        return self._hashCode;
                    }
                    self._hashCode = i32[this._address + 4 /* HASH_CODE_OFFSET */ >> 2];
                    if (self._hashCode) {
                        return self._hashCode;
                    }
                    return self._hashCode = i32[this._address + 4 /* HASH_CODE_OFFSET */ >> 2] = $.nextHashCode();
                }
            }
        },
        "java/lang/Class": {
            fields: {
                instanceSymbols: {
                    "status": "I",
                    "vmClass": "Ljava/lang/Object;"
                }
            },
            methods: {
                instanceSymbols: {
                    "initialize.()V": "initialize"
                }
            }
        },
        "java/lang/String": {
            fields: {
                instanceSymbols: {
                    "value": "[C",
                    "offset": "I",
                    "count": "I"
                }
            }
        },
        "java/lang/Thread": {
            fields: {
                instanceSymbols: {
                    "priority": "I",
                    "nativeAlive": "Z",
                }
            }
        },
        "java/lang/Throwable": {
            fields: {
                instanceSymbols: {
                    "detailMessage": "Ljava/lang/String;",
                }
            }
        },
        "java/lang/ref/WeakReference": {
            fields: {
                instanceSymbols: {
                    "holder": "Ljava/lang/Object;",
                },
            },
        },
        "com/sun/cldc/isolate/Isolate": {
            fields: {
                instanceSymbols: {
                    "_id": "I",
                    "_mainArgs": "[Ljava/lang/String;",
                    "_mainClass": "Ljava/lang/String;",
                    "_priority": "I",
                }
            }
        },
        "java/io/ByteArrayOutputStream": {
            fields: {
                instanceSymbols: {
                    "count": "I",
                    "buf": "[B"
                }
            }
        },
        "com/sun/cldc/i18n/j2me/UTF_8_Writer": {
            fields: {
                instanceSymbols: {
                    "pendingSurrogate": "I"
                }
            }
        },
        "com/sun/j2me/location/CriteriaImpl": {
            fields: {
                instanceSymbols: {
                    "providerName": "Ljava/lang/String;"
                }
            }
        },
        "com/sun/j2me/location/LocationProviderInfo": {
            fields: {
                instanceSymbols: {
                    "canReportAltitude": "Z",
                    "canReportSpeedCource": "Z",
                    "averageResponseTime": "I"
                }
            }
        },
        "com/sun/j2me/location/LocationInfo": {
            fields: {
                instanceSymbols: {
                    "isValid": "Z",
                    "timestamp": "J",
                    "latitude": "D",
                    "longitude": "D",
                    "altitude": "F",
                    "horizontalAccuracy": "F",
                    "verticalAccuracy": "F",
                    "speed": "F",
                    "course": "F",
                    "method": "I"
                }
            }
        },
        "com/sun/javame/sensor/ChannelModel": {
            fields: {
                instanceSymbols: {
                    "scale": "I",
                    "name": "Ljava/lang/String;",
                    "unit": "Ljava/lang/String;",
                    "dataType": "I",
                    "accuracy": "I",
                    "mrangeCount": "I",
                    "mrageArray": "[J"
                }
            }
        },
        "com/sun/javame/sensor/SensorModel": {
            fields: {
                instanceSymbols: {
                    "description": "Ljava/lang/String;",
                    "model": "Ljava/lang/String;",
                    "quantity": "Ljava/lang/String;",
                    "contextType": "Ljava/lang/String;",
                    "connectionType": "I",
                    "maxBufferSize": "I",
                    "availabilityPush": "Z",
                    "conditionPush": "Z",
                    "channelCount": "I",
                    "errorCodes": "[I",
                    "errorMsgs": "[Ljava/lang/String;",
                    "properties": "[Ljava/lang/String;"
                }
            }
        },
        "com/nokia/mid/ui/DirectGraphicsImp": {
            fields: {
                instanceSymbols: {
                    "graphics": "Ljavax/microedition/lcdui/Graphics;"
                }
            }
        },
        "javax/microedition/lcdui/Command": {
            fields: {
                instanceSymbols: {
                    "id": "I",
                    "commandType": "I",
                    "shortLabel": "Ljava/lang/String;",
                    "priority": "I",
                }
            }
        },
        "javax/microedition/lcdui/Font": {
            fields: {
                instanceSymbols: {
                    "baseline": "I",
                    "height": "I",
                }
            }
        },
        "javax/microedition/lcdui/Image": {
            fields: {
                instanceSymbols: {
                    "imageData": "Ljavax/microedition/lcdui/ImageData;",
                    "width": "I",
                    "height": "I"
                }
            }
        },
        "javax/microedition/lcdui/ImageData": {
            fields: {
                instanceSymbols: {
                    "width": "I",
                    "height": "I",
                    "isMutable": "Z",
                }
            }
        },
        "com/nokia/mid/ui/TextEditor": {
            fields: {
                instanceSymbols: {
                    "font": "Ljavax/microedition/lcdui/Font;",
                    "caretPosition": "I",
                }
            }
        },
        "com/sun/midp/events/Event": {
            fields: {
                instanceSymbols: {
                    "type": "I",
                    "next": "Lcom/sun/midp/events/Event;",
                }
            }
        },
        "com/sun/midp/events/NativeEvent": {
            fields: {
                instanceSymbols: {
                    "intParam1": "I",
                    "intParam2": "I",
                    "intParam3": "I",
                    "intParam4": "I",
                    "intParam5": "I",
                    "intParam6": "I",
                    "intParam7": "I",
                    "intParam8": "I",
                    "intParam9": "I",
                    "intParam10": "I",
                    "intParam11": "I",
                    "intParam12": "I",
                    "intParam13": "I",
                    "intParam14": "I",
                    "intParam15": "I",
                    "intParam16": "I",
                    "floatParam1": "F",
                    "stringParam1": "Ljava/lang/String;",
                    "stringParam2": "Ljava/lang/String;",
                    "stringParam3": "Ljava/lang/String;",
                    "stringParam4": "Ljava/lang/String;",
                    "stringParam5": "Ljava/lang/String;",
                    "stringParam6": "Ljava/lang/String;",
                }
            }
        },
        "com/sun/cdc/io/j2me/file/DefaultFileHandler": {
            fields: {
                instanceSymbols: {
                    "nativePath": "Ljava/lang/String;",
                    "nativeDescriptor": "I",
                    "isOpenForRead": "Z",
                    "isOpenForWrite": "Z"
                }
            }
        },
        "com/sun/midp/rms/RecordStoreSharedDBHeader": {
            fields: {
                instanceSymbols: {
                    "lookupId": "I",
                }
            }
        },
        "com/sun/cdc/io/j2me/file/Protocol": {
            fields: {
                instanceSymbols: {
                    "fileHandler": "Lcom/sun/cdc/io/j2me/file/BaseFileHandler;",
                }
            }
        },
        "com/sun/j2me/pim/PIMFieldDescriptor": {
            fields: {
                instanceSymbols: {
                    "field": "I",
                    "dataType": "I",
                    "maxValues": "I",
                }
            }
        },
        "com/sun/midp/io/j2me/sms/Protocol$SMSPacket": {
            fields: {
                instanceSymbols: {
                    "message": "[B",
                    "address": "[B",
                    "port": "I",
                    "sentAt": "J",
                    "messageType": "I",
                }
            }
        },
        "com/sun/midp/io/j2me/socket/Protocol": {
            fields: {
                instanceSymbols: {
                    "host": "Ljava/lang/String;",
                }
            }
        },
        "com/sun/midp/main/CommandState": {
            fields: {
                instanceSymbols: {
                    "suiteId": "I",
                    "midletClassName": "Ljava/lang/String;",
                    "arg0": "Ljava/lang/String;",
                    "arg1": "Ljava/lang/String;",
                    "arg2": "Ljava/lang/String;",
                }
            }
        },
        "com/sun/midp/midletsuite/SuiteSettings": {
            fields: {
                instanceSymbols: {
                    "pushInterruptSetting": "B",
                }
            }
        },
        "com/sun/midp/midletsuite/InstallInfo": {
            fields: {
                instanceSymbols: {
                    "trusted": "Z",
                }
            }
        },
        "com/sun/j2me/content/ContentHandlerRegData": {
            fields: {
                instanceSymbols: {
                    "ID": "Ljava/lang/String;",
                    "registrationMethod": "I",
                }
            }
        },
        "com/sun/j2me/content/InvocationImpl": {
            fields: {
                instanceSymbols: {
                    "action": "Ljava/lang/String;",
                    "arguments": "[Ljava/lang/String;",
                    "argsLen": "I",
                    "status": "I",
                }
            }
        },
    };
    J2ME.BindingsMap = new J2ME.TypedArrayHashtable(50);
    // Create a map of the classes that have bindings.
    for (var k in Bindings) {
        J2ME.BindingsMap.put(J2ME.toUTF8(k), Bindings[k]);
    }
})(J2ME || (J2ME = {}));
var Native = Object.create(null);
/**
 * Asm.js heap buffer and views.
 */
var buffer = ASM.buffer;
var i8 = ASM.HEAP8;
var u8 = ASM.HEAPU8;
var i16 = ASM.HEAP16;
var u16 = ASM.HEAPU16;
var i32 = ASM.HEAP32;
var u32 = ASM.HEAPU32;
var f32 = ASM.HEAPF32;
var f64 = ASM.HEAPF64;
var aliasedI32 = J2ME.IntegerUtilities.i32;
var aliasedF32 = J2ME.IntegerUtilities.f32;
var aliasedF64 = J2ME.IntegerUtilities.f64;
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    function asyncImplOld(returnKind, promise, cleanup) {
        return asyncImpl(J2ME.kindCharacterToKind(returnKind), promise, cleanup);
    }
    J2ME.asyncImplOld = asyncImplOld;
    /**
     * Suspends the execution of the current thread and resumes it later once the specified
     * |promise| is fulfilled.
     *
     * |onFulfilled| is called with one or two arguments |l| and |h|. |l| can be any
     * value, while |h| can only ever be the high bits of a long value.
     *
     * |onRejected| is called with a java.lang.Exception object.
     */
    function asyncImpl(returnKind, promise, cleanup) {
        var ctx = $.ctx;
        promise.then(function onFulfilled(l, h) {
            var thread = ctx.nativeThread;
            thread.pushPendingNativeFrames();
            // Push return value.
            var sp = thread.sp;
            switch (returnKind) {
                case 7 /* Double */:
                    aliasedF64[0] = l;
                    i32[sp++] = aliasedI32[0];
                    i32[sp++] = aliasedI32[1];
                    break;
                case 5 /* Float */:
                    f32[sp++] = l;
                    break;
                case 6 /* Long */:
                    i32[sp++] = l;
                    i32[sp++] = h;
                    break;
                case 4 /* Int */:
                case 1 /* Byte */:
                case 3 /* Char */:
                case 2 /* Short */:
                case 0 /* Boolean */:
                    i32[sp++] = l;
                    break;
                case 8 /* Reference */:
                    release || assert(l !== "number", "async native return value is a number");
                    i32[sp++] = l;
                    break;
                case 9 /* Void */:
                    break;
                default:
                    release || J2ME.Debug.assert(false, "Invalid Kind: " + J2ME.getKindName(returnKind));
            }
            thread.sp = sp;
            cleanup && cleanup();
            J2ME.Scheduler.enqueue(ctx);
        }, function onRejected(exception) {
            var thread = ctx.nativeThread;
            thread.pushPendingNativeFrames();
            var classInfo = J2ME.CLASSES.getClass("org/mozilla/internal/Sys");
            var methodInfo = classInfo.getMethodByNameString("throwException", "(Ljava/lang/Exception;)V");
            thread.pushMarkerFrame(J2ME.FrameType.Interrupt);
            thread.pushFrame(methodInfo);
            thread.frame.setParameter(8 /* Reference */, 0, exception._address);
            cleanup && cleanup();
            J2ME.Scheduler.enqueue(ctx);
        });
        $.pause("Async");
        $.nativeBailout(returnKind);
    }
    J2ME.asyncImpl = asyncImpl;
    Native["java/lang/Thread.sleep.(J)V"] = function (addr, delayL, delayH) {
        asyncImpl(9 /* Void */, new Promise(function (resolve, reject) {
            window.setTimeout(resolve, J2ME.longToNumber(delayL, delayH));
        }));
    };
    Native["java/lang/Thread.isAlive.()Z"] = function (addr) {
        var self = J2ME.getHandle(addr);
        return self.nativeAlive ? 1 : 0;
    };
    Native["java/lang/Thread.yield.()V"] = function (addr) {
        $.yield("Thread.yield");
        $.nativeBailout(9 /* Void */);
    };
    Native["java/lang/Object.wait.(J)V"] = function (addr, timeoutL, timeoutH) {
        $.ctx.wait(addr, J2ME.longToNumber(timeoutL, timeoutH));
        if (U) {
            $.nativeBailout(9 /* Void */);
        }
    };
    Native["java/lang/Object.notify.()V"] = function (addr) {
        $.ctx.notify(addr, false);
        // TODO Remove this assertion after investigating why wakeup on another ctx can unwind see comment in Context.notify..
        release || assert(!U, "Unexpected unwind in java/lang/Object.notify.()V.");
    };
    Native["java/lang/Object.notifyAll.()V"] = function (addr) {
        $.ctx.notify(addr, true);
        // TODO Remove this assertion after investigating why wakeup on another ctx can unwind see comment in Context.notify.
        release || assert(!U, "Unexpected unwind in java/lang/Object.notifyAll.()V.");
    };
    Native["java/lang/ref/WeakReference.initializeWeakReference.(Ljava/lang/Object;)V"] = function (addr, targetAddr) {
        if (targetAddr === 0 /* NULL */) {
            return;
        }
        var weakRef = J2ME.getHandle(addr);
        weakRef.holder = J2ME.gcMallocAtomic(4);
        i32[weakRef.holder >> 2] = targetAddr;
        ASM._gcRegisterDisappearingLink(weakRef.holder, targetAddr);
    };
    Native["java/lang/ref/WeakReference.get.()Ljava/lang/Object;"] = function (addr) {
        var weakRef = J2ME.getHandle(addr);
        if (weakRef.holder === 0 /* NULL */) {
            return 0 /* NULL */;
        }
        return i32[weakRef.holder >> 2];
    };
    Native["java/lang/ref/WeakReference.clear.()V"] = function (addr) {
        var weakRef = J2ME.getHandle(addr);
        ASM._gcUnregisterDisappearingLink(weakRef.holder);
        weakRef.holder = 0 /* NULL */;
    };
    Native["org/mozilla/internal/Sys.getUnwindCount.()I"] = function (addr) {
        return J2ME.unwindCount;
    };
    Native["org/mozilla/internal/Sys.constructCurrentThread.()V"] = function (addr) {
        var methodInfo = J2ME.CLASSES.java_lang_Thread.getMethodByNameString("<init>", "(Ljava/lang/String;)V");
        J2ME.getLinkedMethod(methodInfo)($.mainThread, J2ME.newString("main"));
        if (U) {
            $.nativeBailout(9 /* Void */, 183 /* INVOKESPECIAL */);
        }
        // We've already set this in JVM.createIsolateCtx, but calling the instance
        // initializer above resets it, so we set it again here.
        //
        // We used to store this state on the persistent native object, which was
        // unaffected by the instance initializer; but now we store it on the Java
        // object, which is susceptible to it, since there is no persistent native
        // object anymore).
        //
        // XXX Figure out a less hacky approach.
        //
        var thread = J2ME.getHandle($.mainThread);
        thread.nativeAlive = true;
    };
    Native["org/mozilla/internal/Sys.getIsolateMain.()Ljava/lang/String;"] = function (addr) {
        var isolate = J2ME.getHandle($.isolateAddress);
        return isolate._mainClass;
    };
    Native["org/mozilla/internal/Sys.executeMain.(Ljava/lang/Class;)V"] = function (addr, mainAddr) {
        var main = J2ME.getHandle(mainAddr);
        var entryPoint = J2ME.CLASSES.getEntryPoint(J2ME.classIdToClassInfoMap[main.vmClass]);
        if (!entryPoint)
            throw new Error("Could not find isolate main.");
        var isolate = J2ME.getHandle($.isolateAddress);
        J2ME.getLinkedMethod(entryPoint)(0 /* NULL */, isolate._mainArgs);
        if (U) {
            $.nativeBailout(9 /* Void */, 184 /* INVOKESTATIC */);
        }
    };
    Native["java/lang/Throwable.fillInStackTrace.()V"] = function (addr) {
        var frame = $.ctx.nativeThread.frame;
        var tp = $.ctx.nativeThread.tp;
        var fp = frame.fp;
        var sp = frame.sp;
        var pc = frame.pc;
        var stackTrace = [];
        J2ME.setNative(addr, stackTrace);
        while (true) {
            release || assert(fp >= (tp >> 2), "Invalid frame pointer.");
            if (frame.fp === (tp >> 2)) {
                break;
            }
            stackTrace.push({
                frameType: frame.type,
                methodInfo: frame.methodInfo,
                pc: frame.pc
            });
            frame.set(frame.thread, i32[frame.fp + 1 /* CallerFPOffset */], frame.fp + frame.parameterOffset, i32[frame.fp + 0 /* CallerRAOffset */]);
        }
        frame.fp = fp;
        frame.sp = sp;
        frame.pc = pc;
    };
    Native["java/lang/Throwable.obtainBackTrace.()Ljava/lang/Object;"] = function (addr) {
        var resultAddr = 0 /* NULL */;
        var stackTrace = J2ME.NativeMap.get(addr);
        if (stackTrace) {
            var depth = stackTrace.length;
            var classNamesAddr = J2ME.newStringArray(depth);
            var classNames = J2ME.getArrayFromAddr(classNamesAddr);
            var methodNamesAddr = J2ME.newStringArray(depth);
            var methodNames = J2ME.getArrayFromAddr(methodNamesAddr);
            var methodSignaturesAddr = J2ME.newStringArray(depth);
            var methodSignatures = J2ME.getArrayFromAddr(methodSignaturesAddr);
            var offsetsAddr = J2ME.newIntArray(depth);
            var offsets = J2ME.getArrayFromAddr(offsetsAddr);
            stackTrace.forEach(function (e, n) {
                if (e.frameType === J2ME.FrameType.Interpreter) {
                    var methodInfo = e.methodInfo;
                    classNames[n] = J2ME.newString(methodInfo.classInfo.getClassNameSlow());
                    methodNames[n] = J2ME.newString(methodInfo.name);
                    methodSignatures[n] = J2ME.newString(methodInfo.signature);
                    offsets[n] = e.pc;
                }
                else {
                    classNames[n] = J2ME.newString("MARKER FRAME " + J2ME.FrameType[e.frameType]);
                    methodNames[n] = J2ME.newString("");
                    methodSignatures[n] = J2ME.newString("");
                    offsets[n] = e.pc;
                }
            });
            resultAddr = J2ME.newObjectArray(4);
            var result = J2ME.getArrayFromAddr(resultAddr);
            result[0] = classNamesAddr;
            result[1] = methodNamesAddr;
            result[2] = methodSignaturesAddr;
            result[3] = offsetsAddr;
        }
        return resultAddr;
    };
    Native["java/lang/Runtime.totalMemory.()J"] = function (addr) {
        return J2ME.returnLongValue(asmJsTotalMemory);
    };
})(J2ME || (J2ME = {}));
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var J2ME;
(function (J2ME) {
    /**
     * The closest floating-point representation to this long value.
     */
    function longToNumber(l, h) {
        return h * 4294967296 /* TWO_PWR_32_DBL */ + ((l >= 0) ? l : 4294967296 /* TWO_PWR_32_DBL */ + l);
    }
    J2ME.longToNumber = longToNumber;
    function returnLongValue(v) {
        if (isNaN(v) || !isFinite(v)) {
            tempReturn0 = 0;
            return 0;
        }
        else if (v <= -9223372036854776000 /* TWO_PWR_63_DBL */) {
            // min value
            tempReturn0 = 0x80000000;
            return 0;
        }
        else if (v + 1 >= 9223372036854776000 /* TWO_PWR_63_DBL */) {
            // max value
            tempReturn0 = 0x7FFFFFFF;
            return 0xFFFFFFFF;
        }
        else if (v < 0) {
            var lowBits = returnLongValue(-v);
            var highBits = tempReturn0;
            if (lowBits === 0 && highBits === 0x80000000) {
                return lowBits;
            }
            // bitwise not
            lowBits = (~lowBits) | 0;
            highBits = (~highBits) | 0;
            // add one
            var a48 = highBits >>> 16;
            var a32 = highBits & 0xFFFF;
            var a16 = lowBits >>> 16;
            var a00 = lowBits & 0xFFFF;
            var b16 = 1 >>> 16;
            var b00 = 1 & 0xFFFF;
            var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
            c00 += a00 + b00;
            c16 += c00 >>> 16;
            c00 &= 0xFFFF;
            c16 += a16 + b16;
            c32 += c16 >>> 16;
            c16 &= 0xFFFF;
            c32 += a32;
            c48 += c32 >>> 16;
            c32 &= 0xFFFF;
            c48 += a48;
            c48 &= 0xFFFF;
            tempReturn0 = (c48 << 16) | c32;
            return (c16 << 16) | c00;
        }
        else {
            tempReturn0 = (v / 4294967296 /* TWO_PWR_32_DBL */) | 0;
            return (v % 4294967296 /* TWO_PWR_32_DBL */) | 0;
        }
    }
    J2ME.returnLongValue = returnLongValue;
})(J2ME || (J2ME = {}));
var J2ME;
(function (J2ME) {
    /** @const */ J2ME.MAX_PRIORITY = 10;
    /** @const */ J2ME.MIN_PRIORITY = 1;
    /** @const */ J2ME.NORMAL_PRIORITY = 5;
    /** @const */ J2ME.ISOLATE_MIN_PRIORITY = 1;
    /** @const */ J2ME.ISOLATE_NORM_PRIORITY = 2;
    /** @const */ J2ME.ISOLATE_MAX_PRIORITY = 3;
    /**
     * Maximum time in ms that all of the threads have to run before the event
     * loop is run.
     * NOTE: this number is somewhat arbitrarily chosen, but the thought is
     * we'd like the system to respond in under 100ms, so by using 80ms we then
     * have 20ms to get an event, start processing it, and render an update.
     * @const
     */
    var MAX_WINDOW_EXECUTION_TIME = 80;
    /**
     * Number of ms between preemption checks, chosen arbitrarily.
     * @const
     */
    var PREEMPTION_INTERVAL = 5;
    /**
     * Time when the last preemption check was allowed.
     */
    var lastPreemptionCheck = 0;
    /**
     * Number of preemption checks thus far.
     */
    J2ME.preemptionCount = 0;
    /**
     * Time when the window began execution.
     * @type {number}
     */
    var windowStartTime = 0;
    /**
     * Time used to track thread execution time. This is updated when the thread starts
     * in the execution window and when `updateCurrentRuntime` is called.
     */
    var threadTrackingTime = 0;
    /**
     * Used to block preemptions from happening during code that can't handle them.
     */
    J2ME.preemptionLockLevel = 0;
    /**
     * All of the currently runnable threads. Sorted in ascending order by virtualRuntime.
     * @type {Array}
     */
    var runningQueue = [];
    /**
     * The smallest virtual runtime of all the currently executing threads. This number is
     * monotonically increasing.
     */
    var minVirtualRuntime = 0;
    /**
     * True when a setTimeout has been scheduled to run the threads.
     */
    var processQueueScheduled = false;
    /**
     * The currently executing context.
     */
    var current = null;
    /**
     * Rate the virtual runtime increases.
     */
    var currentTimeScale = 1;
    /**
     * The scheduler tracks the amount of time(virtualRuntime) that each thread has had to execute
     * and tries to always execute the thread that has had least amount of time to run next.
     * For higher priority threads the virtual runtime is increased at a slower rate to give them
     * more time to be the the front of the queue and vice versa for low priority threads. To allow
     * the event loop a turn there is an overall MAX_WINDOW_EXECUTION_TIME that if reached will yield
     * all the threads and schedule them to resume on a setTimeout. This allows us to run up to
     * MAX_WINDOW_EXECUTION_TIME/PREEMPTION_INTERVAL threads per execution window.
     */
    var Scheduler = (function () {
        function Scheduler() {
        }
        Scheduler.enqueue = function (ctx, directExecution) {
            if (ctx.virtualRuntime === 0) {
                // Ensure the new thread doesn't dominate.
                ctx.virtualRuntime = minVirtualRuntime;
            }
            runningQueue.unshift(ctx);
            runningQueue.sort(function (a, b) {
                return a.virtualRuntime - b.virtualRuntime;
            });
            Scheduler.updateMinVirtualRuntime();
            Scheduler.processRunningQueue(directExecution);
        };
        Scheduler.processRunningQueue = function (directExecution) {
            function run() {
                processQueueScheduled = false;
                try {
                    windowStartTime = performance.now();
                    while (runningQueue.length) {
                        var now = performance.now();
                        if (now - windowStartTime >= MAX_WINDOW_EXECUTION_TIME) {
                            break;
                        }
                        var ctx = runningQueue.shift();
                        threadTrackingTime = lastPreemptionCheck = now;
                        current = ctx;
                        /*
                         * The current scaling is a simple linear function where the scale goes from 1x to .1x for lowest
                         * priority to highest priority.
                         * NOTE: this should be tuned.
                         * RUNTIME THREAD SCALE
                         * low     low    1x
                         * norm    norm   0.72x
                         * high    high   .1x
                         */
                        currentTimeScale = -0.03103448276 * (ctx.priority * ctx.runtime.priority) + 1.031034483;
                        ctx.execute();
                        Scheduler.updateCurrentRuntime();
                        current = null;
                    }
                }
                finally {
                    if (runningQueue.length) {
                        Scheduler.processRunningQueue();
                    }
                }
            }
            if (directExecution) {
                run();
                return;
            }
            if (processQueueScheduled) {
                return;
            }
            processQueueScheduled = true;
            window.nextTickDuringEvents(run);
        };
        Scheduler.updateMinVirtualRuntime = function () {
            var virtualRuntime = minVirtualRuntime;
            if (current) {
                virtualRuntime = current.virtualRuntime;
            }
            if (runningQueue.length) {
                var nextContext = runningQueue[0];
                if (!current) {
                    virtualRuntime = nextContext.virtualRuntime;
                }
                else {
                    virtualRuntime = Math.min(virtualRuntime, nextContext.virtualRuntime);
                }
            }
            minVirtualRuntime = Math.max(minVirtualRuntime, virtualRuntime);
        };
        Scheduler.updateCurrentRuntime = function () {
            var now = performance.now();
            var ctx = current;
            var executionTime = now - threadTrackingTime;
            var weightedExecutionTime = executionTime * currentTimeScale;
            ctx.virtualRuntime += weightedExecutionTime;
            threadTrackingTime = now;
            Scheduler.updateMinVirtualRuntime();
        };
        Scheduler.shouldPreempt = function () {
            if (J2ME.preemptionLockLevel > 0) {
                return false;
            }
            var now = performance.now();
            var totalElapsed = now - windowStartTime;
            if (totalElapsed > MAX_WINDOW_EXECUTION_TIME) {
                J2ME.preemptionCount++;
                J2ME.threadWriter && J2ME.threadWriter.writeLn("Execution window timeout: " + totalElapsed.toFixed(2) + " ms, samples: " + PS + ", count: " + J2ME.preemptionCount);
                return true;
            }
            Scheduler.updateCurrentRuntime();
            var elapsed = now - lastPreemptionCheck;
            if (elapsed < PREEMPTION_INTERVAL) {
                return false;
            }
            lastPreemptionCheck = now;
            if (runningQueue.length === 0) {
                return false;
            }
            if ($.ctx.virtualRuntime > runningQueue[0].virtualRuntime) {
                J2ME.preemptionCount++;
                J2ME.threadWriter && J2ME.threadWriter.writeLn("Preemption: " + elapsed.toFixed(2) + " ms, samples: " + PS + ", count: " + J2ME.preemptionCount);
                return true;
            }
            return false;
        };
        return Scheduler;
    })();
    J2ME.Scheduler = Scheduler;
})(J2ME || (J2ME = {}));
/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    (function (WriterFlags) {
        WriterFlags[WriterFlags["None"] = 0] = "None";
        WriterFlags[WriterFlags["Trace"] = 1] = "Trace";
        WriterFlags[WriterFlags["Link"] = 2] = "Link";
        WriterFlags[WriterFlags["Init"] = 4] = "Init";
        WriterFlags[WriterFlags["Perf"] = 8] = "Perf";
        WriterFlags[WriterFlags["Load"] = 16] = "Load";
        WriterFlags[WriterFlags["JIT"] = 32] = "JIT";
        WriterFlags[WriterFlags["Code"] = 64] = "Code";
        WriterFlags[WriterFlags["Thread"] = 128] = "Thread";
        WriterFlags[WriterFlags["TraceStack"] = 256] = "TraceStack";
        WriterFlags[WriterFlags["All"] = 511] = "All";
    })(J2ME.WriterFlags || (J2ME.WriterFlags = {}));
    var WriterFlags = J2ME.WriterFlags;
    /**
     * Toggle VM tracing here.
     */
    J2ME.writers = WriterFlags.None;
    Array.prototype.push2 = function (value) {
        this.push(value);
        this.push(null);
        return value;
    };
    Array.prototype.pop2 = function () {
        this.pop();
        return this.pop();
    };
    Array.prototype.pushKind = function (kind, value) {
        if (J2ME.isTwoSlot(kind)) {
            this.push2(value);
            return;
        }
        this.push(value);
    };
    Array.prototype.popKind = function (kind) {
        if (J2ME.isTwoSlot(kind)) {
            return this.pop2();
        }
        return this.pop();
    };
    // A convenience function for retrieving values in reverse order
    // from the end of the stack.  stack.read(1) returns the topmost item
    // on the stack, while stack.read(2) returns the one underneath it.
    Array.prototype.read = function (i) {
        return this[this.length - i];
    };
    J2ME.CLASSES = new J2ME.ClassRegistry();
    var JVM = (function () {
        function JVM() {
            // ...
        }
        JVM.prototype.createIsolateCtx = function () {
            var runtime = new J2ME.Runtime(this);
            var ctx = new Context(runtime);
            ctx.threadAddress = runtime.mainThread = J2ME.allocObject(J2ME.CLASSES.java_lang_Thread);
            J2ME.setNative(ctx.threadAddress, ctx);
            var thread = J2ME.getHandle(ctx.threadAddress);
            // XXX thread.pid seems to be unused, so remove it.
            thread.pid = util.id();
            thread.nativeAlive = true;
            // The constructor will set the real priority, however one is needed for the scheduler.
            thread.priority = J2ME.NORMAL_PRIORITY;
            runtime.preInitializeClasses(ctx);
            return ctx;
        };
        JVM.prototype.startIsolate0 = function (className, args) {
            var ctx = this.createIsolateCtx();
            var sys = J2ME.CLASSES.getClass("org/mozilla/internal/Sys");
            ctx.nativeThread.pushMarkerFrame(J2ME.FrameType.ExitInterpreter);
            ctx.nativeThread.pushFrame(sys.getMethodByNameString("isolate0Entry", "(Ljava/lang/String;[Ljava/lang/String;)V"));
            ctx.nativeThread.frame.setParameter(8 /* Reference */, 0, J2ME.newString(className.replace(/\./g, "/")));
            var arrayAddr = J2ME.newStringArray(args.length);
            J2ME.setUncollectable(arrayAddr);
            var array = J2ME.getArrayFromAddr(arrayAddr);
            for (var n = 0; n < args.length; ++n) {
                array[n] = args[n] ? J2ME.newString(args[n]) : 0 /* NULL */;
            }
            J2ME.unsetUncollectable(arrayAddr);
            ctx.nativeThread.frame.setParameter(8 /* Reference */, 1, arrayAddr);
            ctx.start();
            release || J2ME.Debug.assert(!U, "Unexpected unwind during isolate initialization.");
        };
        JVM.prototype.startIsolate = function (isolateAddr) {
            var isolate = J2ME.getHandle(isolateAddr);
            var ctx = this.createIsolateCtx();
            var runtime = ctx.runtime;
            runtime.isolateAddress = isolateAddr;
            // We could look this up from the address, but we use it a lot,
            // so we cache it here.
            runtime.isolateId = isolate._id;
            J2ME.setNative(isolateAddr, runtime);
            var sys = J2ME.CLASSES.getClass("org/mozilla/internal/Sys");
            runtime.updateStatus(2 /* Started */);
            runtime.priority = isolate._priority;
            var entryPoint = sys.getMethodByNameString("isolateEntryPoint", "(Lcom/sun/cldc/isolate/Isolate;)V");
            if (!entryPoint)
                throw new Error("Could not find isolate entry point.");
            ctx.nativeThread.pushMarkerFrame(J2ME.FrameType.ExitInterpreter);
            ctx.nativeThread.pushFrame(entryPoint);
            ctx.nativeThread.frame.setParameter(8 /* Reference */, 0, isolateAddr);
            ctx.start();
            release || J2ME.Debug.assert(!U, "Unexpected unwind during isolate initialization.");
        };
        return JVM;
    })();
    J2ME.JVM = JVM;
    var ThreadDataLayout;
    (function (ThreadDataLayout) {
        ThreadDataLayout[ThreadDataLayout["AddressOffset"] = 0] = "AddressOffset";
        ThreadDataLayout[ThreadDataLayout["StackTopOffset"] = 1] = "StackTopOffset";
        ThreadDataLayout[ThreadDataLayout["Size"] = 2] = "Size";
    })(ThreadDataLayout || (ThreadDataLayout = {}));
    var Context = (function () {
        function Context(runtime) {
            this.runtime = runtime;
            this.priority = J2ME.NORMAL_PRIORITY;
            /**
             * Whether or not the context is currently paused.  The profiler uses this
             * to distinguish execution time from paused time in an async method.
             */
            this.paused = true;
            var id = this.id = Context._nextId++;
            this.runtime = runtime;
            this.runtime.addContext(this);
            this.nativeThread = new J2ME.Thread(this);
            this.virtualRuntime = 0;
            this.writer = new J2ME.IndentingWriter(false, function (s) {
                console.log(s);
            });
            if (profile && typeof Shumway !== "undefined") {
                this.methodTimeline = new Shumway.Tools.Profiler.TimelineBuffer("Thread " + this.runtime.id + ":" + this.id);
                J2ME.methodTimelines.push(this.methodTimeline);
            }
            J2ME.setUncollectable(this.nativeThread.tp);
            this.threadData = new Int32Array(ASM.buffer, J2ME.gcMallocUncollectable(2 /* Size */ << 2), 2 /* Size */);
            this.threadData[1 /* StackTopOffset */] = this.nativeThread.tp;
            J2ME.unsetUncollectable(this.nativeThread.tp);
        }
        Object.defineProperty(Context.prototype, "threadAddress", {
            get: function () {
                return this.threadData[0 /* AddressOffset */];
            },
            set: function (addr) {
                this.threadData[0 /* AddressOffset */] = addr;
            },
            enumerable: true,
            configurable: true
        });
        Context.color = function (id) {
            if (inBrowser) {
                return id;
            }
            return Context._colors[id % Context._colors.length] + id + J2ME.IndentingWriter.ENDC;
        };
        Context.currentContextPrefix = function () {
            if ($) {
                return Context.color($.id) + "." + $.ctx.runtime.priority + ":" + Context.color($.ctx.id) + "." + $.ctx.priority;
            }
            return "";
        };
        /**
         * Sets global writers. Uncomment these if you want to see trace output.
         */
        Context.setWriters = function (writer) {
            J2ME.traceStackWriter = J2ME.writers & WriterFlags.TraceStack ? writer : null;
            J2ME.traceWriter = J2ME.writers & WriterFlags.Trace ? writer : null;
            J2ME.perfWriter = J2ME.writers & WriterFlags.Perf ? writer : null;
            J2ME.linkWriter = J2ME.writers & WriterFlags.Link ? writer : null;
            J2ME.jitWriter = J2ME.writers & WriterFlags.JIT ? writer : null;
            J2ME.codeWriter = J2ME.writers & WriterFlags.Code ? writer : null;
            J2ME.initWriter = J2ME.writers & WriterFlags.Init ? writer : null;
            J2ME.threadWriter = J2ME.writers & WriterFlags.Thread ? writer : null;
            J2ME.loadWriter = J2ME.writers & WriterFlags.Load ? writer : null;
        };
        Context.prototype.kill = function () {
            if (this.threadAddress) {
                var thread = J2ME.getHandle(this.threadAddress);
                thread.nativeAlive = false;
            }
            this.runtime.removeContext(this);
            ASM._gcFree(this.threadData.byteOffset);
        };
        Context.prototype.executeMethod = function (methodInfo) {
            return J2ME.getLinkedMethod(methodInfo)();
        };
        Context.prototype.createException = function (className, message) {
            if (!message) {
                message = "";
            }
            message = "" + message;
            var classInfo = J2ME.CLASSES.loadClass(className);
            J2ME.classInitCheck(classInfo);
            release || J2ME.Debug.assert(!U, "Unexpected unwind during createException.");
            J2ME.runtimeCounter && J2ME.runtimeCounter.count("createException " + className);
            var exceptionAddress = J2ME.allocObject(classInfo);
            J2ME.setUncollectable(exceptionAddress);
            var methodInfo = classInfo.getMethodByNameString("<init>", "(Ljava/lang/String;)V");
            J2ME.preemptionLockLevel++;
            J2ME.getLinkedMethod(methodInfo)(exceptionAddress, message ? J2ME.newString(message) : 0 /* NULL */);
            release || J2ME.Debug.assert(!U, "Unexpected unwind during createException.");
            J2ME.preemptionLockLevel--;
            J2ME.unsetUncollectable(exceptionAddress);
            return J2ME.getHandle(exceptionAddress);
        };
        Context.prototype.setAsCurrentContext = function () {
            if ($) {
                J2ME.threadTimeline && J2ME.threadTimeline.leave();
            }
            J2ME.threadTimeline && J2ME.threadTimeline.enter(this.runtime.id + ":" + this.id);
            $ = this.runtime;
            if ($.ctx === this) {
                return;
            }
            $.ctx = this;
            Context.setWriters(this.writer);
        };
        Context.prototype.clearCurrentContext = function () {
            if ($) {
                J2ME.threadTimeline && J2ME.threadTimeline.leave();
            }
            $ = null;
            Context.setWriters(Context.writer);
        };
        Context.prototype.start = function () {
            this.resume();
        };
        Context.prototype.execute = function () {
            this.setAsCurrentContext();
            profile && this.resumeMethodTimeline();
            try {
                this.nativeThread.run();
            }
            catch (e) {
                // The exception was never caught and the thread must be terminated.
                this.kill();
                this.clearCurrentContext();
                // Rethrow so the exception is not silent.
                if (e.classInfo) {
                    e = e.classInfo.getClassNameSlow() + ": " + J2ME.fromStringAddr(e.detailMessage);
                }
                throw e;
            }
            release || assert(this.nativeThread.nativeFrameCount === 0, "All native frames should be gone.");
            if (U) {
                this.nativeThread.endUnwind();
                switch (U) {
                    case 1 /* Yielding */:
                        this.resume();
                        break;
                    case 2 /* Pausing */:
                        break;
                    case 3 /* Stopping */:
                        this.clearCurrentContext();
                        this.kill();
                        return;
                }
                U = 0 /* Running */;
                this.clearCurrentContext();
                return;
            }
            this.clearCurrentContext();
            this.kill();
        };
        Context.prototype.resume = function () {
            J2ME.Scheduler.enqueue(this);
        };
        Context.prototype.block = function (lock, queue, lockLevel) {
            lock[queue].push(this);
            this.lockLevel = lockLevel;
            $.pause("block");
        };
        Context.prototype.unblock = function (lock, queue, notifyAll) {
            while (lock[queue].length) {
                var ctx = lock[queue].pop();
                if (!ctx) {
                    continue;
                }
                ctx.wakeup(lock);
                if (!notifyAll) {
                    break;
                }
            }
        };
        Context.prototype.wakeup = function (lock) {
            if (this.lockTimeout !== null) {
                window.clearTimeout(this.lockTimeout);
                this.lockTimeout = null;
            }
            if (lock.level !== 0) {
                lock.ready.push(this);
            }
            else {
                while (this.lockLevel-- > 0) {
                    this.monitorEnter(lock);
                    if (U === 2 /* Pausing */ || U === 3 /* Stopping */) {
                        return;
                    }
                }
                this.resume();
            }
        };
        Context.prototype.monitorEnter = function (lock) {
            if (lock.level === 0) {
                lock.threadAddress = this.threadAddress;
                lock.level = 1;
                return;
            }
            if (lock.threadAddress === this.threadAddress) {
                ++lock.level;
                return;
            }
            this.block(lock, "ready", 1);
        };
        Context.prototype.monitorExit = function (lock) {
            if (lock.level === 1 && lock.ready.length === 0) {
                lock.level = 0;
                return;
            }
            if (lock.threadAddress !== this.threadAddress)
                throw $.newIllegalMonitorStateException();
            if (--lock.level > 0) {
                return;
            }
            if (lock.level < 0) {
                throw $.newIllegalMonitorStateException("Unbalanced monitor enter/exit.");
            }
            this.unblock(lock, "ready", false);
        };
        Context.prototype.wait = function (objectAddr, timeout) {
            var lock = J2ME.getMonitor(objectAddr);
            if (timeout < 0)
                throw $.newIllegalArgumentException();
            if (!lock || lock.threadAddress !== this.threadAddress)
                throw $.newIllegalMonitorStateException();
            var lockLevel = lock.level;
            for (var i = lockLevel; i > 0; i--) {
                this.monitorExit(lock);
            }
            if (timeout) {
                var self = this;
                this.lockTimeout = window.setTimeout(function () {
                    for (var i = 0; i < lock.waiting.length; i++) {
                        var ctx = lock.waiting[i];
                        if (ctx === self) {
                            lock.waiting[i] = null;
                            ctx.wakeup(lock);
                        }
                    }
                }, timeout);
            }
            else {
                this.lockTimeout = null;
            }
            this.block(lock, "waiting", lockLevel);
        };
        Context.prototype.notify = function (objectAddr, notifyAll) {
            var lock = J2ME.getMonitor(objectAddr);
            if (!lock || lock.threadAddress !== this.threadAddress)
                throw $.newIllegalMonitorStateException();
            // TODO Unblock can call wakeup on a different ctx which in turn calls monitorEnter and can cause unwinds
            // on another ctx, but we shouldn't unwind this ctx. After figuring out why this is, remove assertions in
            // "java/lang/Object.notify.()V" and "java/lang/Object.notifyAll.()V"
            this.unblock(lock, "waiting", notifyAll);
        };
        Context.prototype.bailout = function (bailoutFrameAddress) {
            J2ME.traceWriter && J2ME.traceWriter.writeLn("Bailout: " + J2ME.methodIdToMethodInfoMap[i32[bailoutFrameAddress + 0 /* MethodIdOffset */ >> 2]].implKey);
            this.nativeThread.unwoundNativeFrames.push(bailoutFrameAddress);
        };
        Context.prototype.pauseMethodTimeline = function () {
            release || assert(!this.paused, "context is not paused");
            if (profiling) {
                this.methodTimeline.enter("<pause>", 0 /* Interpreted */);
            }
            this.paused = true;
        };
        Context.prototype.resumeMethodTimeline = function () {
            release || assert(this.paused, "context is paused");
            if (profiling) {
                this.methodTimeline.leave("<pause>", 0 /* Interpreted */);
            }
            this.paused = false;
        };
        /**
         * Re-enters all the frames that are currently on the stack so the full stack
         * trace shows up in the profiler.
         */
        Context.prototype.restartMethodTimeline = function () {
            //REDUX
            //for (var i = 0; i < this.frames.length; i++) {
            //  var frame = this.frames[i];
            //  if (J2ME.Frame.isMarker(frame)) {
            //    continue;
            //  }
            //  this.methodTimeline.enter(frame.methodInfo.implKey, MethodType.Interpreted);
            //}
            //
            // if (this.paused) {
            //   this.methodTimeline.enter("<pause>", MethodType.Interpreted);
            // }
        };
        Context.prototype.enterMethodTimeline = function (key, methodType) {
            if (profiling) {
                this.methodTimeline.enter(key, J2ME.getMethodTypeName(methodType));
            }
        };
        Context.prototype.leaveMethodTimeline = function (key, methodType) {
            if (profiling) {
                this.methodTimeline.leave(key, J2ME.getMethodTypeName(methodType));
            }
        };
        Context._nextId = 0;
        Context._colors = [
            J2ME.IndentingWriter.PURPLE,
            J2ME.IndentingWriter.YELLOW,
            J2ME.IndentingWriter.GREEN,
            J2ME.IndentingWriter.RED,
            J2ME.IndentingWriter.BOLD_RED
        ];
        Context.writer = new J2ME.IndentingWriter(false, function (s) {
            console.log(s);
        });
        return Context;
    })();
    J2ME.Context = Context;
})(J2ME || (J2ME = {}));
var Context = J2ME.Context;
Object.defineProperty(jsGlobal, "CLASSES", {
    get: function () {
        return J2ME.CLASSES;
    }
});
var JVM = J2ME.JVM;
function countTimeline(message, object) {
}
function enterTimeline(message) {
}
function leaveTimeline(message) {
}
var J2ME;
(function (J2ME) {
    var CompilerBailout = (function () {
        function CompilerBailout(message) {
            this.message = message;
            // ...
        }
        CompilerBailout.prototype.toString = function () {
            return "CompilerBailout: " + this.message;
        };
        return CompilerBailout;
    })();
    J2ME.CompilerBailout = CompilerBailout;
})(J2ME || (J2ME = {}));
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    var BytecodeStream = J2ME.Bytecode.BytecodeStream;
    var yieldWriter = null; // stderrWriter;
    J2ME.yieldCounter = null; // new Metrics.Counter(true);
    J2ME.yieldGraph = null; // Object.create(null);
    (function (YieldReason) {
        YieldReason[YieldReason["None"] = 0] = "None";
        YieldReason[YieldReason["Root"] = 1] = "Root";
        YieldReason[YieldReason["Synchronized"] = 2] = "Synchronized";
        YieldReason[YieldReason["MonitorEnterExit"] = 3] = "MonitorEnterExit";
        YieldReason[YieldReason["Virtual"] = 4] = "Virtual";
        YieldReason[YieldReason["Cycle"] = 5] = "Cycle";
        YieldReason[YieldReason["Yield"] = 6] = "Yield";
        YieldReason[YieldReason["Likely"] = 7] = "Likely";
    })(J2ME.YieldReason || (J2ME.YieldReason = {}));
    var YieldReason = J2ME.YieldReason;
    function getYieldReasonName(yieldReason) {
        return J2ME.YieldReason[yieldReason];
    }
    J2ME.getYieldReasonName = getYieldReasonName;
    /**
     * Root set of methods that can yield. Keep this up to date or else the compiler will not generate yield code
     * at the right spots.
     */
    J2ME.yieldMap = {
        "com/sun/midp/lcdui/DisplayDevice.refresh0.(IIIIII)V": 1 /* Root */,
        "com/sun/midp/main/MIDletSuiteUtils.vmBeginStartUp.(I)V": 1 /* Root */,
        "com/sun/midp/lcdui/DisplayDevice.gainedForeground0.(II)V": 1 /* Root */,
        "com/sun/cdc/io/j2me/file/DefaultFileHandler.openForRead.()V": 1 /* Root */,
        "com/sun/cdc/io/j2me/file/DefaultFileHandler.openForWrite.()V": 1 /* Root */,
        "com/sun/cdc/io/j2me/file/DefaultFileHandler.write.([BII)I": 1 /* Root */,
        "java/lang/Thread.sleep.(J)V": 1 /* Root */,
        "com/sun/cldc/isolate/Isolate.waitStatus.(I)V": 1 /* Root */,
        "com/sun/j2me/location/PlatformLocationProvider.waitForNewLocation.(IJ)Z": 1 /* Root */,
        "com/sun/javame/sensor/NativeChannel.doMeasureData.(II)[B": 1 /* Root */,
        "com/sun/midp/util/isolate/InterIsolateMutex.lock0.(I)V": 1 /* Root */,
        "com/sun/midp/events/NativeEventMonitor.waitForNativeEvent.(Lcom/sun/midp/events/NativeEvent;)I": 1 /* Root */,
        "com/sun/midp/io/j2me/push/ConnectionRegistry.poll0.(J)I": 1 /* Root */,
        "com/sun/midp/rms/RecordStoreFile.openRecordStoreFile.(Ljava/lang/String;Ljava/lang/String;I)I": 1 /* Root */,
        "com/sun/midp/io/j2me/storage/RandomAccessStream.open.(Ljava/lang/String;I)I": 1 /* Root */,
        "javax/microedition/lcdui/ImageDataFactory.createImmutableImageDecodeImage.(Ljavax/microedition/lcdui/ImageData;[BII)V": 1 /* Root */,
        "com/nokia/mid/ui/TextEditorThread.getNextDirtyEditor.()Lcom/nokia/mid/ui/TextEditor;": 1 /* Root */,
        "com/nokia/mid/ui/TextEditor.setFocus.(Z)V": 1 /* Root */,
        "com/nokia/mid/ui/VKVisibilityNotificationRunnable.sleepUntilVKVisibilityChange.()Z": 1 /* Root */,
        "org/mozilla/io/LocalMsgConnection.init.(Ljava/lang/String;)V": 1 /* Root */,
        "org/mozilla/io/LocalMsgConnection.receiveData.([B)I": 1 /* Root */,
        "org/mozilla/io/LocalMsgConnection.waitConnection.()V": 1 /* Root */,
        "com/sun/mmedia/DirectPlayer.nGetDuration.(I)I": 1 /* Root */,
        "com/sun/mmedia/DirectPlayer.nGetMediaTime.(I)I": 1 /* Root */,
        "com/sun/mmedia/PlayerImpl.nRealize.(ILjava/lang/String;)Z": 1 /* Root */,
        "com/sun/mmedia/DirectRecord.nPause.(I)I": 1 /* Root */,
        "com/sun/mmedia/DirectRecord.nStop.(I)I": 1 /* Root */,
        "com/sun/mmedia/DirectRecord.nClose.(I)I": 1 /* Root */,
        "com/sun/mmedia/DirectRecord.nStart.(I)I": 1 /* Root */,
        "com/sun/midp/io/j2me/socket/Protocol.open0.([BI)V": 1 /* Root */,
        "com/sun/midp/io/j2me/socket/Protocol.read0.([BII)I": 1 /* Root */,
        "com/sun/midp/io/j2me/socket/Protocol.write0.([BII)I": 1 /* Root */,
        "com/sun/midp/io/j2me/socket/Protocol.close0.()V": 1 /* Root */,
        "com/sun/midp/io/j2me/sms/Protocol.receive0.(IIILcom/sun/midp/io/j2me/sms/Protocol$SMSPacket;)I": 1 /* Root */,
        "com/sun/midp/io/j2me/sms/Protocol.send0.(IILjava/lang/String;II[B)I": 1 /* Root */,
        "com/sun/j2me/pim/PIMProxy.getNextItemDescription0.(I[I)Z": 1 /* Root */,
        "java/lang/Object.wait.(J)V": 1 /* Root */,
        "java/lang/Class.invoke_clinit.()V": 1 /* Root */,
        "java/lang/Thread.yield.()V": 1 /* Root */,
        "java/lang/Thread.start0.()V": 1 /* Root */,
        "java/lang/Class.forName0.(Ljava/lang/String;)V": 1 /* Root */,
        "java/lang/Class.newInstance1.(Ljava/lang/Object;)V": 1 /* Root */,
        "java/lang/Runtime.gc.()V": 1 /* Root */,
        // Test Files:
        "gnu/testlet/vm/NativeTest.throwExceptionAfterPause.()V": 1 /* Root */,
        "gnu/testlet/vm/NativeTest.returnAfterPause.()I": 1 /* Root */,
        "gnu/testlet/vm/NativeTest.dumbPipe.()Z": 1 /* Root */,
        "gnu/testlet/TestHarness.getNumDifferingPixels.(Ljava/lang/String;)I": 1 /* Root */,
        "org/mozilla/MemorySampler.sampleMemory.(Ljava/lang/String;)V": 1 /* Root */,
        "org/mozilla/Test.callAsyncNative.()V": 1 /* Root */,
        "javax/wireless/messaging/SendSMSTest.getNumber.()Ljava/lang/String;": 1 /* Root */,
        "javax/wireless/messaging/SendSMSTest.getBody.()Ljava/lang/String;": 1 /* Root */,
    };
    J2ME.yieldVirtualMap = {};
    J2ME.noPreemptMap = {
        "java/lang/Class.initialize.()V": true
    };
    function isFinalClass(classInfo) {
        return classInfo.isFinal;
        // XXX The following can only be used if every class in all jars is loaded.
        /*
        var result = classInfo.isFinal;
        if (!result) {
          result = classInfo.subClasses.length === 0;
        }
        // console.log(classInfo.getClassNameSlow() + " is final class " + result);
        return result;
        */
    }
    J2ME.isFinalClass = isFinalClass;
    function isFinalMethod(methodInfo) {
        if (isFinalClass(methodInfo.classInfo)) {
            return true;
        }
        return methodInfo.isFinal;
        // XXX The following can only be used if every class in all jars is loaded.
        /*
        var result = methodInfo.isFinal;
        if (!result) {
          var classInfo = methodInfo.classInfo;
          var allSubClasses = classInfo.allSubClasses;
          result = true;
          for (var i = 0; i < allSubClasses.length; i++) {
            var subClassMethods = allSubClasses[i].getMethods();
            for (var j = 0; j < subClassMethods.length; j++) {
              var subClassMethodInfo = subClassMethods[j];
              if (methodInfo.name === subClassMethodInfo.name &&
                  methodInfo.signature === subClassMethodInfo.signature) {
                result = false;
                break;
              }
            }
          }
        }
        return result;
        */
    }
    J2ME.isFinalMethod = isFinalMethod;
    function gatherCallees(callees, classInfo, methodInfo) {
        var methods = classInfo.getMethods();
        for (var i = 0; i < methods.length; i++) {
            var method = methods[i];
            if (method.name === methodInfo.name && method.signature === methodInfo.signature) {
                callees.push(method);
            }
        }
        var subClasses = classInfo.subClasses;
        for (var i = 0; i < subClasses.length; i++) {
            var subClass = subClasses[i];
            gatherCallees(callees, subClass, methodInfo);
        }
    }
    J2ME.gatherCallees = gatherCallees;
    function isStaticallyBound(op, methodInfo) {
        // INVOKESPECIAL and INVOKESTATIC are always statically bound.
        if (op === 183 /* INVOKESPECIAL */ || op === 184 /* INVOKESTATIC */) {
            return true;
        }
        // INVOKEVIRTUAL is only statically bound if its class is final.
        if (op === 182 /* INVOKEVIRTUAL */ && isFinalMethod(methodInfo)) {
            return true;
        }
        return false;
    }
    J2ME.isStaticallyBound = isStaticallyBound;
    // Used to prevent cycles.
    var checkingForCanYield = Object.create(null);
    function addDependency(callee, caller, reason) {
        if (!J2ME.yieldGraph) {
            return;
        }
        if (!J2ME.yieldGraph[callee.implKey]) {
            J2ME.yieldGraph[callee.implKey] = Object.create(null);
        }
        var node = J2ME.yieldGraph[callee.implKey];
        node[caller.implKey] = reason;
    }
    function countDescendents(root) {
        var visited = Object.create(null);
        var visiting = Object.create(null);
        var w = new J2ME.IndentingWriter();
        function visit(name) {
            if (!J2ME.yieldGraph[name]) {
                return 0;
            }
            if (visiting[name]) {
                return 0;
            }
            var n = 0;
            visiting[name] = true;
            for (var k in J2ME.yieldGraph[name]) {
                n++;
                n += visit(k);
            }
            visiting[name] = false;
            return n;
        }
        return visit(root);
    }
    function traceYieldGraph(writer) {
        writer.writeLn(JSON.stringify(J2ME.yieldGraph, null, 2));
        var pairs = [];
        for (var k in J2ME.yieldGraph) {
            pairs.push([k, countDescendents(k)]);
        }
        pairs.sort(function (a, b) {
            return b[1] - a[1];
        });
        for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i];
            writer.writeLn(pairs[i][0] + ": " + pairs[i][1]);
        }
    }
    J2ME.traceYieldGraph = traceYieldGraph;
    function canStaticInitializerYield(classInfo) {
        var result = 0 /* None */;
        while (classInfo) {
            var staticInitializer = classInfo.staticInitializer;
            classInfo = classInfo.superClass;
            if (!staticInitializer) {
                continue;
            }
            result = canYield(staticInitializer);
            if (result !== 0 /* None */) {
                return result;
            }
        }
        return result;
    }
    J2ME.canStaticInitializerYield = canStaticInitializerYield;
    function canYield(methodInfo) {
        if (J2ME.phase === 0 /* Runtime */ && methodInfo.codeAttribute && methodInfo.codeAttribute.code.length > 100) {
            // Large methods are likely to yield, so don't even bother checking at runtime.
            return 7 /* Likely */;
        }
        yieldWriter && yieldWriter.enter("> " + methodInfo.implKey);
        if (J2ME.yieldMap[methodInfo.implKey] !== undefined) {
            yieldWriter && yieldWriter.leave("< " + methodInfo.implKey + " " + getYieldReasonName(J2ME.yieldMap[methodInfo.implKey]) + " cached.");
            return J2ME.yieldMap[methodInfo.implKey];
        }
        if (methodInfo.isSynchronized) {
            J2ME.yieldCounter && J2ME.yieldCounter.count("Method: " + methodInfo.implKey + " yields because it is synchronized.");
            yieldWriter && yieldWriter.leave("< " + methodInfo.implKey + " " + getYieldReasonName(2 /* Synchronized */));
            return J2ME.yieldMap[methodInfo.implKey] = 2 /* Synchronized */;
        }
        if (checkingForCanYield[methodInfo.implKey]) {
            yieldWriter && yieldWriter.leave("< " + methodInfo.implKey + " " + getYieldReasonName(5 /* Cycle */));
            return 5 /* Cycle */;
        }
        if (!methodInfo.codeAttribute) {
            assert(methodInfo.isNative || methodInfo.isAbstract, "bad method type in canYield");
            yieldWriter && yieldWriter.leave("< " + methodInfo.implKey + " Abstract");
            return J2ME.yieldMap[methodInfo.implKey] = 0 /* None */;
        }
        checkingForCanYield[methodInfo.implKey] = true;
        var constantPool = methodInfo.classInfo.constantPool;
        try {
            var result = 0 /* None */;
            var stream = new BytecodeStream(methodInfo.codeAttribute.code);
            stream.setBCI(0);
            while (stream.currentBCI < methodInfo.codeAttribute.code.length) {
                var op = stream.currentBC();
                switch (op) {
                    case 187 /* NEW */:
                        var classInfo = constantPool.resolveClass(stream.readCPI());
                        result = canStaticInitializerYield(classInfo);
                        break;
                    case 178 /* GETSTATIC */:
                    case 179 /* PUTSTATIC */:
                        var fieldInfo = constantPool.resolveField(stream.readCPI(), true);
                        var classInfo = fieldInfo.classInfo;
                        result = canStaticInitializerYield(classInfo);
                        break;
                    case 194 /* MONITORENTER */:
                    case 195 /* MONITOREXIT */:
                        result = 3 /* MonitorEnterExit */;
                        J2ME.yieldCounter && J2ME.yieldCounter.count("Method: " + methodInfo.implKey + " yields because it has monitor enter/exit.");
                        break;
                    case 185 /* INVOKEINTERFACE */:
                        result = 4 /* Virtual */;
                        if (result) {
                            J2ME.yieldCounter && J2ME.yieldCounter.count("Method: " + methodInfo.implKey + " yields because it has an invoke interface.");
                        }
                        break;
                    case 182 /* INVOKEVIRTUAL */:
                    case 215 /* RESOLVED_INVOKEVIRTUAL */:
                    case 183 /* INVOKESPECIAL */:
                    case 184 /* INVOKESTATIC */:
                        var cpi = stream.readCPI();
                        var callee = constantPool.resolveMethod(cpi, op === 184 /* INVOKESTATIC */);
                        if (op !== 184 /* INVOKESTATIC */) {
                            if (J2ME.yieldVirtualMap[methodInfo.implKey] === 0 /* None */) {
                                result = 0 /* None */;
                                break;
                            }
                        }
                        if (op === 184 /* INVOKESTATIC */) {
                            result = canStaticInitializerYield(methodInfo.classInfo);
                            if (result !== 0 /* None */) {
                                break;
                            }
                        }
                        if (!isStaticallyBound(op, callee)) {
                            var callees = [];
                            result = 4 /* Virtual */;
                            // if (false) { // Checking all possible callees, disabled for now until fully tested.
                            //   result = YieldReason.None;
                            //   gatherCallees(callees, callee.classInfo, callee);
                            //   yieldWriter && yieldWriter.writeLn("Gather: " + callee.implKey + " " + callees.map(x => x.implKey).join(", "));
                            //   for (var i = 0; i < callees.length; i++) {
                            //     if (canYield(callees[i])) {
                            //       yieldWriter && yieldWriter.writeLn("Gathered Method: " + callees[i].implKey + " yields.");
                            //       result = YieldReason.Virtual;
                            //       break;
                            //     }
                            //   }
                            // }
                            if (result !== 0 /* None */) {
                                J2ME.yieldCounter && J2ME.yieldCounter.count("Method: " + methodInfo.implKey + " yields because callee: " + callee.implKey + " is not statically bound.");
                                addDependency(callee, methodInfo, 4 /* Virtual */);
                            }
                            break;
                        }
                        result = canYield(callee);
                        if (result) {
                            J2ME.yieldCounter && J2ME.yieldCounter.count("Callee: " + callee.implKey + " yields.");
                            J2ME.yieldCounter && J2ME.yieldCounter.count("Method: " + methodInfo.implKey + " yields because callee: " + callee.implKey + " can yield.");
                            addDependency(callee, methodInfo, 6 /* Yield */);
                        }
                        break;
                }
                if (result) {
                    break;
                }
                stream.next();
            }
        }
        catch (e) {
            result = 5 /* Cycle */;
        }
        checkingForCanYield[methodInfo.implKey] = false;
        yieldWriter && yieldWriter.leave("< " + methodInfo.implKey + " " + getYieldReasonName(result));
        return J2ME.yieldMap[methodInfo.implKey] = result;
    }
    J2ME.canYield = canYield;
})(J2ME || (J2ME = {}));
var J2ME;
(function (J2ME) {
    var assert = J2ME.Debug.assert;
    var BytecodeStream = J2ME.Bytecode.BytecodeStream;
    var BlockMap = J2ME.Bytecode.BlockMap;
    var ExceptionBlock = J2ME.Bytecode.ExceptionBlock;
    var writer = null; // new IndentingWriter();
    J2ME.baselineCounter = null; // new Metrics.Counter(true);
    /**
     * The preemption check should be quick. We don't always want to measure
     * time so we use a quick counter and mask to determine when to do the
     * more expensive preemption check.
     */
    var preemptionSampleMask = 0xFF;
    /**
     * Expressions to inline for commonly invoked methods.
     */
    var inlineMethods = {
        "java/lang/Object.<init>.()V": "undefined"
    };
    /**
     * These methods have special powers. Methods are added to this set based on the regexp patterns in |privilegedPatterns|.
     */
    var privilegedMethods = {};
    var privilegedPatterns = [
        "com/sun/midp/crypto/SHA*",
        "java/io/DataInputStream*",
        "org/mozilla/internal/Sys*",
    ];
    /**
     * Emits optimization results inline as comments in the generated source.
     */
    var emitDebugInfoComments = false;
    /**
     * Emits control flow and yielding assertions.
     */
    var emitCompilerAssertions = false;
    /**
     * Emits profiling code that counts the number of times a method is invoked.
     */
    var emitCallMethodCounter = false;
    /**
     * Emits profiling code that counts the number of times control flow is dispatched
     * to a basic block.
     */
    var emitCallMethodLoopCounter = false;
    /**
     * Emits array bounds checks. Although this is necessary for correctness, most
     * applications work without them.
     */
    J2ME.emitCheckArrayBounds = true;
    /**
     * Inline calls to runtime methods whenever possible.
     */
    J2ME.inlineRuntimeCalls = true;
    /**
     * Emits array store type checks. Although this is necessary for correctness,
     * most applications work without them.
     */
    J2ME.emitCheckArrayStore = true;
    /**
     * Unsafe methods.
     */
    function isPrivileged(methodInfo) {
        var privileged = privilegedMethods[methodInfo.implKey];
        if (privileged) {
            return true;
        }
        else if (privileged === false) {
            return false;
        }
        // Check patterns.
        for (var i = 0; i < privilegedPatterns.length; i++) {
            if (methodInfo.implKey.match(privilegedPatterns[i])) {
                return privilegedMethods[methodInfo.implKey] = true;
            }
        }
        return privilegedMethods[methodInfo.implKey] = false;
    }
    /**
     * Emits preemption checks for methods that already yield.
     */
    J2ME.emitCheckPreemption = false;
    function baselineCompileMethod(methodInfo, target) {
        var compileExceptions = true;
        var compileSynchronized = true;
        if (!compileExceptions && methodInfo.exception_table_length) {
            throw new Error("Method: " + methodInfo.implKey + " has exception handlers.");
        }
        if (!compileSynchronized && methodInfo.isSynchronized) {
            throw new Error("Method: " + methodInfo.implKey + " is synchronized.");
        }
        writer && writer.writeLn("Compile: " + methodInfo.implKey);
        return new BaselineCompiler(methodInfo, target).compile();
    }
    J2ME.baselineCompileMethod = baselineCompileMethod;
    var Emitter = (function () {
        function Emitter(emitIndent) {
            this._indent = 0;
            this._buffer = [];
            this._emitIndent = emitIndent;
        }
        Emitter.prototype.reset = function () {
            this._buffer.length = 0;
            this._indent = 0;
        };
        Emitter.prototype.enter = function (s) {
            this.writeLn(s);
            this._indent++;
        };
        Emitter.prototype.leave = function (s) {
            this._indent--;
            this.writeLn(s);
        };
        Emitter.prototype.leaveAndEnter = function (s) {
            this._indent--;
            this.writeLn(s);
            this._indent++;
        };
        Emitter.prototype.writeLn = function (s) {
            if (this._emitIndent) {
                var prefix = "";
                for (var i = 0; i < this._indent; i++) {
                    prefix += "  ";
                }
                s = prefix + s;
            }
            this._buffer.push(s);
        };
        Emitter.prototype.writeLns = function (lines) {
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.length > 0) {
                    this.writeLn(lines[i]);
                }
            }
        };
        Emitter.prototype.writeEmitter = function (emitter) {
            this._buffer.push.apply(this._buffer, emitter._buffer);
        };
        Emitter.prototype.indent = function () {
            this._indent++;
        };
        Emitter.prototype.outdent = function () {
            this._indent--;
        };
        Emitter.prototype.prependLn = function (s) {
            this._buffer.unshift(s);
        };
        Emitter.prototype.toString = function () {
            return this._buffer.join("\n");
        };
        Emitter.prototype.copyLines = function () {
            return this._buffer.slice();
        };
        return Emitter;
    })();
    function kindToTypedArrayName(kind) {
        switch (kind) {
            case 4 /* Int */:
                return "Int32Array";
            case 3 /* Char */:
                return "Uint16Array";
            case 2 /* Short */:
                return "Int16Array";
            case 1 /* Byte */:
                return "Int8Array";
            case 0 /* Boolean */:
                return "Uint8Array";
            case 5 /* Float */:
                return "Float32Array";
            case 6 /* Long */:
                return "Array";
            case 7 /* Double */:
                return "Float64Array";
            default:
                throw J2ME.Debug.unexpected(J2ME.getKindName(kind));
        }
    }
    function conditionToOperator(condition) {
        switch (condition) {
            case 0 /* EQ */: return "===";
            case 1 /* NE */: return "!==";
            case 2 /* LT */: return "<";
            case 3 /* LE */: return "<=";
            case 4 /* GT */: return ">";
            case 5 /* GE */: return ">=";
            default:
                J2ME.Debug.unexpected(J2ME.Bytecode.Condition[condition]);
        }
    }
    function doubleConstant(v) {
        // Check for -0 floats.
        if ((1 / v) < 0) {
            return "-" + Math.abs(v);
        }
        return String(v);
    }
    function throwCompilerError(message) {
        throw new Error(message);
    }
    var BaselineCompiler = (function () {
        function BaselineCompiler(methodInfo, target) {
            this.hasOSREntryPoint = false;
            this.blockBodies = [];
            this.methodInfo = methodInfo;
            this.variables = {};
            this.pc = 0;
            this.sp = 0;
            this.parameters = [];
            this.referencedClasses = [this.methodInfo.classInfo];
            this.initializedClasses = null;
            this.hasHandlers = methodInfo.exception_table_length > 0;
            this.hasMonitorEnter = false;
            this.blockStackHeightMap = [0];
            this.bodyEmitter = new Emitter(!release);
            this.blockEmitter = new Emitter(!release);
            this.target = target;
            this.hasUnwindThrow = false;
            this.isPrivileged = isPrivileged(this.methodInfo);
        }
        BaselineCompiler.prototype.compile = function () {
            var s;
            s = performance.now();
            this.blockMap = new BlockMap(this.methodInfo);
            this.blockMap.build();
            J2ME.baselineCounter && J2ME.baselineCounter.count("Create BlockMap", 1, performance.now() - s);
            Relooper.cleanup();
            Relooper.init();
            var blocks = this.blockMap.blocks;
            // Create relooper blocks ahead of time so we can add branches in one pass over the bytecode.
            for (var i = 0; i < blocks.length; i++) {
                blocks[i].relooperBlockID = Relooper.addBlock("// Block: " + blocks[i].blockID);
            }
            this.entryBlock = blocks[0].relooperBlockID;
            this.emitPrologue();
            this.emitBody();
            var variables = [];
            for (var k in this.variables) {
                if (this.variables[k] !== undefined) {
                    variables.push(k + "=" + this.variables[k]);
                }
                else {
                    variables.push(k);
                }
            }
            if (variables.length > 0) {
                this.bodyEmitter.prependLn("var " + variables.join(",") + ";");
            }
            if (this.hasMonitorEnter) {
                this.bodyEmitter.prependLn("var th=$.ctx.threadAddress;");
            }
            // All methods get passed in a |self| address. For static methods this parameter is always null but we still
            // need it in front.
            if (this.methodInfo.isStatic) {
                this.parameters.unshift("self");
            }
            return new J2ME.CompiledMethodInfo(this.parameters, this.bodyEmitter.toString(), this.referencedClasses, this.hasOSREntryPoint ? this.blockMap.getOSREntryPoints() : []);
        };
        BaselineCompiler.prototype.needsVariable = function (name, value) {
            this.variables[name] = value;
        };
        BaselineCompiler.prototype.setSuccessorsBlockStackHeight = function (block, sp) {
            var successors = block.successors;
            for (var i = 0; i < successors.length; i++) {
                var successor = successors[i];
                if (successor instanceof ExceptionBlock ||
                    successor.isExceptionEntry) {
                    continue;
                }
                this.setBlockStackHeight(successors[i].startBci, sp);
            }
        };
        BaselineCompiler.prototype.emitBody = function () {
            var blockMap = this.blockMap;
            writer && blockMap.trace(writer);
            var stream = new BytecodeStream(this.methodInfo.codeAttribute.code);
            var needsTry = this.hasHandlers || this.methodInfo.isSynchronized;
            // We need a while to loop back to the top and dispatch to the appropriate exception handler.
            var needsWhile = this.hasHandlers;
            if (emitCallMethodLoopCounter) {
                this.bodyEmitter.writeLn("J2ME.baselineMethodCounter.count(\"" + this.methodInfo.implKey + "\");");
            }
            var s = performance.now();
            var blocks = blockMap.blocks;
            for (var i = 0; i < blocks.length; i++) {
                var block = blocks[i];
                if (block instanceof ExceptionBlock) {
                    continue;
                }
                if (block.isExceptionEntry) {
                    writer && writer.writeLn("block.isExceptionEntry");
                    this.setBlockStackHeight(block.startBci, 1);
                }
                this.blockEmitter.reset();
                this.emitBlockBody(stream, block);
            }
            J2ME.baselineCounter && J2ME.baselineCounter.count("Emit Blocks", 1, performance.now() - s);
            if (this.hasUnwindThrow) {
                needsTry = true;
            }
            needsWhile && this.bodyEmitter.enter("while(1){");
            needsTry && this.bodyEmitter.enter("try{");
            this.bodyEmitter.writeLn("var label=0;");
            // Fill scaffolding with block bodies.
            s = performance.now();
            var scaffolding = Relooper.render(this.entryBlock).split("\n");
            J2ME.baselineCounter && J2ME.baselineCounter.count("Relooper", 1, performance.now() - s);
            for (var i = 0; i < scaffolding.length; i++) {
                var line = scaffolding[i];
                if (line.length > 0 && line[0] === "@") {
                    this.bodyEmitter.writeLns(this.blockBodies[line.substring(1) | 0]);
                }
                else {
                    this.bodyEmitter.writeLn(scaffolding[i]);
                }
            }
            emitCompilerAssertions && this.bodyEmitter.writeLn("J2ME.Debug.assert(false, 'Invalid PC: ' + pc)");
            if (needsTry) {
                this.bodyEmitter.leaveAndEnter("}catch(ex){");
                if (this.hasUnwindThrow) {
                    this.emitBailout(this.bodyEmitter, "ex.getPC()", "ex.getSP()", this.sp);
                }
                this.bodyEmitter.writeLn(this.getStackName(0) + "=TE(ex)._address;");
                this.sp = 1;
                if (this.hasHandlers) {
                    for (var i = 0; i < this.methodInfo.exception_table_length; i++) {
                        this.emitExceptionHandler(this.bodyEmitter, this.methodInfo.getExceptionEntryViewByIndex(i));
                    }
                }
                if (this.methodInfo.isSynchronized) {
                    this.emitMonitorExit(this.bodyEmitter, this.lockObject);
                }
                this.bodyEmitter.writeLn("throw GH(" + this.peek(8 /* Reference */) + ");");
                this.bodyEmitter.leave("}");
            }
            if (needsWhile) {
                this.bodyEmitter.leave("}");
            }
        };
        BaselineCompiler.prototype.emitExceptionHandler = function (emitter, handler) {
            var check = "";
            if (handler.catch_type > 0) {
                var classInfo = this.lookupClass(handler.catch_type);
                check = "IOK";
                if (classInfo.isInterface) {
                    check = "IOI";
                }
                check += "(" + this.peek(8 /* Reference */) + "," + this.classInfoSymbol(classInfo) + ")";
                check = "&&" + check;
            }
            this.bodyEmitter.writeLn("if(pc>=" + handler.start_pc + "&&pc<" + handler.end_pc + check + "){pc=" + this.getBlockIndex(handler.handler_pc) + ";continue;}");
            return;
        };
        /**
         * Resets block level optimization state.
         */
        BaselineCompiler.prototype.resetOptimizationState = function () {
            this.initializedClasses = Object.create(null);
        };
        BaselineCompiler.prototype.emitBlockBody = function (stream, block) {
            this.resetOptimizationState();
            this.sp = this.blockStackHeightMap[block.startBci];
            emitDebugInfoComments && this.blockEmitter.writeLn("// " + this.blockMap.blockToString(block));
            writer && writer.writeLn("emitBlock: " + block.startBci + " " + this.sp + " " + block.isExceptionEntry);
            release || assert(this.sp !== undefined, "Bad stack height");
            stream.setBCI(block.startBci);
            var lastSourceLocation = null;
            var lastBC;
            while (stream.currentBCI <= block.endBci) {
                this.pc = stream.currentBCI;
                lastBC = stream.currentBC();
                this.emitBytecode(stream, block);
                stream.next();
            }
            if (this.sp >= 0) {
                this.setSuccessorsBlockStackHeight(block, this.sp);
                if (!J2ME.Bytecode.isBlockEnd(lastBC)) {
                    Relooper.addBranch(block.relooperBlockID, this.getBlock(stream.currentBCI).relooperBlockID);
                }
            }
            else {
            }
            // Instead of setting the relooper block code to the generated source,
            // we set it to the block ID which we later replace with the source.
            // This is done to avoid joining and serializing strings to the asm.js
            // heap for use in the relooper, and then converting them back to JS
            // strings later.
            Relooper.setBlockCode(block.relooperBlockID, "@" + block.blockID);
            this.blockBodies[block.blockID] = this.blockEmitter.copyLines();
        };
        BaselineCompiler.prototype.emitPrologue = function () {
            var signatureKinds = this.methodInfo.signatureKinds;
            var parameterLocalIndex = 0;
            // For virtual methods, the first parameter is the self address.
            if (!this.methodInfo.isStatic) {
                this.parameters.push(this.getLocalName(parameterLocalIndex++));
            }
            // Skip the first typeDescriptor since it is the return type.
            for (var i = 1; i < signatureKinds.length; i++) {
                var kind = signatureKinds[i];
                this.parameters.push(this.getLocalName(parameterLocalIndex++));
                if (J2ME.isTwoSlot(kind)) {
                    this.parameters.push(this.getLocalName(parameterLocalIndex++));
                }
            }
            var maxLocals = this.methodInfo.codeAttribute.max_locals;
            var nonParameterLocals = [];
            for (var i = parameterLocalIndex; i < maxLocals; i++) {
                nonParameterLocals.push(this.getLocalName(i));
            }
            if (nonParameterLocals.length) {
                this.bodyEmitter.writeLn("var " + nonParameterLocals.map(function (x) { return x + "=0"; }).join(",") + ";");
            }
            if (!this.methodInfo.isStatic) {
                this.bodyEmitter.writeLn("var self=" + this.getLocal(0) + ";");
            }
            var maxStack = this.methodInfo.codeAttribute.max_stack;
            if (maxStack) {
                var stack = [];
                for (var i = 0; i < maxStack; i++) {
                    stack.push(this.getStackName(i));
                }
                this.bodyEmitter.writeLn("var " + stack.map(function (x) { return x + "=0"; }).join(",") + ";");
            }
            this.bodyEmitter.writeLn("var pc=0;");
            if (this.hasHandlers) {
                this.bodyEmitter.writeLn("var ex;");
            }
            if (emitCallMethodCounter) {
                this.bodyEmitter.writeLn("J2ME.baselineMethodCounter.count(\"" + this.methodInfo.implKey + "\");");
            }
            this.lockObject = this.methodInfo.isSynchronized ?
                this.methodInfo.isStatic ? this.runtimeClassObject(this.methodInfo.classInfo) : "self"
                : "null";
            this.emitEntryPoints();
        };
        BaselineCompiler.prototype.emitEntryPoints = function () {
            var needsOSREntryPoint = false;
            var needsEntryDispatch = false;
            var blockMap = this.blockMap;
            var blocks = blockMap.blocks;
            for (var i = 0; i < blocks.length; i++) {
                var block = blocks[i];
                if (block.isLoopHeader && !block.isInnerLoopHeader()) {
                    needsOSREntryPoint = true;
                    needsEntryDispatch = true;
                }
                if (block.isExceptionEntry) {
                    needsEntryDispatch = true;
                }
            }
            if (needsOSREntryPoint) {
                // Are we doing an OSR?
                this.bodyEmitter.enter("if(O){");
                this.bodyEmitter.writeLn("var nt=$.ctx.nativeThread;");
                this.bodyEmitter.writeLn("var fp=nt.fp;");
                this.bodyEmitter.writeLn("var lp=fp-" + this.methodInfo.codeAttribute.max_locals + ";");
                // Restore locals.
                var restoreLocals = [];
                for (var i = 0; i < this.methodInfo.codeAttribute.max_locals; i++) {
                    restoreLocals.push(this.getLocal(i) + "=i32[lp+" + i + "]");
                }
                this.bodyEmitter.writeLn(restoreLocals.join(",") + ";");
                this.needsVariable("re");
                if (!this.methodInfo.isStatic) {
                    this.bodyEmitter.writeLn("self=i32[fp+" + 3 /* MonitorOffset */ + "]");
                }
                this.bodyEmitter.writeLn("pc=nt.pc;");
                this.bodyEmitter.writeLn("nt.popFrame(O);");
                this.bodyEmitter.writeLn("nt.pushMarkerFrame(" + J2ME.FrameType.Native + ");");
                this.bodyEmitter.writeLn("O=null;");
                if (this.methodInfo.isSynchronized) {
                    this.bodyEmitter.leaveAndEnter("}else{");
                    this.emitMonitorEnter(this.bodyEmitter, 0, this.lockObject);
                }
                this.bodyEmitter.leave("}");
                this.hasOSREntryPoint = true;
            }
            else {
                if (this.methodInfo.isSynchronized) {
                    this.emitMonitorEnter(this.bodyEmitter, 0, this.lockObject);
                }
            }
            // Insert a preemption check after the OSR code so the pc
            // and state will be stored. We can only do this if the
            // method has the necessary unwinding code.
            if (J2ME.canYield(this.methodInfo)) {
                this.emitPreemptionCheck(this.bodyEmitter);
            }
            if (needsEntryDispatch) {
                var entryBlock = Relooper.addBlock("// Entry Dispatch Block");
                // Add entry points
                var blocks = this.blockMap.blocks;
                for (var i = 0; i < blocks.length; i++) {
                    var block = blocks[i];
                    if (i === 0 ||
                        (block.isLoopHeader && !block.isInnerLoopHeader()) ||
                        block.isExceptionEntry) {
                        Relooper.addBranch(entryBlock, block.relooperBlockID, "pc===" + block.startBci);
                    }
                }
                // Add invalid block.
                var osrInvalidBlock = Relooper.addBlock(emitCompilerAssertions ? "J2ME.Debug.assert(false, 'Invalid OSR PC: ' + pc)" : "");
                Relooper.addBranch(entryBlock, osrInvalidBlock);
                this.entryBlock = entryBlock;
            }
        };
        BaselineCompiler.prototype.lookupClass = function (cpi) {
            var classInfo = this.methodInfo.classInfo.constantPool.resolveClass(cpi);
            J2ME.ArrayUtilities.pushUnique(this.referencedClasses, classInfo);
            return classInfo;
        };
        BaselineCompiler.prototype.classInfoSymbol = function (classInfo) {
            var id = this.referencedClasses.indexOf(classInfo);
            assert(id >= 0, "Class info not found in the referencedClasses list.");
            return J2ME.classInfoSymbolPrefix + id;
        };
        BaselineCompiler.prototype.classInfoObject = function (classInfo) {
            return "CI[" + this.classInfoSymbol(classInfo) + "]";
        };
        BaselineCompiler.prototype.lookupMethod = function (cpi, opcode, isStatic) {
            var methodInfo = this.methodInfo.classInfo.constantPool.resolveMethod(cpi, isStatic);
            J2ME.ArrayUtilities.pushUnique(this.referencedClasses, methodInfo.classInfo);
            return methodInfo;
        };
        BaselineCompiler.prototype.methodInfoSymbol = function (methodInfo) {
            var id = this.referencedClasses.indexOf(methodInfo.classInfo);
            assert(id >= 0, "Class info not found in the referencedClasses list.");
            return J2ME.methodInfoSymbolPrefix + id + "_" + methodInfo.index;
        };
        BaselineCompiler.prototype.lookupField = function (cpi, opcode, isStatic) {
            var fieldInfo = this.methodInfo.classInfo.constantPool.resolveField(cpi, isStatic);
            J2ME.ArrayUtilities.pushUnique(this.referencedClasses, fieldInfo.classInfo);
            return fieldInfo;
        };
        BaselineCompiler.prototype.getStackName = function (i) {
            if (i >= BaselineCompiler.stackNames.length) {
                return "s" + (i - BaselineCompiler.stackNames.length);
            }
            return BaselineCompiler.stackNames[i];
        };
        BaselineCompiler.prototype.getStack = function (i) {
            return this.getStackName(i);
        };
        BaselineCompiler.prototype.getLocalName = function (i) {
            if (i >= BaselineCompiler.localNames.length) {
                return "l" + (i - BaselineCompiler.localNames.length);
            }
            return BaselineCompiler.localNames[i];
        };
        BaselineCompiler.prototype.getLocal = function (i) {
            if (i < 0 || i >= this.methodInfo.codeAttribute.max_locals) {
                throw new Error("Out of bounds local read");
            }
            return this.getLocalName(i);
        };
        BaselineCompiler.prototype.emitLoadLocal = function (kind, i) {
            this.emitPush(kind, this.getLocal(i));
            if (J2ME.isTwoSlot(kind)) {
                this.emitPush(kind, this.getLocal(i + 1));
            }
        };
        BaselineCompiler.prototype.emitStoreLocal = function (kind, i) {
            if (J2ME.isTwoSlot(kind)) {
                this.blockEmitter.writeLn(this.getLocal(i + 1) + "=" + this.pop(11 /* High */) + ";");
            }
            this.blockEmitter.writeLn(this.getLocal(i) + "=" + this.pop(kind) + ";");
        };
        BaselineCompiler.prototype.peekAny = function () {
            return this.peek(9 /* Void */);
        };
        BaselineCompiler.prototype.peek = function (kind) {
            return this.getStack(this.sp - 1);
        };
        BaselineCompiler.prototype.popAny = function () {
            return this.pop(9 /* Void */);
        };
        BaselineCompiler.prototype.emitPopTemporaries = function (n) {
            for (var i = 0; i < n; i++) {
                this.blockEmitter.writeLn("var t" + i + "=" + this.pop(9 /* Void */) + ";");
            }
        };
        BaselineCompiler.prototype.emitPushTemporary = function () {
            var indices = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                indices[_i - 0] = arguments[_i];
            }
            for (var i = 0; i < indices.length; i++) {
                this.emitPush(9 /* Void */, "t" + indices[i]);
            }
        };
        BaselineCompiler.prototype.pop = function (kind) {
            release || assert(this.sp, "SP should not be less than zero, popping: " + J2ME.getKindName(kind));
            this.sp--;
            return this.getStack(this.sp);
        };
        BaselineCompiler.prototype.popSlot = function () {
            return this.pop(4 /* Int */);
        };
        BaselineCompiler.prototype.emitPushAny = function (v) {
            this.emitPush(9 /* Void */, v);
        };
        BaselineCompiler.prototype.emitPushBits = function (kind, v) {
            release || assert((v | 0) === v, "(v | 0) === v");
            if (v < 0) {
                this.emitPush(kind, "-" + Math.abs(v));
            }
            else {
                this.emitPush(kind, String(v));
            }
        };
        BaselineCompiler.prototype.emitPushInt = function (v) {
            release || assert((v | 0) === v, "(v | 0) === v");
            this.emitPushBits(4 /* Int */, v);
        };
        BaselineCompiler.prototype.emitPushFloat = function (v) {
            aliasedF32[0] = v;
            this.emitPushBits(5 /* Float */, aliasedI32[0]);
        };
        BaselineCompiler.prototype.emitPushDouble = function (v) {
            aliasedF64[0] = v;
            this.emitPushBits(7 /* Double */, aliasedI32[0]);
            this.emitPushBits(11 /* High */, aliasedI32[1]);
        };
        BaselineCompiler.prototype.emitPushLongBits = function (l, h) {
            this.emitPushBits(6 /* Long */, l);
            this.emitPushBits(11 /* High */, h);
        };
        BaselineCompiler.prototype.emitPush = function (kind, v) {
            this.blockEmitter.writeLn(this.getStackName(this.sp) + "=" + v + ";");
            this.sp++;
        };
        BaselineCompiler.prototype.emitReturn = function (kind) {
            if (this.methodInfo.isSynchronized) {
                this.emitMonitorExit(this.blockEmitter, this.lockObject);
            }
            if (kind === 9 /* Void */) {
                this.blockEmitter.writeLn("return;");
                return;
            }
            if (J2ME.isTwoSlot(kind)) {
                var h = this.pop(kind);
                var l = this.pop(kind);
                this.blockEmitter.writeLn("tempReturn0=" + h + ";");
                this.blockEmitter.writeLn("return " + l + ";");
            }
            else {
                this.blockEmitter.writeLn("return " + this.pop(kind) + ";");
            }
        };
        BaselineCompiler.prototype.emitGetField = function (fieldInfo, isStatic) {
            if (isStatic) {
                this.emitClassInitializationCheck(fieldInfo.classInfo);
            }
            var kind = J2ME.getSignatureKind(fieldInfo.utf8Signature);
            var object = isStatic ? this.runtimeClass(fieldInfo.classInfo) : this.pop(8 /* Reference */);
            if (!isStatic) {
                this.emitNullPointerCheck(object);
            }
            var address = object + "+" + fieldInfo.byteOffset;
            if (J2ME.isTwoSlot(kind)) {
                this.needsVariable("ea");
                this.blockEmitter.writeLn("ea=" + address + ";");
                this.emitPush(kind, "i32[ea>>2]");
                this.emitPush(11 /* High */, "i32[ea+4>>2]");
            }
            else {
                this.emitPush(kind, "i32[" + address + ">>2]");
            }
        };
        BaselineCompiler.prototype.emitPutField = function (fieldInfo, isStatic) {
            if (isStatic) {
                this.emitClassInitializationCheck(fieldInfo.classInfo);
            }
            var kind = J2ME.getSignatureKind(fieldInfo.utf8Signature);
            var l, h;
            if (J2ME.isTwoSlot(kind)) {
                h = this.pop(11 /* High */);
                l = this.pop(kind);
            }
            else {
                l = this.pop(kind);
            }
            var object = isStatic ? this.runtimeClass(fieldInfo.classInfo) : this.pop(8 /* Reference */);
            if (!isStatic) {
                this.emitNullPointerCheck(object);
            }
            var address = object + "+" + fieldInfo.byteOffset;
            if (J2ME.isTwoSlot(kind)) {
                this.needsVariable("ea");
                this.blockEmitter.writeLn("ea=" + address + ";");
                this.blockEmitter.writeLn("i32[ea>>2]=" + l + ";");
                this.blockEmitter.writeLn("i32[ea+4>>2]=" + h + ";");
            }
            else {
                this.blockEmitter.writeLn("i32[" + address + ">>2]=" + l + ";");
            }
        };
        BaselineCompiler.prototype.setBlockStackHeight = function (pc, height) {
            writer && writer.writeLn("Setting Block Height " + pc + " " + height);
            if (this.blockStackHeightMap[pc] !== undefined) {
                release || assert(this.blockStackHeightMap[pc] === height, "Bad block height: " + pc + " " + this.blockStackHeightMap[pc] + " " + height);
            }
            this.blockStackHeightMap[pc] = height;
        };
        BaselineCompiler.prototype.emitIf = function (block, stream, predicate) {
            var nextBlock = this.getBlock(stream.nextBCI);
            var targetBlock = this.getBlock(stream.readBranchDest());
            Relooper.addBranch(block.relooperBlockID, nextBlock.relooperBlockID);
            if (targetBlock !== nextBlock) {
                Relooper.addBranch(block.relooperBlockID, targetBlock.relooperBlockID, predicate);
            }
        };
        BaselineCompiler.prototype.emitIfNull = function (block, stream, condition) {
            var x = this.pop(8 /* Reference */);
            this.emitIf(block, stream, x + conditionToOperator(condition) + String(0 /* NULL */));
        };
        BaselineCompiler.prototype.emitIfSame = function (block, stream, kind, condition) {
            var y = this.pop(kind);
            var x = this.pop(kind);
            this.emitIf(block, stream, x + conditionToOperator(condition) + y);
        };
        BaselineCompiler.prototype.emitIfZero = function (block, stream, condition) {
            var x = this.pop(4 /* Int */);
            this.emitIf(block, stream, x + conditionToOperator(condition) + "0");
        };
        BaselineCompiler.prototype.runtimeClass = function (classInfo) {
            this.needsVariable("sa", "$.SA");
            return "sa[" + this.classInfoSymbol(classInfo) + "]";
        };
        BaselineCompiler.prototype.runtimeClassObject = function (classInfo) {
            this.needsVariable("co", "$.CO");
            return "co[" + this.classInfoSymbol(classInfo) + "]";
        };
        BaselineCompiler.prototype.emitClassInitializationCheck = function (classInfo) {
            while (classInfo instanceof J2ME.ArrayClassInfo) {
                classInfo = classInfo.elementClass;
            }
            if (!J2ME.CLASSES.isPreInitializedClass(classInfo)) {
                var message;
                if (this.initializedClasses[classInfo.id]) {
                    (emitDebugInfoComments || J2ME.baselineCounter) && (message = "Optimized ClassInitializationCheck: " + classInfo.getClassNameSlow() + ", block redundant.");
                }
                else if (classInfo === this.methodInfo.classInfo) {
                    (emitDebugInfoComments || J2ME.baselineCounter) && (message = "Optimized ClassInitializationCheck: " + classInfo.getClassNameSlow() + ", self access.");
                }
                else if (!classInfo.isInterface && this.methodInfo.classInfo.isAssignableTo(classInfo)) {
                    (emitDebugInfoComments || J2ME.baselineCounter) && (message = "Optimized ClassInitializationCheck: " + classInfo.getClassNameSlow() + ", base access.");
                }
                else {
                    (emitDebugInfoComments || J2ME.baselineCounter) && (message = "ClassInitializationCheck: " + classInfo.getClassNameSlow());
                    this.needsVariable("ci", "$.I");
                    this.blockEmitter.writeLn("ci[" + this.classInfoSymbol(classInfo) + "] || CIC(" + this.classInfoObject(classInfo) + ");");
                    if (J2ME.canStaticInitializerYield(classInfo)) {
                        this.emitUnwind(this.blockEmitter, String(this.pc));
                    }
                    else {
                        emitCompilerAssertions && this.emitNoUnwindAssertion();
                    }
                }
                emitDebugInfoComments && this.blockEmitter.writeLn("// " + message);
                J2ME.baselineCounter && J2ME.baselineCounter.count(message);
                this.initializedClasses[classInfo.id] = true;
            }
        };
        BaselineCompiler.prototype.emitInvoke = function (methodInfo, opcode, nextPC) {
            var calleeCanYield = 4 /* Virtual */;
            if (J2ME.isStaticallyBound(opcode, methodInfo)) {
                calleeCanYield = J2ME.canYield(methodInfo);
            }
            if (opcode === 184 /* INVOKESTATIC */) {
                this.emitClassInitializationCheck(methodInfo.classInfo);
            }
            var signatureKinds = methodInfo.signatureKinds;
            var args = [];
            for (var i = signatureKinds.length - 1; i > 0; i--) {
                args.unshift(this.pop(signatureKinds[i]));
                if (J2ME.isTwoSlot(signatureKinds[i])) {
                    args.unshift(this.pop(11 /* High */));
                }
            }
            var call;
            var classInfoObject = this.classInfoObject(methodInfo.classInfo);
            var methodId = null;
            if (opcode !== 184 /* INVOKESTATIC */) {
                var object = this.pop(8 /* Reference */);
                this.emitNullPointerCheck(object);
                args.unshift(object);
                if (opcode === 183 /* INVOKESPECIAL */) {
                    methodId = this.methodInfoSymbol(methodInfo);
                    call = "(LM[" + methodId + "]||" + "GLM(" + methodId + "))(" + args.join(",") + ")";
                }
                else if (opcode === 182 /* INVOKEVIRTUAL */) {
                    var classId = "i32[(" + object + "|0)>>2]";
                    if (methodInfo.vTableIndex < (1 << 6 /* LOG_MAX_FLAT_VTABLE_SIZE */)) {
                        call = "(FT[(" + classId + "<<" + 6 /* LOG_MAX_FLAT_VTABLE_SIZE */ + ")+" + methodInfo.vTableIndex + "]||" + "GLVM(" + classId + "," + methodInfo.vTableIndex + "))(" + args.join(",") + ")";
                    }
                    else {
                        call = "(VT[" + classId + "][" + methodInfo.vTableIndex + "]||" + "GLVM(" + classId + "," + methodInfo.vTableIndex + "))(" + args.join(",") + ")";
                    }
                }
                else if (opcode === 185 /* INVOKEINTERFACE */) {
                    var objClass = "CI[i32[(" + object + "+" + 0 /* OBJ_CLASS_ID_OFFSET */ + ")>>2]]";
                    methodId = objClass + ".iTable['" + methodInfo.mangledName + "'].id";
                    call = "(LM[" + methodId + "]||" + "GLM(" + methodId + "))(" + args.join(",") + ")";
                }
                else {
                    J2ME.Debug.unexpected(J2ME.Bytecode.getBytecodesName(opcode));
                }
            }
            else {
                args.unshift(String(0 /* NULL */));
                methodId = this.methodInfoSymbol(methodInfo);
                call = "(LM[" + methodId + "]||" + "GLM(" + methodId + "))(" + args.join(",") + ")";
            }
            if (methodInfo.implKey in inlineMethods) {
                emitDebugInfoComments && this.blockEmitter.writeLn("// Inlining: " + methodInfo.implKey);
                call = inlineMethods[methodInfo.implKey];
            }
            this.needsVariable("re");
            emitDebugInfoComments && this.blockEmitter.writeLn("// " + J2ME.Bytecode.getBytecodesName(opcode) + ": " + methodInfo.implKey);
            this.blockEmitter.writeLn("re=" + call + ";");
            if (calleeCanYield) {
                this.emitUnwind(this.blockEmitter, String(this.pc));
            }
            else {
                emitCompilerAssertions && this.emitUndefinedReturnAssertion();
                emitCompilerAssertions && this.emitNoUnwindAssertion();
            }
            if (signatureKinds[0] !== 9 /* Void */) {
                this.emitPush(signatureKinds[0], "re");
                if (J2ME.isTwoSlot(signatureKinds[0])) {
                    this.emitPush(11 /* High */, "tempReturn0");
                }
            }
        };
        BaselineCompiler.prototype.emitNegativeArraySizeCheck = function (length) {
            if (this.isPrivileged) {
                return;
            }
            this.blockEmitter.writeLn(length + "<0&&TS();");
        };
        BaselineCompiler.prototype.emitBoundsCheck = function (array, index) {
            if (this.isPrivileged || !J2ME.emitCheckArrayBounds) {
                return;
            }
            if (J2ME.inlineRuntimeCalls) {
                this.blockEmitter.writeLn("if((" + index + ">>>0)>=(i32[" + array + "+" + 4 /* ARRAY_LENGTH_OFFSET */ + ">>2]>>>0))TI(" + index + ");");
            }
            else {
                this.blockEmitter.writeLn("CAB(" + array + "," + index + ");");
            }
        };
        BaselineCompiler.prototype.emitArrayStoreCheck = function (array, value) {
            if (this.isPrivileged || !J2ME.emitCheckArrayStore) {
                return;
            }
            this.blockEmitter.writeLn("CAS(" + array + "," + value + ");");
        };
        BaselineCompiler.prototype.emitStoreIndexed = function (kind) {
            var l, h;
            if (J2ME.isTwoSlot(kind)) {
                h = this.pop(11 /* High */);
            }
            l = this.pop(J2ME.stackKind(kind));
            var index = this.pop(4 /* Int */);
            var array = this.pop(8 /* Reference */);
            if (kind === 8 /* Reference */) {
                this.emitNullPointerCheck(array);
            }
            this.emitBoundsCheck(array, index);
            if (kind === 8 /* Reference */) {
                this.emitArrayStoreCheck(array, l);
            }
            var base = array + "+" + 8 /* ARRAY_HDR_SIZE */;
            switch (kind) {
                case 1 /* Byte */:
                    this.blockEmitter.writeLn("i8[" + base + "+" + index + "]=" + l + ";");
                    return;
                case 3 /* Char */:
                    this.blockEmitter.writeLn("u16[(" + base + ">>1)+" + index + "|0]=" + l + ";");
                    return;
                case 2 /* Short */:
                    this.blockEmitter.writeLn("i16[(" + base + ">>1)+" + index + "|0]=" + l + ";");
                    return;
                case 4 /* Int */:
                case 5 /* Float */:
                case 8 /* Reference */:
                    this.blockEmitter.writeLn("i32[(" + base + ">>2)+" + index + "|0]=" + l + ";");
                    return;
                case 6 /* Long */:
                case 7 /* Double */:
                    this.needsVariable("ea");
                    this.blockEmitter.writeLn("ea=(" + base + ">>2)+(" + index + "<<1)|0;");
                    this.blockEmitter.writeLn("i32[ea]=" + l + ";");
                    this.blockEmitter.writeLn("i32[ea+1|0]=" + h + ";");
                    return;
                default:
                    J2ME.Debug.assertUnreachable("Unimplemented type: " + J2ME.getKindName(kind));
                    break;
            }
        };
        BaselineCompiler.prototype.emitLoadIndexed = function (kind) {
            var index = this.pop(4 /* Int */);
            var array = this.pop(8 /* Reference */);
            this.emitNullPointerCheck(array);
            this.emitBoundsCheck(array, index);
            var base = array + "+" + 8 /* ARRAY_HDR_SIZE */;
            switch (kind) {
                case 1 /* Byte */:
                    this.emitPush(kind, "i8[" + base + "+" + index + "|0]");
                    break;
                case 3 /* Char */:
                    this.emitPush(kind, "u16[(" + base + ">>1)+" + index + "|0]");
                    break;
                case 2 /* Short */:
                    this.emitPush(kind, "i16[(" + base + ">>1)+" + index + "|0]");
                    break;
                case 4 /* Int */:
                case 5 /* Float */:
                case 8 /* Reference */:
                    this.emitPush(kind, "i32[(" + base + ">>2)+" + index + "|0]");
                    break;
                case 6 /* Long */:
                case 7 /* Double */:
                    this.needsVariable("ea");
                    this.blockEmitter.writeLn("ea=(" + base + ">>2)+(" + index + "<<1)|0;");
                    this.emitPush(kind, "i32[ea]");
                    this.emitPush(kind, "i32[ea+1|0]");
                    break;
                default:
                    J2ME.Debug.assertUnreachable("Unimplemented type: " + J2ME.getKindName(kind));
                    break;
            }
        };
        BaselineCompiler.prototype.emitIncrement = function (stream) {
            var l = this.getLocal(stream.readLocalIndex());
            this.blockEmitter.writeLn(l + "=" + l + "+" + stream.readIncrement() + "|0;");
        };
        BaselineCompiler.prototype.emitGoto = function (block, stream) {
            var targetBCI = stream.readBranchDest();
            var targetBlock = this.getBlock(targetBCI);
            Relooper.addBranch(block.relooperBlockID, targetBlock.relooperBlockID);
        };
        BaselineCompiler.prototype.emitLoadConstant = function (index) {
            var cp = this.methodInfo.classInfo.constantPool;
            var offset = cp.entries[index];
            var buffer = cp.buffer;
            var tag = buffer[offset++];
            switch (tag) {
                case 4 /* CONSTANT_Float */:
                case 3 /* CONSTANT_Integer */:
                    var value = buffer[offset++] << 24 | buffer[offset++] << 16 | buffer[offset++] << 8 | buffer[offset++];
                    this.emitPushBits(4 /* Int */, value);
                    return;
                case 5 /* CONSTANT_Long */:
                case 6 /* CONSTANT_Double */:
                    var h = buffer[offset++] << 24 | buffer[offset++] << 16 | buffer[offset++] << 8 | buffer[offset++];
                    var l = buffer[offset++] << 24 | buffer[offset++] << 16 | buffer[offset++] << 8 | buffer[offset++];
                    this.emitPushLongBits(l, h);
                    return;
                case 8 /* CONSTANT_String */:
                    this.emitPush(8 /* Reference */, this.classInfoObject(this.methodInfo.classInfo) + ".constantPool.resolve(" + index + ", " + 8 /* CONSTANT_String */ + ")");
                    return;
                default:
                    throw "Not done for: " + J2ME.getTAGSName(tag);
            }
        };
        BaselineCompiler.prototype.emitThrow = function (pc) {
            var object = this.peek(8 /* Reference */);
            this.emitNullPointerCheck(object);
            this.blockEmitter.writeLn("throw GH(" + object + ");");
        };
        BaselineCompiler.prototype.emitNewInstance = function (cpi) {
            var classInfo = this.lookupClass(cpi);
            this.emitClassInitializationCheck(classInfo);
            this.emitPush(8 /* Reference */, "AO(" + this.classInfoObject(classInfo) + ")");
        };
        BaselineCompiler.prototype.emitNewTypeArray = function (typeCode) {
            var kind = J2ME.arrayTypeCodeToKind(typeCode);
            var length = this.pop(4 /* Int */);
            this.emitNegativeArraySizeCheck(length);
            this.needsVariable("na");
            this.blockEmitter.writeLn("na=" + length);
            var arrayClassInfo;
            switch (kind) {
                case 0 /* Boolean */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.Z;
                    break;
                case 1 /* Byte */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.B;
                    break;
                case 2 /* Short */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.S;
                    break;
                case 3 /* Char */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.C;
                    break;
                case 4 /* Int */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.I;
                    break;
                case 5 /* Float */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.F;
                    break;
                case 6 /* Long */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.J;
                    break;
                case 7 /* Double */:
                    arrayClassInfo = J2ME.PrimitiveArrayClassInfo.D;
                    break;
                default: throw J2ME.Debug.unexpected("Unknown stack kind: " + kind);
            }
            this.emitPush(8 /* Reference */, "MA(" + 8 /* ARRAY_HDR_SIZE */ + "+na*" + arrayClassInfo.bytesPerElement + ")");
            var arrAddr = this.peek(8 /* Reference */);
            this.blockEmitter.writeLn("i32[" + arrAddr + "+" + 0 /* OBJ_CLASS_ID_OFFSET */ + ">>2]=" + arrayClassInfo.id);
            this.blockEmitter.writeLn("i32[" + arrAddr + "+" + 4 /* ARRAY_LENGTH_OFFSET */ + ">>2]=na");
        };
        BaselineCompiler.prototype.emitCheckCast = function (cpi) {
            var object = this.peek(8 /* Reference */);
            if (this.isPrivileged) {
                return;
            }
            var classInfo = this.lookupClass(cpi);
            var call = "CCK";
            if (classInfo.isInterface) {
                call = "CCI";
            }
            call = call + "(" + object + "," + this.classInfoSymbol(classInfo) + ")";
            if (J2ME.inlineRuntimeCalls) {
                this.blockEmitter.writeLn("(!" + object + ")||i32[" + object + "+" + 0 /* OBJ_CLASS_ID_OFFSET */ + ">>2]===" + this.classInfoSymbol(classInfo) + "||" + call + ";");
            }
            else {
                this.blockEmitter.writeLn(call + ";");
            }
        };
        BaselineCompiler.prototype.emitInstanceOf = function (cpi) {
            var object = this.pop(8 /* Reference */);
            var classInfo = this.lookupClass(cpi);
            var call = "IOK";
            if (classInfo.isInterface) {
                call = "IOI";
            }
            call = call + "(" + object + "," + this.classInfoSymbol(classInfo) + ")|0";
            if (J2ME.inlineRuntimeCalls) {
                call = "((" + object + "&&i32[" + object + "+" + 0 /* OBJ_CLASS_ID_OFFSET */ + ">>2]=== " + this.classInfoSymbol(classInfo) + ")||" + call + ")|0";
            }
            this.emitPush(4 /* Int */, call);
        };
        BaselineCompiler.prototype.emitNullPointerCheck = function (address) {
            this.blockEmitter.writeLn("!" + address + "&&TN();");
        };
        BaselineCompiler.prototype.emitArrayLength = function () {
            var array = this.pop(8 /* Reference */);
            this.emitNullPointerCheck(array);
            this.emitPush(4 /* Int */, "i32[" + array + "+" + 4 /* ARRAY_LENGTH_OFFSET */ + ">>2]");
        };
        BaselineCompiler.prototype.emitNewObjectArray = function (cpi) {
            var classInfo = this.lookupClass(cpi);
            this.emitClassInitializationCheck(classInfo);
            var length = this.pop(4 /* Int */);
            this.emitNegativeArraySizeCheck(length);
            this.emitPush(8 /* Reference */, "NA(" + this.classInfoObject(classInfo) + ", " + length + ")");
        };
        BaselineCompiler.prototype.emitNewMultiObjectArray = function (cpi, stream) {
            var classInfo = this.lookupClass(cpi);
            var numDimensions = stream.readUByte(stream.currentBCI + 3);
            var dimensions = new Array(numDimensions);
            for (var i = numDimensions - 1; i >= 0; i--) {
                dimensions[i] = this.pop(4 /* Int */);
            }
            this.emitPush(8 /* Reference */, "NM(" + this.classInfoObject(classInfo) + ",[" + dimensions.join(",") + "])");
        };
        BaselineCompiler.prototype.emitUnwind = function (emitter, pc, forceInline) {
            if (forceInline === void 0) { forceInline = false; }
            // Only emit unwind throws if it saves on code size.
            if (false && !forceInline && this.blockMap.invokeCount > 2 &&
                this.methodInfo.codeAttribute.max_stack < 8) {
                emitter.writeLn("U&&B" + this.sp + "(" + pc + ");");
                this.hasUnwindThrow = true;
            }
            else {
                this.emitBailout(emitter, pc, String(this.sp), this.sp);
            }
            J2ME.baselineCounter && J2ME.baselineCounter.count("emitUnwind");
        };
        BaselineCompiler.prototype.emitBailout = function (emitter, pc, sp, stackCount) {
            var localCount = this.methodInfo.codeAttribute.max_locals;
            var args = [this.methodInfoSymbol(this.methodInfo), pc, this.lockObject];
            for (var i = 0; i < localCount; i++) {
                args.push(this.getLocalName(i));
            }
            for (var i = 0; i < stackCount; i++) {
                args.push(this.getStackName(i));
            }
            emitter.writeLn("if(U){$.B(" + args.join(",") + ");return;}");
        };
        BaselineCompiler.prototype.emitNoUnwindAssertion = function () {
            this.blockEmitter.writeLn("if(U){J2ME.Debug.assert(false,'Unexpected unwind.');}");
        };
        BaselineCompiler.prototype.emitUndefinedReturnAssertion = function () {
            this.blockEmitter.writeLn("if (U && re !== undefined) { J2ME.Debug.assert(false, 'Unexpected return value during unwind.'); }");
        };
        BaselineCompiler.prototype.emitMonitorEnter = function (emitter, nextPC, object) {
            this.hasMonitorEnter = true;
            this.needsVariable("lk");
            emitter.writeLn("lk=GM(" + object + ");");
            emitter.enter("if(lk.level===0){lk.threadAddress=th;lk.level=1;}else{ME(lk);");
            this.emitUnwind(emitter, String(nextPC), true);
            emitter.leave("}");
        };
        BaselineCompiler.prototype.emitPreemptionCheck = function (emitter) {
            if (!J2ME.emitCheckPreemption || this.methodInfo.implKey in J2ME.noPreemptMap) {
                return;
            }
            emitter.writeLn("PS++;");
            emitter.writeLn("if((PS&" + preemptionSampleMask + ")===0)PE();");
            this.emitUnwind(emitter, String(this.pc), true);
        };
        BaselineCompiler.prototype.emitMonitorExit = function (emitter, object) {
            emitter.writeLn("lk=GM(" + object + ");");
            emitter.writeLn("if(lk.level===1&&lk.ready.length===0)lk.level=0;else MX(lk);");
        };
        BaselineCompiler.prototype.emitStackOp = function (opcode) {
            switch (opcode) {
                case 87 /* POP */: {
                    this.popAny();
                    break;
                }
                case 88 /* POP2 */: {
                    this.popAny();
                    this.popAny();
                    break;
                }
                case 89 /* DUP */: {
                    this.emitPushAny(this.peekAny());
                    break;
                }
                case 90 /* DUP_X1 */: {
                    this.emitPopTemporaries(2);
                    this.emitPushTemporary(0, 1, 0);
                    break;
                }
                case 91 /* DUP_X2 */: {
                    this.emitPopTemporaries(3);
                    this.emitPushTemporary(0, 2, 1, 0);
                    break;
                }
                case 92 /* DUP2 */: {
                    this.emitPopTemporaries(2);
                    this.emitPushTemporary(1, 0, 1, 0);
                    break;
                }
                case 93 /* DUP2_X1 */: {
                    this.emitPopTemporaries(3);
                    this.emitPushTemporary(1, 0, 2, 1, 0);
                    break;
                }
                case 94 /* DUP2_X2 */: {
                    this.emitPopTemporaries(4);
                    this.emitPushTemporary(1, 0, 3, 2, 1, 0);
                    break;
                }
                case 95 /* SWAP */: {
                    this.emitPopTemporaries(2);
                    this.emitPushTemporary(0, 1);
                    break;
                }
                default:
                    J2ME.Debug.unexpected(J2ME.Bytecode.getBytecodesName(opcode));
            }
        };
        BaselineCompiler.prototype.emitDivideByZeroCheck = function (kind, l, h) {
            if (this.isPrivileged) {
                return;
            }
            if (kind === 4 /* Int */) {
                this.blockEmitter.writeLn("!" + l + "&&TA();");
            }
            else if (kind === 6 /* Long */) {
                this.blockEmitter.writeLn("!" + l + "&&!" + h + "&&TA();");
            }
            else {
                J2ME.Debug.unexpected(J2ME.getKindName(kind));
            }
        };
        BaselineCompiler.prototype.emitArithmeticOp = function (kind, opcode, canTrap) {
            var al, ah;
            var bl, bh;
            if (J2ME.isTwoSlot(kind)) {
                bh = this.pop(kind), bl = this.pop(kind);
                ah = this.pop(kind), al = this.pop(kind);
            }
            else {
                bl = this.pop(kind), al = this.pop(kind);
            }
            if (canTrap) {
                this.emitDivideByZeroCheck(kind, bl, bh);
            }
            switch (opcode) {
                case 96 /* IADD */:
                    this.emitPush(4 /* Int */, al + "+" + bl + "|0");
                    break;
                case 100 /* ISUB */:
                    this.emitPush(4 /* Int */, al + "-" + bl + "|0");
                    break;
                case 104 /* IMUL */:
                    this.emitPush(4 /* Int */, "Math.imul(" + al + "," + bl + ")");
                    break;
                case 108 /* IDIV */:
                    this.emitPush(4 /* Int */, al + "/" + bl + "|0");
                    break;
                case 112 /* IREM */:
                    this.emitPush(4 /* Int */, al + "%" + bl);
                    break;
                case 98 /* FADD */:
                case 102 /* FSUB */:
                case 106 /* FMUL */:
                case 110 /* FDIV */:
                case 114 /* FREM */:
                    this.emitPush(5 /* Float */, J2ME.Bytecode.getBytecodesName(opcode).toLowerCase() + "(" + al + "," + bl + ")");
                    break;
                case 97 /* LADD */:
                case 101 /* LSUB */:
                case 105 /* LMUL */:
                case 109 /* LDIV */:
                case 113 /* LREM */:
                case 99 /* DADD */:
                case 103 /* DSUB */:
                case 107 /* DMUL */:
                case 111 /* DDIV */:
                case 115 /* DREM */:
                    this.emitPush(7 /* Double */, J2ME.Bytecode.getBytecodesName(opcode).toLowerCase() + "(" + al + "," + ah + "," + bl + "," + bh + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    break;
                default:
                    release || assert(false, "emitArithmeticOp: " + J2ME.Bytecode.getBytecodesName(opcode));
            }
        };
        BaselineCompiler.prototype.emitNegateOp = function (kind, opcode) {
            var l, h;
            if (J2ME.isTwoSlot(kind)) {
                h = this.pop(kind);
            }
            l = this.pop(kind);
            switch (kind) {
                case 4 /* Int */:
                    this.emitPush(kind, "(- " + l + ")|0");
                    break;
                case 5 /* Float */:
                    this.emitPush(kind, "fneg(" + l + ")");
                    break;
                case 6 /* Long */:
                case 7 /* Double */:
                    this.emitPush(kind, J2ME.Bytecode.getBytecodesName(opcode).toLowerCase() + "(" + l + "," + h + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    break;
                default:
                    J2ME.Debug.unexpected(J2ME.getKindName(kind));
            }
        };
        BaselineCompiler.prototype.emitShiftOp = function (kind, opcode) {
            var s = this.pop(4 /* Int */);
            var l, h;
            if (J2ME.isTwoSlot(kind)) {
                h = this.pop(kind);
            }
            l = this.pop(kind);
            var v;
            switch (opcode) {
                case 120 /* ISHL */:
                    this.emitPush(kind, l + "<<" + s);
                    return;
                case 122 /* ISHR */:
                    this.emitPush(kind, l + ">>" + s);
                    return;
                case 124 /* IUSHR */:
                    this.emitPush(kind, l + ">>>" + s);
                    return;
                case 121 /* LSHL */:
                case 123 /* LSHR */:
                case 125 /* LUSHR */:
                    this.emitPush(kind, J2ME.Bytecode.getBytecodesName(opcode).toLowerCase() + "(" + l + "," + h + "," + s + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    return;
                default:
                    J2ME.Debug.unexpected(J2ME.Bytecode.getBytecodesName(opcode));
            }
        };
        BaselineCompiler.prototype.emitLogicOp = function (kind, opcode) {
            var al, ah;
            var bl, bh;
            if (J2ME.isTwoSlot(kind)) {
                bh = this.pop(kind), bl = this.pop(kind);
                ah = this.pop(kind), al = this.pop(kind);
            }
            else {
                bl = this.pop(kind), al = this.pop(kind);
            }
            switch (opcode) {
                case 126 /* IAND */:
                    this.emitPush(kind, al + "&" + bl);
                    return;
                case 128 /* IOR */:
                    this.emitPush(kind, al + "|" + bl);
                    return;
                case 130 /* IXOR */:
                    this.emitPush(kind, al + "^" + bl);
                    return;
                case 127 /* LAND */:
                    this.emitPush(kind, al + "&" + bl);
                    this.emitPush(kind, ah + "&" + bh);
                    return;
                case 129 /* LOR */:
                    this.emitPush(kind, al + "|" + bl);
                    this.emitPush(kind, ah + "|" + bh);
                    return;
                case 131 /* LXOR */:
                    this.emitPush(kind, al + "^" + bl);
                    this.emitPush(kind, ah + "^" + bh);
                    return;
                default:
                    J2ME.Debug.unexpected(J2ME.Bytecode.getBytecodesName(opcode));
            }
        };
        BaselineCompiler.prototype.emitConvertOp = function (from, to, opcode) {
            var l, h;
            if (J2ME.isTwoSlot(from)) {
                h = this.pop(from);
            }
            l = this.pop(from);
            switch (opcode) {
                case 133 /* I2L */:
                    this.emitPush(6 /* Long */, l);
                    this.emitPush(11 /* High */, "(" + l + "<0?-1:0)");
                    break;
                case 134 /* I2F */:
                    this.emitPush(5 /* Float */, "i2f(" + l + ")");
                    break;
                case 145 /* I2B */:
                    this.emitPush(4 /* Int */, "(" + l + "<<24)>>24");
                    break;
                case 146 /* I2C */:
                    this.emitPush(4 /* Int */, l + "&0xffff");
                    break;
                case 147 /* I2S */:
                    this.emitPush(4 /* Int */, "(" + l + "<<16)>>16");
                    break;
                case 135 /* I2D */:
                    this.emitPush(7 /* Double */, "i2d(" + l + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    break;
                case 136 /* L2I */:
                    this.emitPush(4 /* Int */, l);
                    break;
                case 137 /* L2F */:
                    this.emitPush(5 /* Float */, "l2f(" + l + "," + h + ")");
                    break;
                case 138 /* L2D */:
                    this.emitPush(7 /* Double */, "l2d(" + l + "," + h + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    break;
                case 142 /* D2I */:
                    this.emitPush(4 /* Int */, "d2i(" + l + "," + h + ")");
                    break;
                case 139 /* F2I */:
                    this.emitPush(4 /* Int */, "f2i(" + l + ")");
                    break;
                case 140 /* F2L */:
                    this.emitPush(6 /* Long */, "f2l(" + l + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    break;
                case 141 /* F2D */:
                    this.emitPush(7 /* Double */, "f2d(" + l + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    break;
                case 143 /* D2L */:
                    this.emitPush(6 /* Long */, "d2l(" + l + "," + h + ")");
                    this.emitPush(11 /* High */, "tempReturn0");
                    break;
                case 144 /* D2F */:
                    this.emitPush(5 /* Float */, "d2f(" + l + "," + h + ")");
                    break;
                default:
                    throwCompilerError(J2ME.Bytecode.getBytecodesName(opcode));
            }
        };
        BaselineCompiler.prototype.emitCompareOp = function (kind, isLessThan) {
            var al, ah;
            var bl, bh;
            if (J2ME.isTwoSlot(kind)) {
                bh = this.pop(kind), bl = this.pop(kind);
                ah = this.pop(kind), al = this.pop(kind);
            }
            else {
                bl = this.pop(kind), al = this.pop(kind);
            }
            if (kind === 6 /* Long */) {
                this.emitPush(4 /* Int */, "lcmp(" + al + "," + ah + "," + bl + "," + bh + ")");
            }
            else if (kind === 7 /* Double */) {
                this.emitPush(4 /* Int */, "dcmp(" + al + "," + ah + "," + bl + "," + bh + "," + isLessThan + ")");
            }
            else if (kind === 5 /* Float */) {
                this.emitPush(4 /* Int */, "fcmp(" + al + "," + bl + "," + isLessThan + ")");
            }
        };
        BaselineCompiler.prototype.getBlockIndex = function (pc) {
            return pc;
        };
        BaselineCompiler.prototype.getBlock = function (pc) {
            return this.blockMap.getBlock(pc);
        };
        BaselineCompiler.prototype.emitTableSwitch = function (block, stream) {
            var tableSwitch = stream.readTableSwitch();
            var value = this.pop(4 /* Int */);
            // We need some text in the body of the table switch block, otherwise the
            // branch condition variable is ignored.
            var branchBlock = Relooper.addBlock("// Table Switch", String(value));
            Relooper.addBranch(block.relooperBlockID, branchBlock);
            var defaultTarget = this.getBlock(stream.currentBCI + tableSwitch.defaultOffset()).relooperBlockID;
            for (var i = 0; i < tableSwitch.numberOfCases(); i++) {
                var key = tableSwitch.keyAt(i);
                var target = this.getBlock(stream.currentBCI + tableSwitch.offsetAt(i)).relooperBlockID;
                if (target === defaultTarget) {
                    continue;
                }
                var caseTargetBlock = Relooper.addBlock();
                Relooper.addBranch(branchBlock, caseTargetBlock, "case " + key + ":");
                Relooper.addBranch(caseTargetBlock, target);
            }
            Relooper.addBranch(branchBlock, defaultTarget);
        };
        BaselineCompiler.prototype.emitLookupSwitch = function (block, stream) {
            var lookupSwitch = stream.readLookupSwitch();
            var value = this.pop(4 /* Int */);
            // We need some text in the body of the lookup switch block, otherwise the
            // branch condition variable is ignored.
            var branchBlock = Relooper.addBlock("// Lookup Switch", String(value));
            Relooper.addBranch(block.relooperBlockID, branchBlock);
            var defaultTarget = this.getBlock(stream.currentBCI + lookupSwitch.defaultOffset()).relooperBlockID;
            for (var i = 0; i < lookupSwitch.numberOfCases(); i++) {
                var key = lookupSwitch.keyAt(i);
                var target = this.getBlock(stream.currentBCI + lookupSwitch.offsetAt(i)).relooperBlockID;
                if (target === defaultTarget) {
                    continue;
                }
                var caseTargetBlock = Relooper.addBlock();
                Relooper.addBranch(branchBlock, caseTargetBlock, "case " + key + ":");
                Relooper.addBranch(caseTargetBlock, target);
            }
            Relooper.addBranch(branchBlock, defaultTarget);
        };
        BaselineCompiler.prototype.emitBytecode = function (stream, block) {
            var cpi;
            var opcode = stream.currentBC();
            writer && writer.writeLn("emit: pc: " + stream.currentBCI + ", sp: " + this.sp + " " + J2ME.Bytecode.getBytecodesName(opcode));
            if ((block.isExceptionEntry || block.hasHandlers) && J2ME.Bytecode.canTrap(opcode)) {
                this.blockEmitter.writeLn("pc=" + this.pc + ";");
            }
            switch (opcode) {
                case 0 /* NOP */: break;
                case 1 /* ACONST_NULL */:
                    this.emitPushBits(8 /* Reference */, 0 /* NULL */);
                    break;
                case 2 /* ICONST_M1 */:
                case 3 /* ICONST_0 */:
                case 4 /* ICONST_1 */:
                case 5 /* ICONST_2 */:
                case 6 /* ICONST_3 */:
                case 7 /* ICONST_4 */:
                case 8 /* ICONST_5 */:
                    this.emitPushInt(opcode - 3 /* ICONST_0 */);
                    break;
                case 11 /* FCONST_0 */:
                case 12 /* FCONST_1 */:
                case 13 /* FCONST_2 */:
                    this.emitPushFloat(opcode - 11 /* FCONST_0 */);
                    break;
                case 14 /* DCONST_0 */:
                case 15 /* DCONST_1 */:
                    this.emitPushDouble(opcode - 14 /* DCONST_0 */);
                    break;
                case 9 /* LCONST_0 */:
                case 10 /* LCONST_1 */:
                    this.emitPushLongBits(opcode - 9 /* LCONST_0 */, 0);
                    break;
                case 16 /* BIPUSH */:
                    this.emitPushInt(stream.readByte());
                    break;
                case 17 /* SIPUSH */:
                    this.emitPushInt(stream.readShort());
                    break;
                case 18 /* LDC */:
                case 19 /* LDC_W */:
                case 20 /* LDC2_W */:
                    this.emitLoadConstant(stream.readCPI());
                    break;
                case 21 /* ILOAD */:
                    this.emitLoadLocal(4 /* Int */, stream.readLocalIndex());
                    break;
                case 22 /* LLOAD */:
                    this.emitLoadLocal(6 /* Long */, stream.readLocalIndex());
                    break;
                case 23 /* FLOAD */:
                    this.emitLoadLocal(5 /* Float */, stream.readLocalIndex());
                    break;
                case 24 /* DLOAD */:
                    this.emitLoadLocal(7 /* Double */, stream.readLocalIndex());
                    break;
                case 25 /* ALOAD */:
                    this.emitLoadLocal(8 /* Reference */, stream.readLocalIndex());
                    break;
                case 26 /* ILOAD_0 */:
                case 27 /* ILOAD_1 */:
                case 28 /* ILOAD_2 */:
                case 29 /* ILOAD_3 */:
                    this.emitLoadLocal(4 /* Int */, opcode - 26 /* ILOAD_0 */);
                    break;
                case 30 /* LLOAD_0 */:
                case 31 /* LLOAD_1 */:
                case 32 /* LLOAD_2 */:
                case 33 /* LLOAD_3 */:
                    this.emitLoadLocal(6 /* Long */, opcode - 30 /* LLOAD_0 */);
                    break;
                case 34 /* FLOAD_0 */:
                case 35 /* FLOAD_1 */:
                case 36 /* FLOAD_2 */:
                case 37 /* FLOAD_3 */:
                    this.emitLoadLocal(5 /* Float */, opcode - 34 /* FLOAD_0 */);
                    break;
                case 38 /* DLOAD_0 */:
                case 39 /* DLOAD_1 */:
                case 40 /* DLOAD_2 */:
                case 41 /* DLOAD_3 */:
                    this.emitLoadLocal(7 /* Double */, opcode - 38 /* DLOAD_0 */);
                    break;
                case 42 /* ALOAD_0 */:
                case 43 /* ALOAD_1 */:
                case 44 /* ALOAD_2 */:
                case 45 /* ALOAD_3 */:
                    this.emitLoadLocal(8 /* Reference */, opcode - 42 /* ALOAD_0 */);
                    break;
                case 46 /* IALOAD */:
                    this.emitLoadIndexed(4 /* Int */);
                    break;
                case 47 /* LALOAD */:
                    this.emitLoadIndexed(6 /* Long */);
                    break;
                case 48 /* FALOAD */:
                    this.emitLoadIndexed(5 /* Float */);
                    break;
                case 49 /* DALOAD */:
                    this.emitLoadIndexed(7 /* Double */);
                    break;
                case 50 /* AALOAD */:
                    this.emitLoadIndexed(8 /* Reference */);
                    break;
                case 51 /* BALOAD */:
                    this.emitLoadIndexed(1 /* Byte */);
                    break;
                case 52 /* CALOAD */:
                    this.emitLoadIndexed(3 /* Char */);
                    break;
                case 53 /* SALOAD */:
                    this.emitLoadIndexed(2 /* Short */);
                    break;
                case 54 /* ISTORE */:
                    this.emitStoreLocal(4 /* Int */, stream.readLocalIndex());
                    break;
                case 55 /* LSTORE */:
                    this.emitStoreLocal(6 /* Long */, stream.readLocalIndex());
                    break;
                case 56 /* FSTORE */:
                    this.emitStoreLocal(5 /* Float */, stream.readLocalIndex());
                    break;
                case 57 /* DSTORE */:
                    this.emitStoreLocal(7 /* Double */, stream.readLocalIndex());
                    break;
                case 58 /* ASTORE */:
                    this.emitStoreLocal(8 /* Reference */, stream.readLocalIndex());
                    break;
                case 59 /* ISTORE_0 */:
                case 60 /* ISTORE_1 */:
                case 61 /* ISTORE_2 */:
                case 62 /* ISTORE_3 */:
                    this.emitStoreLocal(4 /* Int */, opcode - 59 /* ISTORE_0 */);
                    break;
                case 63 /* LSTORE_0 */:
                case 64 /* LSTORE_1 */:
                case 65 /* LSTORE_2 */:
                case 66 /* LSTORE_3 */:
                    this.emitStoreLocal(6 /* Long */, opcode - 63 /* LSTORE_0 */);
                    break;
                case 67 /* FSTORE_0 */:
                case 68 /* FSTORE_1 */:
                case 69 /* FSTORE_2 */:
                case 70 /* FSTORE_3 */:
                    this.emitStoreLocal(5 /* Float */, opcode - 67 /* FSTORE_0 */);
                    break;
                case 71 /* DSTORE_0 */:
                case 72 /* DSTORE_1 */:
                case 73 /* DSTORE_2 */:
                case 74 /* DSTORE_3 */:
                    this.emitStoreLocal(7 /* Double */, opcode - 71 /* DSTORE_0 */);
                    break;
                case 75 /* ASTORE_0 */:
                case 76 /* ASTORE_1 */:
                case 77 /* ASTORE_2 */:
                case 78 /* ASTORE_3 */:
                    this.emitStoreLocal(8 /* Reference */, opcode - 75 /* ASTORE_0 */);
                    break;
                case 79 /* IASTORE */:
                    this.emitStoreIndexed(4 /* Int */);
                    break;
                case 80 /* LASTORE */:
                    this.emitStoreIndexed(6 /* Long */);
                    break;
                case 81 /* FASTORE */:
                    this.emitStoreIndexed(5 /* Float */);
                    break;
                case 82 /* DASTORE */:
                    this.emitStoreIndexed(7 /* Double */);
                    break;
                case 83 /* AASTORE */:
                    this.emitStoreIndexed(8 /* Reference */);
                    break;
                case 84 /* BASTORE */:
                    this.emitStoreIndexed(1 /* Byte */);
                    break;
                case 85 /* CASTORE */:
                    this.emitStoreIndexed(3 /* Char */);
                    break;
                case 86 /* SASTORE */:
                    this.emitStoreIndexed(2 /* Short */);
                    break;
                case 87 /* POP */:
                case 88 /* POP2 */:
                case 89 /* DUP */:
                case 90 /* DUP_X1 */:
                case 91 /* DUP_X2 */:
                case 92 /* DUP2 */:
                case 93 /* DUP2_X1 */:
                case 94 /* DUP2_X2 */:
                case 95 /* SWAP */:
                    this.emitStackOp(opcode);
                    break;
                case 96 /* IADD */:
                case 100 /* ISUB */:
                case 104 /* IMUL */:
                    this.emitArithmeticOp(4 /* Int */, opcode, false);
                    break;
                case 108 /* IDIV */:
                case 112 /* IREM */:
                    this.emitArithmeticOp(4 /* Int */, opcode, true);
                    break;
                case 97 /* LADD */:
                case 101 /* LSUB */:
                case 105 /* LMUL */:
                    this.emitArithmeticOp(6 /* Long */, opcode, false);
                    break;
                case 109 /* LDIV */:
                case 113 /* LREM */:
                    this.emitArithmeticOp(6 /* Long */, opcode, true);
                    break;
                case 98 /* FADD */:
                case 102 /* FSUB */:
                case 106 /* FMUL */:
                case 110 /* FDIV */:
                case 114 /* FREM */:
                    this.emitArithmeticOp(5 /* Float */, opcode, false);
                    break;
                case 99 /* DADD */:
                case 103 /* DSUB */:
                case 107 /* DMUL */:
                case 111 /* DDIV */:
                case 115 /* DREM */:
                    this.emitArithmeticOp(7 /* Double */, opcode, false);
                    break;
                case 116 /* INEG */:
                    this.emitNegateOp(4 /* Int */, opcode);
                    break;
                case 117 /* LNEG */:
                    this.emitNegateOp(6 /* Long */, opcode);
                    break;
                case 118 /* FNEG */:
                    this.emitNegateOp(5 /* Float */, opcode);
                    break;
                case 119 /* DNEG */:
                    this.emitNegateOp(7 /* Double */, opcode);
                    break;
                case 120 /* ISHL */:
                case 122 /* ISHR */:
                case 124 /* IUSHR */:
                    this.emitShiftOp(4 /* Int */, opcode);
                    break;
                case 126 /* IAND */:
                case 128 /* IOR */:
                case 130 /* IXOR */:
                    this.emitLogicOp(4 /* Int */, opcode);
                    break;
                case 121 /* LSHL */:
                case 123 /* LSHR */:
                case 125 /* LUSHR */:
                    this.emitShiftOp(6 /* Long */, opcode);
                    break;
                case 127 /* LAND */:
                case 129 /* LOR */:
                case 131 /* LXOR */:
                    this.emitLogicOp(6 /* Long */, opcode);
                    break;
                case 132 /* IINC */:
                    this.emitIncrement(stream);
                    break;
                case 133 /* I2L */:
                    this.emitConvertOp(4 /* Int */, 6 /* Long */, opcode);
                    break;
                case 134 /* I2F */:
                    this.emitConvertOp(4 /* Int */, 5 /* Float */, opcode);
                    break;
                case 135 /* I2D */:
                    this.emitConvertOp(4 /* Int */, 7 /* Double */, opcode);
                    break;
                case 145 /* I2B */:
                    this.emitConvertOp(4 /* Int */, 1 /* Byte */, opcode);
                    break;
                case 146 /* I2C */:
                    this.emitConvertOp(4 /* Int */, 3 /* Char */, opcode);
                    break;
                case 147 /* I2S */:
                    this.emitConvertOp(4 /* Int */, 2 /* Short */, opcode);
                    break;
                case 136 /* L2I */:
                    this.emitConvertOp(6 /* Long */, 4 /* Int */, opcode);
                    break;
                case 137 /* L2F */:
                    this.emitConvertOp(6 /* Long */, 5 /* Float */, opcode);
                    break;
                case 138 /* L2D */:
                    this.emitConvertOp(6 /* Long */, 7 /* Double */, opcode);
                    break;
                case 139 /* F2I */:
                    this.emitConvertOp(5 /* Float */, 4 /* Int */, opcode);
                    break;
                case 140 /* F2L */:
                    this.emitConvertOp(5 /* Float */, 6 /* Long */, opcode);
                    break;
                case 141 /* F2D */:
                    this.emitConvertOp(5 /* Float */, 7 /* Double */, opcode);
                    break;
                case 142 /* D2I */:
                    this.emitConvertOp(7 /* Double */, 4 /* Int */, opcode);
                    break;
                case 143 /* D2L */:
                    this.emitConvertOp(7 /* Double */, 6 /* Long */, opcode);
                    break;
                case 144 /* D2F */:
                    this.emitConvertOp(7 /* Double */, 5 /* Float */, opcode);
                    break;
                case 148 /* LCMP */:
                    this.emitCompareOp(6 /* Long */, false);
                    break;
                case 149 /* FCMPL */:
                    this.emitCompareOp(5 /* Float */, true);
                    break;
                case 150 /* FCMPG */:
                    this.emitCompareOp(5 /* Float */, false);
                    break;
                case 151 /* DCMPL */:
                    this.emitCompareOp(7 /* Double */, true);
                    break;
                case 152 /* DCMPG */:
                    this.emitCompareOp(7 /* Double */, false);
                    break;
                case 153 /* IFEQ */:
                    this.emitIfZero(block, stream, 0 /* EQ */);
                    break;
                case 154 /* IFNE */:
                    this.emitIfZero(block, stream, 1 /* NE */);
                    break;
                case 155 /* IFLT */:
                    this.emitIfZero(block, stream, 2 /* LT */);
                    break;
                case 156 /* IFGE */:
                    this.emitIfZero(block, stream, 5 /* GE */);
                    break;
                case 157 /* IFGT */:
                    this.emitIfZero(block, stream, 4 /* GT */);
                    break;
                case 158 /* IFLE */:
                    this.emitIfZero(block, stream, 3 /* LE */);
                    break;
                case 159 /* IF_ICMPEQ */:
                    this.emitIfSame(block, stream, 4 /* Int */, 0 /* EQ */);
                    break;
                case 160 /* IF_ICMPNE */:
                    this.emitIfSame(block, stream, 4 /* Int */, 1 /* NE */);
                    break;
                case 161 /* IF_ICMPLT */:
                    this.emitIfSame(block, stream, 4 /* Int */, 2 /* LT */);
                    break;
                case 162 /* IF_ICMPGE */:
                    this.emitIfSame(block, stream, 4 /* Int */, 5 /* GE */);
                    break;
                case 163 /* IF_ICMPGT */:
                    this.emitIfSame(block, stream, 4 /* Int */, 4 /* GT */);
                    break;
                case 164 /* IF_ICMPLE */:
                    this.emitIfSame(block, stream, 4 /* Int */, 3 /* LE */);
                    break;
                case 165 /* IF_ACMPEQ */:
                    this.emitIfSame(block, stream, 8 /* Reference */, 0 /* EQ */);
                    break;
                case 166 /* IF_ACMPNE */:
                    this.emitIfSame(block, stream, 8 /* Reference */, 1 /* NE */);
                    break;
                case 167 /* GOTO */:
                    this.emitGoto(block, stream);
                    break;
                case 170 /* TABLESWITCH */:
                    this.emitTableSwitch(block, stream);
                    break;
                case 171 /* LOOKUPSWITCH */:
                    this.emitLookupSwitch(block, stream);
                    break;
                case 172 /* IRETURN */:
                    this.emitReturn(4 /* Int */);
                    break;
                case 173 /* LRETURN */:
                    this.emitReturn(6 /* Long */);
                    break;
                case 174 /* FRETURN */:
                    this.emitReturn(5 /* Float */);
                    break;
                case 175 /* DRETURN */:
                    this.emitReturn(7 /* Double */);
                    break;
                case 176 /* ARETURN */:
                    this.emitReturn(8 /* Reference */);
                    break;
                case 177 /* RETURN */:
                    this.emitReturn(9 /* Void */);
                    break;
                case 178 /* GETSTATIC */:
                    cpi = stream.readCPI();
                    this.emitGetField(this.lookupField(cpi, opcode, true), true);
                    break;
                case 179 /* PUTSTATIC */:
                    cpi = stream.readCPI();
                    this.emitPutField(this.lookupField(cpi, opcode, true), true);
                    break;
                case 213 /* RESOLVED_GETFIELD */: opcode = 180 /* GETFIELD */;
                case 180 /* GETFIELD */:
                    cpi = stream.readCPI();
                    this.emitGetField(this.lookupField(cpi, opcode, false), false);
                    break;
                case 214 /* RESOLVED_PUTFIELD */: opcode = 181 /* PUTFIELD */;
                case 181 /* PUTFIELD */:
                    cpi = stream.readCPI();
                    this.emitPutField(this.lookupField(cpi, opcode, false), false);
                    break;
                case 215 /* RESOLVED_INVOKEVIRTUAL */: opcode = 182 /* INVOKEVIRTUAL */;
                case 182 /* INVOKEVIRTUAL */:
                    cpi = stream.readCPI();
                    this.emitInvoke(this.lookupMethod(cpi, opcode, false), opcode, stream.nextBCI);
                    break;
                case 183 /* INVOKESPECIAL */:
                    cpi = stream.readCPI();
                    this.emitInvoke(this.lookupMethod(cpi, opcode, false), opcode, stream.nextBCI);
                    break;
                case 184 /* INVOKESTATIC */:
                    cpi = stream.readCPI();
                    this.emitInvoke(this.lookupMethod(cpi, opcode, true), opcode, stream.nextBCI);
                    break;
                case 185 /* INVOKEINTERFACE */:
                    cpi = stream.readCPI();
                    this.emitInvoke(this.lookupMethod(cpi, opcode, false), opcode, stream.nextBCI);
                    break;
                case 187 /* NEW */:
                    this.emitNewInstance(stream.readCPI());
                    break;
                case 188 /* NEWARRAY */:
                    this.emitNewTypeArray(stream.readLocalIndex());
                    break;
                case 189 /* ANEWARRAY */:
                    this.emitNewObjectArray(stream.readCPI());
                    break;
                case 197 /* MULTIANEWARRAY */:
                    this.emitNewMultiObjectArray(stream.readCPI(), stream);
                    break;
                case 190 /* ARRAYLENGTH */:
                    this.emitArrayLength();
                    break;
                case 191 /* ATHROW */:
                    this.emitThrow(stream.currentBCI);
                    break;
                case 192 /* CHECKCAST */:
                    this.emitCheckCast(stream.readCPI());
                    break;
                case 193 /* INSTANCEOF */:
                    this.emitInstanceOf(stream.readCPI());
                    break;
                case 194 /* MONITORENTER */:
                    this.emitMonitorEnter(this.blockEmitter, stream.nextBCI, this.pop(8 /* Reference */));
                    break;
                case 195 /* MONITOREXIT */:
                    this.emitMonitorExit(this.blockEmitter, this.pop(8 /* Reference */));
                    break;
                case 198 /* IFNULL */:
                    this.emitIfNull(block, stream, 0 /* EQ */);
                    break;
                case 199 /* IFNONNULL */:
                    this.emitIfNull(block, stream, 1 /* NE */);
                    break;
                // The following bytecodes are not supported yet and are not frequently used.
                // case Bytecodes.JSR            : ... break;
                // case Bytecodes.RET            : ... break;
                default:
                    throw new Error("Not Implemented " + J2ME.Bytecode.getBytecodesName(opcode));
            }
            writer && writer.writeLn("");
        };
        BaselineCompiler.localNames = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        /**
         * Make sure that none of these shadow global names, like "U" and "O".
         */
        BaselineCompiler.stackNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "_O", "P", "Q", "R", "S", "T", "_U", "V", "W", "X", "Y", "Z"];
        return BaselineCompiler;
    })();
    J2ME.BaselineCompiler = BaselineCompiler;
})(J2ME || (J2ME = {}));
var J2ME;
(function (J2ME) {
    var quote = J2ME.StringUtilities.quote;
    var Emitter = (function () {
        function Emitter(writer, closure, debugInfo, klassHeaderOnly) {
            if (klassHeaderOnly === void 0) { klassHeaderOnly = false; }
            this.writer = writer;
            this.closure = closure;
            this.debugInfo = debugInfo;
            this.klassHeaderOnly = klassHeaderOnly;
            // ...
        }
        return Emitter;
    })();
    J2ME.Emitter = Emitter;
    (function (CompilationTarget) {
        CompilationTarget[CompilationTarget["Runtime"] = 0] = "Runtime";
        CompilationTarget[CompilationTarget["Static"] = 1] = "Static";
    })(J2ME.CompilationTarget || (J2ME.CompilationTarget = {}));
    var CompilationTarget = J2ME.CompilationTarget;
    function getClassInheritanceChain(classInfo) {
        var list = [];
        var klass = classInfo;
        while (klass) {
            list.unshift(klass);
            klass = klass.superClass;
        }
        return list;
    }
    function classNameWithDots(classInfo) {
        return classInfo.getClassNameSlow().replace(/\//g, '.');
    }
    function emitMethodMetaData(emitter, methodInfo, compiledMethodInfo) {
        var metaData = Object.create(null);
        metaData.osr = compiledMethodInfo.onStackReplacementEntryPoints;
        emitter.writer.writeLn("AOTMD[\"" + methodInfo.mangledClassAndMethodName + "\"] = " + JSON.stringify(metaData) + ";");
    }
    J2ME.emitMethodMetaData = emitMethodMetaData;
    function emitReferencedSymbols(emitter, classInfo, compiledMethods) {
        var referencedClasses = [];
        for (var i = 0; i < compiledMethods.length; i++) {
            var compiledMethod = compiledMethods[i];
            compiledMethod.referencedClasses.forEach(function (classInfo) {
                J2ME.ArrayUtilities.pushUnique(referencedClasses, classInfo);
            });
        }
        var mangledClassName = classInfo.mangledName;
        emitter.writer.writeLn(mangledClassName + ".classSymbols = [" + referencedClasses.map(function (classInfo) {
            return quote(classInfo.getClassNameSlow());
        }).join(", ") + "];");
    }
    J2ME.emitReferencedSymbols = emitReferencedSymbols;
    var failedCompilations = 0;
    function compileClassInfo(emitter, classInfo, methodFilterList, ctx) {
        var writer = emitter.writer;
        var mangledClassName = classInfo.mangledName;
        if (!J2ME.isIdentifierName(mangledClassName)) {
            mangledClassName = quote(mangledClassName);
        }
        var classNameParts;
        var methods = classInfo.getMethods();
        var compiledMethods = [];
        for (var i = 0; i < methods.length; i++) {
            var method = methods[i];
            if (method.isNative) {
                continue;
            }
            if (!method.codeAttribute) {
                continue;
            }
            if (methodFilterList !== null && methodFilterList.indexOf(method.implKey) < 0) {
                continue;
            }
            var mangledMethodName = method.mangledName;
            if (!J2ME.isIdentifierName(mangledMethodName)) {
                mangledMethodName = quote(mangledMethodName);
            }
            try {
                var mangledClassAndMethodName = method.mangledClassAndMethodName;
                if (emitter.debugInfo) {
                    writer.writeLn("// " + method.implKey + " (" + mangledClassAndMethodName + ")");
                }
                var compiledMethod = undefined;
                try {
                    compiledMethod = compileMethod(method, ctx, 1 /* Static */);
                }
                catch (e) {
                    J2ME.stderrWriter.errorLn("Compiler Exception: " + method.implKey + " " + e.toString());
                    failedCompilations++;
                }
                if (compiledMethod && compiledMethod.body) {
                    if (methodFilterList) {
                        methodFilterList.splice(methodFilterList.indexOf(method.implKey), 1);
                    }
                    var compiledMethodName = mangledClassAndMethodName;
                    writer.enter("function " + compiledMethodName + "(" + compiledMethod.args.join(",") + ") {");
                    writer.writeLns(compiledMethod.body);
                    writer.leave("}");
                    if (method.name === "<clinit>") {
                        writer.writeLn(mangledClassName + ".staticConstructor = " + mangledClassAndMethodName);
                    }
                    else if (!method.isStatic) {
                        //if (emitter.closure) {
                        //  writer.writeLn(mangledClassName + ".prototype[" + quote(mangledMethodName) + "] = " + mangledClassAndMethodName + ";");
                        //} else {
                        //  writer.writeLn(mangledClassName + ".prototype." + mangledMethodName + " = " + mangledClassAndMethodName + ";");
                        //}
                        if (emitter.closure) {
                            writer.writeLn("window[" + quote(mangledClassAndMethodName) + "] = " + mangledClassAndMethodName + ";");
                        }
                    }
                    emitMethodMetaData(emitter, method, compiledMethod);
                    compiledMethods.push(compiledMethod);
                }
            }
            catch (x) {
                J2ME.stderrWriter.writeLn("XXXX: " + x);
                J2ME.stderrWriter.writeLn(x.stack);
            }
        }
        emitReferencedSymbols(emitter, classInfo, compiledMethods);
        return compiledMethods;
    }
    var CompiledMethodInfo = (function () {
        function CompiledMethodInfo(args, body, referencedClasses, onStackReplacementEntryPoints) {
            if (onStackReplacementEntryPoints === void 0) { onStackReplacementEntryPoints = null; }
            this.args = args;
            this.body = body;
            this.referencedClasses = referencedClasses;
            this.onStackReplacementEntryPoints = onStackReplacementEntryPoints;
            // ...
        }
        return CompiledMethodInfo;
    })();
    J2ME.CompiledMethodInfo = CompiledMethodInfo;
    function compileMethod(methodInfo, ctx, target) {
        var method;
        method = J2ME.baselineCompileMethod(methodInfo, target);
        return method;
    }
    J2ME.compileMethod = compileMethod;
    function compile(jvm, jarFiles, jarFilter, classFilter, methodFilterList, fileFilter, debugInfo) {
        var runtime = new J2ME.Runtime(jvm);
        var ctx = new J2ME.Context(runtime);
        var code = "";
        var writer = new J2ME.IndentingWriter(false, function (s) {
            code += s + "\n";
        });
        var emitter = new Emitter(writer, false, debugInfo, false);
        var compiledMethods = [];
        var classInfoList = [];
        Object.keys(jarFiles).every(function (path) {
            if (path.substr(-4) !== ".jar" || !jarFilter(path)) {
                return true;
            }
            var zipFile = jarFiles[path];
            Object.keys(zipFile.directory).every(function (fileName) {
                if (fileName.substr(-6) !== '.class') {
                    return true;
                }
                try {
                    var className = fileName.substring(0, fileName.length - 6);
                    var classInfo = J2ME.CLASSES.getClass(className);
                    if (classInfo.sourceFile && !classInfo.sourceFile.match(fileFilter)) {
                        return true;
                    }
                    if (!classFilter(classInfo)) {
                        return true;
                    }
                    classInfoList.push(classInfo);
                }
                catch (e) {
                    J2ME.stderrWriter.writeLn(e + ": " + e.stack);
                }
                return true;
            }.bind(this));
            return true;
        }.bind(this));
        var orderedClassInfoList = [];
        function hasDependencies(list, classInfo) {
            var superClass = classInfo.superClass;
            var interfaces = classInfo.getAllInterfaces();
            if (!superClass && interfaces.length === 0) {
                return false;
            }
            for (var i = 0; i < list.length; i++) {
                if (list[i].getClassNameSlow() === superClass.getClassNameSlow()) {
                    return true;
                }
            }
            for (var j = 0; j < interfaces; j++) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i].getClassNameSlow() === interfaces[j].getClassNameSlow()) {
                        return true;
                    }
                }
            }
            return false;
        }
        while (classInfoList.length) {
            for (var i = 0; i < classInfoList.length; i++) {
                var classInfo = classInfoList[i];
                if (!hasDependencies(classInfoList, classInfo)) {
                    orderedClassInfoList.push(classInfo);
                    classInfoList.splice(i--, 1);
                    break;
                }
            }
        }
        var filteredClassInfoList = [];
        for (var i = 0; i < orderedClassInfoList.length; i++) {
            var classInfo = orderedClassInfoList[i];
            var methods = classInfo.getMethods();
            for (var j = 0; j < methods.length; j++) {
                var method = methods[j];
                if (methodFilterList === null || methodFilterList.indexOf(method.implKey) >= 0) {
                    // If at least one method is found, compile the class.
                    filteredClassInfoList.push(classInfo);
                    break;
                }
            }
        }
        for (var i = 0; i < filteredClassInfoList.length; i++) {
            var classInfo = filteredClassInfoList[i];
            if (emitter.debugInfo) {
                writer.writeLn("// " + classInfo.getClassNameSlow() + (classInfo.superClass ? " extends " + classInfo.superClass.getClassNameSlow() : ""));
            }
            // Don't compile interfaces.
            if (classInfo.isInterface) {
                continue;
            }
            J2ME.ArrayUtilities.pushMany(compiledMethods, compileClassInfo(emitter, classInfo, methodFilterList, ctx));
        }
        var color = failedCompilations ? J2ME.IndentingWriter.YELLOW : J2ME.IndentingWriter.GREEN;
        J2ME.stderrWriter.colorLn(color, "Compiled " + compiledMethods.length + " methods OK, " + failedCompilations + " failed.");
        J2ME.stdoutWriter.writeLn(code);
        J2ME.stdoutWriter.enter("/*");
        J2ME.baselineCounter && J2ME.baselineCounter.traceSorted(J2ME.stdoutWriter);
        J2ME.yieldCounter && J2ME.yieldCounter.traceSorted(J2ME.stdoutWriter);
        J2ME.yieldGraph && J2ME.traceYieldGraph(J2ME.stdoutWriter);
        J2ME.stdoutWriter.enter("*/");
        // yieldCounter.traceSorted(stdoutWriter);
    }
    J2ME.compile = compile;
})(J2ME || (J2ME = {}));
// Basics
///<reference path='tools/lib.d.ts' />
///<reference path='tools/es6-promises.d.ts' />
///<reference path='config.ts' />
///<reference path='utilities.ts' />
///<reference path='metrics.ts' />
///<reference path='vm/hashtable.ts' />
///<reference path='bytecodes.ts' />
///<reference path='jit/blockMap.ts' />
///<reference path='int.ts' />
///<reference path='vm/runtime.ts' />
///<reference path='vm/parser.ts' />
///<reference path='options.ts' />
///<reference path='types.ts' />
///<reference path='vm/classRegistry.ts' />
///<reference path='bindings.ts' />
///<reference path='nat.ts' />
///<reference path='long.ts' />
///<reference path='scheduler.ts' />
///<reference path='vm/context.ts' />
// JIT
///<reference path='jit/jit.ts' />
///<reference path='jit/analyze.ts' />
///<reference path='jit/baseline.ts' />
///<reference path='jit/compiler.ts' />
//# sourceMappingURL=j2me-jsc.js.map