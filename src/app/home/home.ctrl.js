(function () {
  'use strict';

  angular.module('home.ctrl', ['common.filters', 'letter.list.ctrl', 'snippet.ctrl', 'user'])

  .controller('HomeController', function(letters, currentLetter, $filter, $timeout, $modal) {
    this.letter = currentLetter;

    this.openLetterList = function() {
      $modal.open({
        templateUrl: 'app/home/letter.list.tpl.html',
        controller: 'LetterListController',
        controllerAs: 'letterListCtrl',
        resolve: {
          letters: function () {
            return letters;
          },
          currentLetter: function() {
            return currentLetter;
          }
        }
      });
    };

    this.openSnippet = function(id) {
      $modal.open({
        templateUrl: 'app/home/snippet.tpl.html',
        controller: 'SnippetController',
        controllerAs: 'snippetCtrl',
        resolve: {
          currentLetter: function() {
            return currentLetter;
          },
          snippetId: function() {
            return id;
          }
        }
      });
    };

    this.enableSnippet = function(snippetId, state) {
      currentLetter.enableSnippet(snippetId, state)
      .catch(function(error) {
        console.log('HomeController [toggleSnippet] could not set snippet state: ' + error);
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
      angular.forEach(currentLetter.snippets, function(snippet) {
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