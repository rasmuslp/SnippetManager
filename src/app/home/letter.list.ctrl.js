(function () {
  'use strict';

  angular.module('letter.list.ctrl', ['letter.edit.ctrl', 'user'])

  .controller('LetterListController', function(letters, currentLetter, UserService, $modal, $modalInstance) {
    this.letters = letters;
    this.currentLetter = currentLetter;

    this.openLetter = function(id) {
      var editLetterModal = $modal.open({
        templateUrl: 'app/home/letter.edit.tpl.html',
        controller: 'LetterEditController',
        controllerAs: 'letterEditCtrl',
        resolve: {
          editLetter: function() {
            return UserService.getLetter(id);
          },
          letters: function() {
            return letters;
          }
        }
      });

      editLetterModal.result
      .then(function(letterId) {
        if (angular.isUndefined(id)) {
          // New letter
          $modalInstance.close(letterId);
        } else {
          // Deleted letter
          if (currentLetter.$id === letterId) {
            // Deleting current letter
            $modalInstance.close(true);
          }
        }
      });
    };

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