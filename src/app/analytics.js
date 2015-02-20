(function () {
	/* jshint -W030, -W033, -W069 */
	/* globals ga */

	'use strict';

	angular.module('analytics', ['angulartics', 'angulartics.google.analytics'])
	.directive('analytics', function ($location) {
		return {
			restrict: 'A',
			link: function() {
				var port = $location.port();
				if (port === 80 || port === 443) {
					(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
						(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
						m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
					})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

					ga('create', 'UA-59950591-1', 'auto');
				}
			}
		};
	});

}());