(function () {
	'use strict';

	angular.module('user.controller', ['user.service', 'user.lang', 'auth.directives', 'auth.service'])

	.controller('UserController', function(UserLanguage, AuthService) {
		this.lang = UserLanguage;
		this.provider = AuthService.provider;
	})

	.controller('UserDeleteController', function($scope, $timeout, UserService, UserLanguage, AuthService) {
		this.lang = UserLanguage;

		this.provider = AuthService.provider;
		if (this.provider === 'password') {
			this.email = AuthService.auth.password.email;
		}

		this.user = {
			email: '',
			pass: ''
		};

		this.working = false;
		this.error = {};
		this.success = false;

		var self = this;

		var errorsToView = [
			// Email
			'INVALID_EMAIL',
			'INVALID_USER',

			// Password
			'INVALID_PASSWORD',

			// Common
			'NETWORK_ERROR'
		];

		var errorHandler = function(error) {
			if (error) {
				//TODO: Some of the errors from errorsToView might contain details that should be logged
				if (errorsToView.indexOf(error.code) === -1) {
					//TODO: Log
					console.error('UserDeleteController [errorHandler]: Error');
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

			UserService.delete()
			.then(function() {
				if (self.provider === 'password') {
					return AuthService.delete(AuthService.auth.password.email, self.user.pass);
				}
			})
			.then(function() {
				// Clear form
				self.user = {};
				$scope.udForm.$setUntouched();
				$scope.udForm.$setPristine();

				self.success = true;
				var successTimer = $timeout(function() {
					self.success = false;
				}, 5000);

				$scope.$on('$destroy', function() {
					$timeout.cancel(successTimer);
				});
			})
			.then(function() {
				$timeout(AuthService.logout(), 2000);
			})
			.catch(function(error) {
				errorHandler(error);
			})
			.finally(function() {
				self.working = false;
			});
		};
	})

	.controller('ChangePasswordController', function($scope, $timeout, UserLanguage, AuthService) {
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

		var errorsToView = [
			// Password
			'INVALID_PASSWORD',

			// Common
			'NETWORK_ERROR'
		];

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