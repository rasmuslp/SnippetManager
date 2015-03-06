(function () {
	'use strict';

	angular.module('user.lang', [])

	.factory('UserLanguage', function() {
		var strings = {
			// Common
			title: 'Account',

			working: 'Working',
			cancel: 'Cancel',
			passwordReq: 'Enter a password',
			passwordMin: 'The password must be at least 8 characters',
			passwordInvalid: 'Invalid password',
			networkError: 'Network error, try again',
			generalError: 'An unexpected error occurred',

			// Overview
			subtitle: 'Overview',

			// Delete account
			delete: 'Delete account',
			deletePrecaution: 'As a precaution, you have to enter your email and password to delete your account.',
			deleteAfter: 'After your account have been deleted, you will be redirected to the login page.',
			email: 'Email address',
			pass: 'Password',
			emailReq: 'Enter your email address',
			emailLike: 'This does not look like an email address',
			emailMatch: 'The entered email does not match the one you signed in with',
			emailInvalid: 'Invalid email address',
			userInvalid: 'This account does not exist',
			deleteSuccess: 'Account deleted',

			// Change password
			change: 'Change password',
			changePrecaution: 'As a precaution, you have to enter your current password.',
			oldPass: 'Current password',
			newPass1: 'New password',
			newPass2: 'Confirm new password',
			changeSuccess: 'Password changed'
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