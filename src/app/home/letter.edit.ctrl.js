(function () {
  'use strict';

  angular.module('letter.edit.ctrl', ['user.service'])

  .controller('LetterEditController', function(editLetter, letters, UserService, $modalInstance) {
    var self = this;
    this.edit = !!editLetter;

    this.org = {
      title: ''
    };

    if (this.edit) {
      if (editLetter === null) {
        console.warn('LetterEditController [modal] Letter not available. Letter was %o', editLetter);
        $modalInstance.close();
      } else {
        this.org = editLetter;
      }
    }

    this.letter = angular.copy(this.org);

    this.addLetter = function() {
      letters.$add(this.letter)
      .then(function(ref) {
        $modalInstance.close(ref.key());
      })
      .catch(function(error) {
        console.log('LetterEditController [addLetter] failed. Letter was %o and error was ' + error.code, self.letter);
      });
    };

    this.saveLetter = function () {
      editLetter.setTitle(this.letter.title)
      .then(function() {
        $modalInstance.close();
      })
      .catch(function(error) {
        console.log('LetterEditController [saveLetter] failed. Letter was %o and error was ' + error.code, self.letter);
      });
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };

    this.delete = function() {
      var id = editLetter.$id;
      //letters.$remove(id)
      UserService.deleteLetter(id)
      .catch(function(error) {
        console.warn('LetterEditController [delete] failed. Letter was %o and error was ' + error, self.org);
      })
      .then(function() {
        $modalInstance.close(id);
      });
    };
  });

}());