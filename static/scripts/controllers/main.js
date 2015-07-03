'use strict';

app.controller('MainCtrl', 
	['$scope',
	 '$routeParams', 
	 '$location', 
	 'BackendService', 
	 'UserService', 
	 'TimeService', 
	 'CommentService', 
	 'DetectMobileService', 
	 'InteractionService', 
	 'SharedState',
	 'TabService',
	 'LocalStorageService',
	function ($scope, $routeParams, $location, BackendService, UserService, TimeService, CommentService, DetectMobileService, InteractionService, SharedState, TabService, LocalStorageService){
		

		var inviteKey = LocalStorageService.inviteCodeKey;
		/*
		state is an object to be shared with all of the directives that
		operate on the main page. It serves as a sort of custom scope object
		that can be manipulated and relied on from anywhere within the page.
		*/
		$scope.state = {};
		$scope.isMobile = DetectMobileService.any();
		$scope.isOldiOS = DetectMobileService.OldiOS();
		// These are attempts to make the left Sidebar display at the appearance of the page for mobile
		SharedState.initialize($scope, 'uiSidebarLeft');
		SharedState.initialize($scope, 'postTab');
		// SharedState.turnOn('uiSidebarLeft');
		
		// console.log($routeParams.postId);

		BackendService.getUser($scope.user).then(function(result){
			$scope.verificationNeeded = result.verificationCode === 1? true : false;
			$scope.state.expired = result.expired === 1? true: false;
			// $scope.state.expired = true;
			$scope.userEmail = result.email;
		});

		/*
		Several different routes use the main controller, which is in charge of the 
		content window to the right. These logical statements determine what to display
		in the content area. Unfortunately having the templates within this view window
		means that we don't take advantage of the route provider and need to use this 
		hacky "route provider"
		*/
		if($location.path() === '/'){
			$scope.state.main = true;
		}

		else if($location.path() === '/write-post'){
			$scope.state.writePost = true;
		}

		else if($location.path() === '/about'){
			$scope.state.about = true;
		}

		else if($location.path() === '/tos'){
			$scope.state.tos = true;
		}

		else if($location.path() === '/privacy'){
			$scope.state.privacy = true;
		}

		else if($location.path() === '/faq'){
			$scope.state.faq = true;
		}

		else if($location.path() === '/sign-up'){
			$scope.state.signUp = true;
		}

		else if($location.path() === '/sign-in'){
			$scope.state.signIn = true;
		}

		else if($location.path() === '/contact'){
			$scope.state.contact = true;
		}

		else if($location.path() === '/forgotPassword'){
			$scope.state.forgotPassword = true;
		}

		else if($location.path() === '/anonymous-posting'){
			$scope.state.anonymousPosting = true;
		}

		else if($location.path() === '/two-week-anonymous'){
			$scope.state.twoWeekAnonymous = true;
		}

		else if($location.path() === '/account'){
			$scope.state.accountPage = true;
		}

		else if($routeParams.emailAddress || $routeParams.inviteCode){
			$scope.state.signUp = true;
		}

		else if($routeParams.resetToken){
			$scope.state.externalPasswordReset = true;	
		}

		else if($routeParams.profileOwner){
			$scope.state.publicProfile = true;
		}

		else if($routeParams.verifyKey){
			$scope.state.verifyUser = true;
		}

		else if($routeParams.inviteCodeToStore){
			$scope.state.main = true;
			LocalStorageService.save(inviteKey, $routeParams.inviteCodeToStore);
		}

		else if($routeParams.tabString){
			$scope.state.accountPage = true;
			var tab = $routeParams.tabString;
			if(tab === 'notifications'){
				TabService.setAccountTab(1);
			}
			else if(tab === 'commentHistory'){
				TabService.setAccountTab(2);
			}
			else if(tab === 'payment'){
				TabService.setAccountTab(3);
			}
			else if(tab === 'invites'){
				TabService.setAccountTab(4);
			}
			else if(tab === 'passwordReset'){
				TabService.setAccountTab(5);
			}
		}

		else if($routeParams.postId){
			var userId = UserService.getUserId();
			if(userId){
		    	CommentService.retrieveComment($routeParams.postId, userId)
		    		.then(function(commentFromService){
			    		$scope.comment = commentFromService;
			    		$scope.comment.childrenChecked = true;
		    		}
		    	);
		    }else{
		    	console.log('retrievePreview');
		    	CommentService.retrievePreview($routeParams.postId)
		    		.then(function(previewFromService){
			    		$scope.comment = previewFromService;
			    		$scope.comment.childrenChecked = true;
		    		}
		    	);
		    }
		}

	}]
);
