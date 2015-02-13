(function () {
  'use strict';

  angular.module('home', ['auth.service', 'user', 'ui.bootstrap', 'ngClipboard'])

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
        user: function(UserService) {
          return UserService.getData();
        }
      }
    })
    .state('home.home', {
      url: '',
      templateUrl: 'app/home/home.tpl.html',
      controller: 'HomeController',
      controllerAs: 'homeCtrl'
    });
  })

  .config(function(ngClipProvider) {
    ngClipProvider.setPath('assets/ZeroClipboard.swf');
  })

  .filter('newlines', function () {
    return function(text, values) {
      var newText = text;
      for (var value in values) {
        if(values.hasOwnProperty(value)) {
          newText = newText.replace(new RegExp(value, 'g'), values[value]);
        }
      }
      return newText;
    };
  })

  .controller('HomeController', function(user, $modal) {
    this.user = user;

    this.openSnippet = function(index) {
      $modal.open({
        templateUrl: 'app/home/snippet.modal.tpl.html',
        controller: 'SnippetController',
        controllerAs: 'snippetCtrl',
        resolve: {
          user: function () {
            return user;
          },
          snippetIndex: function() {
            return index;
          }
        }
      });
    };

    this.deleteSnippet = function(snippetIndex) {
      this.user.snippets.splice(snippetIndex, 1);
      this.user.$save();
    };

  })

  .controller('SnippetController', function(user, snippetIndex, $scope, $modalInstance) {
    this.edit = angular.isDefined(snippetIndex);

    this.snippet = {
      variables : []
    };

    if (this.edit) {
      this.snippet = user.snippets[snippetIndex];
    }

    this.newVariable = '';

    this.addVariable = function () {
      this.snippet.variables = this.snippet.variables || [];
      this.snippet.variables.push({
        tag: this.newVariable
      });

      this.newVariable = '';
    };

    this.addSnippet = function () {
      if (angular.isUndefined(user.snippets)) {
        user.snippets = [];
      }

      user.snippets.push(this.snippet);
      user.$save();
      $modalInstance.close();
    };

    this.saveSnippet = function () {
      user.snippets[snippetIndex] = this.snippet;
      user.$save().then(function() {
        console.log('saved');
      }, function(error) {
        console.log('Error:', error);
      });
      $modalInstance.close();
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };
  });

}());