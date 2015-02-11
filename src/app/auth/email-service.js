(function() {
  'use strict';

  angular.module('email.service', ['common.config', 'common.firebase.factory', 'auth.service', 'firebase'])
  .factory('EmailService', function($q, FB, FirebaseFactory, AuthService) {
    var base = '/emails/';
    var ref = new Firebase(FB + base);

    var ret = {
      create: function(email) {
        var data = {
          email: email
        };

        return FirebaseFactory.set(base + AuthService.uid(), data);
      },

      emailAvailable: function(email) {
        var deferred = $q.defer();

        ref.orderByChild('email').equalTo(email).once('value', function(data) {
          if (data.val()) {
            // Match
            deferred.reject();
          } else {
            // No match
            deferred.resolve();
          }
        }, function(error) {
          deferred.reject('EmailService [emailAvailable] An error occured: ' + error.code);
        });

        return deferred.promise;
      },
    };

    return ret;
  });

}());