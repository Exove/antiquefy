'use strict';

const expect = require('expect.js');
const Bluebird = require('bluebird');

const antiquefy = require('..');


describe('Functions', function() {

	it('Should handle non-promise return values', function(done) {
		var antiquefied = antiquefy(function(a, b) {
			return a + b;
		});

		antiquefied(2, 3, function(error, result) {
			expect(error).to.be(null);
			expect(result).to.be(5);
			done();
		});
	});

	it('Should handle promise return values', function(done) {
		var antiquefied = antiquefy(function(a, b) {
			return Bluebird.resolve(a + b);
		});

		antiquefied(4, 6, function(error, result) {
			expect(error).to.be(null);
			expect(result).to.be(10);
			done();
		});
	});

	it('Should handle variadic arguments', function(done) {
		var antiquefied = antiquefy(function() {
			// Return a promise containing the sum of all the given arguments.
			return Bluebird.reduce(arguments, function(sum, current) {
				return sum + current;
			}, 0);
		});

		antiquefied(5, 6, function(error, result) {
			expect(error).to.be(null);
			expect(result).to.be(11);

			antiquefied(5, 6, 7, 8, function(error, result) {
				expect(error).to.be(null);
				expect(result).to.be(26);
				done();
			});
		});
	});

	it('Should not spread arrays by default', function(done) {
		var antiquefied = antiquefy(function(a, b) {
			return [a, b];
		});

		antiquefied(4, 6, function(error, result) {
			expect(arguments).to.have.length(2);
			expect(error).to.be(null);
			expect(result).to.eql([4, 6]);
			done();
		});
	});

	it('Should be able to spread the arguments', function(done) {
		var antiquefied = antiquefy(function(a, b) {
			return [a, b];
		}, { spread: true });

		antiquefied(4, 6, function(error, result1, result2) {
			expect(arguments).to.have.length(3);
			expect(error).to.be(null);
			expect(result1).to.be(4);
			expect(result2).to.be(6);
			done();
		});
	});

	it('Should handle thrown errors', function(done) {
		var antiquefied = antiquefy(function() {
			throw Error('Oh noes!');
		});

		antiquefied(function(error) {
			expect(arguments).to.have.length(1);
			expect(error).to.be.an(Error);
			expect(error.message).to.be('Oh noes!');
			done();
		});
	});

	it('Should preserve the context', function(done) {
		var antiquefied = antiquefy(function(a) {
			return this.b + a;
		});

		var context = { b: 3 };

		antiquefied.call(context, 4, function(error, result) {
			expect(error).to.be(null);
			expect(result).to.be(7);
			done();
		});
	});

});
