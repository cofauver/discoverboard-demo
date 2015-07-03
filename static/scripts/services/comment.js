'use strict';

app.factory('CommentService',
	['BackendService', 'StringConverterService','TimeService', 'DetectMobileService',
	function(BackendService, StringConverterService, TimeService, DetectMobileService){
		var isMobile = DetectMobileService.any();
		var serviceDefObj = {
			/*createComment builds front end comment objects. 
			It is used in 2 cases. 
				1. When a user first posts a comment (no time will be included)
				2. When a backend comment object needs a front end analog to 
					display correctly (time will be passed in because it was already set 
					in the past.)
				*/

			createCommentForDisplay : function(commentObj, isTopLevel){
				
    			// commentObj.replyDraft = '<p>Sample paragraph <em>text for the <strong>reply</strong></em></p>';


				/*Adding proper time formatting*/ 
				if(!commentObj.time){
					commentObj.time = Date.now();
				}
				commentObj.timeToDisplay = TimeService.howLongAgo(commentObj.time);

				/*Adding proper text formatting*/ 
    			commentObj.textToDisplay = StringConverterService.processRawComment(commentObj.html, isTopLevel);

    			/*Changing tip formatting to be readable for front end*/
				if(commentObj.tip === 1){
					commentObj.tip = true;
				}else{
					commentObj.tip = false;
				}
    				
    			/*Setting parent attribute*/
    			if(!commentObj.parent){
    				commentObj.parent = commentObj.parents[0]
    			}

				return commentObj;
			},

			retrieveComment: function(postId, userId){
				var comment, promise;
				if(isMobile){
					promise = BackendService.getPostWithChildren(postId, userId, 4).then(function(post){
						comment = post;
						comment = serviceDefObj.createCommentForDisplay(comment, true);
						return comment;
					});
				}else{
					promise = BackendService.getPostWithChildren(postId, userId, 10).then(function(post){
						comment = post;
						comment = serviceDefObj.createCommentForDisplay(comment, true);
						return comment;
					});
				}
				return promise
			},

			//for non-signed-in situation
			retrievePreview: function(postId){
				var comment, promise;
				if(isMobile){
					promise = BackendService.getPostPreview(postId, 4).then(function(post){
						comment = post;
						comment = serviceDefObj.createCommentForDisplay(comment, true);
						return comment;
					});
				}else{
					promise = BackendService.getPostPreview(postId, 10).then(function(post){
						comment = post;
						comment = serviceDefObj.createCommentForDisplay(comment, true);
						return comment;
					});
				}
				return promise
			},

			prepareChildren: function(childrenList){
				var preparedChildren = [];
				angular.forEach(childrenList, function(child){
					var childObj = serviceDefObj.createCommentForDisplay(child);
					preparedChildren.push(childObj);
				});
				return preparedChildren;
			}

		};

		return serviceDefObj;
	}]
);
