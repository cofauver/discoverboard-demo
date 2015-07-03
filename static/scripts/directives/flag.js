'use strict';

app.directive('dbFlag', 
	['BackendService','UserService', 
	function (BackendService, UserService) {
		return {
			scope:{
				comment: '=',
				state: '='
			},
			restrict:'EA',

			controller:function($scope){
				var user = UserService.getUserId();
				$scope.comment.flagWords = 'Flag';

				// $scope.checkIfFlaggable = function(){
				// 	BackendService.getFlags(postId).then(function(result){
					// make unflaggable or flaggable based on what we agree upon.
				// },function(){

					// });
				// };

				$scope.checkIdNumber = function(commentId){
					// console.log($scope.state);
					$scope.state.specificId = commentId;
				};

				$scope.flagComment = function(reason){
					// if($scope.comment.flagged === false){
						BackendService.postFlag(user, $scope.comment.id, reason).then(function(result){
							console.log('flag reported with reason: ' + reason);
						},function(error){
							console.log(error);
						});
					// }
					$scope.state.specificId = '';
					$scope.comment.flagged = true;
					$scope.comment.flagWords = 'Flagged'
				};
			},
			templateUrl: '../templates/flag.html'
		};
	}]
);
