// extensions.js - index - Copyright Andreas Kalsch <andreaskalsch@gmx.de> (MIT Licensed)




"use strict";
//var sys = require('sys');




// Make sure that global is window on the client
if (global === undefined) global = window;




// Object


/**
 * Return all object's own property keys
 * From http://prototypejs.org/assets/2010/5/13/prototype.js
 */
if (!Object.keys) {

	Object.keys = function (object) {
    
		var results = [];
		for (var property in object) {

			if (object.hasOwnProperty(property)) results.push(property);
		}
		return results;
	};
}


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


Object._specialKeys = ['$ref', '$refs', '$id', '$omit'].concat([]);


/**
 * Add (if not yet existing) and return a global-ly unique object ID
 */
Object.id = function (object) {
	
	if (object instanceof Object 
		&& !object.hasOwnProperty('$id')) object.$id = ++Object._id;
		
	return object.$id;
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
	
	var s = this.replace(/'/g, '&#039;')
		.replace(/\"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
		
	if (newline) s = s.replace(/\n/g, '<br/>');
	
	return s;
};


var slice = Array.prototype.slice;

String.prototype.sprintf = function () {

	var args = slice.call(arguments, 0);
	args.unshift(this);

	return sprintf.apply(this, args);
};




// JSON


/*
    http://www.JSON.org/json2.js
    2010-03-20

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

// END http://www.JSON.org/json2.js


JSON.REPLACER_REFS_AND_CLASSES = function (key, value) {

	if (this.hasOwnProperty('$omit') && this.$omit[key]) return;
	
	
	if (value instanceof Object) {
	
		var constr = value.constructor;
		
		if (constr !== Object
			&& constr !== Array
			&& constr.classPath
			&& constr.clientUsesClass) {
		
			value.$classPath = value.constructor.classPath;
		}
	}
	
	return value;
};

JSON.REVIVER_CLASSES = function (key, value) {

	if (value.$classPath) {
	
		var constr = Object.find(global, value.$classPath);
		delete value.$classPath;
		if (typeof constr === 'function') return new constr(value);
	}
	
	
	return value;
};