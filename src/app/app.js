'use strict';

(function () {

	angular.module('smApp', ['ngAnimate', 'templates', 'ui.router', 'auth', 'welcome', 'home', 'ngClipboard', 'ngMarkdown'])

	.config(function(ngClipProvider) {
		ngClipProvider.setPath('assets/ZeroClipboard.swf');
	})

	.run(function($rootScope) {
		$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
			console.log('State change error: %o', error);
		});
	});

	$(document).on('click','.navbar-collapse.in',function(e) {
		if($(e.target).is('a') && ($(e.target).attr('class') !== 'dropdown-toggle')) {
			$(this).collapse('hide');
		}
	});

}());