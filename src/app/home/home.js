(function () {
  'use strict';

  angular.module('home', ['auth.service', 'user', 'home.ctrl', 'snippet.ctrl'])

  .config(function($urlRouterProvider, $stateProvider) {
    $stateProvider
    .state('home', {
      abstract: true,
      url: '/home',
      template: '<div id="home-content" ui-view></div>',
      contoller: function($state) {
        $state.go('home.home');
      },
      resolve: {
        requireAuth: function(requireAuth) {
          return requireAuth();
        },
        snippets: function(UserService) {
          return UserService.getSnippets();
        }
      }
    })
    .state('home.home', {
      url: '',
      templateUrl: 'app/home/home.tpl.html',
      controller: 'HomeController',
      controllerAs: 'homeCtrl'
    });
  });

}());