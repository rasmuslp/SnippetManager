(function () {
  'use strict';

  angular.module('letter.list.ctrl', ['letter.edit.ctrl', 'user'])

  .controller('LetterListController', function(letters, currentLetter, UserService, $modal, $modalInstance) {
    this.letters = letters;
    this.currentLetter = currentLetter;

    this.selectLetter = function(id) {
      $modalInstance.close(id);
    };

    this.close = function() {
      $modalInstance.close();
    };

    this.cancel = function() {
      $modalInstance.dismiss();
    };
  });

}());