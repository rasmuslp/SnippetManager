(function () {
	/* jshint -W121 */

	'use strict';

	angular.module('common', ['common.config', 'common.firebase.factory', 'common.filters']);
	String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
	};

}());