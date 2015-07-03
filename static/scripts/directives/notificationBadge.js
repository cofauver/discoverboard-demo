'use strict';

app.directive('dbNotificationBadge', 
	['NotificationService', 'UserService', 'TabService',
	function (NotificationService, UserService, TabService) {
		return {
			restrict:'EA',

			controller:function($scope){
				
				$scope.user = {};
				$scope.user.name = UserService.getUsername();
				$scope.userId = UserService.getUserId();
				$scope.showAlerts;
				$scope.numAlertsToDisplay = NotificationService.numAlertsToDisplay;
				$scope.notifications = NotificationService.notifications;

				var checkForAlerts = function(){
					NotificationService.updateAlerts($scope.userId).then(function(numAlerts){
						console.log(numAlerts);
						if(numAlerts > 0){
							$scope.numAlertsToDisplay = numAlerts;
							$scope.notifications = NotificationService.notifications;
						}
					})	
				}

				$scope.setNotificationTab = function(){
					TabService.setAccountTab(1);
				}

				$scope.deactivateNotifications = function(){
					$scope.numAlertsToDisplay = 0;
					NotificationService.numAlertsToDisplay = 0;
					angular.forEach($scope.notifications, function(notif){
						notif.active = 0;

					});
				};

				$scope.$on('$locationChangeStart', checkForAlerts());
				
			},
			templateUrl: '../templates/notification-badge.html'
		};
	}]
);
