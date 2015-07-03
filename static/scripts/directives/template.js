'use strict';

app.directive('dbNotification', 
	['BackendService', 
	function (BackendService) {
		return {
			scope:{

			},
			restrict:'EA',

			controller:function($scope){
				
			},
			templateUrl: '../templates/notification.html'
		};
	}]
);
