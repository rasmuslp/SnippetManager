(function () {
  'use strict';

  angular.module('user', ['user.service', 'user.controller'])

  .config(function($urlRouterProvider, $stateProvider) {
    $stateProvider
    .state('user', {
      abstract: true,
      url: '/user',
      template: '<div ui-view></div>',
      contoller: function($state) {
        $state.go('user.user');
      },
      resolve: {
        requireAuth: function(requireAuth) {
          return requireAuth();
        }
      }
    })
    .state('user.user', {
      url: '',
      templateUrl: 'app/user/user.tpl.html',
      controller: 'UserController',
      controllerAs: 'userCtrl'
    })
    .state('user.delete', {
      url: '/delete',
      templateUrl: 'app/user/user.delete.tpl.html',
      controller: 'UserDeleteController',
      controllerAs: 'udCtrl'
    })
    .state('user.password', {
      url: '/password',
      templateUrl: 'app/user/user.password.tpl.html',
      controller: 'ChangePasswordController',
      controllerAs: 'cpCtrl'
    });
  });

}());