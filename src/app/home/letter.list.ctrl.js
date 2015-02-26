(function () {
  'use strict';

  angular.module('letter.list.ctrl', ['letter.edit.ctrl', 'user'])

  .controller('LetterListController', function(letters, currentLetter, UserService, $modal, $modalInstance) {
    this.letters = letters;
    this.currentLetter = currentLetter;

    this.openLetter = function(id) {
      $modal.open({
        templateUrl: 'app/home/letter.edit.tpl.html',
        controller: 'LetterEditController',
        controllerAs: 'letterEditCtrl',
        resolve: {
          letters: function () {
            return letters;
          },
          editLetter: function() {
            return UserService.getLetter(id);
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