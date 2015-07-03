'use strict';

app.directive('dbAccount', 
	['BackendService', 'CommentService','UserService', 'TabService', '$rootScope', 'NotificationService', 'DetectMobileService', '$route',
	function (BackendService, CommentService, UserService, TabService, $rootScope, NotificationService, DetectMobileService, $route) {
		return {
		scope:{
			state: '='
		},
		restrict:'EA',

		controller:function($scope){
			var user = UserService.getUserId();
			$scope.username = UserService.getUsername();
			$scope.inviteeEmail = '';
			$scope.togglePersonalInfo = false;
			$scope.image = false;
			$scope.activeTab = TabService.getAccountTab();
			$scope.inviteMessage = 'Hey,\n\nI\'m a member of an online community. I think you would like it too. \n\n-'+$scope.username; 
			$scope.numInvitesSent = [];
			$scope.mobile = DetectMobileService.any();
			$scope.invitee = {};

			// $scope.$watch('profilePicture',function(newVal){
			// 	if(newVal !== undefined){
			// 		BackendService.postUser(user, {picture: newVal});
			// 	}
			// });


			$scope.$watch(function(){
				return TabService.getAccountTab();
			},function(newVal){
				$rootScope.Ui.set({'profileTab': newVal});
				// $scope.profileTab = newVal;
			});
			

			/*Lists the full messages of all of the notifications*/
			BackendService.getUserNotifications(user, 0).then(function(result){
				$scope.notifications = result;
				console.log('account call happening');
			});

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
			});

			// May want this call in userButton or MainCtrl ready to load it into
			// the account page when you reach that page. That would help avoid the
			// current stutter without userComments.
			BackendService.getUserCreatedPosts(user).then(function(comments){
				$scope.userComments = [];
				var displayVersion;
				angular.forEach(comments, function(comment){
					displayVersion = CommentService.createCommentForDisplay(comment)
					// console.log(displayVersion);
					$scope.userComments.push(displayVersion)
					if(comment.parent){
						comment.destination = comment.parent;
					}else{
						comment.destination = comment.id;
					}
				});
			});

			$scope.inviteNewUser = function(inviteeEmail, text){
				BackendService.inviteNewUser(inviteeEmail, user, text).then(function(result){
					$scope.accountInfo.invites -= 1;
					$scope.invitedSuccess = true;
				});
				$scope.invitee.email = '';
				$scope.numInvitesSent.push(1);
			};

			$scope.toggleSubscription = function(subscriptionStatus){
                $scope.loading = true;
				var data = {canceledSubscription: subscriptionStatus};
				BackendService.postUser(user, data).then(function(result){
					$scope.accountInfo = result.data.user;
					console.log(result);
					console.log($scope.accountInfo);
                    $scope.loading = false;
                    $route.reload();
				});
			};

			$scope.togglePersonalInfoEdit = function(){
				$scope.personalInfoEdit = !$scope.personalInfoEdit;
			};

			$scope.addPersonalInfo = function(bio, location, name){
				var data = {bio: bio, location: location};
				if (name){
					$scope.username = name;
					data.name = name;
					UserService.setUsername(name);
				}
				BackendService.postUser(user, data);
				$scope.personalInfoEdit = false;
			};

			$scope.setTab = function(activeTab){
				TabService.setAccountTab(activeTab);
			};

			$scope.getCreditCardInfo = function(){
				$scope.financialInfoStep = true;
			};

			// Financial Data functionality; could be its own directive, 
			// but the functionality is a little different

            BackendService.getMonthlyCost().then(function(monthlyCost){
                $scope.monthlyCost = monthlyCost;
            });

            var returnDueToError = function(error){
                $scope.loading = false;
                $scope.error = true;
                $scope.errorFromBackend = error.data;
            };

		    $scope.submitFinancialData = function(status, response){
                $scope.loading = true;
                if(response.error) {
                    console.log('error in stripe connection');
                    console.log(response.error);
                    returnDueToError(response.error.message);
                }else{
                    var data = {stripeToken: response.id};
                    BackendService.postUser(user, data).then(function(){
                    	$scope.loading = false;
                    	$route.reload();
                    },function(error){
                    	returnDueToError(error);
                    })
                }

            };


		},
		templateUrl: '../templates/account.html'
	};
}]);
