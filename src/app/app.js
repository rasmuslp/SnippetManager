'use strict';

(function () {

	angular.module('smApp', ['templates', 'ui.router', 'auth', 'welcome', 'home'])

	.run(function($rootScope) {
		$rootScope.$on('$stateChangeError', function(event) {
			console.log(event);
		});
	});

	$(document).on('click','.navbar-collapse.in',function(e) {
		if($(e.target).is('a') && ($(e.target).attr('class') !== 'dropdown-toggle')) {
			$(this).collapse('hide');
		}
	});

}());