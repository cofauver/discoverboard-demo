'use strict';

app.directive('dbPasswordReset',
    ['BackendService', 'UserService', 
    function(BackendService, UserService){
    	return {
    		templateUrl: '../templates/password-reset.html',
    		restrict: 'EA',

        	controller:function($scope, $location){
        		var user = UserService.getUserId();

                var displayError = function(){
                    $scope.displayError = true;
                    $scope.errorText = 'Your current password may have been incorrect';
                }

        		$scope.resetPassword = function(oldPassword, newPassword){
                    $scope.displayError = false;
                    $scope.submitting = true;
        			var data = {password: oldPassword, newPassword:newPassword};
        			BackendService.postUser(user, data).then(function(result){
                        console.log(result);
                        $scope.submitting = false;
                        if(result === 'Authentication required'){
                            displayError();
                        }else{
                            $scope.displaySuccess = true;   
                        }
                    }); 
        		};
        	}

    	};
    }]
)