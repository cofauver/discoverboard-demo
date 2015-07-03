'use strict';

app.directive('dbComment', 
	['$sce', '$location',
	'RecursionHelper', 
	'CommentService', 
	'InteractionService',
	'UserService',
	'ColorService',
	'BackendService',
	'DetectMobileService',
	'ListService',
	function ($sce, $location, RecursionHelper, CommentService, InteractionService, UserService, ColorService, BackendService, DetectMobileService, ListService) {
		return {
			scope:{
				state: '=',
				comment: '=',
				depth: '='
			},
			restrict:'EA',

			controller:function($scope){
				
				var user = UserService.getUserId();
				$scope.username = UserService.getUsername();
				$scope.replyTextMarkup = '';
				$scope.parents = [];
				$scope.comment.collapse = false;
				$scope.comment.replies = CommentService.prepareChildren($scope.comment.children);
				$scope.depthColor = ColorService.barColor($scope.depth);
				$scope.isMobile = DetectMobileService.any();
				$scope.displayPermalink = false;
				$scope.inputText = {};

				$scope.signedIn = $scope.username ? true : false;

				// console.log($scope.comment.replies);


				/*When the backend comes back with a draft already filled in, fill in the input box*/
				if($scope.comment.replyDraft){
					$scope.inputText.markup = $scope.comment.replyDraft;
					$scope.replyInput = true;
				};

				if($scope.comment.id !== $scope.comment.topParentId && $scope.depth === 0){
					$scope.missingContext = true;
				}

				if($scope.username === $scope.comment.posterName && $scope.comment.replies.length === 0){
					$scope.eligibleToEdit = true;
				}

				if($scope.depth === 0 && $scope.comment.id === $scope.comment.topParentId){
					$scope.topLevelPost = true;
				}

				if($scope.username === $scope.comment.posterName){
					$scope.owner = true;
				}

				if($scope.comment.id === $scope.comment.topParentId){
					InteractionService.commentViewed(user, $scope.comment.id, Date.now());
				}

				if(($scope.depth === 4 && $scope.isMobile) || $scope.depth === 10){
					$scope.depthLimit = true;
				}

				$scope.tipComment = function(){
					// your tips stay true
					$scope.comment.tip = true;
					InteractionService.tipComment(user, $scope.comment.id); 
				};

				$scope.reportInView = function(whichComment, inview){
					if(inview && !$scope.comment.inview){
						// console.log('"' +whichComment.summary + '"  reporting enter interaction');
						InteractionService.commentInView(user, whichComment.id);
						$scope.comment.inview = true;

					}else if(!inview){
						// console.log('"' +whichComment.summary + '" reporting exit interaction');
						InteractionService.commentOutOfView(user, whichComment.id);
						$scope.comment.inview = false;

					}

				};

				$scope.prepareToDelete = function(){
					$scope.readyToDelete = true;
				}

				$scope.deletePost = function(){
					var postId = $scope.comment.id;
					console.log(postId);
					BackendService.updateComment(postId, {posterId: user, deleted: 1}).then(function(data){
						console.log(data);
						if(postId === $scope.comment.topParentId){
							ListService.removePostFromLatest(postId);
							$location.path('/');
						}else{
							$scope.deletedComment = true;
						}
     				});
				}



				$scope.getNextOpenGraph = function(){
					var nextOpenGraph = $scope.comment.opengraph.shift();
					console.log(nextOpenGraph);
					return nextOpenGraph;
				};


				//This piece of code was helpful for testing the interaction reporting for whether a comment was in view
				// $scope.lineInView = function(index, inview, inviewpart, event) {
				// 	var inViewReport = inview ? '<strong>enters</strong>' : '<strong>exit</strong>';
				// 	if (typeof(inviewpart) != 'undefined') {
				// 		inViewReport = '<strong>' + inviewpart + '</strong> part ' + inViewReport;
				// 	}
				// 	console.log(inViewReport);
				// 	// $scope.inviewLogs.unshift({ id: logId++, message: $sce.trustAsHtml('Line <em>#' + index + '</em>: ' + inViewReport) });
				// 	console.log(event);
				// 	return false;
				// }

				$scope.reportOutOfView = function(){
					InteractionService.commentOutOfView(user, $scope.comment.id);
				};



				/*Opens the reply textbox*/
				$scope.toggleReply = function(){
					$scope.replyInput = !$scope.replyInput;
					if ($scope.replyInput){
						var page = document.getElementsByClassName('scrollable-content')[2];
            			page.scrollTop += 200;
					}
				};

				/*Opens a text box that allows editing*/
				$scope.toggleEdit = function(){
					$scope.editing = true;
				};
	
				/*
				When you click on one of the excerpt glyphicons, this will
				excerpt the text in the comment box at the end of the current
				comment string
				*/
		    	$scope.excerptParagraph = function(excerpt, creator){
		    		if($scope.inputText.markup){
		    			$scope.inputText.markup = $scope.inputText.markup + '<p></p><blockquote>' + excerpt + '<em>@' + creator + '</em></blockquote><p></p>';
		    		}else{
		    			$scope.inputText.markup = '<p></p><blockquote>' + excerpt + '<em>@' + creator + '</em></blockquote><p></p>';
		    		}
		    		$scope.replyInput = true;
		    	};


			},
			templateUrl: '../templates/comment.html',

			//Adjusting compile allows us to avoid conflicts in nesting dbComments within dbComments
			compile: function(element, attrs) {
	            // Use the compile function from the RecursionHelper,
	            // And return the linking function(s) which it returns
	            // console.log('In compile: ');
	            // console.log(element);
	            return RecursionHelper.compile(element);
	        }
		};
	}]
);
