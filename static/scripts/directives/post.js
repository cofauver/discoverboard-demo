'use strict';

app.directive('dbPost', 
	['BackendService',
	'InteractionService',
	'UserService',
	'TimeService',
	function (BackendService, InteractionService, UserService, TimeService) {
		return {
			scope:{
				post: '=',
				depth: '='
			},
			restrict:'EA',

			controller:function($scope){
				$scope.interactionId = '';
				var user = UserService.getUserId();
				// console.log('in dbPost $scope.post and $scope.post.time');
				// console.log($scope.post);
				// console.log($scope.post.time);
				$scope.post.timeToDisplay = TimeService.howLongAgo($scope.post.time);


				// BackendService.getUser($scope.post.posterId).then(function(user){
				// 	$scope.post.posterName = user.username;
				// });


			},
			templateUrl: '../templates/post.html',
		};
	}]
);
