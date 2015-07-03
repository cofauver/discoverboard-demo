'use strict';

app.directive('dbSuggestConversation', 
	['BackendService', 'UserService',
	function (BackendService, UserService) {
		return {
			scope:{
				post: '='
			},
			restrict:'EA',

			controller:function($scope){
				var data, user;
				$scope.openInputs = false;
				$scope.emailSuggestionsSent = [];
				$scope.dBoSuggestionsSent = [];
				$scope.recommendedNames = {};
				//GET /users/UID/friends
				user = UserService.getUserId();
				BackendService.getUserFriends(user).then(function(result){
					// console.log(result);
					if(typeof result === 'object'){
						$scope.friendList = result;
					}
					angular.forEach(result, function(friend){
						$scope.recommendedNames[friend] = false;
					});
				});


				$scope.suggestEmail = function(emailAddress){
					data = {userId: user, targetEmail: emailAddress, postId: $scope.post.id};
					BackendService.postSuggestion(data).then(function(){
						$scope.emailSuggestionsSent.push(emailAddress);
					})
				}

				$scope.suggestFriend = function(friend){
					data = {userId: user, targetName: friend, postId: $scope.post.id};
					BackendService.postSuggestion(data).then(function(){
						console.log('successful dbo suggestion')
						$scope.dBoSuggestionsSent.push(friend);
					})
				}
			},
			templateUrl: '../templates/suggest.html'
		};
	}]
);
