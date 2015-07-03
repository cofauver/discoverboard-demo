'use strict';

/*Detects whether a device is mobile and also allows detection of specific mobile platforms*/
app.factory('DetectMobileService',[function(){
	var isMobile = {
	    Android: function() {
	        return navigator.userAgent.match(/Android/i);
	    },
	    BlackBerry: function() {
	        return navigator.userAgent.match(/BlackBerry/i);
	    },
	    iOS: function() {
	        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	    },
        OldiOS: function() {
	        if (navigator.userAgent.match(/iPhone|iPad|iPod/i)){
                var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
                console.log("v: " + v)
                if (parseInt(v[1], 10) < 8){
                    return true;
                }
            }
            return false;
        },
	    Opera: function() {
	        return navigator.userAgent.match(/Opera Mini/i);
	    },
	    Windows: function() {
	        return navigator.userAgent.match(/IEMobile/i);
	    },
	    any: function() {
	        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	    }
	};
   	
	return isMobile;
	
}]);
