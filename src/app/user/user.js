(function() {
  'use strict';

  angular.module('user', ['common', 'auth'])
  .factory('UserService', function($q, FB, FirebaseFactory, AuthService, $firebase) {
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

      getUserData: function() {
        var authData = AuthService.getAuthSync();
        service.user.data = $firebase(new Firebase(FB + base + authData.uid)).$asObject();

        return service.user.data;
      }
    };

    return service;
  });

}());