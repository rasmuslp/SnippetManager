(function () {
  'use strict';

  angular.module('home.ctrl', ['common.filters'])

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
  });

}());