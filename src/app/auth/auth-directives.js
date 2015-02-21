(function () {
	'use strict';

	angular.module('auth.directives', ['auth.service'])

	.directive('compareToValidator', function() {
		return {
			restrict: 'A',
			require : 'ngModel',
			link : function($scope, element, attrs, ngModel) {
				$scope.$watch(attrs.compareToValidator, function() {
					ngModel.$validate();
				});
				ngModel.$validators.compareTo = function(value) {
					var other = $scope.$eval(attrs.compareToValidator);
					return !value || !other || value === other;
				};
			}
		};
	})

	.directive('showAuthed', function (AuthService, $timeout) {
		var isAuthed;
		AuthService.watch(function(authData) {
			isAuthed = !!authData;
		});

		return {
			restrict: 'A',
			link: function($scope, element) {
				// Hide until processed
				element.addClass('ng-cloak');

				function update() {
					// Set view state. Wrapped in timer for reliability
					$timeout(function() {
						element.toggleClass('ng-cloak', !isAuthed);
					});
				}

				update();
				AuthService.watch(update, $scope);
			}
		};
	})

	.directive('hideAuthed', function (AuthService, $timeout) {
		var isAuthed;
		AuthService.watch(function(authData) {
			isAuthed = !!authData;
		});

		return {
			restrict: 'A',
			link: function($scope, element) {
				// Hide until processed
				element.addClass('ng-cloak');

				function update() {
					// Set view state. Wrapped in timer for reliability
					$timeout(function() {
						element.toggleClass('ng-cloak', isAuthed);
					});
				}

				update();
				AuthService.watch(update, $scope);
			}
		};
	});

}());