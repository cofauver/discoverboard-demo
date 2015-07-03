'use strict';

app.directive('dbUserButton', ['$route', '$log', 'UserService', 'BackendService', 'StringConverterService', 
	function ($route, $log, UserService, BackendService, StringConverterService) {
		return {
			restrict: 'EA',
			templateUrl: '../../templates/user-button.html',
			scope:{
				loggedIn: '='
			},
			controller: function($scope){
				$scope.user = {};
				$scope.user.name = UserService.getUsername();
				var userId = UserService.getUserId();

				if($scope.user.name){
					$scope.usernameFontSize = StringConverterService.determineFontSize($scope.user.name);
				}else{
					$scope.usernameFontSize = '8pt';
				}
	 
				$scope.logOut = function(){
					UserService.removeUsername();
					UserService.removeUserId();
					UserService.removeSessionKey();
					$scope.user.name = null;
					userId = null;
					$scope.loggedIn = false;
					$route.reload();
				};

				var checkForNotifications = function(){
					BackendService.getNotifications(userId).then(function(notifications){
						// console.log('retrieved all notifications');
						// console.log(notifications);

						// this will need some adjustment based on whether notifications is a list
						// of stuff that happened or a number of events that we want to tell the
						// user about.
						$scope.notifications = notifications;
					});
				};

				var updateUserState = function(){
					// checkForNotifications();
				}

				// $scope.$on('$locationChangeStart', updateUserState());

				$scope.$watch(function(){
					return UserService.getUsername();
				},function(newVal, oldVal){
					if(newVal){
						$scope.user.name = newVal;
					}
				})
				
				// Angular UI Bootstrap
				$scope.status = {
				  isopen: false
				};

				$scope.toggled = function(open) {
				  $log.log('Dropdown is now: ', open);
				};

				$scope.toggleDropdown = function($event) {
				  $event.preventDefault();
				  $event.stopPropagation();
				  $scope.status.isopen = !$scope.status.isopen;
	  			};

			}
		};
	}
]);
