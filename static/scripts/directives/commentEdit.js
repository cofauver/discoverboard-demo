'use strict';

app.directive('dbCommentEdit', 
	['BackendService', 'StringConverterService', 'UserService', 'ListService',
	function (BackendService, StringConverterService, UserService, ListService) {
		return {
			restrict:'EA',
			scope: {
				comment: '=',
				editing: '='
			},
			controller:function($scope){

				var user = UserService.getUserId();

				$scope.updatedReplyTextMarkup = $scope.comment.editHtml;
				
				$scope.updateComment = function(html){
					var payload = {html: html, posterId: user};
					BackendService.updateComment($scope.comment.id, payload).then(function(result){
						ListService.updatePostSummary(result.id, result.summary);
						console.log(result);
						$scope.comment = result;
						$scope.comment.textToDisplay = StringConverterService.processRawComment($scope.comment.html);

						$scope.editing = false;
					});
				};

			},
			templateUrl: '../templates/comment-edit.html'
		};
	}]
);
