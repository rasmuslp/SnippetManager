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

  .controller('WelcomeController', function($sce) {

    this.snippet = {
      content: 'Hello <b>NAME</b>! I can see that you are working for <b>COMPANY</b> and I thought you might be interested in our service, which makes it possible to use varaibles in text.<br /><br /><br/> <b>NAME</b> when did I last tell you that you were awesome?',
      variables: [{
        tag: 'NAME',
        placeholder:'Your name'
      },{
        tag: 'COMPANY',
        placeholder:'Where you work'
      }]
    };


    this.html = function(html) {
      return $sce.trustAsHtml(html);
    };
  });

}());