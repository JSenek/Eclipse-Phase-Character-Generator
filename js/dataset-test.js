Modernizr.addTest('dataset', function(){ return 'dataset' in document.documentElement; });
Modernizr.load([{
	test : Modernizr.dataset,
	nope : ['js/html5-dataset.js']
}]);