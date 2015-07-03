'use strict';

app.factory('NotificationService', 
    ['BackendService', 'StringConverterService', function(BackendService, StringConverterService){


    var service = {
    	// notifications:
    	numAlertsToDisplay:0,

        calculateNumAlerts: function(notifications){
            
            var numAlerts = 0;

            angular.forEach(notifications, function(notification){
                console.log(notification);
                numAlerts += notification.extras.length + notification.replies.length + notification.hearts.length + notification.responses.length + notification.follows.length;
            });

            return numAlerts;

        },

    	updateNotifications: function(userId){
            if(service.user === undefined){
                service.user = userId;
            }
    		var promise = BackendService.getUserNotifications(userId).then(function(updatedNotifications){
                service.notifications = updatedNotifications;
                console.log(updatedNotifications);
    			return service.notifications;
    		});
    		return promise;
    	},

    	updateAlerts: function(userId){
    		var promise = BackendService.getUserAlerts(userId).then(function(alert){
                console.log(alert);
    			if(alert){
    				return service.updateNotifications(userId).then(function(updatedNotifications){
                        console.log(updatedNotifications);
    					service.numAlertsToDisplay = service.calculateNumAlerts(updatedNotifications);
    					return service.numAlertsToDisplay;
    				});
    			}else{
    				return 0;
    			}
    		});
    		return promise;
    	}
    	
    }
    return service;
}]);

