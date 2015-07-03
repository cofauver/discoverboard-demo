'use strict';

app.directive('dbContact', 
	['BackendService', 'UserService', 
	function (BackendService, UserService) {
		return {
			scope:{
				state: '='
			},
			restrict:'EA',

			controller:function($scope){
				
				$scope.userId = UserService.getUserId();
				BackendService.getUser($scope.userId).then(function(result){
					$scope.accountInfo = result;
					$scope.name = $scope.accountInfo.name;
					$scope.email = $scope.accountInfo.email;
					$scope.infoLoaded = true;
				});

				$scope.sendEmail = function(name, email, message){
					BackendService.postFeedback(name, email, message).then(function(data){
						$scope.displaySuccess = true;
						$scope.message = '';
     				});
				};


			},
			templateUrl: '../templates/contact.html'
		};
	}]
);
