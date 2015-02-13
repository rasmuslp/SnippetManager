(function() {
  'use strict';

  angular.module('user', ['common', 'auth'])
  .factory('UserService', function($q, FB, FirebaseFactory, AuthService) {
    var base = '/users/';

    var defaultUser = {
      displayName: ''
    };

    AuthService.watch(function(authData) {
      if (authData) {
        console.log('UserService [watch auth] got auth');
        if (authData.provider === 'password') {
          service.user.displayName = authData.password.email;
        } else if (authData.provider === 'facebook' || authData.provider === 'twitter' || authData.provider === 'google') {
          service.user.displayName = authData[authData.provider].displayName;
        } else {
          service.user.displayName = 'Menu';
        }
      } else {
        console.log('UserService [watch auth] no auth');
        service.user = angular.copy(defaultUser);
      }
    });

    var service = {
      user: angular.copy(defaultUser),

      getData: function() {
        return FirebaseFactory.getAsObject(base + AuthService.uid());
      }
    };

    return service;
  });

}());