'use strict';

app.directive('dbLogin', 
 	['$route', '$location','BackendService', 'UserService', 'LocalStorageService',
		function ($route, $location, BackendService, UserService, LocalStorageService) {
			return {
				restrict:'EA',
				scope: {
					state: '='
				},
				controller: function($scope){
					

		        	$scope.login = function(email, password){
		        		$scope.waitingForLogin = true;
		        		BackendService.authenticate(email, password).success(function(data){
		        			UserService.setSessionKey(data.authentication.sessionKey);
		        			UserService.setUserId(data.authentication.userId);
		        			UserService.setUsername(data.authentication.name);

	                        $scope.userId = data.authentication.userId;
	                        $location.path('/');
	                        $route.reload();
	                        
		        		}).error(function(error){
		        			$scope.displayErrorMessage = true;
		        			$scope.waitingForLogin = false;
		        		});
		        	};

		        

				},
				templateUrl: '../templates/login.html'
			};
		}
	]
);
