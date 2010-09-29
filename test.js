var sys = require('sys'),
	assert = require('assert'),
	a = assert.strictEqual,
	d = assert.deepEqual;
require('extensions');



// Object



	// Object.callAsync()
	
// Implement a dummy async String.prototype.toLowerCase()

String.prototype.toLowerCaseAsync = function (_callback) {

	_callback(null, this.toLowerCase());
};

Object.callAsync({a: 'abC', b: 'ZYX'}, 'toLowerCaseAsync', function (e, map) {
	
	a(e, null);

	d(
		map,
		{
			a: 'abc',
			b: 'zyx'
		}
	);
});



	// Object.call()
	
var map = Object.call({a: 'abC', b: 'ZYX'}, 'toLowerCase');

d(
	map,
	{
		a: 'abc',
		b: 'zyx'
	}
);



	// Object.extend()


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



	// Object.extendDeep()


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



	// Object.fromPrototype()


var proto = {
	a:1,
	b:2
};

var ext = {
	b:3
};

var res = Object.fromPrototype(proto, ext);

d(
	res,
	{b:3}
);

d(
	res.__proto__,
	{a:1, b:2}
);



	// Object.id()


var p = {};

Object.id(p);

a(
	p.__id,
	1
);

var q = {};

Object.id(q);

d(
	q.__id,
	2
);


	
	// Object.resetRefs()


var o = {c:1};

Object.resetRefs(o);

d(
	o.$refs,
	[]
);

p = [];

Object.resetRefs(p);

d(
	p[p.length - 1],
	{$$refs:[]}
);



	// Object.getRefs()


d(
	Object.getRefs(o),
	[]	
);

d(
	Object.getRefs(p),
	[]	
);



	// Object.addRef()


d(
	Object.addRef(o, ['a'], ['#']),
	[['a'], ['#']]
);

d(
	Object.addRef(p, ['a'], ['#']),
	[['a'], ['#']]	
);

global.xy = true;

Object.addRef(o, ['b'], ['xy']);
Object.addRef(p, ['b'], ['xy']);



	// Object.findRefs()


var q = {};
q.a = q;
q.b = q;

Object.findRefs(q);

a(
	q.__id,
	3
);

d(
	q.$refs,
	[
		['a'], ['#'],
		['b'], ['#']
	]
);

Object.findRefs(q);

a(
	q.__id,
	3
);

d(
	q.$refs,
	[
		['a'], ['#'],
		['b'], ['#']
	]
);



	// Object.resolveRefs()


Object.resolveRefs(o);

d(
	o.a,
	o
);

d(
	o.b,
	undefined
);

d(
	Object.getRefs(o),
	[['b'], ['xy']]
);

Object.resolveRefs(o, true);

d(
	o.a,
	o
);

d(
	o.b,
	true
);

d(
	Object.getRefs(o),
	[]
);



// Array.prototype



	// Array.prototype.clone()
	

var array = [1,2,3],
	cl = array.clone();
cl.push(4);
a(
	array[3],
	undefined
);



// String.prototype


	// String.prototype.escapeXml()
	
	
var str = '<>\n<>""\'\'\n';
a(
	str.escapeXml(),
	'&lt;&gt;\n&lt;&gt;&quot;&quot;&#039;&#039;\n'
);
a(
	str.escapeXml(true),
	'&lt;&gt;<br/>&lt;&gt;&quot;&quot;&#039;&#039;<br/>'
);



// Test extended JSON capabilities

/*global.MyClass = function MyClass (data) {

	Object.extend(this, data);
}
global.MyClass.clientUsesClass = true;
global.MyClass.classPath = ['MyClass'];


var myObject = new MyClass({a:1,b:2,c:[7,8,9]});
myObject.d = myObject;

var s = JSON.stringify(Object.findRefs(myObject), JSON.REPLACER_REFS_AND_CLASSES);

var _myObject = Object.resolveRefs(JSON.parse(s, JSON.REVIVER_CLASSES));

a(
	_myObject instanceof MyClass,
	true
);

a(
	_myObject.d,
	_myObject
);*/




log('Passed');