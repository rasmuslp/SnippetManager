(function() {
	'use strict';

	angular.module('common.firebase.factory', ['firebase'])

	.factory('FirebaseFactory', function(FB, $q, $firebase) {
		var baseRef = new Firebase(FB);

		var ret = {
			delete: function(path) {
				var deferred = $q.defer();

				var ref = baseRef.child(path);
				ref.set({}, function(error) {
					if (error) {
						console.warn('FirebaseFactory [delete] of ' + path + ' failed: %o', error);
						deferred.reject('FirebaseFactory [delete] of ' + path + ' failed with error code ' + error.code);
					} else {
						deferred.resolve();
					}
				});

				return deferred.promise;
			},

			getOnce: function(path) {
				var deferred = $q.defer();

				var ref = baseRef.child(path);
				ref.once('value', function(data) {
					deferred.resolve(data.val());
				}, function(error) {
					console.warn('FirebaseFactory [getOnce] of ' + path + ' failed: %o', error);
					deferred.reject('FirebaseFactory [getOnce] of ' + path + ' failed with error code ' + error.code);
				});

				return deferred.promise;
			},

			getAsArray: function(path) {
				var ref = baseRef.child(path);

				return $firebase(ref).$asArray();
			},

			getAsObject: function(path) {
				var ref = baseRef.child(path);

				return $firebase(ref).$asObject();
			},

			set: function(path, object) {
				var deferred = $q.defer();

				var ref = baseRef.child(path);
				ref.set(object, function(error) {
					if (error) {
						console.warn('FirebaseFactory [set] of ' + path + ' failed: %o', error);
						deferred.reject('FirebaseFactory [set] of ' + path + ' failed with error code ' + error.code);
					} else {
						deferred.resolve();
					}
				});

				return deferred.promise;
			},

			update: function(path, object) {
				var deferred = $q.defer();

				var sync = $firebase(baseRef.child(path));
				sync.$update(object)
				.then(function(ref) {
					deferred.resolve(ref.key());
				}, function(error) {
					console.warn('FirebaseFactory [update] of %o to ' + path + ' failed: %o', object, error);
					deferred.reject('FirebaseFactory [update] of %o to ' + path + ' failed with error code ' + error.code, object);
				});

				return deferred.promise;
			},

			push: function(path, object) {
				var deferred = $q.defer();

				var sync = $firebase(baseRef.child(path));
				sync.$push(object)
				.then(function(ref) {
					deferred.resolve(ref.key());
				}, function(error) {
					console.warn('FirebaseFactory [push] of %o to ' + path + ' failed: %o', object, error);
					deferred.reject('FirebaseFactory [push] of %o to ' + path + ' failed with error code ' + error.code, object);
				});

				return deferred.promise;
			}
		};

		return ret;
	})

	.factory('ObjectCache', function ($firebase) {
		return function (ref) {
			var cached = {};

			// Fills cache with
			cached.$init = function() {
				ref.on('child_added', function(snapshot) {
					cached.$load(snapshot.key());
				});
			};

			// Load object into cache
			cached.$load = function (id) {
				if( !cached.hasOwnProperty(id) ) {
					cached[id] = $firebase(ref.child(id)).$asObject();
				}

				return cached[id];
			};

			// Frees memory and stops listening on objects.
			// Use this when you switch views in your SPA and no longer need this list.
			cached.$dispose = function () {
				angular.forEach(cached, function (object) {
					object.$destroy();
				});
			};

			// Removes an object, both form cache and on Firebase
			cached.$remove = function(id) {
				delete cached[id];
				ref.child(id).remove();
			};

			return cached;
		};
	});

}());