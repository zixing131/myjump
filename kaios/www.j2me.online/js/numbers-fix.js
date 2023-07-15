var BigInteger = jsbn.BigInteger;
var MAX_NUMBER = 0x100000000;
var MAX = new BigInteger(String(MAX_NUMBER));
var l2b = function (value) {
	var hi = new BigInteger(String(value.hi));
	var lo = new BigInteger(String(value.lo));
	return hi.multiply(MAX).add(lo);
};
var b2l = function (value) {
	var array = value.divideAndRemainder(MAX);
	var hi = Number(array[0].toString());
	var lo = Number(array[1].toString());
	// TODO check overflow
	return {
		hi: hi,
		lo: lo
	};
};
js2me.numberToLong = function (n) {
	return { hi: ~~(n / MAX_NUMBER), lo: n % MAX_NUMBER };
};
js2me.ladd = function (a, b) {
	return b2l(l2b(a).add(l2b(b)));
};
js2me.lcmp = function (a, b) {
	return l2b(a).compareTo(l2b(b));
};
js2me.ldiv = function (a, b) {
	a = l2b(a);
	b = l2b(b);
	var c = a.divideAndRemainder(b);
	return {
		div: b2l(c[0]),
		rem: b2l(c[1])
	};
};
js2me.lmul = function (a, b) {
	return b2l(l2b(a).multiply(l2b(b)));
};
js2me.lneg = function (a) {
	return b2l(l2b(a).negate());
};
js2me.lshl = function (a, shift) {
	return b2l(l2b(a).shiftLeft(shift));
};
// lshr
js2me.lsub = function (a, b) {
	return b2l(l2b(a).subtract(l2b(b)));
};
js2me.lxor = function (a, b) {
	return b2l(l2b(a).lxor(l2b(b)));
};
