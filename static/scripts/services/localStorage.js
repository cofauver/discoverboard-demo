'use strict';

app.factory('LocalStorageService',['$window', function(window){
	
	
		/*
		Allows us to save a (key, value) pair to local storage
		and then retrieve those values or delete them
		in these cases the pairs will be any of the options below:
		'mermoose-username' : USER_NAME
		'mermoose-id' : USER_ID
        'session-key' : SESSION_KEY
        'invite-code' : An invite code to be 
        				used when that person 
        				eventually goes to sign up
		*/

	return {
		usernameKey: 'mermoose-username',
		idKey: 'mermoose-id',
		sessionKeyKey: 'session-key',
		inviteCodeKey: 'code-key',
		load:function(key) {
			return window.localStorage.getItem(key);
		},

		save : function(key, value) {
			return window.localStorage.setItem(key, value);
		},
		clear : function(key){
			window.localStorage.removeItem(key);
		}
	};

}]);
