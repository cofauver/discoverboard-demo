'use strict';

app.factory('TimeService', function(){
	
	return {
		howLongAgo: function(timeInMs){
			var now, timeSince, seconds, minutes, hours, days, months, years, toReturn;
			if (timeInMs) {
				now = Date.now();
				timeSince = now - timeInMs;
				if(timeSince < 60000){ //less than a minute
					seconds = Math.floor(timeSince/1000);
					toReturn = seconds === 1 ? seconds + ' second ago': seconds + ' seconds ago';
					return toReturn;
				}else if(timeSince < 3600000){ //less than an hour
					minutes = Math.floor(timeSince/60000);
					toReturn = minutes === 1 ? minutes + ' minute ago': minutes + ' minutes ago';
					return toReturn;
				}else if(timeSince < 86400000){ //less than a day
					hours = Math.floor(timeSince/3600000);
					toReturn = hours === 1 ? hours + ' hour ago': hours+' hours ago';
					return toReturn;
				}else if(timeSince < 2592000000){ // less than a month
					days = Math.floor(timeSince/86400000);
					toReturn = days === 1 ? days + ' day ago': days+' days ago';
					return toReturn;
				}else if(timeSince < 31557600000){ // less than a year
					months = Math.floor(timeSince/2592000000);
					toReturn = months === 1 ? months+' month ago': months+' months ago';
					return toReturn;
				}else{
					years = Math.floor(timeSince/31557600000);
					toReturn = years === 1 ? years+' year ago': years+' years ago';
					return toReturn;
				}
			}else{
				return 'just a moment ago'
			}
		}
	};
});
