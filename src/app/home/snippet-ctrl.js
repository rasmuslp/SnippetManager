(function () {
  'use strict';

  angular.module('snippet.ctrl', ['ngTagsInput'])

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