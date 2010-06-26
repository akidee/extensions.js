// Needed for client side
if (!Object.keys) {

	Object.keys = function (object) {
    
		var results = [];
		for (var property in object) {

			if (object.hasOwnProperty(property)) results.push(property);
		}
		return results;
	};
}


// Only use if b.__proto__ === Object.prototype
/// Use Object.keys() instead?
Object.extend = function (a, b, preserve_a) {

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
};


/// Fix
/*Object.extendDeep = function (a, b, preserve_a) {
    
    if (!b) return a;
    
    
    for (var key in b) {
      if (typeof b[key] === 'object')
        a[key] = Object.extendDeep(a[key] || {}, b[key]);
      else if (preserve_a && !(key in a) || !preserve_a) {
      
        a[key] = b[key];
    }
    return a;
};*/


Object.restrict = function (a, keys) {

    var b = {};
    for (var ii = keys.length, i = 0, key; i < ii; i++) {
    
        key = keys[i];
        if (key in a) b[key] = a[key];
    }
    return b;
};


/// Fix to fit standard, then add to recma.js
if (!Function.prototype.bind) {

	// check
	Function.prototype.bind = function (context) {
	
		if (arguments[0] === undefined) return this;
		var __method = this, args = Array.prototype.slice.call(arguments, 1);
		return function() {
	
			//var a = merge(args, arguments);
			return __method.apply(context, arguments);
		};
	};
}


Array.prototype.clone = function () {
	
	return this.slice(0);
};


String.prototype.escapeXml = function () {
	
	return this.replace(/'/g,'&#039;')
		.replace(/\"/g,'&quot;')
		.replace(/</g,'&lt;')
		.replace(/>/g,'&gt;');
};