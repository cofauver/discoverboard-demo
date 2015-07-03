'use strict';

app.directive('dbMainMessage', 
	['UserService', 'DetectMobileService', 'BackendService', 'ListService', '$animate',
	function (UserService, DetectMobileService, BackendService, ListService, $animate) {
		return {
			scope: {
				state: '='
			},
			restrict:'EA',

			controller:function($scope){

				$scope.isMobile = DetectMobileService.any();
				$scope.isOldiOS = DetectMobileService.OldiOS();
				var user = UserService.getUserId();
				var sessionKey = UserService.getSessionKey();

				BackendService.getMonthlyCost().then(function(monthlyCost){
					$scope.monthlyCost = monthlyCost;
				});
				
				if(user){
					$scope.state.loggedIn = true;
				}
			},
			templateUrl: '../templates/main-message.html'
		};
	}]
);
