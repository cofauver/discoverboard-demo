				
'use strict';

app.directive('dbExternalPasswordReset', 
	['BackendService', '$routeParams', 
	function (BackendService, $routeParams) {
		return {
			scope:{

			},
			restrict:'EA',

			controller:function($scope){
				var token = $routeParams.resetToken;
				// $scope.verifyCard = function(lastFourDigits){
				// 	BackendService.postCodedPasswordResetData(token, {cardEnding:lastFourDigits}).then(function(result){
				// 		$scope.cardVerified = true;	
				// 	}, function(error){
				// 		$scope.showError = true;
    //                     $scope.errorMessage = error.data;
				// 	});
					
				// };

				$scope.registerNewPassword = function(newPassword){
					BackendService.postCodedPasswordResetData(token, {newPassword: newPassword}).then(function(){
						$scope.newPasswordSet = true;
					},function(){
						$scope.showError = true;
					});
				};
			},
			templateUrl: '../templates/external-password-reset.html'
		};
	}]
);


