(function () {
  'use strict';

  angular.module('home', ['auth.service', 'user'])

  .config(function($urlRouterProvider, $stateProvider) {
    $stateProvider
    .state('home', {
      abstract: true,
      url: '/home',
      template: '<div id="home-content" ui-view></div>',
      contoller: function($state) {
        $state.go('home.home');
      },
      resolve: {
        requireAuth: function(requireAuth) {
          return requireAuth();
        },
        user: function(UserService) {
          return UserService.getData();
        }
      }
    })
    .state('home.home', {
      url: '',
      templateUrl: 'app/home/home.tpl.html',
      controller: 'HomeController',
      controllerAs: 'homeCtrl'
    });
  })


  .filter('newlines', function () {
    return function(text, values) {
      var newText = text;
      for (var value in values) {
        newText = newText.replace(new RegExp(value, 'g'), values[value])
      }
      return newText;
    }
  })

  .controller('HomeController', function(user) {
    this.user = user;

    this.user.$loaded()
    .then(function() {
      user.snippets = user.snippets || [];
    });

    this.newVariable = '';

    this.addVariable = function () {
      console.log('Add variable');
      this.newSnippet.variables = this.newSnippet.variables || [];
      this.newSnippet.variables.push({
        tag: this.newVariable
      });

      this.newVariable = '';
    };

    //this.snippets = [{content: 'This is some content', variables: [{tag: 'navn'},{tag: 'title'},{tag: 'test'}, {tag: 'mother'}]}, {content: 'This is some other content', variables: [{tag: 'navn'},{tag: 'title'},{tag: 'test'}]}]
    this.newSnippet = {
      variables : []
    };

    this.saveSnippet = function () {
      console.log('Save snippet');

      if (angular.isUndefined(this.user.snippets)) {
        this.user.snippets = [];
      }

      this.user.snippets.push(this.newSnippet);
      this.user.$save();
    };

    this.deleteSnippet = function(snippet) {
      var index = this.user.snippets.indexOf(snippet);
      console.log(index);
      if (index != -1) {
        console.log('I am in');
        this.user.snippets.splice(index, 1);
        this.user.$save();
      }
    }

  });

}());