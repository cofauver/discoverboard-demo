'use strict';

app.directive('dbVerifyUser', 
	['$routeParams', '$timeout', '$location', 'BackendService', 'UserService',
	function ($routeParams, $timeout, $location, BackendService, UserService) {
		return {
			scope:{

			},
			restrict:'EA',

			controller:function($scope){
				$scope.success = false;
				var user = $routeParams.userId;
				var data = {verificationCode: $routeParams.verifyKey};

				var verify = function(){
					BackendService.postUser(user, data).then(function(result){
						if(result !== 'Authentication required'){
                            if (!result.verificationCode){
                                $scope.success = true;
                                $timeout(function(){
                                    $location.path('/');	
                                }, 2000);
                            } else {
                                $scope.failure = true;
                                $scope.userEmail = result.email;
                            }
						};
					});
				};
				

				if(UserService.getUserId()){
					verify();
				}else{
					$scope.promptLogin = true;
					$scope.state = {promptLogin: true};
				}


			},
			templateUrl: '../templates/verify-user.html'
		};
	}]
);
