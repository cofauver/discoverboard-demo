'use strict';

app.directive('dbWritePost', 
	['$location', 'BackendService', 'UserService', 'TimeService', 'TabService', 'ListService', 'DetectMobileService',
	function ($location, BackendService, UserService, TimeService, TabService, ListService, DetectMobileService) {
		return {
		
		restrict:'EA',
		scope: {
			state: '='
		},
		controller:function($scope){
			var user, userName;
			user = UserService.getUserId();
			userName = UserService.getUsername();
			$scope.userInput = {};
			$scope.workingDraft = {html: '', posterId: user};
			$scope.post = {summary:'', text: '', id:''};
			$scope.replyInput = true;
			$scope.submitted = false;
			$scope.mobile = DetectMobileService.any();

			$scope.draftFunctions = {}

			$scope.submitComment = function(workingDraft){
				$scope.post.timeToDisplay = TimeService.howLongAgo(Date.now());
				if($scope.userInput.anonymous){
					workingDraft.anonymous = 1;
				}else{
					$scope.post.posterName = userName;
				}
				console.log('anonymous: ' + $scope.userInput.anonymous);
				console.log(workingDraft);
	    		BackendService.createComment(workingDraft).then(function(postFromBackend){
	    			console.log(postFromBackend);
	    			$scope.post.id = postFromBackend.id;
	    			$scope.post.summary = postFromBackend.summary;
	    			$scope.post.image = postFromBackend.image;
	    			if($scope.userInput.anonymous){
						$scope.post.posterName = postFromBackend.posterName;
	    			}
	    			ListService.addPostToLatest($scope.post);
	    			$location.path('/posts/'+$scope.post.id)
	    			
	    		});
	    		$scope.post.text = '';
	    		$scope.submitted = true;
	    		TabService.setSidebarTab(2);
	    	};	


		},
		templateUrl: '../templates/write-post.html'
	};
}]);
