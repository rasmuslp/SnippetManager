(function() {
	'use strict';

	angular.module('auth.service', ['common.config', 'firebase'])
	.factory('AuthService', function(FB, $firebase, $firebaseAuth) {
		var fbAuth = $firebaseAuth(new Firebase(FB));

		var listeners = [];

		function statusChange(authData) {
			console.log('Auth status and data: %o', authData);
			var oldAuth = ret.auth;
			ret.auth = fbAuth.$getAuth();
			angular.forEach(listeners, function(fn) {
				fn(ret.auth, oldAuth);
			});
		}

		var ret = {
			auth: null,

			uid: function() {
				if (ret.auth && ret.auth.uid) {
					return ret.auth.uid;
				}

				return null;
			},

			getAuth: function() {
				return fbAuth.$waitForAuth();
			},

			getAuthSync: function() {
				return fbAuth.$getAuth();
			},

			create: function(email, password) {
				var credentials = {
					email: email,
					password: password
				};

				return fbAuth.$createUser(credentials);
			},

			login: function(email, password, remember) {
				var credentials = {
					email: email,
					password: password
				};

				var options = {
					remember: angular.isDefined(remember) ? remember : 'default'
				};

				return fbAuth.$authWithPassword(credentials, options);
			},

			login3rdParty: function(provider) {
				return fbAuth.$authWithOAuthPopup(provider)
				.catch(function(error) {
					if (error && error.code === 'TRANSPORT_UNAVAILABLE') {
						//TODO: Log
						return fbAuth.$authWithOAuthRedirect(provider);
					}
				});
			},

			logout: function() {
				console.log('Unauthing');
				fbAuth.$unauth();
			},

			changePassword: function(email, oldPassword, newPassword) {
				return fbAuth.$changePassword({
					email: email,
					oldPassword: oldPassword,
					newPassword: newPassword
				});
			},

			resetPassword: function(email) {
				return fbAuth.$resetPassword({
					email: email
				});
			},

			watch: function(cb, $scope) {
				ret.getAuth().then(function(authData) {
					cb(authData);
				});

				listeners.push(cb);

				var unbind = function() {
					var i = listeners.indexOf(cb);
					if ( i > -1 ) {
						listeners.splice(i, 1);
					}
				};

				if ($scope) {
					$scope.$on('$destroy', unbind);
				}

				return unbind;
			}
		};

		fbAuth.$onAuth(statusChange);
		statusChange();

		return ret;
	})
	.factory('requireAuth', function($q, AuthService) {
		// Wrapper that rejects the promise if the auth is unset
		return function() {
			return AuthService.getAuth().then(function (auth) {
				return auth ? auth : $q.reject({ authRequired: true });
			});
		};
	});

}());