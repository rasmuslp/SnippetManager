(function () {
	'use strict';

	angular.module('user.controller', ['user.lang', 'auth.service'])

	.constant('errorsToView', [
		// Password
		'INVALID_PASSWORD',

		// Common
		'NETWORK_ERROR'
	])

	.controller('UserController', function(UserLanguage) {
		this.lang = UserLanguage;
	})

	.controller('ChangePasswordController', function($scope, $timeout, errorsToView, UserLanguage, AuthService) {
		this.lang = UserLanguage;

		this.pass = {
			oldPass: '',
			newPass1: '',
			newPass2: ''
		};

		this.working = false;
		this.error = {};
		this.success = false;

		var self = this;

		var errorHandler = function(error) {
			if (error) {
				//TODO: Some of the errors from errorsToView might contain details that should be logged
				if (errorsToView.indexOf(error.code) === -1) {
					//TODO: Log
					console.error('ChangePasswordController [errorHandler]: Error');
					console.error('Code: ' + error.code);
					console.error('Message: ' + error.message);

					self.error.code = 'GENERAL_ERROR';
				} else {
					self.error.code = error.code;
				}
			}
		};

		this.submit = function(valid) {
			if (!valid) {
				return;
			}

			this.working = true;
			this.error = {};
			this.success = false;

			AuthService.changePassword(AuthService.auth.password.email, this.pass.oldPass, this.pass.newPass1)
			.then(function() {
				// Clear form
				self.pass = {};
				$scope.cpForm.$setUntouched();
				$scope.cpForm.$setPristine();

				self.success = true;
				var successTimer = $timeout(function() {
					self.success = false;
				}, 5000);

				$scope.$on('$destroy', function() {
					$timeout.cancel(successTimer);
				});
			})
			.catch(function(error) {
				errorHandler(error);
			})
			.finally(function() {
				self.working = false;
			});
		};
	});

}());