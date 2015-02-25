(function () {
  'use strict';

  angular.module('home', ['auth.service', 'user', 'home.ctrl'])

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
        letters: function(UserService) {
          return UserService.getLetters();
        }
      }
    })
    .state('home.home', {
      url: '',
      templateUrl: 'app/home/home.tpl.html',
      controller: 'HomeController',
      controllerAs: 'homeCtrl',
      resolve: {
        currentLetter: function(UserService) {
          return UserService.getCurrentLetter();
        }
      }
    });
  });

}());