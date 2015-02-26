(function () {
  'use strict';

  angular.module('home.ctrl', ['common.filters', 'letter.list.ctrl', 'snippet.ctrl', 'user'])

  .controller('HomeController', function(letters, currentLetter, $filter, $timeout, UserService, $modal) {
    this.currentLetter = currentLetter;
    var self = this;

    this.openLetterList = function() {
      var letterListModal = $modal.open({
        templateUrl: 'app/home/letter.list.tpl.html',
        controller: 'LetterListController',
        controllerAs: 'letterListCtrl',
        resolve: {
          letters: function () {
            return letters;
          },
          currentLetter: function() {
            return self.currentLetter;
          }
        }
      });

      letterListModal.result
      .then(function(selectedLetterId) {
        if (selectedLetterId !== self.currentLetter.$id) {
          return UserService.setCurrentLetterId(selectedLetterId)
          .then(function() {
            return UserService.getCurrentLetter();
          })
          .then(function(letter) {
            self.currentLetter = letter;
          })
          .catch(function(error) {
            console.log('HomeController [openLetterList] could not set current letter: ' + error.code);
          });
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
            return self.currentLetter;
          },
          snippetId: function() {
            return id;
          }
        }
      });
    };

    this.enableSnippet = function(snippetId, state) {
      self.currentLetter.enableSnippet(snippetId, state)
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

    this.copyEnabledAsHTML = function() {
      var text = '';
      angular.forEach(self.currentLetter.snippets, function(snippet) {
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