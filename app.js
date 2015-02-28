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

	angular.module('auth.controller', ['auth.service'])

	.controller('AuthController', ['$state', 'AuthService', 'signup', 'auth', function($state, AuthService, signup, auth) {
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
			.catch(function(error) {
				errorHandler(error);
			});
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
			controllerAs: 'authCtrl',
			resolve: {
				'signup': function() {
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

  angular.module('home.ctrl', ['common.filters', 'letter.list.ctrl', 'snippet.ctrl', 'user'])

  .controller('HomeController', ['letters', 'currentLetter', '$scope', '$filter', '$timeout', 'UserService', '$modal', function(letters, currentLetter, $scope, $filter, $timeout, UserService, $modal) {
    this.currentLetter = currentLetter;
    var self = this;

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
        if (selectedLetterId === true) {
          // Deleted letter
          return UserService.setCurrentLetterId(null)
          .then(function() {
            return UserService.getCurrentLetter();
          })
          .then(function(letter) {
            self.currentLetter = letter;
          })
          .catch(function(error) {
            console.log('HomeController [openLetterList] could not set current letter: ' + error.code);
          });
        } else if (selectedLetterId !== self.currentLetter.$id) {
          // Changed letter
          return UserService.setCurrentLetterId(selectedLetterId)
          .then(function() {
            return UserService.getCurrentLetter();
          })
          .then(function(letter) {
            self.currentLetter = letter;
          })
          .catch(function(error) {
            console.log('HomeController [openLetterList] could not set current letter: ' + error.code);
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
      //letters.$remove(id)
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
          $modalInstance.close(letterId);
        } else {
          // Deleted letter
          if (currentLetter.$id === letterId) {
            // Deleting current letter
            $modalInstance.close(true);
          }
        }
      });
    };

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
      }
    };

    return Letter;
  }]);

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

    var getNextLetterId = function() {
      // This will return a Letter ID that refers to an object that is guaranteed to exist.

      return service.getLetters()
      .then(function(asArray) {
        return asArray.$loaded();
      })
      .then(function(data) {
        if (data.length === 0) {
          // Create new example letter
          return FirebaseFactory.push(base + uid + '/letters', {
            title: 'Meeting example'
          })
          .then(function(letterId) {
            return FirebaseFactory.push(base + uid + '/letters/' + letterId + '/snippets/', {
              title: 'Header',
              enabled: true,
              content: '# Dear NAME\nPlease help me get my nephews back from VILLIAN.',
              variables: [{
                tag: 'NAME'
              },{
                tag: 'VILLIAN'
              }]
            })
            .then(function() {
              return FirebaseFactory.push(base + uid + '/letters/' + letterId + '/snippets/', {
                title: 'Remember',
                enabled: true,
                content: 'Remember to bring the secret WEAPON to defeat VILLIAN.',
                variables: [{
                  tag: 'WEAPON'
                },{
                  tag: 'VILLIAN'
                }]
              });
            })
            .then(function() {
              return FirebaseFactory.push(base + uid + '/letters/' + letterId + '/snippets/', {
                title: 'Meet',
                enabled: false,
                content: 'Let us meet up at LOCATION at TIME.',
                variables: [{
                  tag: 'LOCATION'
                },{
                  tag: 'TIME'
                }]
              });
            })
            .then(function() {
              return FirebaseFactory.push(base + uid + '/letters/' + letterId + '/snippets/', {
                title: 'Click me !',
                enabled: false,
                content: '### Snipp\'it\nA letter consists of snippets. A snippet has a template text and some keywords that replaces said keywords in the text. Try it out by entering a word HERE!',
                variables: [{
                  tag: 'HERE'
                }]
              });
            })
            .then(function() {
              return FirebaseFactory.push(base + uid + '/letters/' + letterId + '/snippets/', {
                title: 'Footer',
                enabled: true,
                content: '### Regards\n\nDonald Duck\n1113 Quack Street\nDuckburg'
              });
            })
            .then(function() {
              return letterId;
            });
          });
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

  angular.module('user', ['user.service']);

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