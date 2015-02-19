(function() {
  'use strict';

  angular.module('menu.controller', ['common', 'auth'])
  .controller('MenuController', function (AuthService) {
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

  });

}());