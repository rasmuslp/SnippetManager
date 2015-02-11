(function() {
  'use strict';

  angular.module('menu.controller', ['common', 'auth', 'user'])
  .controller('MenuController', function (UserService) {
    this.user = UserService.user;
  });

}());