(function() {
  'use strict';

  angular.module('user.loader.1', ['common'])
  .factory('UserLoader1', function($q) {
    var version = 1;

    var defaultUser = {
      displayName: ''
    };

    var loader = {
      getVersion: function() {
        return version;
      },

      user: angular.copy(defaultUser),

      clear: function() {
        loader.user = angular.copy(defaultUser);
      },

      upgrade: function(authData, userVersion) {
        var deferred = $q.defer();

        // UserLoader ensures the upgrade flow and passes the upgrade along to older versions if necessary
        deferred.reject('UserLoader1 [upgrade] of version ' + userVersion + ' is not possible as version ' + version + ' is the base version');

        return deferred.promise;
      },

      load: function(authData) {
        var deferred = $q.defer();

        console.log('UserLoader1 [load]ing user data');

        if (authData.provider === 'password') {
          loader.user.displayName = authData.password.email;
          deferred.resolve();
        } else if (authData.provider === 'facebook' || authData.provider === 'twitter' || authData.provider === 'google') {
          loader.user.displayName = authData[authData.provider].displayName;
          deferred.resolve();
        } else {
          deferred.reject('UserLoader1 [load]');
        }

        return deferred.promise;
      }
    };

    return loader;
  });

}());