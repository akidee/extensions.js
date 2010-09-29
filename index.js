// extensions.js - index - Copyright Andreas Kalsch <andreaskalsch@gmx.de> (MIT Licensed)

"use strict";

/*<
require('ddr-ecma5', function () {
>*/




// global


// Make sure that global is window on the client
if (global === undefined) global = window;

if (console
	&& typeof console.log === 'function') {

	global.log = function () {
	
		console.log.apply(console, arguments);
	};
}
else {

	global.log = function(){};
}


//<
global.exit = function (seconds) {

	setTimeout(function () {
	
		process.exit(0);
	}, seconds * 1000);
};
//>




// Object


/**
 * Execute method for every of object's own properties and return result object.
 * All objects in object must have this method!
 * You can optionally add arguments for method.
 *
 * object (object)
 * method (string) method name, "this" is always object
 * ...
 * 
 * (object)
 */
Object.call = function (object, method /*, args... */) {

	var args = Array.prototype.slice.call(arguments, 2),
		map = {};
	
	var keys = Object.keys(object),
		key;
	for (var li = keys.length, i = 0; i < li; i++) {
	
		key = keys[i];
		if (object[key] === null || object[key] === undefined
			|| typeof object[key][method] !== 'function') continue;
		
		
		map[key] = object[key][method].apply(object[key], args);
	}
	
	return map;
};


/**
 * Execute async method for every of object's own properties and return result object.
 * All objects in object must have this method!
 * You can optionally add arguments for callback.
 *
 * object (object)
 * method (string) method name, "this" is always object
 * ... _callback (function)
 *   e (object|null) with (Error) by key
 *   map (object)
 * 
 * (object)
 */
Object.callAsync = function (object, method /*, args..., _callback */) {

	var args = Array.prototype.slice.call(arguments, 2),
		_callback = args.pop(),
		map = {},
		errorMap = {},
		j = 0,
		was = false;

	var keys = Object.keys(object),
		key;
		
	for (var li = keys.length, i = 0; i < li; i++) {

		key = keys[i];

		if (object[key] === null || object[key] === undefined
			|| typeof object[key][method] !== 'function') continue;


		j++;
		was = true;

		args.push((function (key) {
		
			return function (e, result) {
	
				if (e) errorMap[key] = result;
				else map[key] = result;

				process.nextTick(function () {
				
					--j === 0 && _callback(
						Object.keys(errorMap).length > 0
							? errorMap
							: null,
						map
					);
				});
			}
		})(key));
	
		object[key][method].apply(object[key], args);

		args.pop();
	}
	
	if (!was) _callback(null, map);
};


/**
 * Return a new object with prototype as __proto__
 */
Object.fromPrototype = function (prototype, object) {

	var f = function (object) {
	
		Object.extend(this, object || {});
	};
	f.prototype = prototype;
	return new f(object);
};


/**
 * Copy all of b's own properties to a
 * Based on http://github.com/visionmedia/ext.js/blob/master/lib/ext/core_ext/object/extensions.js
 *
 * @param  {object} a
 * @param  {object} b
 * @param  {boolean} preserve_a
 * @return {object}
 */
Object.extend = function (a, b, preserve_a) {

	if (!b) return a;
	

	var keys = Object.keys(b);
	
	if (!preserve_a) {
	
		for (var i = 0, len = keys.length; i < len; ++i)
			a[keys[i]] = b[keys[i]];
	}
	else {
	
		for (var i = 0, len = keys.length; i < len; ++i) {

			if (!(keys[i] in a)) a[keys[i]] = b[keys[i]];
		}
	}
		
	return a;
};


/**
 * Copy all of b's own properties to a - deeply through object tree
 * Based on http://github.com/visionmedia/ext.js/blob/master/lib/ext/core_ext/object/extensions.js
 *
 * @param  {object} a
 * @param  {object} b
 * @param  {boolean} preserve_a
 * @return {object}
 */
Object.extendDeep = function(a, b, preserve_a) {

	if (!b) return a;
	
	
	var keys = Object.keys(b),
		key;
		
	if (!preserve_a) {
	
		for (var i = 0, len = keys.length; i < len; ++i) {
			
			key = keys[i];
			if (typeof b[key] === 'object')
		
				a[key] = Object.extendDeep((a[key] = a[key] || {}), b[key]);
			else
		
				a[key] = b[key];
		}
	}
	else {
	
		for (var i = 0, len = keys.length; i < len; ++i) {
			
			key = keys[i];
			if (typeof b[key] === 'object')
		
				a[key] = Object.extendDeep((a[key] = a[key] || {}), b[key], preserve_a);
			else if (!(key in a))
		
				a[key] = b[key];
		}
	}
	
	return a;
};


/**
 * Find a property in object by path or return undefined
 */
Object.find = function (object, path) {
	
	var key,
		obj = object;
	for (var li = path.length, i = 0; i < li; i++) {
	
		if ((key = path[i]) === undefined) break;
		
		
		if ((obj instanceof Object || obj instanceof Array)
			&& key in obj) obj = obj[key];
		else return undefined;
	}
	
	return obj;
};


Object._id = 0;


Object._specialKeys = ['$ref', '$refs', '$$refs'/*, '$id', '$omit'*/].concat([]);


/**
 * Add (if not yet existing) and return a global-ly unique object ID
 */
Object.id = function (object) {
	
	if (object instanceof Object 
		&& !object.hasOwnProperty('__id')) {
		
		Object.defineProperty(object, '__id', {
			value: ++Object._id,
			enumerable: false
		});	
	}
		
	return object.__id;
};


/**
 * Resets and returns object.$refs
 */
Object.resetRefs = function (object) {

	if (!(object instanceof Object)) return null;
	

	var refs = Object.getRefs(object);
	if (refs) {
	
		refs.splice(0);
		return refs;
	}
	
	refs = [];
	if (object instanceof Array) {
	
		object.push({$$refs:refs});
	}
	else {
	
		object.$refs = refs;
	}
	
	return refs;
};


/**
 * Returns object.$refs if existing, else null
 */
Object.getRefs = function (object) {

	if (!(object instanceof Object)) return null;
	
	
	if (object instanceof Array) {
	
		if (object[object.length - 1]
			&& object[object.length - 1].$$refs instanceof Array) return object[object.length - 1].$$refs;
	}
	
	if (object.hasOwnProperty('$refs')) return object.$refs;
	
	return null;
};


/**
 * Adds a new to/from reference to object.$refs
 * The object must habe been initialized with Object.resetRefs(object)
 * fromPath can start with '#' or 'inGlobalNamespace'
 * Returns object.$refs
 */
Object.addRef = function (object, toPath, fromPath) {
	
	var refs = Object.getRefs(object);

	if (!refs) throw new Error('You need to call Object.resetRefs(object) first!');
	
	
	refs.push(toPath);
	refs.push(fromPath);
	
	return refs;
};


/**
 * Populate object.$refs with all redundant references included in object
 * Returns object
 */
Object.findRefs = function (object) {

	var fromPathById = {},
		toPath = [],
		refs = Object.resetRefs(object);

	(function self (obj) {

		if (!(obj instanceof Object)) return;
		
		
		var id = Object.id(obj);
		if (fromPathById[id] !== undefined) {
		
			refs.push(toPath.clone());
			refs.push(fromPathById[id]);
			
			// <
			if (!object.hasOwnProperty('$omit')) Object.defineProperty(object, '$omit', {
				value: {},
				enumerable: false
			});
			object.$omit[toPath[toPath.length - 1]] = true;
			// >
			
			return;
		}
		
		fromPathById[id] = ['#'].concat(toPath);
		
		if (object instanceof Array) {
		
			for (var li = object.length, i = 0; i < li; i++) {
			
				toPath.push(i);
				self(obj[i]);
				toPath.pop();
			};
			
			return;
		}

		for (var ks = Object.keys(
			obj
		), li = ks.length, i = 0, key; key = ks[i], i < li; i++) {
		
			if (Object._specialKeys.indexOf(key) > -1) continue;
			
		
			toPath.push(key);
			self(obj[key]);
			toPath.pop();
		}
		
	})(object);
	
	return object;
};


/**
 * Resolve as object.$refs as possible and remove resolved ones from object.$refs
 * If you are sure that $refs comes from a trusted source, set isTrustedSource = true
 * to include global based references
 * Returns object
 */
Object.resolveRefs = function (object, isTrustedSource) {
		
	var refs,
		isArray = object instanceof Array;
		
	if (isArray) {
		
		var last = object[object.length - 1];
		if (last instanceof Object
			&& last.$refs instanceof Array) refs = last.$refs;
	}
	else if (object instanceof Object
		&& object.$refs instanceof Array) refs = object.$refs;

	if (!refs) return object;

	
	var to, to_last,
		from, from_first,
		obj;
		
	for (var li = refs.length, i = 0; i < li; i += 2) {
	
		to = refs[i].clone();
		from = refs[i + 1].clone();

		to_last = to.pop();
		from_first = from.shift();
		if (to_last === undefined || from_first === undefined) continue;
		
		
		obj = Object.find(object, to);
		if (!obj) continue;


		if (from_first !== '#') from.unshift(from_first);
		
		if (from_first !== '#' && !isTrustedSource) continue;
		
		obj[to_last] 
			= Object.find(
				from_first === '#'
					? object
					: global,
				from
			);
			
			
		// Yeah, this is fucked up
		refs.splice(i, 2);
		i -= 2; li -= 2;
	}
	
	return object;
};




// Array.prototype


/// Manually pushing is faster in V8 than slicing?
Array.prototype.clone = function () {
	
	return this.slice(0);
};




// String.prototype


String.prototype.escapeXml = function (newline) {
	
	var s = this.replace(/&/g, '&amp;')
		.replace(/'/g, '&#039;')
		.replace(/\"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
		
	if (newline) s = s.replace(/\n/g, '<br/>');
	
	return s;
};


String.prototype.simple = function (preserveCase) {

	var copy = this.replace(/\s+/g, ' ').trim();
	return preserveCase
		? copy
		: copy.toLowerCase();
};




// Date.prototype


Date.prototype.clone = function () {

	return new Date(this.getTime());
};


Date.prototype.add = function (milliseconds) {

	return new Date(this.getTime() + milliseconds);
};




// RegExp


RegExp.escapeString = function(/*String*/str, /*String?*/except){
	//	summary:
	//		Adds escape sequences for special characters in regular expressions
	// except:
	//		a String with special characters to be left unescaped

	return str.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(ch){
		if(except && except.indexOf(ch) != -1){
			return ch;
		}
		return "\\" + ch;
	}); // String
}




// Number


// See http://www.irt.org/script/1031.htm
Number.MIN_INT = -9007199254740992;
Number.MAX_INT = -Number.MIN_INT;




/*<
});
>*/