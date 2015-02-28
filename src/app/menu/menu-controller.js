(function() {
  'use strict';

  angular.module('menu.controller', ['common', 'auth'])
  .controller('MenuController', function ($state, $modal, AuthService, loginState) {
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
            'auth': function(AuthService) {
              return AuthService.getAuth();
            },
            'signup': function() {
              return false;
            }
          }
        });
      }
    };

  });

}());