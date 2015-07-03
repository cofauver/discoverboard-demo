'use strict';

app.directive('dbProfileCompletion', 
	['BackendService', 'UserService', 'TabService', 'ListService',
	function (BackendService, UserService, TabService, ListService) {
		return {
			scope: {
				state: '='
			},
			restrict:'EA',

			controller:function($scope){

				$scope.checkedOff = {};
				$scope.userId = UserService.getUserId();
				

				var checkOffList = function(listItem){
					if($scope.checklist.indexOf(listItem) === -1){
						$scope.checkedOff[listItem] = true;
					}
				};

				$scope.setAccountTab = function(tabVal){
					TabService.setAccountTab(tabVal);
				};

				$scope.setSidebarTab = function(tabVal){
					TabService.setSidebarTab(tabVal);
				};

				$scope.$watch(function(){
					return ListService.getFeaturedList();
				},function(newVal, oldVal){
					if(newVal){
						$scope.state.topFeaturedPostId = ListService.getFeaturedList()[0].id;
					}
				});

				BackendService.getUser($scope.userId).then(function(result){
					
					$scope.checklist = result.checklist;
					// console.log(result.checklist);
					var checklistVars = ['post', 'invite', 'reply', 'community', 'completed', 'profile'];

					angular.forEach(checklistVars, function(item){
						checkOffList(item);
					});

					$scope.completeVal = Math.ceil(16.66666 + (checklistVars.length - $scope.checklist.length) * 16.66666);

					if($scope.checklist.length === 1){
						$scope.checklistComplete = true;
					}else if($scope.checklist.length === 0){
						$scope.state.checklistComplete = true;
					}

					$scope.state.loaded = true;

				});

				$scope.routeToContent = function(){
					if($scope.checklist.indexOf('completed') > -1){
						BackendService.postUser($scope.userId, {'checklist': 'completed'});
						$scope.state.checklistComplete = true;
						$scope.setSidebarTab(1);
					}				
				};

			},
			templateUrl: '../templates/profile-completion.html'
		};
	}]
);
