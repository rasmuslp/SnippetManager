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
          return UserService.getUserData();
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

  .controller('HomeController', function(user) {

    this.user = user;

    var self = this;

    this.user.$loaded()
    .then(function() {
      self.user.snippets = self.user.snippets || [];
    });
    //this.snippets = [{content: 'This is some content', variables: [{tag: 'navn'},{tag: 'title'},{tag: 'test'}, {tag: 'mother'}]}, {content: 'This is some other content', variables: [{tag: 'navn'},{tag: 'title'},{tag: 'test'}]}]
    this.currentSnippet = {
      variables : []
    };

    this.addVariable = function () {
      this.currentSnippet.variables.push({
        tag: this.newPlaceholder
      }
    )
    console.log("test")
    this.newPlaceholder = "";
  };

  this.saveSnippet = function () {
    console.log("MOTHFKDSJLKDSMSDKLFD");
    this.user.snippets.push({
      content: this.newContent
    });

    this.user.$save();
  };



});



}());