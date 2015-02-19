(function() {
  'use strict';

  angular.module('user.service', ['common', 'auth'])
  .factory('UserService', function($q, FB, FirebaseFactory, AuthService) {
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
  });

}());