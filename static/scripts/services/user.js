'use strict';

/*
The UserService handles the "name"s and "userId"s. It takes advantage of 
the local storage to keep this information accessible. The local storage is
especially important for the userId, because the asynchronous http request
can happen while the page loads and does not need to happen again. This way,
no later methods rely on promises, but have the data accessible
*/

app.factory('UserService', ['$http', 'LocalStorageService','BackendService', function($http, LocalStorageService, BackendService) {
	
	/*Set the keys for the name and id information*/
	var idKey = LocalStorageService.idKey;
	var nameKey = LocalStorageService.usernameKey;
	var sessionKeyKey = LocalStorageService.sessionKeyKey;

	var userId = LocalStorageService.load(idKey);
	var name = LocalStorageService.load(nameKey);
	var completion = false;

	var service = {
		userId: userId,
		name: name,

		setUserId:function(id){
			this.userId = id;
			LocalStorageService.save(idKey, id);
		},

		/*Check localstorage for a userId*/
		getUserId: function(){
			var id = LocalStorageService.load(idKey);
			return id;
		},

		removeUserId: function(){
			delete this.userId;
			LocalStorageService.clear(idKey)
		},

		/*Check localstorage for a sessionKey*/
		getSessionKey: function(){
			var id = LocalStorageService.load(sessionKeyKey);
			return id;
		},

		setSessionKey: function(key){
			LocalStorageService.save(sessionKeyKey, key);
			BackendService.setSessionKeyHeader(key);
		},

		removeSessionKey: function(){
			LocalStorageService.clear(sessionKeyKey);
			BackendService.clearSessionKey();
		},

		setUsername:function(name){
			this.name = name;
			LocalStorageService.save(nameKey, name);
		},

		getUsername: function() {
			return this.name;
		},

		removeUsername: function(){
			delete this.name;
			LocalStorageService.clear(nameKey);
		}
	};

	return service;
	
}]);
