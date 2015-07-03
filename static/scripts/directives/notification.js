'use strict';

app.directive('dbNotification', 
	['StringConverterService', 
	function (StringConverterService) {
		return {
			scope:{
				state: '=',
				notification: '='
			},

			restrict:'EA',

			controller:function($scope){

				$scope.heartsList = StringConverterService.processNotification($scope.notification.hearts);
				$scope.repliesList = StringConverterService.processNotification($scope.notification.replies);
				$scope.responsesList = StringConverterService.processNotification($scope.notification.responses);
				
				if($scope.notification.follows){
					$scope.followsList = StringConverterService.processNotification($scope.notification.follows);
				}

			},
			templateUrl: '../templates/notification.html'
		};
	}]
);
