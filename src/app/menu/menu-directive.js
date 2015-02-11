(function () {
  'use strict';

  angular.module('menu.directive', ['menu.controller'])
  .directive('siteMenu', function() {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: 'app/menu/menu.tpl.html',
      controller: 'MenuController',
      controllerAs: 'menuCtrl'
    };
  });

}());