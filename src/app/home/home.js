(function () {
  'use strict';

  angular.module('home', ['auth.service', 'common', 'user', 'ui.bootstrap', 'ngTagsInput'])

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

    this.toggleSnippet = function(snippet) {
      snippet.enabled = !!snippet.enabled;
      snippets.$save(snippet)
      .catch(function(error) {
        console.log('HomeController [toggleSnippet] could not save snippet: ' + error);
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

    this.org = {
      variables : [],
      enabled: true
    };

    if (this.edit) {
      this.org = snippets.$getRecord(snippetId);
      if (this.org === null) {
        console.warn('SnippetController [modal] Snippet not available. ID was ' + snippetId);
        $modalInstance.close();
      }
    }

    this.snippet = angular.copy(this.org);
    this.snippet.variables = angular.copy(this.org.variables);
    this.tagsChanged = false;

    this.tagMod = function() {
      this.tagsChanged = !angular.equals(this.org.variables, this.snippet.variables);
    };

    this.addSnippet = function () {
      snippets.$add(this.snippet);
      $modalInstance.close();
    };

    this.saveSnippet = function () {
      angular.extend(this.org, this.snippet);
      snippets.$save(this.org)
      .catch(function(error) {
        console.log('SnippetController [saveSnippet] could not save item: ' + error);
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

    this.delete = function() {
      snippets.$remove(this.org)
      .catch(function(error) {
        console.warn('SnippetController [delete] Could not delete snippet. Snippet was ' + this.org + ' and error was ' + error.code);
      })
      .then(function() {
        $modalInstance.close();
      });
    };
  });

}());