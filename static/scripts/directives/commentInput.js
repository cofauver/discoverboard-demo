'use strict';

app.directive('dbCommentInput',
	['$routeParams',
	'$route',
	'$window',
	'BackendService',
	'CommentService', 
	'InteractionService',
	'UserService',
	function($routeParams, $route, $window, BackendService, CommentService, InteractionService, UserService){
		return{
			restrict:'EA',
			templateUrl: '../templates/comment-input.html',
			controller: function($scope){
				var commentObj, data, parentId, time, topParentId, userId, hasBeenFilled;
				$scope.userInput = {};
				$scope.username = UserService.getUsername();
				$scope.submitted = false;

				userId = UserService.getUserId();
				topParentId = $scope.comment.topParentId;
				parentId = $scope.comment.id;

				if($scope.inputText.markup){
					hasBeenFilled = true;
				};


				$scope.submitComment = function(reply) {
					time = Date.now();
					data = {html: reply, posterId: userId, parents: [parentId], topParentId: topParentId}
					if($scope.userInput.anonymous){
						data.anonymous = 1;
					}
					console.log('anonymous: ' + $scope.userInput.anonymous);
					console.log(data);
					BackendService.createComment(data).then(function(comment){
						commentObj = CommentService.createCommentForDisplay(comment);
						console.log(commentObj);
						$scope.comment.replies.unshift(commentObj);
						InteractionService.reportReply(userId, parentId);
				 		$scope.replyInput = false;
				 		$scope.submitted = true;
				 		$route.reload();
					});
		    	};

		    	$scope.$on('$locationChangeStart', function(){
		    		if($scope.inputText.markup || hasBeenFilled){
						var draftData = {html: $scope.inputText.markup, parentId: parentId};
						BackendService.createDraft(userId, draftData);
					}
				});

			}
		}
	}]
);
