(function () {
	'use strict';

	angular.module('auth.lang', [])

  .factory('AuthLanguage', function() {
		var strings = {
			// Common
			'login': 'login',
			'Login': 'Login',
			'signup': 'sign up',
			'Signup': 'Sign up',
			'Cancel': 'Cancel',

			// Other
      'check': 'Checking authentication',
			'or': 'or',
			'hasAccount': 'If you already have an account, you can login here.',
			'noAccount': 'You don\'t have an account?',
			'goToCreateAccount': 'Create an account here!',

			// Form
			'emailPlaceholder': 'Email address',
			'emailReq': 'Enter your email address',
			'emailLike': 'This does not look like an email address',
			'emailTaken': 'This email address is already registered',
			'emailInvalid': 'Invalid email address',
			'userInvalid': 'This account does not exist',
			'passwordPlaceholder': 'Password',
			'passwordReq': 'Enter a password',
			'passwordMin': 'The password must be at least 8 characters',
			'passwordInvalid': 'Invalid password',
			'passwordConfirmPlaceholder': 'Confirm password',
			'passwordRepeat': 'Repeat the password',
			'passwordMatch': 'The passwords does not match',
			'remember': 'Remember me',
			'createAccount': 'Create account',
			'working': 'Working',
			'networkError': 'Network error, try again',
			'generalError': 'An unexpected error occurred',
			'orSocial': 'or login with one of these',
			'providerError': 'An error occurred at',
			'providerAuthenticationError': 'The authentication at',
			'userCancel': 'was cancelled',
			'userDenied': 'was denied'

		};

    return {
			get: function(key) {
				if (strings.hasOwnProperty(key)) {
					return strings[key];
				} else {
					console.error('AuthLanguage: Missing translation for: ' + key);
					return 'Missing translation';
				}
			}
    };
  });

}());