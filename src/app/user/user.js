(function() {
  'use strict';

  angular.module('user', ['common', 'auth', 'user.loader.1'])
  .factory('UserService', function($q, FB, FirebaseFactory, AuthService, UserLoader1) {
    var UserLoader = UserLoader1;

    var base = '/users/';

    AuthService.watch(function(authData) {
      if (authData) {
        FirebaseFactory.getOnce(base + authData.uid + '/version')
        .then(function(version) {
          console.log('UserService [watch auth] Got version: ' + version);

          if (version === null) {
            // No User data for this uid. Let's create it.
            return FirebaseFactory.set(base + authData.uid, {
              version: UserLoader.getVersion()
            });
          } else if (version !== UserLoader.getVersion()) {
            // Perform an upgrade
            return UserLoader.upgrade(authData, version);
          }
        })
        .then(function() {
          return UserLoader.load(authData);

          //TODO: watch for version to change
        })
        .catch(function(error) {
          console.log('UserService [watch auth] error: %o', error);
        });
      } else {
        console.log('UserService [watch auth] no auth');
      }
    });

    var service = {
      user: UserLoader.user
    };

    return service;
  });

}());