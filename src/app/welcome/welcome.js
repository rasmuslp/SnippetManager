(function () {
  'use strict';

  angular.module('welcome', ['menu'])

  .config(function($stateProvider) {
    $stateProvider
    .state('welcome', {
      url: '/welcome',
      templateUrl: 'app/welcome/welcome.tpl.html',
      controller: 'WelcomeController',
      controllerAs: 'welcomeCtrl'
    });
  })

  .controller('WelcomeController', function($filter) {

    this.snippet = {
      content: 'Hello <b>NAME</b>! I can see that you are working for <b>COMPANY</b> and I thought you might be interested in our service. It makes it possible to use variables in snippets of text. It even supports Markdown and copy to clipboard as HTML.<br /><br /><br/> <b>NAME</b> when did I last tell you that you were awesome?',
      variables: [{
        tag: 'NAME',
        placeholder:'Your name'
      },{
        tag: 'COMPANY',
        placeholder:'Where you work'
      }]
    };

    this.copyAsMarkdown = function(snippet) {
      return $filter('tagFill')(snippet, this.values);
    };

    this.copyAsHTML = function(snippet) {
      return $filter('ngMarkdown')(this.copyAsMarkdown(snippet));
    };
  });

}());