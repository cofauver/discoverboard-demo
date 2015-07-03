'use strict';

/*This service contacts the back end. It is the only place that contacts the backend.
All GET calls return a promise.

	1. POST /users
 	2. GET /users/<userid>
 	3. POST /users/<userid>
	4. GET /posts *** NOT IMPLEMENTED HERE ***
	5. POST /posts
	6. GET /posts/<postid>
	7. POST /posts/<postid>
	8. GET /users/<userid>/posts
	9. GET /users/<userid>/featured
	10. GET /users/<userid>/latest
	11. POST /tips
	12. POST /interactions
	12a. POST /visitorInteractions
	13. GET /interactions/<interactionid>
	14. POST /interactions/<interactionid>
	15. GET /users/<userid>/interactions
	16. GET /posts/<postid>/interactions
	17. GET /posts/<postid>/children
	18. GET /flags
	19. POST /flags
	20. GET /flags/<flagid>
	21. POST /flags/<flagid>
	22. POST /invites
	23. GET /invites/<inviteid>
	24. GET /users/<userid>/invites
	25. GET /users/<userid>/profile
	26. GET /users/<userid>/alerts
	27. GET /users/<userid>/notifications
	27 b. GET users/<userid>/friends
	28. POST /authentications
	29. GET /monthlyCost
	30. POST /feedback
	31. GET /samplePosts

	32. POST /passwordResetToken
	33. POST /passwordResetToken/<code>
	34. POST /suggestions
	35. POST /user/<userid>/drafts
	36. GET /user/<userid>/drafts
	*/



app.factory('BackendService',['$http', 'DetectMobileService', 'LocalStorageService', function($http, DetectMobileService, LocalStorageService){
	

	var errorReport = function(methodString, err){
		console.log('ERROR in the BackendService while performing ' + methodString + ':');
		console.log(err);

		// This guards against having two users signed in on the same browser.
		// The browser will reload when an interaction call is unauthorized
		if(methodString === 'postInteraction' && err.statusText === 'UNAUTHORIZED'){
			location.reload();
		}

		return err.data;
	};

	var sessionKeyKey = LocalStorageService.sessionKeyKey;
	var currentSessionKey = LocalStorageService.load(sessionKeyKey);

	var backend = {
		sessionKeyHeader: {headers: {'Sessionkey': currentSessionKey}},
		setSessionKeyHeader: function(sessionKey){
			this.sessionKeyHeader = {headers: {'Sessionkey': sessionKey}};
		},

		clearSessionKey: function(){
			this.sessionKeyHeader = null;
		},

		/*
		1. Creates a new user on the backend and returns a new userId
		endpoint: POST /users
		returns: the user's id
		*/
		createUser : function(data){
			var promise = $http.post('/api/users', data).success(function(data, status, headers, config){
				return data.user.id;
			}).error(function(err){
				return errorReport('createUser',err);
			});
			return promise;
		},

		/*
		2.
		endpoint: GET /users/UID
		returns: the user
		Requires sessionKey in header
		*/
		getUser: function(userId){
			var promise = $http.get('/api/users/'+ userId, this.sessionKeyHeader).then(function(result){
				return result.data.user;
			},function(err){
				return errorReport('getUser',err);
			});
			return promise;
		},
	
		/*
		3. 
		endpoint: POST /users/UID
		returns: the user
		Requires sessionKey in header
		*/
		postUser : function(userId, data){

			var promise = $http.post('/api/users/'+ userId, data, this.sessionKeyHeader).success(function(result){
				return result.user;
			}).error(function(err){
				return errorReport('postUser',err);
			});
			return promise;
		},

		/*
		4.
		endpoint: GET /posts
		returns: posts, filtered by parameters
		*/
		

		searchPosts: function(searchQuery){
			var promise = $http.get('/api/posts?searchQuery='+searchQuery, this.sessionKeyHeader).then(function(result){
				return result.data.posts;
			},function(err){
				return errorReport('searchPosts',err);
			});
			return promise;
		},
		
		/*
		5.
		endpoint: POST /posts
		returns: the post
		Requires sessionKey in header
		*/
		createComment: function(data){ //add title and link as pieces that you can pass in.
			var promise = $http.post('/api/posts', data, this.sessionKeyHeader).then(function(result){
				console.log(result);
				return result.data.post; 
			},function(err){
				return errorReport('createComment',err);
			}); 
			return promise;
		},
		/*
		6.
		endpoint: GET /posts/PID
		returns: the post object
		*/
		getPost: function(postid){
			var promise = $http.get('/api/posts/'+ postid).then(function(result){
				return result.data.post;
			},function(err){
				return errorReport('getComment',err);
			});
			return promise;
		},
		/*
		7.
		endpoint: POST /posts/PID
		returns: ?
		Requires sessionKey in header
		*/
		updateComment:function(postid, data){
			var promise = $http.post('/api/posts/'+ postid, data, this.sessionKeyHeader).then(function(result){
				return result.data.post;
			},function(err){
				return errorReport('updateComment',err);
			}); 
			return promise;
		},
		
		/*
		8.
		endpoint: GET /users/UID/posts
		returns: the posts/comments this user has made
		Requires sessionKey in header
		*/
		getUserCreatedPosts: function(posterId){
			var promise = $http.get('/api/users/'+ posterId + '/posts', this.sessionKeyHeader).then(function(result){
				return result.data.posts;
			},function(err){
				return errorReport('getUserCreatedPosts',err);
			});
			return promise;
		},
		/*
		9.
		endpoint: GET /users/UID/featured
		returns: the posts that are featured for this user to see
		Requires sessionKey in header
		*/
		getFeaturedPosts: function(userId){
			var promise = $http.get('/api/users/' + userId + '/featured', this.sessionKeyHeader)
			.then(function(result){
				return result.data.posts;
			},function(err){
				return errorReport('getFeaturedPosts',err);
			});
			return promise;
		},
		/*
		10.
		endpoint: GET /users/UID/latest
		returns: the latest posts for this user to see
		Requires sessionKey in header
		*/
		getLatestPosts: function(userId, currentLength){
			if(currentLength){
				var desiredLength = currentLength + 25;
				var promise = $http.get('/api/users/' + userId + '/latest?start='+ currentLength + '&end=' + desiredLength, this.sessionKeyHeader)
				.then(function(result){
					return result.data.posts;
				},function(err){
					return errorReport('getLatestPosts',err);
				});
				return promise;
			}else{
				var promise = $http.get('/api/users/' + userId + '/latest', this.sessionKeyHeader)
				.then(function(result){
					return result.data.posts;
				},function(err){
					return errorReport('getLatestPosts',err);
				});
				return promise;
			}
		},

		/*
		11.
		endpoint: POST /tips
		returns: ??
		Requires sessionKey in header
		*/
		tip: function(user, post){
			var promise = $http.post('/api/tips', {userId:user,postId:post}, this.sessionKeyHeader)
			.then(function(result){
				return result.data;
			},function(err){
				return errorReport('tip',err);
			}); 
			return promise;
		},
		/*
		12. 
		endpoint: POST /interactions
		returns: an interaction id
		*/
		postInteraction: function(data){
			data.referrer = document.referrer;
			var promise = $http.post('/api/interactions', data, this.sessionKeyHeader)
			.then(function(result){
				return result.data.interaction.id;
			},function(err){
				return errorReport('postInteraction',err);
			});
			
			return promise;
		},
	    /*	
		12a. 
		endpoint: POST /visitorInteractions
		returns: an interaction 
		*/
		postVisitorInteraction: function(data){
			data.referrer = document.referrer;
			var promise = $http.post('/api/visitorInteractions', data)
			.then(function(result){
				return result.data.interaction.id;
			},function(err){
				return errorReport('postVisitorInteraction',err);
			});
			
			return promise;
		},
		
		/*
		13. 
		endpoint: GET /interactions/IID
		returns: a single interaction object
		*/
		getInteraction: function(interactionId){
			var promise = $http.get('/api/interactions/'+interactionId).then(function(result){
				return result.data.interaction;
			},function(err){
				return errorReport('getInteraction',err);
			}); 
			return promise;
		},
		/*
		14.
		endpoint: POST /interactions/IID
		returns: ?
		*/
		updateInteraction: function(interactionid, interactionObject){
			var promise = $http.post('/api/interactions/'+interactionid, interactionObject).then(function(result){
				return result.data.interaction.id;
			},function(err){
				return errorReport('updateInteraction',err);
			}); 
			return promise;
		},
		
		/*
		15. 
		endpoint: GET /users/UID/interactions
		return: the interactions for a specific user
		Requires sessionKey in the header
		*/
		getUserInteractions: function(userId){
			var promise = $http.get('/api/users/'+userId+'/interactions', this.sessionKeyHeader)
			.then(function(result){
				return result.data.interactions;
			},function(err){
				return errorReport('getUserInteractions',err);
			}); 
			return promise;
		},
		/*
		16. 
		endpoint: GET /posts/PID/interactions 
		returns: the interactions that users have with any given post
		*/
		getPostInteractions: function(postid){
			var promise = $http.get('/api/posts/'+postid+'/interactions').then(function(result){
				return result.data.interactions;
			},function(err){
				return errorReport('getPostInteractions',err);
			}); 
			return promise;
		},
		

		/*
		17.
		endpoint: GET /posts/PID/children   OR    GET /posts/PID/children?depth=D
		returns: all of the children of the specified post (up to the specified depth)
		NOTE: we use forUser because it will return whether or not a specific user has
		tipped each child post.
		*/
		getPostWithChildren: function(postId, userId, depth){
			if (depth){
				var promise = $http.get('/api/posts/'+postId+'/children?forUser=' + userId + '&depth='+depth, this.sessionKeyHeader)
				.then(function(result){
					return result.data.posts;
				},function(err){
					return errorReport('getPostWithChildren',err);
				});	
			}else{
				var promise = $http.get('/api/posts/'+postId+'/children?forUser=' + userId, this.sessionKeyHeader)
				.then(function(result){
					return result.data.posts;
				},function(err){
					return errorReport('getPostWithChildren',err);
				});
			} 
			return promise;
		},

		/* 
		17b.
		/posts/PID/preview 
		*/
		getPostPreview: function(postId){
			var promise = $http.get('/api/posts/'+postId+'/preview')
			.then(function(result){
				return result.data.posts;
			},function(err){
				return errorReport('getPostPreviews',err);
			});
 
			return promise;
		},
		
		/*
		18. 
		endpoint: GET /flags
		Purpose: Returns flags, filtered by parameters.
	        Parameters: flaggerId
	            flaggerId: userId of user that created the flag, optional
	            **DESIRED** postId: the id of a post that may or may not be flagged, optional
	        Data: None
	        Returns: {'flags': [{'id': %s, ...}, {'id': %s, ...}]}
		*/
		getFlags: function(flaggerId){
			var promise;
			if(flaggerId){
				promise = $http.get('/api/flags?flaggerId='+flaggerId, this.sessionKeyHeader)
				.then(function(result){
					return result.data.flags;
				},function(err){
					return errorReport('getFlags',err);
				});
			}else{
				promise = $http.get('/api/flags', this.sessionKeyHeader)
				.then(function(result){
					return result.data.flags;
				},function(err){
					return errorReport('getFlags',err);
				});
			}
			return promise;
		},
		/*
		19. 
		endpoint: POST /flags
		Purpose: Create a new flag with the specified data.
	        Data: flaggerId, postId
	            flaggerId: userId of user creating this flag, required
	            postId: postid of the flagged post, required
	        Returns: {'flag': {'id': %s, 'flaggerId': %s, 'postId': %s, 'confirmations': [%s, ...], 'rejections': [%s, ...]}}
		*/
		postFlag: function(flaggerId, postId, reason){
			var data = {flaggerId: flaggerId, postId: postId, reason: reason};
			var promise = $http.post('/api/flags', data, this.sessionKeyHeader)
			.then(function(result){
				return result.data.flag;
			},function(err){
				if(err.status === 409){
					return 'This post has already been flagged';
				}else{
					return errorReport('postFlag', err);
				}
			}); 
			return promise;
		},
		/*
		20. 
		endpoint: GET /flags/<flagid>
		Purpose: Returns a flag specified by id
	        Returns: {'flag': {'id': %s, 'flaggerId': %s, 'postId': %s, 'confirmations': [%s, ...], 'rejections': [%s, ...]}}
		*/
		getFlagById: function(flagId){
			var promise = $http.get('/api/flags/'+flagId).then(function(result){
				return result.data.flag;
			},function(err){
				return errorReport('getFlagById',err);
			});
			return promise;
		},
		/*
		21. 
		endpoint: POST /flags/<flagid>
		Purpose: Update the specified flag.
	        Data: flaggerId, postId, confirmations, rejections
	            flaggerId: userId of user creating this flag, optional
	            postId: postid of the flagged post, optional
	            confirmations: integer number of confirmations to add to this flag, optional
	            rejections: integer number of rejections to add to this flag, optional
	        Returns: {'flag': {'id': %s, 'flaggerId': %s, 'postId': %s, 'confirmations': [%s, ...], 'rejections': [%s, ...]}}
		*/
		updateFlag: function(flagId, data){
			var promise = $http.post('/api/flags/'+flagId, data, this.sessionKeyHeader).then(function(result){
				return result.data.flag;
			},function(err){
				return errorReport('updateFlag', err);
			}); 
			return promise;
		},

		/*	
		22. POST /invites
		Purpose: Send a new invite
	        Parameters: None
	        Data: inviteeEmail, inviterId
	            inviteeEmail: email to which the invite should be sent, required
	            inviterId: userId for the user sending the invite, required
	        Returns: {'invite': {'id': %s, 'inviterId': %s, 'inviteeEmail': %s, 'sendTime': %f, 'accepted': %d, 'acceptTime': %f}}
		*/
		inviteNewUser: function(inviteeEmail, inviterId, text){
			var data = {inviteeEmail: inviteeEmail, inviterId: inviterId, text:text};
			var promise = $http.post('/api/invites', data, this.sessionKeyHeader).then(function(result){
				return result.data.invite;
			},function(err){
				return errorReport('inviteNewUser', err);
			}); 
			return promise;
		},
		/*
		23. GET /invites/<inviteid>
		Purpose: Returns an invite specified by id.
	        Returns: {'invite': {'id': %s, 'inviterId': %s, 'inviteeEmail': %s, 'sendTime': %f, 'accepted': %d, 'acceptTime': %f}}
		*/
		getInviteById: function(inviteId){
			var promise = $http.get('/api/invites/'+inviteId).then(function(result){
				return result.data.invite;
			},function(err){
				return errorReport('getInviteById',err);
			});
			return promise;
		},
		/*
		24. GET /users/<userId>/invites
		Purpose: Returns list of invites sent by this user
	        Returns: {'invites': [{'id': %s, ...}, {'id': %s, ...}]}
		*/
		getUsersInvites: function(userId, sessionKey){
			var promise = $http.get('/api/users/'+ userId + '/invites', this.sessionKeyHeader)
			.then(function(result){
				return result.data.invites;
			},function(err){
				return errorReport('getUsersInvites',err);
			});
			return promise;
		},

		/*
		25. GET /users/<userid>/profile
		Purpose: Returns profile page data for this user
		Returns: {'profile': {'name': %s, 'bio': %s, 'location': %s, 'picture': %s}}
		*/
		getUserProfile: function(profileToBeViewed, requestingUser){
			var promise = $http.get('/api/users/'+ profileToBeViewed + '/profile?for_user=' + requestingUser, this.sessionKeyHeader)
			.then(function(result){
				return result.data.profile;
			},function(err){
				return errorReport('getUserProfile',err);
			});
			return promise;
		},

		/*
		26. GET /users/<userId>/alerts
		Purpose: Returns whether any alerts should be displayed for the specified user
	        Returns: {'notifications': %d, 'new_features': %d}
		*/
		getUserAlerts: function(userId, sessionKey){
			var promise = $http.get('/api/users/'+ userId + '/alerts', this.sessionKeyHeader)
			.then(function(result){
				var alert = result.data.notifications === 1 ? true:false;
				return alert;
			},function(err){
				return errorReport('getUserAlerts',err);
			});
			return promise;
		},

		/*
        26.5 GET /users/UID/activity
		*/
		getUserActivity: function(userId, currentLength){
            var endpoint, desiredLength;
            endpoint = '/api/users/'+ userId + '/activity';
			if(currentLength){
				desiredLength = currentLength + 10;
                endpoint = '/api/users/'+ userId + '/activity?start=' + currentLength + '&end=' + desiredLength;
            }
            var promise = $http.get(endpoint, this.sessionKeyHeader)
            .then(function(result){
                return result.data.activity;
            },function(err){
                return errorReport('getUserActivity',err);
            });
            return promise;
		},

		/*
		27. GET /users/<userId>/notifications
		 Purpose: Returns list of notifications for this user
	        Parameters: limitToActive
	            limitToActive: boolean 1 or 0 to only return active notifications, optional; default = 1
	        Returns: {'notifications': [{'id': %s, ...}, {'id': %s, ...}]}
		*/
		getUserNotifications: function(userId, limitToActive){
			if(limitToActive === 0){
				var promise = $http.get('/api/users/'+ userId + '/notifications?limitToActive=0', this.sessionKeyHeader)
				.then(function(result){
					console.log(result);
					return result.data.notifications;
				},function(err){
					return errorReport('getUserNotifications', err);
				});
				return promise;
			}else{
				var promise = $http.get('/api/users/'+ userId + '/notifications', this.sessionKeyHeader)
				.then(function(result){
					console.log(result);
					return result.data.notifications;
				},function(err){
					return errorReport('getUserNotifications', err);
				});
				return promise;
			}
		},

		/*
		27 b. GET /users/<userId>/friends
		 Purpose: Returns list of user names and photos of people who this person might want to suggest
		 a post to
	        Returns: {'friends': []}
		*/
		getUserFriends: function(userId){
			var promise = $http.get('/api/users/'+ userId + '/friends', this.sessionKeyHeader)
			.then(function(result){
				return result.data.friends;
			},function(err){
				return errorReport('getUserFriends', err);
			});
			return promise;
		},

		/*
		28.	POST /authentications
		  Purpose:
		  	Parameters:
		  	Data: 
		  		email:
		  		name:
		  		password:
		  		card:
		  		inviteCode: optional
		  	Returns:
		*/
		authenticate: function(email, password){
			var data = {email: email,  password: password};
			var promise = $http.post('/api/authentications', data).success(function(result){
			}).error(function(data, status, headers, config){
				return errorReport('authenticate', data);
			}); 
			return promise;
		},


		/* 
		29.
		GET /monthlyCost
	        Purpose: Returns the current monthly cost of a subscription, in cents
	        Parameters: None
	        Data: None
	        Returns: {'montlyCost': %d}
	        Errors: None
	        Examples:
	            GET /monthlyCost
	                Purpose: Returns the current monthly cost of a subscription, in cents
	                Returns: {'monthlyCost': 100}
	    */

	    getMonthlyCost: function(){
	    	var promise = $http.get('/api/monthlyCost')
				.then(function(result){
					return result.data.monthlyCost;
				},function(err){
					return errorReport('getMonthlyCost', err);
				});
			return promise;
		},

		/*	
		30. 
		POST /feedback
	        Purpose: Submit user feedback
	        Parameters: None
	        Data: name, email, message
	            name: string name of the person submitting feedback, required
	            email: string email of the person submitting feedback, required
	            message: string feedback message, required
	        Returns: {'name': %s, 'email': %s, 'message': %s}
	        Errors: 400
	            400: Unable to decode json
	            400: Didn't include required data keys: name, email, message
		*/

		postFeedback: function(name, email, message){
			var data = {name: name, email: email,  message: message};
			var promise = $http.post('/api/feedback', data).success(function(result){
			}).error(function(data, status, headers, config){
				return errorReport('postFeedback', data);
			}); 
			return promise;
		},

		/*
		31.
		GET /samplePosts
			Get the 5 posts available to the public, non-signed in users.
		*/

		getSamplePosts: function(){
			var promise = $http.get('/api/samplePosts')
				.then(function(result){
					return result.data.posts;
				},function(err){
					return errorReport('getSamplePosts', err);
				});
			return promise; 
		},

		/*
		32. POST /passwordResetToken
		*/
		postPasswordResetData: function(data){
			var promise = $http.post('/api/passwordResetToken', data).success(function(result){
			}).error(function(data, status, headers, config){
				return errorReport('postPasswordResetData', data);
			}); 
			return promise;
		},
		/*
		33. POST /passwordResetToken/<code>
		*/
		postCodedPasswordResetData: function(code, data){
			var promise = $http.post('/api/passwordResetToken/' + code, data).success(function(result){
			}).error(function(data, status, headers, config){
				return errorReport('postCodedPasswordResetData', data);
			}); 
			return promise;
		},

		/*
		33. POST /suggestions
		*/
		postSuggestion: function(data){
			var promise = $http.post('/api/suggestions', data, this.sessionKeyHeader).success(function(result){
				return result.data;
			}).error(function(data, status, headers, config){
				return errorReport('postSuggestion', data);
			}); 
			return promise;
		},

		/*
		35. POST users/<userid>/drafts
		*/
		createDraft: function(user, data){
			var promise = $http.post('/api/users/'+ user +'/drafts', data, this.sessionKeyHeader).success(function(result){
				return result.draft;
			}).error(function(data, status, headers, config){
				return errorReport('createDraft', data);
			}); 
			return promise;
		},

		/*
		35. POST users/<userid>/drafts/<draftid>
		*/
		storeDraft: function(user, draftid, data){
			var promise = $http.post('/api/users/'+ user +'/drafts/'+ draftid, data, this.sessionKeyHeader).success(function(result){
				return result.draft;
			}).error(function(data, status, headers, config){
				return errorReport('storeDraft', data);
			}); 
			return promise;
		},


		/*
		36. GET /users/<userid>/drafts
		*/
		getPostDrafts: function(user){
			var promise = $http.get('/api/users/'+ user + '/drafts', this.sessionKeyHeader).then(function(result){
				return result.data.drafts;
			},function(err){
				return errorReport('getPostDrafts',err);
			});
			return promise;
		},


		/*
		37. DELETE /drafts/draftId
		*/
		deleteDraft: function(user, draftId){
			var promise = $http.delete('/api/users/'+ user +'/drafts/'+ draftId, this.sessionKeyHeader).then(function(result){
				return result.data.drafts;
			},function(err){
				return errorReport('deleteDraft',err);
			});
			return promise;
		}

	};

	return backend;
}]);
