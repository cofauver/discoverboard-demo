'use strict';

app.directive('dbSidebar', 
	['UserService', 'BackendService', 'TimeService', 'ListService', 'TabService', '$rootScope', 'SharedState', 'DetectMobileService', 'WindowSizeService', '$window',
	function (UserService, BackendService, TimeService, ListService, TabService, $rootScope, SharedState, DetectMobileService, WindowSizeService, $window) {
		return {
		restrict:'EA',

		controller:function($scope){
			$scope.mobile = DetectMobileService.any();
			SharedState.initialize($scope, 'postTab', {defaultValue: 1});
            var sessionKey = UserService.getSessionKey();
            $scope.searchText = '';
            $scope.searchResult = false;
            $scope.searching = false;
            $scope.windowWidth = WindowSizeService.getWindowWidth();
            console.log($scope.windowWidth);

            var addTimeStamps = function(list){
				angular.forEach(list, function(post){
					post.timeToDisplay = TimeService.howLongAgo(post.time);
				});
				return list;
			};

			$scope.$watch(function(){return $scope.searchText;},
				function(){
					if($scope.searchText.length === 0){
						$scope.searchResult = false;
						$scope.searching = false;
					}else{
						$scope.searchResult = false;
						$scope.searching = true;
					}
			});

			$scope.$watch(function(){
				SharedState.initialize($scope, 'postTab');
				return TabService.getSidebarTab();
			},function(newVal){
				$rootScope.Ui.set({'postTab': newVal});
			});


   //  		var w = angular.element($window);
			// $scope.$watch(function(){return w.width();},
			// 	function(newVal){
			// 		$scope.windowWidth = WindowSizeService.getWindowWidth();
			// 		console.log($scope.windowWidth);
			// });
			
			$scope.setTab = function(postTab){
				TabService.setSidebarTab(postTab);
			};

			$scope.clearSearch = function(){
				$scope.filterText = '';
			};

			$scope.$watch(function(){
					return ListService.latestList;
				},function(newVal){
					$scope.latestPosts = newVal;
				}
			);

			$scope.$watch(function(){
					return UserService.getSessionKey();
				},function(newVal, oldVal){
					$scope.user = UserService.getUserId();
					if(newVal === undefined || newVal === null){
						$scope.loggedIn = false;
						$scope.octopusDays = 0;
						BackendService.getSamplePosts().then(function(samplePosts){
							samplePosts = ListService.addTimeStamps(samplePosts);
							$scope.samplePosts = samplePosts;
						});
						$scope.featuredPosts = undefined;
						$scope.latestPosts = undefined;
					}else{
						$scope.loggedIn = true;
						sessionKey = newVal;
						BackendService.getUser($scope.user).then(function(result){
							$scope.octopusDays = result.octopusDays;
							$scope.expired = result.expired === 1? true: false;
							if($scope.expired){
								BackendService.getSamplePosts().then(function(samplePosts){
									samplePosts = ListService.addTimeStamps(samplePosts);
									$scope.samplePosts = samplePosts;
								});
							}
							else{
								BackendService.getFeaturedPosts($scope.user).then(function(featuredPosts){
									featuredPosts = ListService.addTimeStamps(featuredPosts);
									$scope.featuredPosts = featuredPosts;
									// console.log($scope.featuredPosts);
									ListService.setFeaturedList(featuredPosts);
								});

								BackendService.getLatestPosts($scope.user).then(function(latestPosts){
									latestPosts = ListService.addTimeStamps(latestPosts);
									$scope.latestPosts = latestPosts;
									// console.log($scope.latestPosts);
									ListService.setLatestList(latestPosts);
								});
							}
						});

					}
				}
			);

			$scope.setTab = function(postTab){
				TabService.setSidebarTab(postTab);
			};

			$scope.clearSearch = function(){
				$scope.searchText = '';
				$scope.searchResult = false;

			};

			$scope.search = function(searchQuery){
				if(searchQuery){
					BackendService.searchPosts(searchQuery).then(function(searchResult){
						console.log(searchResult);
						if(searchResult.length === 0){
							$scope.searchResult = 1;
						}else{
							$scope.searchResult = searchResult;	
						}
						$scope.searching = false;
					});
				}
			};

		},
		templateUrl: '../templates/sidebar.html'
	};
}]);
