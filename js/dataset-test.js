/* Modernizr test for dataset functionality
 *
 * Test for browser support of html5 data-* attributes, and load the polyfill if not found.
 *
 */

Modernizr.addTest('dataset', function(){ return 'dataset' in document.documentElement; });
Modernizr.load([{
	test : Modernizr.dataset,
	nope : ['js/html5-dataset.js']
}]);
