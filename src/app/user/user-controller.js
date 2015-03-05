(function () {
	'use strict';

	angular.module('user.controller', ['user.lang'])

	.controller('UserController', function(UserLanguage) {
		this.lang = UserLanguage;
	})

	.controller('ChangePasswordController', function(UserLanguage) {
		this.lang = UserLanguage;
	});

}());