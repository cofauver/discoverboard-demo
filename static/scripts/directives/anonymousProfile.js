'use strict';

app.directive('dbAnonymousProfile', 
	['BackendService', 
	function (BackendService) {
		return {
			scope:{

			},
			restrict:'EA',

			controller:function($scope){
				var user = UserService.getUserId();
				$scope.signedIn = user? true:false;
			},
			templateUrl: '../templates/anonymous-profile.html'
		};
	}]
);
