(function () {
  'use strict';

  angular.module('welcome', ['menu'])

  .config(function($stateProvider) {
    $stateProvider
    .state('welcome', {
      url: '/welcome',
      templateUrl: 'app/welcome/welcome.tpl.html'
    });
  });

}());