(function () {
	'use strict';

	angular.module('user.lang', [])

	.factory('UserLanguage', function() {
		var strings = {
			title: 'Account',

			// Overview
			subtitle: 'Overview',

			// Change password
			change: 'Change password',
			oldPass: 'Old password',
			newPass1: 'New password',
			newPass2: 'Confirm new password',
			working: 'Working',
			cancel: 'Cancel',

			passwordReq: 'Enter a password',
			passwordMin: 'The password must be at least 8 characters',
			passwordInvalid: 'Invalid password',

			networkError: 'Network error, try again',
			generalError: 'An unexpected error occurred',

		};

		return {
			get: function(key) {
				if (strings.hasOwnProperty(key)) {
					return strings[key];
				} else {
					console.error('UserLanguage: Missing translation for: ' + key);
					return 'Missing translation';
				}
			}
		};
	});

}());