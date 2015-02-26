(function () {
  'use strict';

  angular.module('snippet.ctrl', ['ngTagsInput'])

  .controller('SnippetController', function(currentLetter, snippetId, $scope, $modalInstance) {
    var self = this;
    this.edit = angular.isDefined(snippetId);

    this.org = {
      variables : [],
      enabled: true
    };

    if (this.edit) {
      this.org = currentLetter.snippets[snippetId];
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
      currentLetter.addSnippet(this.snippet)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.log('SnippetController [addSnippet] failed. Snippet was %o and error was ' + error.code, self.snippet);
      });
    };

    this.saveSnippet = function () {
      currentLetter.saveSnippet(snippetId, this.snippet)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.log('SnippetController [saveSnippet] failed. Snippet was %o and error was ' + error.code, self.snippet);
      });
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };

    this.delete = function() {
      currentLetter.removeSnippet(snippetId)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.warn('SnippetController [delete] failed. Snippet was %o and error was ' + error.code, self.snippet);
      });
    };
  });

}());