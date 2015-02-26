(function() {
  'use strict';

  angular.module('letter', ['auth', 'common'])

  .factory('LetterFactory', function($FirebaseArray, Letter) {
    return $FirebaseArray.$extendFactory({
      $$added: function(snap) {
        return new Letter(snap);
      },

      $$updated: function(snap) {
        var msg = this.$getRecord(snap.key());
        return msg.update(snap);
      }
    });
  })

  .factory('Letter', function(AuthService, $firebaseUtils, FirebaseFactory) {
    function Letter(snap) {
      this.$id = snap.key();
      this.update(snap);
    }

    Letter.prototype = {
      update: function(snap) {
        return $firebaseUtils.updateRec(this, snap);
      },

      setTitle: function(title) {
        return FirebaseFactory.update('/users/' + AuthService.uid() + '/letters/' + this.$id, {
          title: title
        });
      },

      addSnippet: function(snippet) {
        return FirebaseFactory.push('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/', snippet);
      },

      enableSnippet: function(snippetId, state) {
        return FirebaseFactory.update('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/' + snippetId, {
          enabled: state
        });
      },

      removeSnippet: function(snippetId) {
        return FirebaseFactory.delete('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/' + snippetId);
      },

      saveSnippet: function(snippetId, snippet) {
        return FirebaseFactory.update('/users/' + AuthService.uid() + '/letters/' + this.$id + '/snippets/' + snippetId, snippet);
      }
    };

    return Letter;
  });

}());