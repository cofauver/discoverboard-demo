'use strict';

app.factory('ListService', 
    ['BackendService', 
    'TimeService', 
    'UserService', 
    function(BackendService, TimeService, UserService){
    
        return {
        	setLatestList: function(list){
        		this.latestList = list;
        	},
        	getLatestList: function(){
        		return this.latestList;
        	},
        	setFeaturedList: function(list){
        		this.featuredList = list;
        	},
        	getFeaturedList: function(){
        		return this.featuredList;
        	},
            addPostToLatest: function(post){
                this.latestList.unshift(post);
            },
        	removePostFromLatest: function(postId){
        		this.latestList = this.latestList.filter(function(obj){
    				return obj.id !== postId;
    			});
        	},
            updatePostSummary: function(postId, summary){
                for (var i = 0; i < this.latestList.length; i++) {
                    if(this.latestList[i].id === postId){
                        this.latestList[i].summary = summary;
                        return true;
                    }
                };
            },
            addTimeStamps: function(list){
                angular.forEach(list, function(post){
                    post.timeToDisplay = TimeService.howLongAgo(post.time);
                });
                return list;
            }
        };
}]);
