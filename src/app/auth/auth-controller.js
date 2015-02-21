(function () {
	'use strict';

	angular.module('auth.controller', ['auth.service'])

	.controller('AuthController', function($state, AuthService, signup, auth) {
		if (auth !== null) {
			$state.go('auth.redirect');
		}

		this.signup = signup;

		this.user = {
			email: '',
			password: '',
			passwordConfirm: '',
			remember: false
		};

		this.working = false;
		this.error = {};

		var self = this;

		var createAccount = function(email, password) {
			return AuthService.create(email, password);
		};

		var login = function(email, password, remember) {
			return AuthService.login(email, password, remember);
		};

		var errorHandler = function(error) {
			if (error) {
				//TODO: Some of thee might contain details that should be logged ?
				var errorsToView = [
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
				];

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

				createAccount(user.email, user.password)
				.then(function() {
					return login(user.email, user.password, user.remember);
				})
				.catch(function(error) {
					errorHandler(error);
				})
				.finally(function() {
					self.working = false;
				});
			} else {
				console.log('AuthController [submit]: Login!');

				login(this.user.email, this.user.password, this.user.remember)
				.catch(function(error) {
					errorHandler(error);
				})
				.finally(function() {
					self.working = false;
				});
			}
		};

		this.login3rdParty = function(provider) {
			this.error = {};
			this.error.provider = provider.capitalize();

			AuthService.login3rdParty(provider)
			.then(function() {
				console.log('AuthController [login3rdParty]: Login succeeded!');
			})
			.catch(function(error) {
				errorHandler(error);
			});
		};

	});

}());