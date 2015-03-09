(function () {
	'use strict';

	angular.module('auth.controller', ['auth.service', 'auth.lang'])

	.controller('AuthCheckController', function($state, AuthLanguage) {
		this.lang = AuthLanguage;
		$state.go('auth.authenticating');
	})

	.constant('errorsToView', [
		// Email
		'EMAIL_TAKEN',
		'INVALID_EMAIL',
		'INVALID_USER',

		// Password
		'INVALID_PASSWORD',

		// Common
		'NETWORK_ERROR',

		// Provider
		'PROVIDER_ERROR',
		'USER_CANCELLED',
		'USER_DENIED'
	])

	.controller('AuthController', function($state, errorsToView, AuthService, AuthLanguage, signup, auth, $modalInstance) {
		if (auth !== null) {
			$state.go('auth.redirect');
		}

		this.lang = AuthLanguage;

		this.signup = signup;

		this.user = {
			email: '',
			password: '',
			passwordConfirm: '',
			remember: false
		};

		this.working = false;
		this.error = {};
		this.reset = AuthLanguage.get('passwordReset');

		var self = this;

		var errorHandler = function(error) {
			if (error) {
				//TODO: Some of the errors from errorsToView might contain details that should be logged
				if (errorsToView.indexOf(error.code) === -1) {
					//TODO: Log
					console.error('AuthController [submit]: Error');
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

			if (this.signup) {
				console.log('AuthController [submit]: Sign up!');

				var user = this.user;

				AuthService.create(this.user.email, this.user.password)
				.then(function() {
					return AuthService.login(user.email, user.password, user.remember);
				})
				.then(function() {
					if ($modalInstance) {
						$modalInstance.close();
					}
				})
				.catch(function(error) {
					errorHandler(error);
				})
				.finally(function() {
					self.working = false;
				});
			} else {
				console.log('AuthController [submit]: Login!');

				AuthService.login(this.user.email, this.user.password, this.user.remember)
				.then(function() {
					if ($modalInstance) {
						$modalInstance.close();
					}
				})
				.catch(function(error) {
					errorHandler(error);
				})
				.finally(function() {
					self.working = false;
				});
			}
		};

		this.resetPassword = function() {
			AuthService.resetPassword(this.user.email)
			.then(function() {
				self.reset = AuthLanguage.get('passwordResetSuccess');
			})
			.catch(function(error) {
				self.reset = AuthLanguage.get('passwordResetFailed');
				console.log('AuthController [resetPassword] failed with error code ' + error.code);
			});
		};

		this.login3rdParty = function(provider) {
			this.error = {};
			this.error.provider = provider.capitalize();

			AuthService.login3rdParty(provider)
			.then(function() {
				if ($modalInstance) {
					$modalInstance.close();
				}
			})
			.catch(function(error) {
				errorHandler(error);
			});
		};

		this.close = function() {
			$modalInstance.close();
		};

		this.cancel = function() {
			$modalInstance.dismiss();
		};

	});

}());