'use strict';

app.directive('dbCreateAccount', 
    ['$location',
    '$routeParams', 
    'BackendService', 
    'UserService',
    'LocalStorageService',
    function($location, $routeParams, BackendService, UserService, LocalStorageService){
    	return {
    		restrict: 'EA',
    		controller:function($scope, $location){

                /*functions*/
            	var returnDueToError, generateSessionKey, generateUserId, completeSignup, moveToStripeForm;

                /*values*/
                var inviteKey, storedInvite, data, userId, userName, sessionKey;

                $scope.personalInfoStep = true;
                $scope.financialInfoStep = false;
                $scope.spinner = false;
                $scope.error = false;

                inviteKey = LocalStorageService.inviteCodeKey;
                storedInvite = LocalStorageService.load(inviteKey);

                if($routeParams.emailAddress){
                    $scope.email = $routeParams.emailAddress;
                }
                
                if($routeParams.inviteCode){
                    $scope.prefilledCode=$routeParams.inviteCode;
                    $scope.inviteCode = $routeParams.inviteCode;
                }else if(storedInvite){
                    $scope.prefilledCode = storedInvite;
                    $scope.inviteCode = storedInvite;
                }

            	

                BackendService.getMonthlyCost().then(function(monthlyCost){
                    $scope.monthlyCost = monthlyCost;
                });

                returnDueToError = function(error){
                    console.log('failure');
                    $scope.financialInfoStep = false;
                    $scope.spinner = false;
                    $scope.personalInfoStep = true;
                    $scope.error = true;
                    $scope.errorFromBackend = error;
                };

                generateSessionKey = function(){
                    var promise = BackendService.authenticate(data.email, data.password).then(function(result){
                        data.sessionKey = result.data.authentication.sessionKey;
                        console.log(data.sessionKey);
                    });
                    return promise;
                };

                generateUserId = function(data){
                    var promise = BackendService.createUser(data).then(function(result){
                        console.log(result.data.user.id);
                        data.id = result.data.user.id;
                    },function(err){
                        returnDueToError(err.data);
                    });
                    return promise;
                };


                completeSignup = function(){
                    UserService.setUsername(data.name);
                    UserService.setUserId(data.id);
                    UserService.setSessionKey(data.sessionKey);
                    $scope.spinner = false;
                    $location.path('/');
                };
                    

                moveToStripeForm = function(){
                    $scope.spinner = false;
                    $scope.personalInfoStep = false;
                    $scope.financialInfoStep = true;
                };


                $scope.completePersonalInfoStage = function(name, email, password){
                    data = {name: name, email: email, password: password};
                    $scope.personalInfoStep = false;
                    $scope.error = false;
                    $scope.spinner = true;
                    generateUserId(data).then(function(result){
                        //only happens for success of the above
                        generateSessionKey().then(function(){
                            completeSignup();
                        });
                    });
                };

                $scope.submitFinancialData = function(status, response){
                    $scope.financialInfoStep = false;
                    $scope.spinner = true;
                    if(response.error) {
                        console.log('error in stripe connection');
                        console.log(response.error);
                        returnDueToError(response.error.message);
                    }else{
                        data.stripeToken = response.id;
                        generateUserId(data).then(function(){
                            generateSessionKey().then(function(){
                                completeSignup();
                            });
                        });
                    }
                };            
            },
                
    		templateUrl: '../templates/create-account.html'
    	};
    }
]);
