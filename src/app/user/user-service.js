(function() {
  'use strict';

  angular.module('user.service', ['common', 'auth', 'letter'])
  .factory('UserService', function($q, FB, FirebaseFactory, AuthService, LetterFactory) {
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
  });

}());