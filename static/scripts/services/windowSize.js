'use strict';

app.factory('WindowSizeService', ['$window', function($window){
    return {

    	getWindowWidth: function(){

    		var w = angular.element($window);
    		var windowWidth = {};

    		if(w.width() >= 1200){
    			windowWidth.lg = true;
    		}else if(w.width() >= 922){
    			windowWidth.md = true;
    		}else if(w.width() >= 768){
    			windowWidth.sm = true;
    		}else{
    			windowWidth.xs = true;
    		}

    		return windowWidth;

	    }


    };

}]);