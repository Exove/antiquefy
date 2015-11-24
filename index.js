'use strict';

const assert = require('assert');

const Bluebird = require('bluebird');
const _ = require('lodash');


/**
 * Check if the given argument is a generator function.
 *
 * @param {*} fn - The entity to check.
 *
 * @return {boolean} - `true` if `fn` is a generator function,
 *         `false` otherwise.
 */
function isGenerator(fn) {
	return fn && fn.constructor && fn.constructor.name === 'GeneratorFunction';
}


/**
 * Create a callback-last style function from a function returning a
 * promise or from a generator function.
 *
 * If a normal function is provided, it is expected to return a promise.
 * When this promise resolves, it calls the antiquefied functions callback
 * function, forwarding possible errors correctly.
 *
 * If a generator function is given, it will be wrapped inside a Bluebird
 * coroutine. This produces a function which returns a promise after the
 * generator has been finished.
 *
 * @param {Function|GeneratorFunction} fn - The function or generator
 *        function to antiquefy.
 * @param {Object} options - Options for the antiquefying process.
 * @param {boolean} [options.spread=false] - If this is true and `fn`
 *        returns an array (or a promise which is fulfilled with an array),
 *        the array elements will be spread to the callback as individual
 *        arguments, instead of giving the array as a single argument.
 *
 * @return {Function} - The antiquefied function.
 */
function antiquefy(fn, options) {
	// Assign arguments into a separate variables.
	// Since we are possibly assigning back to the function argument
	// (when we wrap the generator inside Bluebird coroutine),
	// it might affect performance if you would assign directly to
	// the argument variable.
	var _fn = fn;
	var _options = options || { spread: false };

	// Sanity check the input.
	assert(
		_.isFunction(_fn),
		'The input to antiquefy is expected' + 
		'to be either a function or a generator function, \'' + 
		typeof _fn + '\' given.'
	);

	// Create the antiquefied function.
	return function() {
		// All "real" arguments, i.e. all arguments except the callback.
		var argsToFn = new Array(arguments.length - 1);

		// Copy the arguments in a non-leaking way.
		// More info:
		// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
		for (var i = 0; i < argsToFn.length; ++i) {
			argsToFn[i] = arguments[i];
		}

		// Expect a callback-last style function, so the callback
		// will be the last argument.
		var callback = arguments[arguments.length - 1];

		if (isGenerator(_fn)) {
			// If the given function is a generator function,
			// wrap it inside a Bluebird coroutine.
			_fn = Bluebird.coroutine(_fn);
		}

		// Wrap the arguments into a promise.
		var argsPromise = Bluebird.resolve(argsToFn);

		// Spread the arguments to `fn`.
		// Also bind the the context of this wrapper function to the
		// antiquefied function, so that it is correctly forwarded to `fn`.
		var fnPromise = argsPromise.spread(_fn.bind(this));

		// Use Bluebird's `asCallback(..)` to register the antiquefied function's
		// callback function on this promise.
		fnPromise.asCallback(callback, _options);
	}
}


module.exports = antiquefy;
