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

	angular.module('smApp', ['ngAnimate', 'templates', 'ui.router', 'analytics', 'auth', 'welcome', 'home', 'ngClipboard', 'ngMarkdown'])

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

	angular.module('auth.controller', ['auth.service'])

	.controller('AuthController', ['$state', 'AuthService', 'auth', function($state, AuthService, auth) {
		if (auth !== null) {
			$state.go('auth.redirect');
		}

		this.signup = false;

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

	angular.module('auth', ['ngMessages', 'auth.service', 'auth.controller', 'auth.directives'])

	.constant('welcomeNoAuthState', 'welcome')
	.constant('welcomeAuthState', 'home.home')

	.config(['$urlRouterProvider', '$stateProvider', 'welcomeNoAuthState', 'welcomeAuthState', function($urlRouterProvider, $stateProvider, welcomeNoAuthState, welcomeAuthState) {
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
		.state('auth.login', {
			url: '/login',
			templateUrl: 'app/auth/auth.tpl.html',
			controller: 'AuthController',
			controllerAs: 'authCtrl'
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
			controller: ['$state', function($state) {
				$state.go('auth.authenticating');
			}]
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

	.run(['$rootScope', '$state', 'welcomeAuthState', 'AuthService', function($rootScope, $state, welcomeAuthState, AuthService) {
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
	}]);

}());
(function () {
  'use strict';

  angular.module('home', ['auth.service', 'common', 'user', 'ui.bootstrap', 'ngTagsInput'])

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
        snippets: ['UserService', function(UserService) {
          return UserService.getSnippets();
        }]
      }
    })
    .state('home.home', {
      url: '',
      templateUrl: 'app/home/home.tpl.html',
      controller: 'HomeController',
      controllerAs: 'homeCtrl'
    });
  }])

  .controller('HomeController', ['snippets', '$modal', '$filter', '$timeout', function(snippets, $modal, $filter, $timeout) {
    this.snippets = snippets;

    this.openSnippet = function(id) {
      $modal.open({
        templateUrl: 'app/home/snippet.modal.tpl.html',
        controller: 'SnippetController',
        controllerAs: 'snippetCtrl',
        resolve: {
          snippets: function () {
            return snippets;
          },
          snippetId: function() {
            return id;
          }
        }
      });
    };

    this.toggleSnippet = function(snippet) {
      snippet.enabled = !!snippet.enabled;
      snippets.$save(snippet)
      .catch(function(error) {
        console.log('HomeController [toggleSnippet] could not save snippet: ' + error);
      });
    };

    this.copyAsMarkdown = function(snippet) {
      return $filter('tagFill')(snippet, this.values);
    };

    this.copyAsHTML = function(snippet) {
      return $filter('ngMarkdown')(this.copyAsMarkdown(snippet));
    };

    this.copyNotice = false;
    var self = this;

    this.copyEnabledAsHTML = function() {
      var text = '';
      angular.forEach(snippets, function(snippet) {
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
  }])

  .controller('SnippetController', ['snippets', 'snippetId', '$scope', '$modalInstance', function(snippets, snippetId, $scope, $modalInstance) {
    this.edit = angular.isDefined(snippetId);

    this.org = {
      variables : [],
      enabled: true
    };

    if (this.edit) {
      this.org = snippets.$getRecord(snippetId);
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
      snippets.$add(this.snippet);
      $modalInstance.close();
    };

    this.saveSnippet = function () {
      angular.extend(this.org, this.snippet);
      snippets.$save(this.org)
      .catch(function(error) {
        console.log('SnippetController [saveSnippet] could not save item: ' + error);
      })
      .finally(function() {
        $modalInstance.close();
      });
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };

    this.delete = function() {
      snippets.$remove(this.org)
      .catch(function(error) {
        console.warn('SnippetController [delete] Could not delete snippet. Snippet was ' + this.org + ' and error was ' + error.code);
      })
      .then(function() {
        $modalInstance.close();
      });
    };
  }]);

}());
(function() {
  'use strict';

  angular.module('menu.controller', ['common', 'auth'])
  .controller('MenuController', ['AuthService', function (AuthService) {
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

			getAsArray: function(path) {
				var ref = baseRef.child(path);

				return $firebase(ref).$asArray();
			},

			getAsObject: function(path) {
				var ref = baseRef.child(path);

				return $firebase(ref).$asObject();
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

				var ref = baseRef.child(path);
				ref.update(object, function(error) {
					if (error) {
						console.warn('FirebaseFactory [update] of ' + path + ' failed: %o', error);
						deferred.reject('FirebaseFactory [update] of ' + path + ' failed with error code ' + error.code);
					} else {
						deferred.resolve();
					}
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
(function() {
  'use strict';

  angular.module('user.service', ['common', 'auth'])
  .factory('UserService', ['$q', 'FB', 'FirebaseFactory', 'AuthService', function($q, FB, FirebaseFactory, AuthService) {
    var version = 2;

    var base = '/users/';

    var uid = null;

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
                console.log('UserService perform upgrade from v ' + userVersion + ' to v ' + version);
                if (userVersion === 1) {
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
                    console.log('Upgrade completed');
                  })
                  .catch(function(error) {
                    console.error('Upgrade errored: %o', error);
                    return $q.reject(new Error('Upgrade errored: ' + error));
                  });
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

    var service = {
      getData: function() {
        return load()
        .then(function() {
          return FirebaseFactory.getAsObject(base + uid + '/data');
        });
      },

      getSnippets: function() {
        return load()
        .then(function() {
          return FirebaseFactory.getAsArray(base + uid + '/snippets');
        });
      }
    };

    return service;
  }]);

}());
(function () {
  'use strict';

  angular.module('user', ['user.service']);

}());
//# sourceMappingURL=maps/app.js.map