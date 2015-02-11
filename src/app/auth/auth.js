(function () {
	'use strict';

	angular.module('auth', ['ngMessages', 'auth.service', 'email.service'])

	.constant('welcomeNoAuthState', 'welcome')
	.constant('welcomeAuthState', 'home.home')

	.config(function($urlRouterProvider, $stateProvider, welcomeNoAuthState, welcomeAuthState) {
		$urlRouterProvider.otherwise('/redirect');

		$stateProvider
		.state('auth', {
			abstract: true,
			template: '<div ui-view></div>',
			resolve: {
				'auth': function(AuthService) {
					return AuthService.getAuth();
				}
			}
		})
		.state('auth.signup', {
			url: '/signup',
			templateUrl: 'app/auth/auth.tpl.html',
			controller: 'AuthController',
			controllerAs: 'authCtrl',
			resolve: {
				'signup': function() {
					return true;
				}
			}
		})
		.state('auth.login', {
			url: '/login',
			templateUrl: 'app/auth/auth.tpl.html',
			controller: 'AuthController',
			controllerAs: 'authCtrl',
			resolve: {
				'signup': function() {
					return false;
				}
			}
		})
		.state('auth.logout', {
			onEnter: function(AuthService) {
				AuthService.logout();
			},
			controller: function($state) {
				$state.go(welcomeNoAuthState);
			}
		})
		.state('auth.redirect', {
			url: '/redirect',
			templateUrl: 'app/auth/auth-pre.tpl.html',
			controller: function($state) {
				$state.go('auth.authenticating');
			}
		})
		.state('auth.authenticating', {
			controller: function(auth, $state) {
				if (auth === null) {
					console.log('Not authed, redirecting to front page');
					$state.go(welcomeNoAuthState);
				} else {
					console.log('Authed, redirecting');
					$state.go(welcomeAuthState);
				}
			}
		});
	})

	.run(function($rootScope, $state, welcomeAuthState, AuthService) {
		AuthService.watch(function(newAuth, oldAuth) {
			// Just logged in
			if (newAuth && (angular.isUndefined(oldAuth) || oldAuth === null)) {
				$state.go(welcomeAuthState);
			}

			// Find out if 'auth' is in the resolve list somewhere between the current state and the root.
			function routeRequiresAuth(startState) {
				var state = startState;
				while (true) {
					if (state.resolve && 'requireAuth' in state.resolve) {
						return true;
					}

					var stateName = state.name;
					var lastDot = stateName.lastIndexOf('.');
					if (lastDot !== -1) {
						var parentStateName = stateName.substring(0, lastDot);
						state = $state.get(parentStateName);
					} else {
						break;
					}
				}

				return false;
			}

			// Should auth status change while viewing a state requiring auth, the user is redirected to login
			if (!newAuth && routeRequiresAuth($state.current)) {
				console.warn('Auth is required for the state you are viewing: "' + $state.current.name + '". Redirecting you to login.');
				$state.go('auth.login');
			}
		}, $rootScope);

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState) {
			console.log(fromState.name + ' -> ' + toState.name);
		});

		$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
			if(angular.isObject(error) && error.authRequired) {
				console.warn('Auth required for transitioning to state: "' +  toState.name + '". Redirecting you to login.');
				$state.go('auth.login');
			}
		});
	})

	.directive('emailAvailableValidator', function(EmailService) {
		return {
			restrict: 'A',
			require : 'ngModel',
			link : function($scope, element, attrs, ngModel) {
				if ($scope.$eval(attrs.emailAvailableValidator)) {
					ngModel.$asyncValidators.emailUnique = function(email) {
						return EmailService.emailAvailable(email);
					};
				}
			}
		};
	})

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
	})

	.controller('AuthController', function($state, AuthService, EmailService, signup, auth) {
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

		var createAccount = function(email, password) {
			return AuthService.create(email, password);
		};

		var registerEmail = function(email) {
			return EmailService.create(email);
		};

		var login = function(email, password, remember) {
			return AuthService.login(email, password, remember);
		};

		this.submit = function(valid) {
			if (!valid) {
				return;
			}

			if (this.signup) {
				console.log('AuthController [submit]: Sign up!');

				var user = this.user;

				createAccount(user.email, user.password)
				.then(function() {
					return login(user.email, user.password, user.remember);
				})
				.then(function() {
					return registerEmail(user.email);
				})
				.catch(function(error) {
					//TODO: Throw to GUI
					console.error('AuthController [submit]: Error: %o', error);
				});
			} else {
				console.log('AuthController [submit]: Login!');

				login(this.user.email, this.user.password, this.user.remember)
				.catch(function(error) {
					//TODO: Throw to GUI
					console.error('AuthController [submit]: Error: %o', error);
				});
			}
		};

		this.login3rdParty = function(provider) {
			AuthService.login3rdParty(provider)
			.then(function() {
				console.log('AuthController [login3rdParty]: Login succeeded!');
			})
			.catch(function(error) {
				//TODO: Throw to GUI
				console.error('AuthController [login3rdParty]: Error: %o', error);
			});
		};

	});

}());