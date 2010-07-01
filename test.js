var sys = require('sys'),
	assert = require('assert'),
	a = assert.strictEqual,
	d = assert.deepEqual;
require('extensions');



var p = {a: 1};
var f = function () {};
f.prototype = {b:1};
var q = new f;
q.a = 2;
q.c = 2;


d(
	Object.keys(Object.extend(p, q)),
	['a', 'c']
);


a(
	p.a,
	2
);



p = {a: 1};


a(
	Object.extend(p, q, true).a,
	1
);



p = {d: {e: 1}};
q = {d: {e: 2, f: 3}};


d(
	Object.keys(Object.extendDeep(p, q).d),
	['e', 'f']
);


a(
	p.d.e,
	2
);



p = {d: {e: 1}};


a(
	Object.extendDeep(p, q, true).d.e,
	1
);



p = {};
q = {d: {e: 2, f: 3}};


d(
	Object.extendDeep(p, q).d.f,
	3
);