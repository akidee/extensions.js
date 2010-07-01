/**
 * From http://prototypejs.org/assets/2010/5/13/prototype.js
 */
/* <
if (!Object.keys) {

	Object.keys = function (object) {
    
		var results = [];
		for (var property in object) {

			if (object.hasOwnProperty(property)) results.push(property);
		}
		return results;
	};
}
> */


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
 * Copy all of b's own properties to a - deeply through object trees
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
		
				a = Object.mergeDeep((a[key] = a[key] || {}), b[key]);
			else
		
				a[key] = b[key];
		}
	}
	else {
	
		for (var i = 0, len = keys.length; i < len; ++i) {
			
			key = keys[i];
			if (typeof b[key] === 'object')
		
				a = Object.mergeDeep((a[key] = a[key] || {}), b[key], preserve_a);
			else if (!(key in a))
		
				a[key] = b[key];
		}
	}
	return a;
};


/**
 * Return a new object with prototype as __proto__
 */
Object.fromPrototype = function (prototype) {

	var f = function () {};
	f.prototype = prototype;
	return new f;
};


/// Manually pushing is faster in V8 than slicing?
Array.prototype.clone = function () {
	
	return this.slice(0);
};


String.prototype.escapeXml = function (newline) {
	
	var s = this.replace(/'/g,'&#039;')
		.replace(/\"/g,'&quot;')
		.replace(/</g,'&lt;')
		.replace(/>/g,'&gt;');
		
	if (newline) s = s.replace(/\n/g, '<br/>');
	
	return s;
};


// Only use if b.__proto__ === Object.prototype
/// Use Object.keys() instead?
/*Object.extend = function (a, b, preserve_a) {

	if (!b) return a;
	
	
	if (!preserve_a) {
	
		for (var key in b)
			a[key] = b[key];
	}
	else {
	
		for (var key in b)
			if (!(key in a)) a[key] = b[key];
	}
	return a;
};*/


/*Object.restrict = function (a, keys) {

    var b = {};
    for (var ii = keys.length, i = 0, key; i < ii; i++) {
    
        key = keys[i];
        if (key in a) b[key] = a[key];
    }
    return b;
};*/