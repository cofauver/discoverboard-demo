'use strict';

app.directive('dbSetEmailFrequency', 
	['BackendService', 'UserService',
	function (BackendService, UserService) {
		return {
			scope:{
				accountInfo: '='
			},
			restrict:'EA',

			controller:function($scope){
				$scope.activityEmailFrequency = {label: 'day'};


				var user = UserService.getUserId();
				$scope.frequencyOptions  = [{label:'day', value:1}, 
											{label:'week', value:7},
											{label:'month', value:31},
											{label:'century', value: 36500}];
				$scope.frequencyOptionsSubset = $scope.frequencyOptions.slice(1);

				$scope.setActivityEmailFrequency = function(){
					var data = {activityEmailFrequency: $scope.activityEmailFrequency.value};
					BackendService.postUser(user, data);
				};

				$scope.setTopPostsEmailFrequency = function(){
					var data = {topPostsEmailFrequency: $scope.topPostsEmailFrequency.value};
					BackendService.postUser(user, data);
				};

				$scope.$watch('accountInfo',function(value){
					if(value){
						//sets the activityEmail frequency 
						if($scope.accountInfo.activityEmailFrequency === 1){
							$scope.activityEmailFrequency = $scope.frequencyOptions[0];
						}else if($scope.accountInfo.activityEmailFrequency === 7){
							$scope.activityEmailFrequency = $scope.frequencyOptions[1];
						}else if($scope.accountInfo.activityEmailFrequency === 31){
							$scope.activityEmailFrequency = $scope.frequencyOptions[2];
						}else if($scope.accountInfo.activityEmailFrequency === 36500){
							$scope.activityEmailFrequency = $scope.frequencyOptions[3];
						}

						//sets the topPostsEmail frequency
						if($scope.accountInfo.topPostsEmailFrequency === 7){
							$scope.topPostsEmailFrequency = $scope.frequencyOptionsSubset[0];
						}else if($scope.accountInfo.topPostsEmailFrequency === 31){
							$scope.topPostsEmailFrequency = $scope.frequencyOptionsSubset[1];
						}else if($scope.accountInfo.topPostsEmailFrequency === 36500){
							$scope.topPostsEmailFrequency = $scope.frequencyOptionsSubset[2];
						}
					}
				});
			},
			templateUrl: '../templates/set-email-frequency.html'
		};
	}]
);


