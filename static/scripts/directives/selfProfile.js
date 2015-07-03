'use strict';

app.directive('dbSelfProfile', 
	['$routeParams', 'BackendService', 'UserService',
	function ($routeParams, BackendService, UserService) {
		return {
			restrict:'EA',

			controller:function($scope){
			// 	var user = UserService.getUserId();
			// 	$scope.signedIn = user? true:false;
			// 	var profileOwner = $routeParams.profileOwner;
			// 	BackendService.getUserProfile(profileOwner).then(function(result){
			// 		$scope.profileData = result;
			// 	})
			},
			templateUrl: '../templates/self-profile.html'
		};
	}]
);
