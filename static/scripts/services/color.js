'use strict';

app.factory('ColorService', function(){
	return{
		barColor: function(depth){
		
			if(depth === 0){
				return 'rgba(0,0,0,.85)';
			}else if(depth % 4 === 1){
				return 'rgba(50,50,50,.85)';
			}else if(depth % 4 === 2){
				return 'rgba(100,100,100,.85)';
			}else if(depth % 4 === 3){
				return 'rgba(150,150,150,.85)';
			}else if(depth % 4 === 0){
				return 'rgba(200,200,200,.95)';
			}
		}
	}
})
