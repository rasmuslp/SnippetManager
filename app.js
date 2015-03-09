(function () {
	/* jshint -W030, -W033, -W069 */
	/* globals ga */

	'use strict';

	angular.module('analytics', ['angulartics', 'angulartics.google.analytics'])
	.directive('analytics', ['$location', function ($location) {
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
	}]);

}());
'use strict';

(function () {

	angular.module('smApp', ['ngAnimate', 'templates', 'ui.router', 'ui.bootstrap', 'analytics', 'auth', 'welcome', 'home', 'ngClipboard', 'ngMarkdown'])

	.config(['ngClipProvider', function(ngClipProvider) {
		ngClipProvider.setPath('assets/ZeroClipboard.swf');
	}])

	.run(['$rootScope', function($rootScope) {
		$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
			console.log('State change error: %o', error);
		});
	}]);

	$(document).on('click','.navbar-collapse.in',function(e) {
		if($(e.target).is('a') && ($(e.target).attr('class') !== 'dropdown-toggle')) {
			$(this).collapse('hide');
		}
	});

}());
(function () {
	'use strict';

	angular.module('auth.controller', ['auth.service', 'auth.lang'])

	.controller('AuthCheckController', ['$state', 'AuthLanguage', function($state, AuthLanguage) {
		this.lang = AuthLanguage;
		$state.go('auth.authenticating');
	}])

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

	.controller('AuthController', ['$state', 'errorsToView', 'AuthService', 'AuthLanguage', 'signup', 'auth', '$modalInstance', function($state, errorsToView, AuthService, AuthLanguage, signup, auth, $modalInstance) {
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

	}]);

}());
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

	.directive('showAuthed', ['AuthService', '$timeout', function (AuthService, $timeout) {
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
	}])

	.directive('hideAuthed', ['AuthService', '$timeout', function (AuthService, $timeout) {
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
	}]);

}());
(function () {
	'use strict';

	angular.module('auth.lang', [])

  .factory('AuthLanguage', function() {
		var strings = {
			// Common
			'login': 'login',
			'Login': 'Login',
			'signup': 'sign up',
			'Signup': 'Sign up',
			'Cancel': 'Cancel',

			// Other
      'check': 'Checking authentication',
			'or': 'or',
			'hasAccount': 'If you already have an account, you can login here.',
			'noAccount': 'You don\'t have an account?',
			'goToCreateAccount': 'Create an account here!',

			// Form
			'emailPlaceholder': 'Email address',
			'emailReq': 'Enter your email address',
			'emailLike': 'This does not look like an email address',
			'emailTaken': 'This email address is already registered',
			'emailInvalid': 'Invalid email address',
			'userInvalid': 'This account does not exist',
			'passwordPlaceholder': 'Password',
			'passwordReq': 'Enter a password',
			'passwordMin': 'The password must be at least 8 characters',
			'passwordInvalid': 'Invalid password',
			'passwordReset': 'Click here to reset password',
			'passwordResetSuccess': 'Check your email for a temporary password',
			'passwordResetFailed': 'Failed to send email, try again',
			'passwordConfirmPlaceholder': 'Confirm password',
			'passwordRepeat': 'Repeat the password',
			'passwordMatch': 'The passwords does not match',
			'remember': 'Remember me',
			'createAccount': 'Create account',
			'working': 'Working',
			'networkError': 'Network error, try again',
			'generalError': 'An unexpected error occurred',
			'orSocial': 'or login with one of these',
			'providerError': 'An error occurred at',
			'providerAuthenticationError': 'The authentication at',
			'userCancel': 'was cancelled',
			'userDenied': 'was denied'

		};

    return {
			get: function(key) {
				if (strings.hasOwnProperty(key)) {
					return strings[key];
				} else {
					console.error('AuthLanguage: Missing translation for: ' + key);
					return 'Missing translation';
				}
			}
    };
  });

}());
(function() {
	'use strict';

	angular.module('auth.service', ['common.config', 'firebase'])
	.factory('AuthService', ['FB', '$firebase', '$firebaseAuth', function(FB, $firebase, $firebaseAuth) {
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

			delete: function(email, password) {
				return fbAuth.$removeUser({
					email: email,
					password: password
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
	}])
	.factory('requireAuth', ['$q', 'AuthService', function($q, AuthService) {
		// Wrapper that rejects the promise if the auth is unset
		return function() {
			return AuthService.getAuth().then(function (auth) {
				return auth ? auth : $q.reject({ authRequired: true });
			});
		};
	}]);

}());
(function () {
	'use strict';

	angular.module('auth', ['ngMessages', 'auth.service', 'auth.lang', 'auth.controller', 'auth.directives'])

	.constant('loginState', 'auth.login')
	.constant('welcomeNoAuthState', 'welcome')
	.constant('welcomeAuthState', 'home.home')

	.config(['$urlRouterProvider', '$stateProvider', 'loginState', 'welcomeNoAuthState', 'welcomeAuthState', function($urlRouterProvider, $stateProvider, loginState, welcomeNoAuthState, welcomeAuthState) {
		$urlRouterProvider.otherwise('/redirect');

		$stateProvider
		.state('auth', {
			abstract: true,
			template: '<div ui-view></div>',
			resolve: {
				'auth': ['AuthService', function(AuthService) {
					return AuthService.getAuth();
				}]
			}
		})
		.state(loginState, {
			url: '/login',
			templateUrl: 'app/auth/auth.page.tpl.html',
			controller: 'AuthController',
			controllerAs: 'authCtrl',
			resolve: {
				'signup': function() {
					return false;
				},
				'$modalInstance': function() {
					return false;
				}
			}
		})
		.state('auth.logout', {
			onEnter: ['AuthService', function(AuthService) {
				AuthService.logout();
			}],
			controller: ['$state', function($state) {
				$state.go(welcomeNoAuthState, {reload: true});
			}]
		})
		.state('auth.redirect', {
			url: '/redirect',
			templateUrl: 'app/auth/auth-pre.tpl.html',
			controller: 'AuthCheckController',
			controllerAs: 'authCtrl'
		})
		.state('auth.authenticating', {
			controller: ['auth', '$state', function(auth, $state) {
				if (auth === null) {
					console.log('Not authed, redirecting to front page');
					$state.go(welcomeNoAuthState);
				} else {
					console.log('Authed, redirecting');
					$state.go(welcomeAuthState);
				}
			}]
		});
	}])

	.run(['$rootScope', '$state', 'loginState', 'welcomeAuthState', 'AuthService', function($rootScope, $state, loginState, welcomeAuthState, AuthService) {
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
				$state.go(loginState);
			}
		}, $rootScope);

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState) {
			console.log(fromState.name + ' -> ' + toState.name);
		});

		$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
			if(angular.isObject(error) && error.authRequired) {
				console.warn('Auth required for transitioning to state: "' +  toState.name + '". Redirecting you to login.');
				$state.go(loginState);
			}
		});
	}]);

}());
(function () {
  'use strict';

  angular.module('home.ctrl', ['common.filters', 'letter.list.ctrl', 'snippet.ctrl', 'user', 'dndLists'])

  .controller('HomeController', ['letters', 'currentLetter', '$scope', '$filter', '$timeout', 'UserService', '$modal', function(letters, currentLetter, $scope, $filter, $timeout, UserService, $modal) {
    var self = this;
    var updateCurrentLetter = function(letter) {
      self.currentLetter = letter;
      self.snippetData = letter.getSnippets();
      self.snippetData.$loaded(function(data) {
        var setPriority = false;
        var i;
        for (i = 0; i < data.length; i++) {
          if (data[i].$priority === null) {
            setPriority = true;
            break;
          }
        }

        if (setPriority) {
          console.log('Setting priority');
          for (i = 0; i < data.length; i++) {
            self.snippetData[i].$priority = i;
            self.snippetData.$save(i);
          }
        }
      });
    };
    updateCurrentLetter(currentLetter);

    this.openLetter = function(id) {
      var editLetterModal = $modal.open({
        templateUrl: 'app/home/letter.edit.tpl.html',
        controller: 'LetterEditController',
        controllerAs: 'letterEditCtrl',
        resolve: {
          editLetter: function() {
            return UserService.getLetter(id);
          },
          letters: function() {
            return letters;
          }
        }
      });

      editLetterModal.result
      .then(function(letterId) {
        if (angular.isUndefined(id)) {
          // New letter
          return UserService.setCurrentLetterId(letterId)
          .then(function() {
            return UserService.getCurrentLetter();
          })
          .then(function(letter) {
            updateCurrentLetter(letter);
          })
          .catch(function(error) {
            console.log('HomeController [openLetter] could not change to new letter: ' + error.code);
          });
        } else {
          // Deleted letter
          if (self.currentLetter.$id === letterId) {
            // Deleting current letter
            return UserService.setCurrentLetterId(null)
            .then(function() {
              return UserService.getCurrentLetter();
            })
            .then(function(letter) {
              updateCurrentLetter(letter);
            })
            .catch(function(error) {
              console.log('HomeController [openLetter] get new letter after delete: ' + error.code);
            });
          }
        }
      });
    };

    this.openLetterList = function() {
      var letterListModal = $modal.open({
        size: 'sm',
        templateUrl: 'app/home/letter.list.tpl.html',
        controller: 'LetterListController',
        controllerAs: 'letterListCtrl',
        resolve: {
          letters: function () {
            return letters;
          },
          currentLetter: function() {
            return self.currentLetter;
          }
        }
      });

      letterListModal.result
      .then(function(selectedLetterId) {
        if (selectedLetterId !== self.currentLetter.$id) {
          // Changed letter
          return UserService.setCurrentLetterId(selectedLetterId)
          .then(function() {
            return UserService.getCurrentLetter();
          })
          .then(function(letter) {
            updateCurrentLetter(letter);
          })
          .catch(function(error) {
            console.log('HomeController [openLetterList] could not change letter: ' + error.code);
          });
        }
      });
    };

    this.openSnippet = function(id) {
      $modal.open({
        templateUrl: 'app/home/snippet.tpl.html',
        controller: 'SnippetController',
        controllerAs: 'snippetCtrl',
        resolve: {
          currentLetter: function() {
            return self.currentLetter;
          },
          snippetId: function() {
            return id;
          }
        }
      });
    };

    this.enableSnippet = function(snippetId, state) {
      self.currentLetter.enableSnippet(snippetId, state)
      .catch(function(error) {
        console.log('HomeController [toggleSnippet] could not set snippet state: ' + error);
      });
    };

    this.dndSnippet = {
      splice: function(dropIndex, dummy, object) {
        var dragIndex = self.snippetData.$indexFor(object.$id);

        if (dragIndex < dropIndex) {
          // Moving down, compensate as original element isn't removed but modified
          dropIndex--;
        }

        self.snippetData[dragIndex].$priority = dropIndex;
        self.snippetData.$save(dragIndex);

        if (dragIndex > dropIndex) {
          // Moving up
          while (self.snippetData[dropIndex] && dropIndex !== dragIndex ){
            self.snippetData[dropIndex].$priority = dropIndex + 1;
            self.snippetData.$save(dropIndex);
            dropIndex++;
          }
        } else if (dragIndex < dropIndex) {
          // Moving down
          while (self.snippetData[dropIndex] && dropIndex !== dragIndex ){
            self.snippetData[dropIndex].$priority = dropIndex - 1;
            self.snippetData.$save(dropIndex);
            dropIndex--;
          }
        }
      }
    };

    this.copyAsMarkdown = function(snippet) {
      return $filter('tagFill')(snippet, this.values);
    };

    this.copyAsHTML = function(snippet) {
      return $filter('ngMarkdown')(this.copyAsMarkdown(snippet));
    };

    this.copyNotice = false;

    this.copyEnabledAsHTML = function() {
      var text = '';
      angular.forEach(self.currentLetter.snippets, function(snippet) {
        if (snippet.enabled) {
          text += this.copyAsHTML(snippet);
        }
      }, this);

      $timeout(function() {
        self.copyNotice = true;
      }, 0);

      $timeout(function() {
        self.copyNotice = false;
      }, 1000);

      return text;
    };
  }]);

}());
(function () {
  'use strict';

  angular.module('home', ['auth.service', 'user', 'home.ctrl'])

  .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
    $stateProvider
    .state('home', {
      abstract: true,
      url: '/home',
      template: '<div id="home-content" ui-view></div>',
      contoller: function($state) {
        $state.go('home.home');
      },
      resolve: {
        requireAuth: ['requireAuth', function(requireAuth) {
          return requireAuth();
        }],
        letters: ['UserService', function(UserService) {
          return UserService.getLetters();
        }]
      }
    })
    .state('home.home', {
      url: '',
      templateUrl: 'app/home/home.tpl.html',
      controller: 'HomeController',
      controllerAs: 'homeCtrl',
      resolve: {
        currentLetter: ['UserService', function(UserService) {
          return UserService.getCurrentLetter();
        }]
      }
    });
  }]);

}());
(function () {
  'use strict';

  angular.module('letter.edit.ctrl', ['user.service'])

  .controller('LetterEditController', ['editLetter', 'letters', 'UserService', '$modalInstance', function(editLetter, letters, UserService, $modalInstance) {
    var self = this;
    this.edit = !!editLetter;

    this.org = {
      title: ''
    };

    if (this.edit) {
      if (editLetter === null) {
        console.warn('LetterEditController [modal] Letter not available. Letter was %o', editLetter);
        $modalInstance.close();
      } else {
        this.org = editLetter;
      }
    }

    this.letter = angular.copy(this.org);

    this.addLetter = function() {
      letters.$add(this.letter)
      .then(function(ref) {
        $modalInstance.close(ref.key());
      })
      .catch(function(error) {
        console.log('LetterEditController [addLetter] failed. Letter was %o and error was ' + error.code, self.letter);
      });
    };

    this.saveLetter = function () {
      editLetter.setTitle(this.letter.title)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.log('LetterEditController [saveLetter] failed. Letter was %o and error was ' + error.code, self.letter);
      });
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };

    this.delete = function() {
      var id = editLetter.$id;
      UserService.deleteLetter(id)
      .catch(function(error) {
        console.warn('LetterEditController [delete] failed. Letter was %o and error was ' + error, self.org);
      })
      .then(function() {
        $modalInstance.close(id);
      });
    };
  }]);

}());
(function () {
  'use strict';

  angular.module('letter.list.ctrl', ['letter.edit.ctrl', 'user'])

  .controller('LetterListController', ['letters', 'currentLetter', 'UserService', '$modal', '$modalInstance', function(letters, currentLetter, UserService, $modal, $modalInstance) {
    this.letters = letters;
    this.currentLetter = currentLetter;

    this.selectLetter = function(id) {
      $modalInstance.close(id);
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };
  }]);

}());
(function () {
  'use strict';

  angular.module('snippet.ctrl', ['ngTagsInput'])

  .controller('SnippetController', ['currentLetter', 'snippetId', '$scope', '$modalInstance', function(currentLetter, snippetId, $scope, $modalInstance) {
    var self = this;
    this.edit = angular.isDefined(snippetId);

    this.org = {
      variables : [],
      enabled: true
    };

    if (this.edit) {
      this.org = currentLetter.snippets[snippetId];
      if (this.org === null) {
        console.warn('SnippetController [modal] Snippet not available. ID was ' + snippetId);
        $modalInstance.close();
      }
    }

    this.snippet = angular.copy(this.org);
    this.snippet.variables = angular.copy(this.org.variables);
    this.tagsChanged = false;

    this.tagMod = function() {
      this.tagsChanged = !angular.equals(this.org.variables, this.snippet.variables);
    };

    this.addSnippet = function () {
      currentLetter.addSnippet(this.snippet)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.log('SnippetController [addSnippet] failed. Snippet was %o and error was ' + error.code, self.snippet);
      });
    };

    this.saveSnippet = function () {
      currentLetter.saveSnippet(snippetId, this.snippet)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.log('SnippetController [saveSnippet] failed. Snippet was %o and error was ' + error.code, self.snippet);
      });
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };

    this.delete = function() {
      currentLetter.removeSnippet(snippetId)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.warn('SnippetController [delete] failed. Snippet was %o and error was ' + error.code, self.snippet);
      });
    };
  }]);

}());
(function () {
	/* jshint -W121 */

	'use strict';

	angular.module('common', ['common.config', 'common.firebase.factory', 'common.filters']);
	String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
	};

}());
(function () {
	'use strict';

	angular.module('common.config', [])
	.constant('FB', 'https://snippetmanager.firebaseio.com/');

}());
(function () {
  'use strict';


  angular.module('common.filters', [])

  .filter('tagFill', function () {
    return function(snippet, values) {
      var text = snippet.content;
      var newText = text;
      for (var variableIndex in snippet.variables) {
        if (snippet.variables.hasOwnProperty(variableIndex)) {

          var variable = snippet.variables[variableIndex];
          if (values.hasOwnProperty(variable.tag) && values[variable.tag].length > 0) {
            newText = newText.replace(new RegExp(variable.tag, 'g'), values[variable.tag]);
          } else if (variable.placeholder && variable.placeholder.length > 0) {
            newText = newText.replace(new RegExp(variable.tag, 'g'), '(' + variable.placeholder + ')');
          }
        }
      }

      return newText;
    };
  })

  .filter('html', ['$sce', function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    };
  }]);

}());
(function() {
	'use strict';

	angular.module('common.firebase.factory', ['firebase'])

	.factory('FirebaseFactory', ['FB', '$q', '$firebase', function(FB, $q, $firebase) {
		var baseRef = new Firebase(FB);

		var ret = {
			delete: function(path) {
				var deferred = $q.defer();

				var ref = baseRef.child(path);
				ref.set({}, function(error) {
					if (error) {
						console.warn('FirebaseFactory [delete] of ' + path + ' failed: %o', error);
						deferred.reject('FirebaseFactory [delete] of ' + path + ' failed with error code ' + error.code);
					} else {
						deferred.resolve();
					}
				});

				return deferred.promise;
			},

			getOnce: function(path) {
				var deferred = $q.defer();

				var ref = baseRef.child(path);
				ref.once('value', function(data) {
					deferred.resolve(data.val());
				}, function(error) {
					console.warn('FirebaseFactory [getOnce] of ' + path + ' failed: %o', error);
					deferred.reject('FirebaseFactory [getOnce] of ' + path + ' failed with error code ' + error.code);
				});

				return deferred.promise;
			},

			getAsArray: function(path, config) {
				var ref = baseRef.child(path);

				return $firebase(ref, config).$asArray();
			},

			getAsObject: function(path, config) {
				var ref = baseRef.child(path);

				return $firebase(ref, config).$asObject();
			},

			set: function(path, object) {
				var deferred = $q.defer();

				var ref = baseRef.child(path);
				ref.set(object, function(error) {
					if (error) {
						console.warn('FirebaseFactory [set] of ' + path + ' failed: %o', error);
						deferred.reject('FirebaseFactory [set] of ' + path + ' failed with error code ' + error.code);
					} else {
						deferred.resolve();
					}
				});

				return deferred.promise;
			},

			update: function(path, object) {
				var deferred = $q.defer();

				var sync = $firebase(baseRef.child(path));
				sync.$update(object)
				.then(function(ref) {
					deferred.resolve(ref.key());
				}, function(error) {
					console.warn('FirebaseFactory [update] of %o to ' + path + ' failed: %o', object, error);
					deferred.reject('FirebaseFactory [update] of %o to ' + path + ' failed with error code ' + error.code, object);
				});

				return deferred.promise;
			},

			push: function(path, object) {
				var deferred = $q.defer();

				var sync = $firebase(baseRef.child(path));
				sync.$push(object)
				.then(function(ref) {
					deferred.resolve(ref.key());
				}, function(error) {
					console.warn('FirebaseFactory [push] of %o to ' + path + ' failed: %o', object, error);
					deferred.reject('FirebaseFactory [push] of %o to ' + path + ' failed with error code ' + error.code, object);
				});

				return deferred.promise;
			}
		};

		return ret;
	}])

	.factory('ObjectCache', ['$firebase', function ($firebase) {
		return function (ref) {
			var cached = {};

			// Fills cache with
			cached.$init = function() {
				ref.on('child_added', function(snapshot) {
					cached.$load(snapshot.key());
				});
			};

			// Load object into cache
			cached.$load = function (id) {
				if( !cached.hasOwnProperty(id) ) {
					cached[id] = $firebase(ref.child(id)).$asObject();
				}

				return cached[id];
			};

			// Frees memory and stops listening on objects.
			// Use this when you switch views in your SPA and no longer need this list.
			cached.$dispose = function () {
				angular.forEach(cached, function (object) {
					object.$destroy();
				});
			};

			// Removes an object, both form cache and on Firebase
			cached.$remove = function(id) {
				delete cached[id];
				ref.child(id).remove();
			};

			return cached;
		};
	}]);

}());
(function() {
  'use strict';

  angular.module('menu.controller', ['common', 'auth'])
  .controller('MenuController', ['$state', '$modal', 'AuthService', 'loginState', function ($state, $modal, AuthService, loginState) {
    this.name = '';

    var self = this;
    AuthService.watch(function(authData) {
      if (authData) {
        if (authData.provider === 'password') {
          self.name = authData.password.email;
        } else if (authData.provider === 'facebook' || authData.provider === 'twitter' || authData.provider === 'google') {
          self.name = authData[authData.provider].displayName;
        } else {
          self.name = '';
        }
      } else {
        self.name = '';
      }
    });

    this.openAuth = function() {
      if ($state.current.name !== loginState) {
        $modal.open({
          size: 'sm',
          templateUrl: 'app/auth/auth.modal.tpl.html',
          controller: 'AuthController',
          controllerAs: 'authCtrl',
          resolve: {
            'auth': ['AuthService', function(AuthService) {
              return AuthService.getAuth();
            }],
            'signup': function() {
              return false;
            }
          }
        });
      }
    };

  }]);

}());
(function () {
  'use strict';

  angular.module('menu.directive', ['menu.controller'])
  .directive('siteMenu', function() {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: 'app/menu/menu.tpl.html',
      controller: 'MenuController',
      controllerAs: 'menuCtrl'
    };
  });

}());
(function () {
  'use strict';

  angular.module('menu', ['menu.directive', 'menu.controller']);

}());
(function() {
  'use strict';

  angular.module('letter', ['auth', 'common'])

  .factory('LetterFactory', ['$FirebaseArray', 'Letter', function($FirebaseArray, Letter) {
    return $FirebaseArray.$extendFactory({
      $$added: function(snap) {
        return new Letter(snap);
      },

      $$updated: function(snap) {
        var msg = this.$getRecord(snap.key());
        return msg.update(snap);
      }
    });
  }])

  .factory('Letter', ['AuthService', '$firebaseUtils', 'FirebaseFactory', function(AuthService, $firebaseUtils, FirebaseFactory) {
    function Letter(snap) {
      this.$id = snap.key();
      this.update(snap);
    }

    Letter.prototype = {
      update: function(snap) {
        return $firebaseUtils.updateRec(this, snap);
      },

      setTitle: function(title) {
        return FirebaseFactory.update('/users/' + AuthService.uid() + '/letters/' + this.$id, {
          title: title
        });
      },

      addSnippet: function(snippet) {
        angular.extend(snippet, {
          '.priority': this.noSnippets()
        });
        return FirebaseFactory.push('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/', snippet);
      },

      enableSnippet: function(snippetId, state) {
        return FirebaseFactory.update('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/' + snippetId, {
          enabled: state
        });
      },

      removeSnippet: function(snippetId) {
        return FirebaseFactory.delete('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/' + snippetId);
      },

      saveSnippet: function(snippetId, snippet) {
        return FirebaseFactory.update('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/' + snippetId, snippet);
      },

      getSnippets: function() {
        return FirebaseFactory.getAsArray('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/');
      },

      noSnippets: function() {
        if (!this.snippets) {
          return 0;
        }

        return Object.keys(this.snippets).length;
      }
    };

    return Letter;
  }]);

}());
(function () {
	'use strict';

	angular.module('user.controller', ['user.service', 'user.lang', 'auth.directives', 'auth.service'])

	.controller('UserController', ['UserLanguage', 'AuthService', function(UserLanguage, AuthService) {
		this.lang = UserLanguage;
		this.provider = AuthService.provider;
	}])

	.controller('UserDeleteController', ['$scope', '$timeout', 'UserService', 'UserLanguage', 'AuthService', function($scope, $timeout, UserService, UserLanguage, AuthService) {
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
				self.success = true;
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
	}])

	.controller('ChangePasswordController', ['$scope', '$timeout', 'UserLanguage', 'AuthService', function($scope, $timeout, UserLanguage, AuthService) {
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
	}]);

}());
(function () {
	'use strict';

	angular.module('user.lang', [])

	.factory('UserLanguage', function() {
		var strings = {
			// Common
			title: 'Account',

			working: 'Working',
			cancel: 'Cancel',
			passwordReq: 'Enter a password',
			passwordMin: 'The password must be at least 8 characters',
			passwordInvalid: 'Invalid password',
			networkError: 'Network error, try again',
			generalError: 'An unexpected error occurred',

			// Overview
			subtitle: 'Overview',

			// Delete account
			delete: 'Delete account',
			deletePrecaution: 'As a precaution, you have to enter your email and password to delete your account.',
			deleteAfter: 'After your account have been deleted, you will be redirected to the login page.',
			email: 'Email address',
			pass: 'Password',
			emailReq: 'Enter your email address',
			emailLike: 'This does not look like an email address',
			emailMatch: 'The entered email does not match the one you signed in with',
			emailInvalid: 'Invalid email address',
			userInvalid: 'This account does not exist',
			deleteSuccess: 'Account deleted',

			// Change password
			change: 'Change password',
			changePrecaution: 'As a precaution, you have to enter your current password.',
			oldPass: 'Current password',
			newPass1: 'New password',
			newPass2: 'Confirm new password',
			changeSuccess: 'Password changed'
		};

		return {
			get: function(key) {
				if (strings.hasOwnProperty(key)) {
					return strings[key];
				} else {
					console.error('UserLanguage: Missing translation for: ' + key);
					return 'Missing translation';
				}
			}
		};
	});

}());
(function() {
  'use strict';

  angular.module('user.service', ['common', 'auth', 'letter'])
  .factory('UserService', ['$q', 'FB', 'FirebaseFactory', 'AuthService', 'LetterFactory', function($q, FB, FirebaseFactory, AuthService, LetterFactory) {
    var version = 3;

    var base = '/users/';

    var uid = null;

    var upgrade1to2 = function(uid) {
      console.log('UserService upgrading to v2');
      var snippetsPath = '/users/' + uid + '/snippets';

      return FirebaseFactory.getOnce(snippetsPath)
      .then(function(data) {
        return FirebaseFactory.delete(snippetsPath)
        .then(function() {
          if (data !== null) {
            var snippets2 = FirebaseFactory.getAsArray(snippetsPath);
            for (var i = 0; i < data.length; i++) {
              snippets2.$add(data[i]);
            }
          }
        });
      })
      .then(function() {
        return FirebaseFactory.update(base + uid, {
          version: version
        });
      })
      .then(function() {
        console.log('Upgrade to v2 completed');
      })
      .catch(function(error) {
        console.error('Upgrade to v2 errored: %o', error);
        return $q.reject(new Error('Upgrade to v3 errored: ' + error));
      });
    };

    var upgrade2to3 = function(uid) {
      console.log('UserService upgrading to v3');
      var snippetsPath = '/users/' + uid + '/snippets';
      var lettersPath = '/users/' + uid + '/letters';

      return FirebaseFactory.getOnce(snippetsPath)
      .then(function(data) {
        if (data !== null) {
          return FirebaseFactory.push(lettersPath, {
            title: 'Example',
            snippets: data
          });
        }
      })
      .then(function() {
        return FirebaseFactory.delete(snippetsPath);
      })
      .then(function() {
        return FirebaseFactory.update(base + uid, {
          version: version
        });
      })
      .then(function() {
        console.log('Upgrade to v3 completed');
      })
      .catch(function(error) {
        console.error('Upgrade to v3 errored: %o', error);
        return $q.reject(new Error('Upgrade to v3 errored: ' + error));
      });
    };

    var load = function() {
      var deferred = $q.defer();

      AuthService.getAuth()
      .then(function(data) {
        if (uid === data.uid) {
          deferred.resolve();
        } else {
          uid = data.uid;

          return FirebaseFactory.getOnce(base + uid + '/version')
          .then(function(userVersion) {
            console.log('UserService got version: ' + userVersion);

            if (userVersion === null) {
              // No User data for this uid. Let's create it.
              return FirebaseFactory.set(base + uid, {
                version: version
              })
              .then(function() {
                deferred.resolve();
              });
            } else if (version !== userVersion) {
              if (angular.isNumber(userVersion)) {
                console.log('UserService will perform an upgrade from v' + userVersion + ' to v' + version);
                if (userVersion === 1) {
                  return upgrade1to2(uid)
                  .then(function() {
                    return upgrade2to3(uid);
                  });
                } else if (userVersion === 2) {
                  return upgrade2to3(uid);
                }
              } else {
                console.error('UserService: Version is not a number: ' + userVersion);
              }
            }
            //TODO: watch for version to change ?
          });
        }
      })
      .then(function() {
        // User ready
        deferred.resolve();
      })
      .catch(function(error) {
        deferred.reject('UserService [load] error ' + error.code);
      });

      return deferred.promise;
    };

    var cloneLetters = function() {
      return FirebaseFactory.getOnce(base + 'simplelogin:14/letters')
      .then(function(letters) {
        return FirebaseFactory.set(base + uid + '/letters', letters);
      })
      .then(function() {
        return FirebaseFactory.getOnce(base + 'simplelogin:14/currentLetterId');
      })
      .then(function(id) {
        return FirebaseFactory.update(base + uid, {
          currentLetterId: id
        })
        .then(function() {
          return id;
        });
      })
      .catch(function(error) {
        console.log('UserService [cloneLetters] error ' + error.code);
      });
    };

    var getNextLetterId = function() {
      // This will return a Letter ID that refers to an object that is guaranteed to exist.

      return service.getLetters()
      .then(function(asArray) {
        return asArray.$loaded();
      })
      .then(function(data) {
        if (data.length === 0) {
          // Clone example data
          return cloneLetters();
        } else {
          // Use first letter
          return data[0].$id;
        }
      })
      .then(function (nextLetterId) {
        return service.setCurrentLetterId(nextLetterId)
        .then(function() {
          return nextLetterId;
        });
      });
    };

    var service = {
      delete: function() {
        return load()
        .then(function() {
          return FirebaseFactory.delete(base + uid);
        });
      },

      getData: function() {
        return load()
        .then(function() {
          return FirebaseFactory.getAsObject(base + uid + '/data');
        });
      },

      getCurrentLetter: function() {
        return load()
        .then(function() {
          return FirebaseFactory.getOnce(base + uid + '/currentLetterId');
        })
        .then(function(letterId) {
          if (letterId === null) {
            // Not previously set
            return getNextLetterId()
            .then(function(nextLetterId) {
              return service.getLetter(nextLetterId);
            });
          } else {
            return service.getLetter(letterId)
            .then(function(letter) {
              if (letter === null) {
                // Letter dissapered
                return getNextLetterId()
                .then(function(nextLetterId) {
                  return service.getLetter(nextLetterId);
                });
              } else {
                // Letter found
                return letter;
              }
            });
          }
        });
      },

      setCurrentLetterId: function(id) {
        return load()
        .then(function() {
          return FirebaseFactory.update(base + uid, {
            currentLetterId: id
          });
        });
      },

      getLetters: function() {
        return load()
        .then(function() {
          return FirebaseFactory.getAsArray(base + uid + '/letters', {arrayFactory: LetterFactory});
        });
      },

      getLetter: function(id) {
        return service.getLetters()
        .then(function(asArray) {
          return asArray.$loaded();
        })
        .then(function(data) {
          var letter = data.$getRecord(id);
          console.log('Letter: %o', letter);
          return letter;
        });
      },

      deleteLetter: function(id) {
        return load()
        .then(function() {
          return FirebaseFactory.delete(base + uid + '/letters/' + id);
        });
      }
    };

    return service;
  }]);

}());
(function () {
  'use strict';

  angular.module('user', ['user.service', 'user.controller'])

  .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
    $stateProvider
    .state('user', {
      abstract: true,
      url: '/user',
      template: '<div ui-view></div>',
      contoller: function($state) {
        $state.go('user.user');
      },
      resolve: {
        requireAuth: ['requireAuth', function(requireAuth) {
          return requireAuth();
        }]
      }
    })
    .state('user.user', {
      url: '',
      templateUrl: 'app/user/user.tpl.html',
      controller: 'UserController',
      controllerAs: 'userCtrl'
    })
    .state('user.delete', {
      url: '/delete',
      templateUrl: 'app/user/user.delete.tpl.html',
      controller: 'UserDeleteController',
      controllerAs: 'udCtrl'
    })
    .state('user.password', {
      url: '/password',
      templateUrl: 'app/user/user.password.tpl.html',
      controller: 'ChangePasswordController',
      controllerAs: 'cpCtrl'
    });
  }]);

}());
(function () {
  'use strict';

  angular.module('welcome', ['menu'])

  .config(['$stateProvider', function($stateProvider) {
    $stateProvider
    .state('welcome', {
      url: '/welcome',
      templateUrl: 'app/welcome/welcome.tpl.html',
      controller: 'WelcomeController',
      controllerAs: 'welcomeCtrl'
    });
  }])

  .controller('WelcomeController', ['$filter', function($filter) {

    this.snippet = {
      content: 'Hello <b>NAME</b>! I can see that you are working for <b>COMPANY</b> and I thought you might be interested in our service. It makes it possible to use variables in snippets of text. It even supports Markdown and copy to clipboard as HTML.<br /><br /><br/> <b>NAME</b> when did I last tell you that you were awesome?',
      variables: [{
        tag: 'NAME',
        placeholder:'Your name'
      },{
        tag: 'COMPANY',
        placeholder:'Where you work'
      }]
    };

    this.copyAsMarkdown = function(snippet) {
      return $filter('tagFill')(snippet, this.values);
    };

    this.copyAsHTML = function(snippet) {
      return $filter('ngMarkdown')(this.copyAsMarkdown(snippet));
    };
  }]);

}());
//# sourceMappingURL=maps/app.js.map