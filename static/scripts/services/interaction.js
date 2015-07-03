'use strict';

/*
InteractionService manages all of the data that comes from interactions 
between users and articles.

flag
facebook
twitter
viewingTime  **would enterTime and exitTime be better? 
tip
click
reply
*/

app.factory('InteractionService',  
    ['BackendService',  
    function(BackendService){
        var InteractionService = {
            commentViewed: function(userId, postId){
                if(userId){
                    BackendService.postInteraction({userId: userId, postId: postId, view: 1});
                }else{
                    BackendService.postVisitorInteraction({postId: postId, view: 1});
                }
            },

            commentInView: function(userId, postId){
                if(userId){
                    BackendService.postInteraction({userId: userId, postId: postId, scrolledIn: 1});
                }else{
                    BackendService.postVisitorInteraction({postId: postId, scrolledIn: 1});
                }
            },

            commentOutOfView: function(userId, postId){
                if(userId){
                    BackendService.postInteraction({userId: userId, postId: postId, scrolledOut: 1});
                }else{
                    BackendService.postVisitorInteraction({postId: postId, scrolledOut: 1});
                }
            },

            facebookShare: function(userId, postId){
                if(userId){
                    BackendService.postInteraction({userId: userId, postId: postId, facebook: 1});
                }else{
                    BackendService.postVisitorInteraction({postId: postId, facebook: 1});
                }
            },

            friendShare: function(userId, postId){
                if(userId){
                    BackendService.postInteraction({userId: userId, postId: postId, suggest: 1});
                }else{
                    BackendService.postVisitorInteraction({postId: postId, suggest: 1});
                }
            },

            leaveBoard: function(userId, postId){
                // console.log('leaving board ' + postId);
                if(userId){
                    BackendService.postInteraction({userId: userId, postId: postId, exit: 1});
                }else{
                    BackendService.postVisitorInteraction({postId: postId, exit: 1});
                }
            },

            tipComment: function(userId, postId){
                if(userId){
                    BackendService.tip(userId, postId).then(function(){
                        BackendService.postInteraction({userId: userId, postId: postId, tip: 1});
                    });
                }
            },

            
            reportReply: function(userId, postId){
                if(userId){
                    BackendService.postInteraction({userId: userId, postId: postId, reply: 1}); //1:true
                }
            }
    	};
    	return InteractionService;
    }]
);
