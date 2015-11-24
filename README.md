# Antiquefy

Create callback-last style functions from functions returning promises and from generator functions.

## Examples

In most cases asynchronous functions which return their results in a callback function can be easily promisified using various promise libraries. However, if you have a 3rd party function which takes a hook-like function with a `done` callback, the process is not so straightforward.

For example, [passport-local](https://github.com/jaredhanson/passport-local) strategy takes a `verify` callback function which is itself supplied with a `done` callback. Antiquefy handles the calling of the `done` callback automatically after the antiquefied function has been finished. The `done` callback is expected to be an error first style callback.

### Generators

Here is the antiquefied version of the Passport local strategy example using generators:

```js
passport.use(new LocalStrategy(antiquefy(
	function*(username, password) {
		var user = yield User.findOne({ username: username });

		if (!user) {
			return false;
		}
		
		if (!user.verifyPassword(password)) {
			return false;
		}
		
		return user;
	}
)));
```
	
### Promises

The above could also be achieved using promises:

```js
passport.use(new LocalStrategy(antiquefy(
	function(username, password) {
		return User.findOne({ username: username }).then(function(user) {

			if (!user) {
				return false;
			}
		
			if (!user.verifyPassword(password)) {
				return false;
			}
		
			return user;
		});
	}
)));
```

Functionally this is equivalent to the generator example, but is little more verbose and requires one extra indentation level.

## API

### `antiquefy(fn, [options])` ⇒ `Function`

Convert the given function or generator function into a function which takes a `done` callback.

| Param | Type | Description |
| --- | --- | --- |
| `fn` | `Function` or `GeneratorFunction` | The function (or generator function) to Antiquefy. |
| `options` | `Object` | Options for Antiquefy. |
| `options.spread` | `boolean` | Set this to `true` if you wish to spread the returned array elements as individual arguments for the `done` callback.<br/>**Optional**<br/>**Default:** `false` |

#### Spreading arguments

If the `done` callback takes more than one parameter, it can be supplied multiple arguments by returning an array and setting the `spread` option to `true`.

```js
var sum = antiquefy(function(a, b) {
	return [a, b, a + b];
}, { spread: true });

sum(4, 6, function(error, first, second, sum) {
	console.log(first); // 4
	console.log(second); // 6
	console.log(sum); // 10
});
```

This works similarly to Bluebird's [`asCallback(..)`](http://bluebirdjs.com/docs/api/ascallback.html) and that is what Antiquefy uses internally.

## Tests

Unit tests can be run by executing:

	npm test
