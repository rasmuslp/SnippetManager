(function () {
  'use strict';

  angular.module('home.ctrl', ['common.filters', 'letter.list.ctrl', 'snippet.ctrl', 'user', 'dndLists'])

  .controller('HomeController', function(letters, currentLetter, $scope, $filter, $timeout, UserService, $modal) {
    var self = this;
    var updateCurrentLetter = function(letter) {
      self.currentLetter = letter;
      self.snippetData = letter.getSnippets();
      self.snippetData.$loaded(function(data) {
        var setPriority = false;
        var i;
        for (i = 0; i < data.length; i++) {
          if (data[i].$priority === null) {
            setPriority = true;
            break;
          }
        }

        if (setPriority) {
          console.log('Setting priority');
          for (i = 0; i < data.length; i++) {
            self.snippetData[i].$priority = i;
            self.snippetData.$save(i);
          }
        }
      });
    };
    updateCurrentLetter(currentLetter);

    this.openLetterList = function() {
      var letterListModal = $modal.open({
        size: 'sm',
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
        if (selectedLetterId === true) {
          // Deleted letter
          return UserService.setCurrentLetterId(null)
          .then(function() {
            return UserService.getCurrentLetter();
          })
          .then(function(letter) {
            updateCurrentLetter(letter);
          })
          .catch(function(error) {
            console.log('HomeController [openLetterList] could not set current letter: ' + error.code);
          });
        } else if (selectedLetterId !== self.currentLetter.$id) {
          // Changed letter
          return UserService.setCurrentLetterId(selectedLetterId)
          .then(function() {
            return UserService.getCurrentLetter();
          })
          .then(function(letter) {
            updateCurrentLetter(letter);
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

    this.dndSnippet = {
      splice: function(dropIndex, dummy, object) {
        var dragIndex = self.snippetData.$indexFor(object.$id);

        if (dragIndex < dropIndex) {
          // Moving down, compensate as original element isn't removed but modified
          dropIndex--;
        }

        self.snippetData[dragIndex].$priority = dropIndex;
        self.snippetData.$save(dragIndex);

        if (dragIndex > dropIndex) {
          // Moving up
          while (self.snippetData[dropIndex] && dropIndex !== dragIndex ){
            self.snippetData[dropIndex].$priority = dropIndex + 1;
            self.snippetData.$save(dropIndex);
            dropIndex++;
          }
        } else if (dragIndex < dropIndex) {
          // Moving down
          while (self.snippetData[dropIndex] && dropIndex !== dragIndex ){
            self.snippetData[dropIndex].$priority = dropIndex - 1;
            self.snippetData.$save(dropIndex);
            dropIndex--;
          }
        }
      }
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