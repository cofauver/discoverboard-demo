'use strict';

app.directive('dbHome', 
	['BackendService', 'CommentService','UserService', 'TabService', 'NotificationService', 'DetectMobileService', '$route',
	function (BackendService, CommentService, UserService, TabService,  NotificationService, DetectMobileService, $route) {
		return {
		scope:{
			state: '=',
		},
		restrict:'EA',

		controller:function($scope){
			var user = UserService.getUserId();
            console.log("User is:" + user);
			$scope.username = UserService.getUsername();
			$scope.inviteeEmail = '';
			$scope.togglePersonalInfo = false;
			$scope.image = false;
			$scope.activeTab = TabService.getAccountTab();
			$scope.inviteMessage = 'Hey,\n\nI\'m a member of an online community. I think you would like it too. \n\n-'+$scope.username; 
			$scope.numInvitesSent = [];
			$scope.mobile = DetectMobileService.any();
			$scope.invitee = {};

			$scope.state.loaded = true;
			$scope.state.postAlert = false;

            var allLoaded, index, scrollMarker;
            $scope.loadHasBeenTriggered = false;

            var view = document.getElementsByClassName('scrollable-content')[2];

            if (user){
                BackendService.getUserActivity(user).then(function(newActivity){
                    $scope.newsfeed = newActivity;
                    angular.forEach($scope.newsfeed, function(item){
                        if(item.activityType === 'post'){
                            item = CommentService.createCommentForDisplay(item);
                        }
                    });
                });
            }

			$scope.$watch('profilePicture',function(newVal){
				if(newVal !== undefined){
					BackendService.postUser(user, {picture: newVal});
				}
			});
			
            $scope.reportInView = function(index, inview){
                if(inview && index >= $scope.newsfeed.length - 4 && !$scope.loadHasBeenTriggered && !allLoaded){
                    $scope.loadHasBeenTriggered = true;

                    BackendService.getUserActivity(user, $scope.newsfeed.length).then(function(newActivity){
                        if(newActivity.length === 0){
                            allLoaded = true;
                        }else{
                            scrollMarker = view.scrollTop;
                            angular.forEach(newActivity, function(obj){
                            	if(obj.activityType === 'post'){
                					obj = CommentService.createCommentForDisplay(obj);
                            	}
                                $scope.newsfeed.push(obj);
                            });
                        }
                        $scope.loadHasBeenTriggered = false;
                    });
                }
            }

            
            if (user){
                /*
                Gets the user's account information
                cardEnding, email, id, invites, monthlySubscription: "cost in cents" , name, nextBilling
                */
                BackendService.getUser(user).then(function(result){
                    $scope.accountInfo = result;
                    $scope.profilePicture = result.picture;
                    $scope.octopusDays = result.octopusDays;

                    if(!$scope.accountInfo.cardEnding || $scope.accountInfo.canceledSubscription===1){
                        $scope.accountInfo.noSubscription = 1;
                    }else{
                        $scope.accountInfo.noSubscription = 0;
                    }

                    angular.forEach($scope.newsfeed, function(item){
                        if(item.activityType === 'post'){
                            item.posterPicture = $scope.profilePicture;
                        }
                    });
                });
            }

			$scope.togglePersonalInfoEdit = function(){
				$scope.state.personalInfoEdit = !$scope.state.personalInfoEdit;
			};

			$scope.addPersonalInfo = function(bio, location, name){
				var data = {bio: bio, location: location};
				if (name){
					$scope.username = name;
					data.name = name;
					UserService.setUsername(name);
				}
				BackendService.postUser(user, data);
				$scope.state.personalInfoEdit = false;
			};

			$scope.createPost = function(){
				element.triggerHandler('focusin');
			};

		},
		templateUrl: '../templates/home.html'
	};
}]);
