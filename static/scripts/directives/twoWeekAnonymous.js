'use strict';

app.directive('dbTwoWeekAnonymous', 
	['BackendService', 'UserService', 
	function (BackendService, UserService) {
		return {
			scope:{

			},
			restrict:'EA',

			controller:function($scope){
				var user = UserService.getUserId();
				$scope.signedIn = user? true:false;
			},
			templateUrl: '../templates/two-week-anonymous.html'
		};
	}]
);
