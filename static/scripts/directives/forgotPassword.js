'use strict';

app.directive('dbForgotPassword', 
	['BackendService', 
	function (BackendService) {
		return {
			scope:{
				state: '='
			},
			restrict:'EA',

			controller:function($scope){
				$scope.emailLink = function(emailAddress){
					BackendService.postPasswordResetData({email: emailAddress}).then(function(){
						$scope.emailSent = true;
					});
				}
			},
			templateUrl: '../templates/forgot-password.html'
		};
	}]
);
