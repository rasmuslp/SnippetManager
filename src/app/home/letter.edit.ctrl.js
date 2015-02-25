(function () {
  'use strict';

  angular.module('letter.edit.ctrl', [])

  .controller('LetterEditController', function(letters, editLetter, $modalInstance) {
    this.edit = !!editLetter;

    this.org = {
      title: ''
    };

    if (this.edit) {
      if (editLetter === null) {
        console.warn('LetterEditController [modal] Letter not available. LetterID was %o', editLetter);
        $modalInstance.close();
      } else {
        this.org = editLetter;
      }
    }

    this.letter = angular.copy(this.org);
    
    this.saveLetter = function () {
      angular.extend(this.org, this.letters);
      letters.$save(this.org)
      .catch(function(error) {
        console.log('LetterEditController [saveLetter] could not save item: ' + error);
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
      letters.$remove(this.org)
      .catch(function(error) {
        console.warn('LetterEditController [delete] Could not delete letter. Letter was ' + this.org + ' and error was ' + error.code);
      })
      .then(function() {
        $modalInstance.close();
      });
    };
  });

}());