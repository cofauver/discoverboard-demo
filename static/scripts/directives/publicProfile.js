'use strict';

app.directive('dbPublicProfile', 
	['$routeParams', 'BackendService', 'UserService',
	function ($routeParams, BackendService, UserService) {
		return {
			scope:{

			},
			restrict:'EA',

			controller:function($scope){
				var user = UserService.getUserId();
				$scope.signedIn = user? true:false;
				var profileOwner = $routeParams.profileOwner;
				if($scope.signedIn){
					BackendService.getUserProfile(profileOwner, user).then(function(result){
						$scope.profileData = result;
                        $scope.isFollowing = result.following;
					})
				}

				$scope.follow = function(){
					BackendService.postUser(user, {follow:profileOwner});
					$scope.isFollowing = true;
				};

				$scope.unfollow = function(){
					BackendService.postUser(user, {unfollow:profileOwner});
					$scope.isFollowing = false;
				};
			},
			templateUrl: '../templates/profile.html'
		};
	}]
);
