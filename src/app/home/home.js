(function () {
  'use strict';

  angular.module('home', ['auth.service', 'common', 'user', 'ui.bootstrap'])

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
  })

  .controller('HomeController', function(snippets, $modal, $filter, $timeout) {
    this.snippets = snippets;

    this.openSnippet = function(id) {
      $modal.open({
        templateUrl: 'app/home/snippet.modal.tpl.html',
        controller: 'SnippetController',
        controllerAs: 'snippetCtrl',
        resolve: {
          snippets: function () {
            return snippets;
          },
          snippetId: function() {
            return id;
          }
        }
      });
    };

    this.deleteSnippet = function(snippet) {
      snippets.$remove(snippet)
      .catch(function(error) {
        console.warn('HomeController [delete] Could not delete snippet. Snippet was ' + snippet + ' and error was ' + error.code);
      });
    };

    this.copyAsMarkdown = function(snippet) {
      return $filter('tagFill')(snippet, this.values);
    };

    this.copyAsHTML = function(snippet) {
      return $filter('ngMarkdown')(this.copyAsMarkdown(snippet));
    };

    this.copyNotice = false;
    var self = this;

    this.copyEnabledAsHTML = function() {
      var text = '';
      angular.forEach(snippets, function(snippet) {
        if (snippet.enabled) {
          text += this.copyAsHTML(snippet);
        }
      }, this);

      $timeout(function() {
        self.copyNotice = true;
      }, 0);

      $timeout(function() {
        self.copyNotice = false;
      }, 1000);

      return text;
    };
  })

  .controller('SnippetController', function(snippets, snippetId, $scope, $modalInstance) {
    this.edit = angular.isDefined(snippetId);

    this.snippet = {
      variables : []
    };

    if (this.edit) {
      this.snippet = snippets.$getRecord(snippetId);
      if (this.snippet === null) {
        console.warn('SnippetController [modal] Snippet not available. ID was ' + snippetId);
        $modalInstance.close();
      }
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
      snippets.$add(this.snippet);
      $modalInstance.close();
    };

    this.saveSnippet = function () {
      snippets.$save(this.snippet)
      .catch(function(error) {
        console.log('EditController [submit] could not save item: ' + error);
      })
      .finally(function() {
        $modalInstance.close();
      });
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };
  });

}());