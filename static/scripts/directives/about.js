'use strict';

app.directive('dbAbout',  
	['$location', 'BackendService', 'UserService',
	function ($location, BackendService, UserService) {
		return {
			restrict:'EA',
			controller:function($scope){

				var userId = UserService.getUserId();

				BackendService.getUser(userId).then(function(result){
					var checklist = result.checklist;
					if(checklist.indexOf('community') > -1){
						BackendService.postUser(userId, {'checklist': 'community'});
					}
					if(checklist.indexOf('completed') > -1){
						$scope.showPathBackToChecklist = true;
					}
				});


			},
			templateUrl: '../templates/about.html'
		};
}]);
