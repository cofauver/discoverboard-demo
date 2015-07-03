'use strict';

app.directive('dbBoard', ['$routeParams','InteractionService', 'UserService', function($routeParams, InteractionService, UserService){
	return {
		restrict: 'EA',
		scope:{
			state: '=',
			post: '=',
			comment: '=' 
		},
		controller: function($scope){
			$scope.deleteItem = function(){
				$scope.itemShowing = false;
			};
			
			var routeId = $scope.comment.id


			// $scope.$watch(function(){return $routeParams.postId}, function(newVal, oldVal){
			// 	console.log(newVal);
			// 	console.log(oldVal);
			// 	InteractionService.leaveBoard(UserService.userId, oldVal);
			// }, true);

			$scope.$on('$locationChangeStart', function(){
				InteractionService.leaveBoard(UserService.userId, routeId);
			});

		},
		templateUrl:'../templates/board.html'
	};
}]);
