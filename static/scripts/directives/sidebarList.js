'use strict';

app.directive('dbSidebarList', 
	['$timeout', 'BackendService', 'ListService', 'UserService', 
	function ($timeout, BackendService, ListService, UserService) {
		return {
			scope:{
				list: '=',
				listName: '=',
				number: '=',
				searching: '='
			},
			restrict:'EA',

			controller:function($scope){
				var allLoaded, user, index, scrollMarker;
				$scope.loadHasBeenTriggered = false;
				user = UserService.getUserId();

				$scope.signedIn = user? true:false;

				$scope.$watch(function(){
					return UserService.getUserId();
				},function(newVal){
					$scope.signedIn = UserService.getUserId() ? true:false;
				});

				var sidebar = document.getElementsByClassName('scrollable-content')[1];


				$scope.reportInView = function(index, inview){
					if(inview && index >= $scope.list.length - 4 && !$scope.loadHasBeenTriggered && !allLoaded){
						$scope.loadHasBeenTriggered = true;
						console.log('near bottom');
						console.log(sidebar.scrollTop);

						BackendService.getLatestPosts(user, $scope.list.length).then(function(newPosts){
							console.log(newPosts);
							if(newPosts.length === 0){
								allLoaded = true;
							}else{
								scrollMarker = sidebar.scrollTop;
								newPosts = ListService.addTimeStamps(newPosts);
								angular.forEach(newPosts, function(post){
									$scope.list.push(post);
								});
								ListService.setLatestList = $scope.list;
								sidebar.scrollTop = scrollMarker;
							}
							$scope.loadHasBeenTriggered = false;
						});
					}
				}
			},
			templateUrl: '../templates/sidebar-list.html'
		};
	}]
);
